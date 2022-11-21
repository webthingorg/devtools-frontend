// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import * as DataGrid from '../../../../../front_end/ui/legacy/components/data_grid/data_grid.js';
import * as Coordinator from '../../../../../front_end/ui/components/render_coordinator/render_coordinator.js';
import type * as ApplicationComponents from '../../../../../front_end/panels/application/components/components.js';
import type * as SDK from '../../../../../front_end/core/sdk/sdk.js';
import * as Resources from '../../../../../front_end/panels/application/application.js';
import type * as Protocol from '../../../../../front_end/generated/protocol.js';
import {
  describeWithMockConnection,
} from '../../helpers/MockConnection.js';
import {
  assertShadowRoot,
  getCleanTextContentFromElements,
  raf,
} from '../../helpers/DOMHelpers.js';
import {createTarget} from '../../helpers/EnvironmentHelpers.js';
import {assertNotNullOrUndefined} from '../../../../../front_end/core/platform/platform.js';

import View = Resources.SharedStorageItemsView;

const coordinator = Coordinator.RenderCoordinator.RenderCoordinator.instance();

describeWithMockConnection('SharedStorageItemsView', () => {
  let target: SDK.Target.Target;
  let sharedStorageModel: Resources.SharedStorageModel.SharedStorageModel;
  let sharedStorage: Resources.SharedStorageModel.SharedStorageForOrigin;

  const TEST_ORIGIN = 'http://a.test';

  const METADATA = {
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
      '4',
    ]);
  });

  it('has placeholder sidebar when there are no entries', async () => {
    const getMetadataSpy = sinon.stub(sharedStorageModel.storageAgent, 'invoke_getSharedStorageMetadata').resolves({
      metadata: METADATA,
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
    const node = view.getFirstChildNodeForTesting();
    assertNotNullOrUndefined(node);

    grid.dispatchEventToListeners(
        DataGrid.DataGrid.Events.SelectedNode, node as DataGrid.DataGrid.DataGridNode<unknown>);
    await raf();
    assert.deepEqual(view.getOuterSplitWidgetForTesting().sidebarWidget()?.constructor.name, 'SearchableView');
  });
});
