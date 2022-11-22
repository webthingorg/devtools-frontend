// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import * as DataGrid from '../../../../../front_end/ui/legacy/components/data_grid/data_grid.js';
import * as Coordinator from '../../../../../front_end/ui/components/render_coordinator/render_coordinator.js';
import type * as ApplicationComponents from '../../../../../front_end/panels/application/components/components.js';
import type * as Common from '../../../../../front_end/core/common/common.js';
import type * as SDK from '../../../../../front_end/core/sdk/sdk.js';
import * as Resources from '../../../../../front_end/panels/application/application.js';
import type * as Protocol from '../../../../../front_end/generated/protocol.js';
import {
  describeWithMockConnection,
} from '../../helpers/MockConnection.js';
import {
  assertShadowRoot,
  dispatchClickEvent,
  getCleanTextContentFromElements,
  raf,
} from '../../helpers/DOMHelpers.js';
import {createTarget} from '../../helpers/EnvironmentHelpers.js';
import {assertNotNullOrUndefined} from '../../../../../front_end/core/platform/platform.js';

import View = Resources.SharedStorageItemsView;

const coordinator = Coordinator.RenderCoordinator.RenderCoordinator.instance();

class SharedStorageItemsListener {
  #sharedStorage: Resources.SharedStorageModel.SharedStorageForOrigin;
  #dispatcher: Common.ObjectWrapper.ObjectWrapper<View.SharedStorageItemsDispatcher.EventTypes>;
  #storageCleared: boolean = false;
  #clearedFinished: boolean = false;

  constructor(
      sharedStorage: Resources.SharedStorageModel.SharedStorageForOrigin,
      dispatcher: Common.ObjectWrapper.ObjectWrapper<View.SharedStorageItemsDispatcher.EventTypes>) {
    this.#sharedStorage = sharedStorage;
    this.#sharedStorage.addEventListener(
        Resources.SharedStorageModel.SharedStorageForOrigin.Events.ClearEntriesViaDevTools, this.#backendCleared, this);
    this.#dispatcher = dispatcher;
    this.#dispatcher.addEventListener(View.SharedStorageItemsDispatcher.Events.ItemsCleared, this.#itemsCleared, this);
  }

  dispose(): void {
    this.#dispatcher.removeEventListener(
        View.SharedStorageItemsDispatcher.Events.ItemsCleared, this.#itemsCleared, this);
  }

  #backendCleared(): void {
    this.#storageCleared = true;
  }

  #itemsCleared(): void {
    this.#clearedFinished = true;
  }

  async waitForBackendCleared(): Promise<void> {
    if (!this.#storageCleared) {
      await this.#sharedStorage.once(
          Resources.SharedStorageModel.SharedStorageForOrigin.Events.ClearEntriesViaDevTools);
    }
    this.#storageCleared = false;
  }

  async waitForItemsCleared(): Promise<void> {
    if (!this.#clearedFinished) {
      await this.#dispatcher.once(View.SharedStorageItemsDispatcher.Events.ItemsCleared);
    }
    this.#clearedFinished = false;
  }
}

describeWithMockConnection('SharedStorageItemsView', function() {
  let target: SDK.Target.Target;
  let sharedStorageModel: Resources.SharedStorageModel.SharedStorageModel;
  let sharedStorage: Resources.SharedStorageModel.SharedStorageForOrigin;

  const TEST_ORIGIN = 'http://a.test';

  const METADATA = {
    creationTime: 100 as Protocol.Network.TimeSinceEpoch,
    length: 3,
    remainingBudget: 2.5,
  } as unknown as Protocol.Storage.SharedStorageMetadata;

  const METADATA_NO_ENTRIES = {
    creationTime: 100 as Protocol.Network.TimeSinceEpoch,
    length: 0,
    remainingBudget: 2.5,
  } as unknown as Protocol.Storage.SharedStorageMetadata;

  const ENTRIES = [
    {
      key: 'key1',
      value: 'a',
    } as unknown as Protocol.Storage.SharedStorageEntry,
    {
      key: 'key2',
      value: 'b',
    } as unknown as Protocol.Storage.SharedStorageEntry,
    {
      key: 'key3',
      value: 'c',
    } as unknown as Protocol.Storage.SharedStorageEntry,
  ];

  beforeEach(() => {
    target = createTarget();
    sharedStorageModel = target.model(Resources.SharedStorageModel.SharedStorageModel) as
        Resources.SharedStorageModel.SharedStorageModel;
    sharedStorage = new Resources.SharedStorageModel.SharedStorageForOrigin(sharedStorageModel, TEST_ORIGIN);
    assert.strictEqual(sharedStorage.securityOrigin, TEST_ORIGIN);
  });

  it('displays metadata and entries', async () => {
    const getMetadataSpy = sinon.stub(sharedStorageModel.storageAgent, 'invoke_getSharedStorageMetadata').resolves({
      metadata: METADATA,
      getError: () => undefined,
    });
    const getEntriesSpy = sinon.stub(sharedStorageModel.storageAgent, 'invoke_getSharedStorageEntries').resolves({
      entries: ENTRIES,
      getError: () => undefined,
    });

    const view = await View.SharedStorageItemsView.createView(sharedStorage);
    assert.isTrue(getMetadataSpy.calledOnceWithExactly({ownerOrigin: TEST_ORIGIN}));
    assert.isTrue(getEntriesSpy.calledOnceWithExactly({ownerOrigin: TEST_ORIGIN}));

    const entries = view.getEntriesForTesting();
    assert.deepEqual(ENTRIES, entries);

    const metadataView = view.getInnerSplitWidgetForTesting().sidebarWidget()?.contentElement.firstChild as
        ApplicationComponents.SharedStorageMetadataView.SharedStorageMetadataReportView;
    assertNotNullOrUndefined(metadataView);

    assertShadowRoot(metadataView.shadowRoot);
    await coordinator.done();
    await coordinator.done();  // 2nd call awaits async render

    const keys = getCleanTextContentFromElements(metadataView.shadowRoot, 'devtools-report-key');
    assert.deepEqual(keys, [
      'Origin',
      'Creation',
      'Budget',
      'Length',
    ]);

    const values = getCleanTextContentFromElements(metadataView.shadowRoot, 'devtools-report-value');
    assert.deepEqual(values, [
      TEST_ORIGIN,
      (new Date(100 * 1e3)).toLocaleString(),
      '2.5',
      '3',
    ]);
  });

  it('has placeholder sidebar when there are no entries', async () => {
    const getMetadataSpy = sinon.stub(sharedStorageModel.storageAgent, 'invoke_getSharedStorageMetadata').resolves({
      metadata: METADATA_NO_ENTRIES,
      getError: () => undefined,
    });
    const getEntriesSpy = sinon.stub(sharedStorageModel.storageAgent, 'invoke_getSharedStorageEntries').resolves({
      entries: [],
      getError: () => undefined,
    });

    const view = await View.SharedStorageItemsView.createView(sharedStorage);

    assert.isTrue(getMetadataSpy.calledOnceWithExactly({ownerOrigin: TEST_ORIGIN}));
    assert.isTrue(getEntriesSpy.calledOnceWithExactly({ownerOrigin: TEST_ORIGIN}));

    assert.notDeepEqual(view.getOuterSplitWidgetForTesting().sidebarWidget()?.constructor.name, 'SearchableView');
    assert.isTrue(view.getOuterSplitWidgetForTesting()
                      .sidebarWidget()
                      ?.contentElement.firstChild?.nextSibling?.textContent?.includes('Select'));
  });

  it('updates sidebarWidget upon receiving SelectedNode Event', async () => {
    const getMetadataSpy = sinon.stub(sharedStorageModel.storageAgent, 'invoke_getSharedStorageMetadata').resolves({
      metadata: METADATA,
      getError: () => undefined,
    });
    const getEntriesSpy = sinon.stub(sharedStorageModel.storageAgent, 'invoke_getSharedStorageEntries').resolves({
      entries: ENTRIES,
      getError: () => undefined,
    });

    const view = await View.SharedStorageItemsView.createView(sharedStorage);
    assert.isTrue(getMetadataSpy.calledOnceWithExactly({ownerOrigin: TEST_ORIGIN}));
    assert.isTrue(getEntriesSpy.calledOnceWithExactly({ownerOrigin: TEST_ORIGIN}));

    const grid = view.getDataGridForTesting();
    const node = new DataGrid.DataGrid.DataGridNode({key: 'key2', value: 'b'}, false);

    grid.dispatchEventToListeners(DataGrid.DataGrid.Events.SelectedNode, node);
    await raf();
    assert.deepEqual(view.getOuterSplitWidgetForTesting().sidebarWidget()?.constructor.name, 'SearchableView');
  });

  it('clears entries when deleteAll is clicked', async () => {
    const getMetadataSpy = sinon.stub(sharedStorageModel.storageAgent, 'invoke_getSharedStorageMetadata');
    getMetadataSpy.onCall(0).resolves({
      metadata: METADATA,
      getError: () => undefined,
    });
    getMetadataSpy.onCall(1).resolves({
      metadata: METADATA,
      getError: () => undefined,
    });
    getMetadataSpy.onCall(2).resolves({
      metadata: METADATA_NO_ENTRIES,
      getError: () => undefined,
    });
    const getEntriesSpy = sinon.stub(sharedStorageModel.storageAgent, 'invoke_getSharedStorageEntries');
    getEntriesSpy.onCall(0).resolves({
      entries: ENTRIES,
      getError: () => undefined,
    });
    getEntriesSpy.onCall(1).resolves({
      entries: [],
      getError: () => undefined,
    });
    const clearSpy = sinon.stub(sharedStorageModel.storageAgent, 'invoke_clearSharedStorageEntries').resolves({
      getError: () => undefined,
    });

    // Creating will cause `getMetadata()` to be called.
    const view = await View.SharedStorageItemsView.createView(sharedStorage);
    assert.isTrue(getMetadataSpy.calledOnceWithExactly({ownerOrigin: TEST_ORIGIN}));

    const itemsListener =
        new SharedStorageItemsListener(sharedStorage, view.getSharedStorageItemsDispatcherForTesting());
    const backendClearedPromise = itemsListener.waitForBackendCleared();
    const clearedPromise = itemsListener.waitForItemsCleared();

    // Showing will cause `getMetadata()` and `getEntries()` to be called.
    view.markAsRoot();
    view.show(document.documentElement);

    // Clicking "Delete All" will cause `clear()`, `getMetadata()`, and `getEntries()` to be called.
    dispatchClickEvent(view.getDeleteAllButtonForTesting().element);
    await raf();
    await backendClearedPromise;
    await clearedPromise;

    assert.isTrue(clearSpy.calledOnceWithExactly({ownerOrigin: TEST_ORIGIN}));
    assert.isTrue(getMetadataSpy.calledThrice);
    assert.isTrue(getMetadataSpy.alwaysCalledWithExactly({ownerOrigin: TEST_ORIGIN}));
    assert.isTrue(getEntriesSpy.calledTwice);
    assert.isTrue(getEntriesSpy.alwaysCalledWithExactly({ownerOrigin: TEST_ORIGIN}));
  });
});
