// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import type * as DataGrid from '../../../../../front_end/ui/legacy/components/data_grid/data_grid.js';
import * as UI from '../../../../../front_end/ui/legacy/legacy.js';
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
  dispatchKeyDownEvent,
  getCleanTextContentFromElements,
  raf,
} from '../../helpers/DOMHelpers.js';
import {createTarget} from '../../helpers/EnvironmentHelpers.js';
import {assertNotNullOrUndefined} from '../../../../../front_end/core/platform/platform.js';

import View = Resources.SharedStorageItemsView;

const coordinator = Coordinator.RenderCoordinator.RenderCoordinator.instance();

class SharedStorageItemsListener {
  #dispatcher: Common.ObjectWrapper.ObjectWrapper<View.SharedStorageItemsDispatcher.EventTypes>;
  #cleared: boolean = false;
  #filteredCleared: boolean = false;
  #refreshed: boolean = false;
  #deletedKeys: Array<String> = [];
  #editedEvents: Array<View.SharedStorageItemsDispatcher.ItemEditedEvent> = [];

  constructor(dispatcher: Common.ObjectWrapper.ObjectWrapper<View.SharedStorageItemsDispatcher.EventTypes>) {
    this.#dispatcher = dispatcher;
    this.#dispatcher.addEventListener(View.SharedStorageItemsDispatcher.Events.ItemsCleared, this.#itemsCleared, this);
    this.#dispatcher.addEventListener(
        View.SharedStorageItemsDispatcher.Events.FilteredItemsCleared, this.#filteredItemsCleared, this);
    this.#dispatcher.addEventListener(
        View.SharedStorageItemsDispatcher.Events.ItemsRefreshed, this.#itemsRefreshed, this);
    this.#dispatcher.addEventListener(View.SharedStorageItemsDispatcher.Events.ItemDeleted, this.#itemDeleted, this);
    this.#dispatcher.addEventListener(View.SharedStorageItemsDispatcher.Events.ItemEdited, this.#itemEdited, this);
  }

  dispose(): void {
    this.#dispatcher.removeEventListener(
        View.SharedStorageItemsDispatcher.Events.ItemsCleared, this.#itemsCleared, this);
    this.#dispatcher.removeEventListener(
        View.SharedStorageItemsDispatcher.Events.FilteredItemsCleared, this.#filteredItemsCleared, this);
    this.#dispatcher.removeEventListener(
        View.SharedStorageItemsDispatcher.Events.ItemsRefreshed, this.#itemsRefreshed, this);
    this.#dispatcher.removeEventListener(View.SharedStorageItemsDispatcher.Events.ItemDeleted, this.#itemDeleted, this);
    this.#dispatcher.removeEventListener(View.SharedStorageItemsDispatcher.Events.ItemEdited, this.#itemEdited, this);
  }

  get deletedKeys(): Array<String> {
    return this.#deletedKeys;
  }

  get editedEvents(): Array<View.SharedStorageItemsDispatcher.ItemEditedEvent> {
    return this.#editedEvents;
  }

  #itemsCleared(): void {
    this.#cleared = true;
  }

  #filteredItemsCleared(): void {
    this.#filteredCleared = true;
  }

  #itemsRefreshed(): void {
    this.#refreshed = true;
  }

  #itemDeleted(event: Common.EventTarget.EventTargetEvent<View.SharedStorageItemsDispatcher.ItemDeletedEvent>): void {
    this.#deletedKeys.push(event.data.key);
  }

  #itemEdited(event: Common.EventTarget.EventTargetEvent<View.SharedStorageItemsDispatcher.ItemEditedEvent>): void {
    this.#editedEvents.push(event.data);
  }

  async waitForItemsCleared(): Promise<void> {
    if (!this.#cleared) {
      await this.#dispatcher.once(View.SharedStorageItemsDispatcher.Events.ItemsCleared);
    }
    this.#cleared = false;
  }

  async waitForFilteredItemsCleared(): Promise<void> {
    if (!this.#filteredCleared) {
      await this.#dispatcher.once(View.SharedStorageItemsDispatcher.Events.FilteredItemsCleared);
    }
    this.#filteredCleared = false;
  }

  async waitForItemsRefreshed(): Promise<void> {
    if (!this.#refreshed) {
      await this.#dispatcher.once(View.SharedStorageItemsDispatcher.Events.ItemsRefreshed);
    }
    this.#refreshed = false;
  }

  async waitForItemsDeletedTotal(total: number): Promise<void> {
    while (this.#deletedKeys.length < total) {
      await this.#dispatcher.once(View.SharedStorageItemsDispatcher.Events.ItemDeleted);
    }
  }

  async waitForItemsEditedTotal(total: number): Promise<void> {
    while (this.#editedEvents.length < total) {
      await this.#dispatcher.once(View.SharedStorageItemsDispatcher.Events.ItemEdited);
    }
  }
}

function selectNodeByKey(
    dataGrid: DataGrid.DataGrid.DataGridImpl<unknown>, key: string|null): DataGrid.DataGrid.DataGridNode<unknown>|null {
  for (const node of dataGrid.rootNode().children) {
    if ((key && node.data.key && node.data.key === key) || (!key && !node.data.key)) {
      node.select();
      return node;
    }
  }
  return null;
}

function getCellElementFromNodeAndColumnId(
    dataGrid: DataGrid.DataGrid.DataGridImpl<unknown>, node: DataGrid.DataGrid.DataGridNode<unknown>,
    columnId: string): Element|null {
  const column = dataGrid.columns[columnId];
  const cellIndex = dataGrid.visibleColumnsArray.indexOf(column);
  return node.element()?.children[cellIndex] || null;
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

  const METADATA_2_ENTRIES = {
    creationTime: 100 as Protocol.Network.TimeSinceEpoch,
    length: 2,
    remainingBudget: 2.5,
  } as unknown as Protocol.Storage.SharedStorageMetadata;

  const METADATA_4_ENTRIES = {
    creationTime: 100 as Protocol.Network.TimeSinceEpoch,
    length: 4,
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

  const ENTRIES_1 = [
    {
      key: 'key2',
      value: 'b',
    } as unknown as Protocol.Storage.SharedStorageEntry,
  ];

  const ENTRIES_2 = [
    {
      key: 'key1',
      value: 'a',
    } as unknown as Protocol.Storage.SharedStorageEntry,
    {
      key: 'key3',
      value: 'c',
    } as unknown as Protocol.Storage.SharedStorageEntry,
  ];

  const ENTRIES_KEY_EDITED_1 = [
    {
      key: 'key1',
      value: 'a',
    } as unknown as Protocol.Storage.SharedStorageEntry,
    {
      key: 'key0',
      value: 'b',
    } as unknown as Protocol.Storage.SharedStorageEntry,
    {
      key: 'key3',
      value: 'c',
    } as unknown as Protocol.Storage.SharedStorageEntry,
  ];

  const ENTRIES_KEY_EDITED_2 = [
    {
      key: 'key1',
      value: 'b',
    } as unknown as Protocol.Storage.SharedStorageEntry,
    {
      key: 'key3',
      value: 'c',
    } as unknown as Protocol.Storage.SharedStorageEntry,
  ];

  const ENTRIES_VALUE_EDITED = [
    {
      key: 'key1',
      value: 'a',
    } as unknown as Protocol.Storage.SharedStorageEntry,
    {
      key: 'key2',
      value: 'd',
    } as unknown as Protocol.Storage.SharedStorageEntry,
    {
      key: 'key3',
      value: 'c',
    } as unknown as Protocol.Storage.SharedStorageEntry,
  ];

  const ENTRIES_NEW_KEY = [
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
    {
      key: 'key4',
      value: '',
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

    // Creating will cause `getMetadata()` to be called.
    const view = await View.SharedStorageItemsView.createView(sharedStorage);
    assert.isTrue(getMetadataSpy.calledOnceWithExactly({ownerOrigin: TEST_ORIGIN}));

    const itemsListener = new SharedStorageItemsListener(view.getSharedStorageItemsDispatcherForTesting());
    const refreshedPromise = itemsListener.waitForItemsRefreshed();

    // Showing will cause `getMetadata()` and `getEntries()` to be called.
    view.markAsRoot();
    view.show(document.documentElement);
    await refreshedPromise;

    assert.isTrue(getMetadataSpy.calledTwice);
    assert.isTrue(getMetadataSpy.alwaysCalledWithExactly({ownerOrigin: TEST_ORIGIN}));
    assert.isTrue(getEntriesSpy.calledOnceWithExactly({ownerOrigin: TEST_ORIGIN}));

    assert.deepEqual(view.getEntriesForTesting(), ENTRIES);

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

    // Creating will cause `getMetadata()` to be called.
    const view = await View.SharedStorageItemsView.createView(sharedStorage);
    assert.isTrue(getMetadataSpy.calledOnceWithExactly({ownerOrigin: TEST_ORIGIN}));

    const itemsListener = new SharedStorageItemsListener(view.getSharedStorageItemsDispatcherForTesting());
    const refreshedPromise = itemsListener.waitForItemsRefreshed();

    // Showing will cause `getMetadata()` and `getEntries()` to be called.
    view.markAsRoot();
    view.show(document.documentElement);
    await refreshedPromise;

    assert.isTrue(getMetadataSpy.calledTwice);
    assert.isTrue(getMetadataSpy.alwaysCalledWithExactly({ownerOrigin: TEST_ORIGIN}));
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

    // Creating will cause `getMetadata()` to be called.
    const view = await View.SharedStorageItemsView.createView(sharedStorage);
    assert.isTrue(getMetadataSpy.calledOnceWithExactly({ownerOrigin: TEST_ORIGIN}));

    const itemsListener = new SharedStorageItemsListener(view.getSharedStorageItemsDispatcherForTesting());
    const refreshedPromise = itemsListener.waitForItemsRefreshed();

    // Showing will cause `getMetadata()` and `getEntries()` to be called.
    view.markAsRoot();
    view.show(document.documentElement);
    await refreshedPromise;

    assert.isTrue(getMetadataSpy.calledTwice);
    assert.isTrue(getMetadataSpy.alwaysCalledWithExactly({ownerOrigin: TEST_ORIGIN}));
    assert.isTrue(getEntriesSpy.calledOnceWithExactly({ownerOrigin: TEST_ORIGIN}));

    // Select the second row.
    assertNotNullOrUndefined(selectNodeByKey(view.getDataGridForTesting(), 'key2'));
    await raf();

    assert.deepEqual(view.getOuterSplitWidgetForTesting().sidebarWidget()?.constructor.name, 'SearchableView');
  });

  it('refreshes when "Refresh" is clicked', async () => {
    const getMetadataSpy = sinon.stub(sharedStorageModel.storageAgent, 'invoke_getSharedStorageMetadata').resolves({
      metadata: METADATA,
      getError: () => undefined,
    });
    const getEntriesSpy = sinon.stub(sharedStorageModel.storageAgent, 'invoke_getSharedStorageEntries').resolves({
      entries: ENTRIES,
      getError: () => undefined,
    });

    // Creating will cause `getMetadata()` to be called.
    const view = await View.SharedStorageItemsView.createView(sharedStorage);
    assert.isTrue(getMetadataSpy.calledOnceWithExactly({ownerOrigin: TEST_ORIGIN}));

    const itemsListener = new SharedStorageItemsListener(view.getSharedStorageItemsDispatcherForTesting());
    const refreshedPromise1 = itemsListener.waitForItemsRefreshed();

    // Showing will cause `getMetadata()` and `getEntries()` to be called.
    view.markAsRoot();
    view.show(document.documentElement);
    await refreshedPromise1;

    assert.isTrue(getMetadataSpy.calledTwice);
    assert.isTrue(getMetadataSpy.alwaysCalledWithExactly({ownerOrigin: TEST_ORIGIN}));
    assert.isTrue(getEntriesSpy.calledOnceWithExactly({ownerOrigin: TEST_ORIGIN}));

    assert.deepEqual(view.getEntriesForTesting(), ENTRIES);

    // Clicking "Refresh" will cause `getMetadata()` and `getEntries()` to be called.
    const refreshedPromise2 = itemsListener.waitForItemsRefreshed();
    dispatchClickEvent(view.getRefreshButtonForTesting().element);
    await raf();
    await refreshedPromise2;

    assert.isTrue(getMetadataSpy.calledThrice);
    assert.isTrue(getMetadataSpy.alwaysCalledWithExactly({ownerOrigin: TEST_ORIGIN}));
    assert.isTrue(getEntriesSpy.calledTwice);
    assert.isTrue(getEntriesSpy.alwaysCalledWithExactly({ownerOrigin: TEST_ORIGIN}));

    assert.deepEqual(view.getEntriesForTesting(), ENTRIES);
  });

  it('clears entries when "Delete All" is clicked', async () => {
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

    const itemsListener = new SharedStorageItemsListener(view.getSharedStorageItemsDispatcherForTesting());
    const refreshedPromise = itemsListener.waitForItemsRefreshed();

    // Showing will cause `getMetadata()` and `getEntries()` to be called.
    view.markAsRoot();
    view.show(document.documentElement);
    await refreshedPromise;

    assert.isTrue(getMetadataSpy.calledTwice);
    assert.isTrue(getMetadataSpy.alwaysCalledWithExactly({ownerOrigin: TEST_ORIGIN}));
    assert.isTrue(getEntriesSpy.calledOnceWithExactly({ownerOrigin: TEST_ORIGIN}));

    assert.deepEqual(view.getEntriesForTesting(), ENTRIES);

    // Clicking "Delete All" will cause `clear()`, `getMetadata()`, and `getEntries()` to be called.
    const clearedPromise = itemsListener.waitForItemsCleared();
    dispatchClickEvent(view.getDeleteAllButtonForTesting().element);
    await raf();
    await clearedPromise;

    assert.isTrue(clearSpy.calledOnceWithExactly({ownerOrigin: TEST_ORIGIN}));
    assert.isTrue(getMetadataSpy.calledThrice);
    assert.isTrue(getMetadataSpy.alwaysCalledWithExactly({ownerOrigin: TEST_ORIGIN}));
    assert.isTrue(getEntriesSpy.calledTwice);
    assert.isTrue(getEntriesSpy.alwaysCalledWithExactly({ownerOrigin: TEST_ORIGIN}));

    assert.deepEqual(view.getEntriesForTesting(), []);
  });

  it('clears filtered entries when "Delete All" is clicked with a filter set', async () => {
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
      metadata: METADATA,
      getError: () => undefined,
    });
    getMetadataSpy.onCall(3).resolves({
      metadata: METADATA_2_ENTRIES,
      getError: () => undefined,
    });
    getMetadataSpy.onCall(4).resolves({
      metadata: METADATA_2_ENTRIES,
      getError: () => undefined,
    });
    const getEntriesSpy = sinon.stub(sharedStorageModel.storageAgent, 'invoke_getSharedStorageEntries');
    getEntriesSpy.onCall(0).resolves({
      entries: ENTRIES,
      getError: () => undefined,
    });
    getEntriesSpy.onCall(1).resolves({
      entries: ENTRIES,
      getError: () => undefined,
    });
    getEntriesSpy.onCall(2).resolves({
      entries: ENTRIES_2,
      getError: () => undefined,
    });
    getEntriesSpy.onCall(3).resolves({
      entries: ENTRIES_2,
      getError: () => undefined,
    });
    const deleteEntrySpy = sinon.stub(sharedStorageModel.storageAgent, 'invoke_deleteSharedStorageEntry').resolves({
      getError: () => undefined,
    });

    // Creating will cause `getMetadata()` to be called.
    const view = await View.SharedStorageItemsView.createView(sharedStorage);
    assert.isTrue(getMetadataSpy.calledOnceWithExactly({ownerOrigin: TEST_ORIGIN}));

    const itemsListener = new SharedStorageItemsListener(view.getSharedStorageItemsDispatcherForTesting());
    const refreshedPromise1 = itemsListener.waitForItemsRefreshed();

    // Showing will cause `getMetadata()` and `getEntries()` to be called.
    view.markAsRoot();
    view.show(document.documentElement);
    await refreshedPromise1;

    assert.isTrue(getMetadataSpy.calledTwice);
    assert.isTrue(getMetadataSpy.alwaysCalledWithExactly({ownerOrigin: TEST_ORIGIN}));
    assert.isTrue(getEntriesSpy.calledOnceWithExactly({ownerOrigin: TEST_ORIGIN}));

    assert.deepEqual(view.getEntriesForTesting(), ENTRIES);

    // Adding a filter to the text box will cause `getMetadata()`, and `getEntries()` to be called.
    const refreshedPromise2 = itemsListener.waitForItemsRefreshed();
    view.getFilterItemForTesting().dispatchEventToListeners(UI.Toolbar.ToolbarInput.Event.TextChanged, 'b');
    await raf();
    await refreshedPromise2;

    assert.isTrue(getMetadataSpy.calledThrice);
    assert.isTrue(getMetadataSpy.alwaysCalledWithExactly({ownerOrigin: TEST_ORIGIN}));
    assert.isTrue(getEntriesSpy.calledTwice);
    assert.isTrue(getEntriesSpy.alwaysCalledWithExactly({ownerOrigin: TEST_ORIGIN}));

    // Only the filtered entries are displayed.
    assert.deepEqual(view.getEntriesForTesting(), ENTRIES_1);

    // Clicking "Delete All" will cause `deleteEntry()`, `getMetadata()`, and `getEntries()` to be called.
    const clearedPromise = itemsListener.waitForFilteredItemsCleared();
    dispatchClickEvent(view.getDeleteAllButtonForTesting().element);
    await raf();
    await clearedPromise;

    assert.isTrue(deleteEntrySpy.calledOnceWithExactly({ownerOrigin: TEST_ORIGIN, key: 'key2'}));
    assert.strictEqual(getMetadataSpy.callCount, 4);
    assert.isTrue(getMetadataSpy.alwaysCalledWithExactly({ownerOrigin: TEST_ORIGIN}));
    assert.isTrue(getEntriesSpy.calledThrice);
    assert.isTrue(getEntriesSpy.alwaysCalledWithExactly({ownerOrigin: TEST_ORIGIN}));

    // The filtered entries are cleared.
    assert.deepEqual(view.getEntriesForTesting(), []);

    // Changing the filter in the text box will cause `getMetadata()`, and `getEntries()` to be called.
    const refreshedPromise3 = itemsListener.waitForItemsRefreshed();
    view.getFilterItemForTesting().dispatchEventToListeners(UI.Toolbar.ToolbarInput.Event.TextChanged, '');
    await raf();
    await refreshedPromise3;

    assert.strictEqual(getMetadataSpy.callCount, 5);
    assert.isTrue(getMetadataSpy.alwaysCalledWithExactly({ownerOrigin: TEST_ORIGIN}));
    assert.strictEqual(getEntriesSpy.callCount, 4);
    assert.isTrue(getEntriesSpy.alwaysCalledWithExactly({ownerOrigin: TEST_ORIGIN}));

    assert.deepEqual(view.getEntriesForTesting(), ENTRIES_2);
  });

  it('deletes selected entry when "Delete Selected" is clicked', async () => {
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
      metadata: METADATA_2_ENTRIES,
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
    const deleteEntrySpy = sinon.stub(sharedStorageModel.storageAgent, 'invoke_deleteSharedStorageEntry').resolves({
      getError: () => undefined,
    });

    // Creating will cause `getMetadata()` to be called.
    const view = await View.SharedStorageItemsView.createView(sharedStorage);
    assert.isTrue(getMetadataSpy.calledOnceWithExactly({ownerOrigin: TEST_ORIGIN}));

    const itemsListener = new SharedStorageItemsListener(view.getSharedStorageItemsDispatcherForTesting());
    const refreshedPromise = itemsListener.waitForItemsRefreshed();

    // Showing will cause `getMetadata()` and `getEntries()` to be called.
    view.markAsRoot();
    view.show(document.documentElement);
    await refreshedPromise;

    assert.isTrue(getMetadataSpy.calledTwice);
    assert.isTrue(getMetadataSpy.alwaysCalledWithExactly({ownerOrigin: TEST_ORIGIN}));
    assert.isTrue(getEntriesSpy.calledOnceWithExactly({ownerOrigin: TEST_ORIGIN}));

    assert.deepEqual(view.getEntriesForTesting(), ENTRIES);

    // Select the second row.
    assertNotNullOrUndefined(selectNodeByKey(view.getDataGridForTesting(), 'key2'));
    await raf();

    // Clicking "Delete Selected" will cause `deleteEntry()`, `getMetadata()`, and `getEntries()` to be called.
    const deletedPromise = itemsListener.waitForItemsDeletedTotal(1);
    dispatchClickEvent(view.getDeleteSelectedButtonForTesting().element);
    await raf();
    await deletedPromise;

    assert.isTrue(deleteEntrySpy.calledOnceWithExactly({ownerOrigin: TEST_ORIGIN, key: 'key2'}));
    assert.isTrue(getMetadataSpy.calledThrice);
    assert.isTrue(getMetadataSpy.alwaysCalledWithExactly({ownerOrigin: TEST_ORIGIN}));
    assert.isTrue(getEntriesSpy.calledTwice);
    assert.isTrue(getEntriesSpy.alwaysCalledWithExactly({ownerOrigin: TEST_ORIGIN}));

    assert.deepEqual(view.getEntriesForTesting(), []);
    assert.deepEqual(itemsListener.deletedKeys, ['key2']);
  });

  it('edits key of selected entry to a non-preexisting key', async () => {
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
      metadata: METADATA,
      getError: () => undefined,
    });
    const getEntriesSpy = sinon.stub(sharedStorageModel.storageAgent, 'invoke_getSharedStorageEntries');
    getEntriesSpy.onCall(0).resolves({
      entries: ENTRIES,
      getError: () => undefined,
    });
    getEntriesSpy.onCall(1).resolves({
      entries: ENTRIES_KEY_EDITED_1,
      getError: () => undefined,
    });
    const deleteEntrySpy = sinon.stub(sharedStorageModel.storageAgent, 'invoke_deleteSharedStorageEntry').resolves({
      getError: () => undefined,
    });
    const setEntrySpy = sinon.stub(sharedStorageModel.storageAgent, 'invoke_setSharedStorageEntry').resolves({
      getError: () => undefined,
    });

    // Creating will cause `getMetadata()` to be called.
    const view = await View.SharedStorageItemsView.createView(sharedStorage);
    assert.isTrue(getMetadataSpy.calledOnceWithExactly({ownerOrigin: TEST_ORIGIN}));

    const itemsListener = new SharedStorageItemsListener(view.getSharedStorageItemsDispatcherForTesting());
    const refreshedPromise = itemsListener.waitForItemsRefreshed();

    // Showing will cause `getMetadata()` and `getEntries()` to be called.
    view.markAsRoot();
    view.show(document.documentElement);
    await refreshedPromise;

    assert.isTrue(getMetadataSpy.calledTwice);
    assert.isTrue(getMetadataSpy.alwaysCalledWithExactly({ownerOrigin: TEST_ORIGIN}));
    assert.isTrue(getEntriesSpy.calledOnceWithExactly({ownerOrigin: TEST_ORIGIN}));

    assert.deepEqual(view.getEntriesForTesting(), ENTRIES);

    // Select the second row.
    const node = selectNodeByKey(view.getDataGridForTesting(), 'key2');
    assertNotNullOrUndefined(node);
    await raf();

    const selectedNode = node as DataGrid.DataGrid.DataGridNode<unknown>;
    view.getDataGridForTesting().startEditingNextEditableColumnOfDataGridNode(selectedNode, 'key', true);

    const cellElement = getCellElementFromNodeAndColumnId(view.getDataGridForTesting(), selectedNode, 'key');
    assertNotNullOrUndefined(cellElement);

    //  Editing a key will cause `deleteEntry()`, `setEntry()`, `getMetadata()`, and `getEntries()` to be called.
    const editedPromise = itemsListener.waitForItemsEditedTotal(1);
    cellElement.textContent = 'key0';
    dispatchKeyDownEvent(cellElement, {key: 'Enter'});
    await raf();
    await editedPromise;

    assert.isTrue(deleteEntrySpy.calledOnceWithExactly({ownerOrigin: TEST_ORIGIN, key: 'key2'}));
    assert.isTrue(
        setEntrySpy.calledOnceWithExactly({ownerOrigin: TEST_ORIGIN, key: 'key0', value: 'b', ignoreIfPresent: false}));
    assert.isTrue(getMetadataSpy.calledThrice);
    assert.isTrue(getMetadataSpy.alwaysCalledWithExactly({ownerOrigin: TEST_ORIGIN}));
    assert.isTrue(getEntriesSpy.calledTwice);
    assert.isTrue(getEntriesSpy.alwaysCalledWithExactly({ownerOrigin: TEST_ORIGIN}));

    assert.deepEqual(view.getEntriesForTesting(), ENTRIES_KEY_EDITED_1);
    assert.deepEqual(itemsListener.editedEvents, [
      {columnIdentifier: 'key', oldText: 'key2', newText: 'key0'} as View.SharedStorageItemsDispatcher.ItemEditedEvent,
    ]);
  });

  it('edits key of selected entry to a preexisting key', async () => {
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
      metadata: METADATA_2_ENTRIES,
      getError: () => undefined,
    });
    const getEntriesSpy = sinon.stub(sharedStorageModel.storageAgent, 'invoke_getSharedStorageEntries');
    getEntriesSpy.onCall(0).resolves({
      entries: ENTRIES,
      getError: () => undefined,
    });
    getEntriesSpy.onCall(1).resolves({
      entries: ENTRIES_KEY_EDITED_2,
      getError: () => undefined,
    });
    const deleteEntrySpy = sinon.stub(sharedStorageModel.storageAgent, 'invoke_deleteSharedStorageEntry').resolves({
      getError: () => undefined,
    });
    const setEntrySpy = sinon.stub(sharedStorageModel.storageAgent, 'invoke_setSharedStorageEntry').resolves({
      getError: () => undefined,
    });

    // Creating will cause `getMetadata()` to be called.
    const view = await View.SharedStorageItemsView.createView(sharedStorage);
    assert.isTrue(getMetadataSpy.calledOnceWithExactly({ownerOrigin: TEST_ORIGIN}));

    const itemsListener = new SharedStorageItemsListener(view.getSharedStorageItemsDispatcherForTesting());
    const refreshedPromise = itemsListener.waitForItemsRefreshed();

    // Showing will cause `getMetadata()` and `getEntries()` to be called.
    view.markAsRoot();
    view.show(document.documentElement);
    await refreshedPromise;

    assert.isTrue(getMetadataSpy.calledTwice);
    assert.isTrue(getMetadataSpy.alwaysCalledWithExactly({ownerOrigin: TEST_ORIGIN}));
    assert.isTrue(getEntriesSpy.calledOnceWithExactly({ownerOrigin: TEST_ORIGIN}));

    assert.deepEqual(view.getEntriesForTesting(), ENTRIES);

    // Select the second row.
    const node = selectNodeByKey(view.getDataGridForTesting(), 'key2');
    assertNotNullOrUndefined(node);
    await raf();

    const selectedNode = node as DataGrid.DataGrid.DataGridNode<unknown>;
    view.getDataGridForTesting().startEditingNextEditableColumnOfDataGridNode(selectedNode, 'key', true);

    const cellElement = getCellElementFromNodeAndColumnId(view.getDataGridForTesting(), selectedNode, 'key');
    assertNotNullOrUndefined(cellElement);

    //  Editing a key will cause `deleteEntry()`, `setEntry()`, `getMetadata()`, and `getEntries()` to be called.
    const editedPromise = itemsListener.waitForItemsEditedTotal(1);
    cellElement.textContent = 'key1';
    dispatchKeyDownEvent(cellElement, {key: 'Enter'});
    await raf();
    await editedPromise;

    assert.isTrue(deleteEntrySpy.calledOnceWithExactly({ownerOrigin: TEST_ORIGIN, key: 'key2'}));
    assert.isTrue(
        setEntrySpy.calledOnceWithExactly({ownerOrigin: TEST_ORIGIN, key: 'key1', value: 'b', ignoreIfPresent: false}));
    assert.isTrue(getMetadataSpy.calledThrice);
    assert.isTrue(getMetadataSpy.alwaysCalledWithExactly({ownerOrigin: TEST_ORIGIN}));
    assert.isTrue(getEntriesSpy.calledTwice);
    assert.isTrue(getEntriesSpy.alwaysCalledWithExactly({ownerOrigin: TEST_ORIGIN}));

    assert.deepEqual(view.getEntriesForTesting(), ENTRIES_KEY_EDITED_2);
    assert.deepEqual(itemsListener.editedEvents, [
      {columnIdentifier: 'key', oldText: 'key2', newText: 'key1'} as View.SharedStorageItemsDispatcher.ItemEditedEvent,
    ]);
  });

  it('edits value of selected entry to a new value', async () => {
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
      metadata: METADATA,
      getError: () => undefined,
    });
    const getEntriesSpy = sinon.stub(sharedStorageModel.storageAgent, 'invoke_getSharedStorageEntries');
    getEntriesSpy.onCall(0).resolves({
      entries: ENTRIES,
      getError: () => undefined,
    });
    getEntriesSpy.onCall(1).resolves({
      entries: ENTRIES_VALUE_EDITED,
      getError: () => undefined,
    });
    const deleteEntrySpy = sinon.stub(sharedStorageModel.storageAgent, 'invoke_deleteSharedStorageEntry').resolves({
      getError: () => undefined,
    });
    const setEntrySpy = sinon.stub(sharedStorageModel.storageAgent, 'invoke_setSharedStorageEntry').resolves({
      getError: () => undefined,
    });

    // Creating will cause `getMetadata()` to be called.
    const view = await View.SharedStorageItemsView.createView(sharedStorage);
    assert.isTrue(getMetadataSpy.calledOnceWithExactly({ownerOrigin: TEST_ORIGIN}));

    const itemsListener = new SharedStorageItemsListener(view.getSharedStorageItemsDispatcherForTesting());
    const refreshedPromise = itemsListener.waitForItemsRefreshed();

    // Showing will cause `getMetadata()` and `getEntries()` to be called.
    view.markAsRoot();
    view.show(document.documentElement);
    await refreshedPromise;

    assert.isTrue(getMetadataSpy.calledTwice);
    assert.isTrue(getMetadataSpy.alwaysCalledWithExactly({ownerOrigin: TEST_ORIGIN}));
    assert.isTrue(getEntriesSpy.calledOnceWithExactly({ownerOrigin: TEST_ORIGIN}));

    assert.deepEqual(view.getEntriesForTesting(), ENTRIES);

    // Select the second row.
    const node = selectNodeByKey(view.getDataGridForTesting(), 'key2');
    assertNotNullOrUndefined(node);
    await raf();

    const selectedNode = node as DataGrid.DataGrid.DataGridNode<unknown>;
    view.getDataGridForTesting().startEditingNextEditableColumnOfDataGridNode(selectedNode, 'value', true);

    const cellElement = getCellElementFromNodeAndColumnId(view.getDataGridForTesting(), selectedNode, 'value');
    assertNotNullOrUndefined(cellElement);

    //  Editing a value will cause `setEntry()`, `getMetadata()`, and `getEntries()` to be called.
    const editedPromise = itemsListener.waitForItemsEditedTotal(1);
    cellElement.textContent = 'd';
    dispatchKeyDownEvent(cellElement, {key: 'Enter'});
    await raf();
    await editedPromise;

    assert.isTrue(deleteEntrySpy.notCalled);
    assert.isTrue(
        setEntrySpy.calledOnceWithExactly({ownerOrigin: TEST_ORIGIN, key: 'key2', value: 'd', ignoreIfPresent: false}));
    assert.isTrue(getMetadataSpy.calledThrice);
    assert.isTrue(getMetadataSpy.alwaysCalledWithExactly({ownerOrigin: TEST_ORIGIN}));
    assert.isTrue(getEntriesSpy.calledTwice);
    assert.isTrue(getEntriesSpy.alwaysCalledWithExactly({ownerOrigin: TEST_ORIGIN}));

    assert.deepEqual(view.getEntriesForTesting(), ENTRIES_VALUE_EDITED);
    assert.deepEqual(itemsListener.editedEvents, [
      {columnIdentifier: 'value', oldText: 'b', newText: 'd'} as View.SharedStorageItemsDispatcher.ItemEditedEvent,
    ]);
  });

  it('adds an entry when the key cell of the empty data row is edited', async () => {
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
      metadata: METADATA_4_ENTRIES,
      getError: () => undefined,
    });
    const getEntriesSpy = sinon.stub(sharedStorageModel.storageAgent, 'invoke_getSharedStorageEntries');
    getEntriesSpy.onCall(0).resolves({
      entries: ENTRIES,
      getError: () => undefined,
    });
    getEntriesSpy.onCall(1).resolves({
      entries: ENTRIES_NEW_KEY,
      getError: () => undefined,
    });
    const deleteEntrySpy = sinon.stub(sharedStorageModel.storageAgent, 'invoke_deleteSharedStorageEntry').resolves({
      getError: () => undefined,
    });
    const setEntrySpy = sinon.stub(sharedStorageModel.storageAgent, 'invoke_setSharedStorageEntry').resolves({
      getError: () => undefined,
    });

    // Creating will cause `getMetadata()` to be called.
    const view = await View.SharedStorageItemsView.createView(sharedStorage);
    assert.isTrue(getMetadataSpy.calledOnceWithExactly({ownerOrigin: TEST_ORIGIN}));

    const itemsListener = new SharedStorageItemsListener(view.getSharedStorageItemsDispatcherForTesting());
    const refreshedPromise = itemsListener.waitForItemsRefreshed();

    // Showing will cause `getMetadata()` and `getEntries()` to be called.
    view.markAsRoot();
    view.show(document.documentElement);
    await refreshedPromise;

    assert.isTrue(getMetadataSpy.calledTwice);
    assert.isTrue(getMetadataSpy.alwaysCalledWithExactly({ownerOrigin: TEST_ORIGIN}));
    assert.isTrue(getEntriesSpy.calledOnceWithExactly({ownerOrigin: TEST_ORIGIN}));

    assert.deepEqual(view.getEntriesForTesting(), ENTRIES);

    // Select the empty (null) row.
    const node = selectNodeByKey(view.getDataGridForTesting(), null);
    assertNotNullOrUndefined(node);
    await raf();

    const selectedNode = node as DataGrid.DataGrid.DataGridNode<unknown>;
    view.getDataGridForTesting().startEditingNextEditableColumnOfDataGridNode(selectedNode, 'key', true);

    const cellElement = getCellElementFromNodeAndColumnId(view.getDataGridForTesting(), selectedNode, 'key');
    assertNotNullOrUndefined(cellElement);

    //  Editing a key will cause `deleteEntry()`, `setEntry()`, `getMetadata()`, and `getEntries()` to be called.
    const editedPromise = itemsListener.waitForItemsEditedTotal(1);
    cellElement.textContent = 'key4';
    dispatchKeyDownEvent(cellElement, {key: 'Enter'});
    await raf();
    await editedPromise;

    assert.isTrue(deleteEntrySpy.calledOnceWithExactly({ownerOrigin: TEST_ORIGIN, key: ''}));
    assert.isTrue(
        setEntrySpy.calledOnceWithExactly({ownerOrigin: TEST_ORIGIN, key: 'key4', value: '', ignoreIfPresent: false}));
    assert.isTrue(getMetadataSpy.calledThrice);
    assert.isTrue(getMetadataSpy.alwaysCalledWithExactly({ownerOrigin: TEST_ORIGIN}));
    assert.isTrue(getEntriesSpy.calledTwice);
    assert.isTrue(getEntriesSpy.alwaysCalledWithExactly({ownerOrigin: TEST_ORIGIN}));

    assert.deepEqual(view.getEntriesForTesting(), ENTRIES_NEW_KEY);
    assert.deepEqual(itemsListener.editedEvents, [
      {columnIdentifier: 'key', oldText: '', newText: 'key4'} as View.SharedStorageItemsDispatcher.ItemEditedEvent,
    ]);
  });
});
