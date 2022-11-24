// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as SDK from '../../../../../front_end/core/sdk/sdk.js';
import * as Application from '../../../../../front_end/panels/application/application.js';
import type * as Protocol from '../../../../../front_end/generated/protocol.js';
import * as Root from '../../../../../front_end/core/root/root.js';
import {
  createTarget,
  stubNoopSettings,
} from '../../helpers/EnvironmentHelpers.js';
import {describeWithMockConnection} from '../../helpers/MockConnection.js';
import {assertNotNullOrUndefined} from '../../../../../front_end/core/platform/platform.js';

const {assert} = chai;

describeWithMockConnection('SharedStorageTreeElement', () => {
  const tests = (targetFactory: () => SDK.Target.Target) => {
    let target: SDK.Target.Target;
    let sharedStorageModel: Application.SharedStorageModel.SharedStorageModel;
    let sharedStorage: Application.SharedStorageModel.SharedStorageForOrigin;
    let treeElement: Application.SharedStorageTreeElement.SharedStorageTreeElement;

    const TEST_ORIGIN = 'http://a.test';

    const METADATA = {
      creationTime: 100 as Protocol.Network.TimeSinceEpoch,
      length: 3,
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

    beforeEach(async () => {
      stubNoopSettings();
      target = targetFactory();
      Root.Runtime.experiments.register('backgroundServices', '', false);
      Root.Runtime.experiments.register(Root.Runtime.ExperimentName.PRELOADING_STATUS_PANEL, '', false);

      sharedStorageModel = target.model(Application.SharedStorageModel.SharedStorageModel) as
          Application.SharedStorageModel.SharedStorageModel;
      sharedStorage = new Application.SharedStorageModel.SharedStorageForOrigin(sharedStorageModel, TEST_ORIGIN);
      assert.strictEqual(sharedStorage.securityOrigin, TEST_ORIGIN);
    });

    it('is created', async () => {
      const getMetadataSpy = sinon.stub(sharedStorageModel.storageAgent, 'invoke_getSharedStorageMetadata').resolves({
        metadata: METADATA,
        getError: () => undefined,
      });
      const getEntriesSpy = sinon.stub(sharedStorageModel.storageAgent, 'invoke_getSharedStorageEntries').resolves({
        entries: ENTRIES,
        getError: () => undefined,
      });

      treeElement = await Application.SharedStorageTreeElement.SharedStorageTreeElement.createElement(
          Application.ResourcesPanel.ResourcesPanel.instance(), sharedStorage);
      document.body.appendChild(treeElement.listItemNode);
      treeElement.select();

      const view = treeElement.getViewForTesting();
      assertNotNullOrUndefined(view);
    });
  };
  describe('without tab target', () => tests(() => createTarget()));
  describe('with tab target', () => tests(() => {
                                const tabTarget = createTarget({type: SDK.Target.Type.Tab});
                                createTarget({parentTarget: tabTarget, subtype: 'prerender'});
                                return createTarget({parentTarget: tabTarget});
                              }));
});
