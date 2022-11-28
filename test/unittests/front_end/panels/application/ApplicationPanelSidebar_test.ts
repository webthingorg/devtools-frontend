// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as Common from '../../../../../front_end/core/common/common.js';
import type * as Protocol from '../../../../../front_end/generated/protocol.js';
import {assertNotNullOrUndefined} from '../../../../../front_end/core/platform/platform.js';
import * as Root from '../../../../../front_end/core/root/root.js';
import * as SDK from '../../../../../front_end/core/sdk/sdk.js';
import * as Application from '../../../../../front_end/panels/application/application.js';
import * as UI from '../../../../../front_end/ui/legacy/legacy.js';
import {createTarget, stubNoopSettings} from '../../helpers/EnvironmentHelpers.js';
import {describeWithMockConnection} from '../../helpers/MockConnection.js';

const {assert} = chai;

class SharedStorageTreeElementListener {
  #sidebar: Application.ApplicationPanelSidebar.ApplicationPanelSidebar;
  #originsAdded: Array<String> = new Array<String>();

  constructor(sidebar: Application.ApplicationPanelSidebar.ApplicationPanelSidebar) {
    this.#sidebar = sidebar;

    this.#sidebar.sharedStorageTreeElementDispatcher.addEventListener(
        Application.ApplicationPanelSidebar.SharedStorageTreeElementDispatcher.Events.TreeElementAdded,
        this.#treeElementAdded, this);
  }

  dispose(): void {
    this.#sidebar.sharedStorageTreeElementDispatcher.removeEventListener(
        Application.ApplicationPanelSidebar.SharedStorageTreeElementDispatcher.Events.TreeElementAdded,
        this.#treeElementAdded, this);
  }

  #treeElementAdded(event: Common.EventTarget.EventTargetEvent<
                    Application.ApplicationPanelSidebar.SharedStorageTreeElementDispatcher.TreeElementAddedEvent>):
      void {
    this.#originsAdded.push(event.data.origin);
  }

  async waitForElementsAdded(expectedCount: number): Promise<void> {
    while (this.#originsAdded.length < expectedCount) {
      await this.#sidebar.sharedStorageTreeElementDispatcher.once(
          Application.ApplicationPanelSidebar.SharedStorageTreeElementDispatcher.Events.TreeElementAdded);
    }
  }
}

describeWithMockConnection('ApplicationPanelSidebar', () => {
  const tests = (targetFactory: () => SDK.Target.Target) => {
    let target: SDK.Target.Target;

    const METADATA = {
      creationTime: 100 as Protocol.Network.TimeSinceEpoch,
      length: 4,
      remainingBudget: 2.5,
    } as unknown as Protocol.Storage.SharedStorageMetadata;

    beforeEach(() => {
      stubNoopSettings();
      target = targetFactory();
      Root.Runtime.experiments.register('backgroundServices', '', false);
      Root.Runtime.experiments.register(Root.Runtime.ExperimentName.PRELOADING_STATUS_PANEL, '', false);
    });

    it('shows cookies for all frames', async () => {
      sinon.stub(UI.ViewManager.ViewManager.instance(), 'showView').resolves();  // Silence console error
      Application.ResourcesPanel.ResourcesPanel.instance({forceNew: true});
      const sidebar = await Application.ResourcesPanel.ResourcesPanel.showAndGetSidebar();
      const resourceTreeModel = target.model(SDK.ResourceTreeModel.ResourceTreeModel);
      assertNotNullOrUndefined(resourceTreeModel);
      sinon.stub(resourceTreeModel, 'frames').returns([
        {
          url: 'http://www.example.com/',
          unreachableUrl: () => null,
          resourceTreeModel: () => resourceTreeModel,
        } as unknown as SDK.ResourceTreeModel.ResourceTreeFrame,
        {
          url: 'http://www.example.com/admin/',
          unreachableUrl: () => null,
          resourceTreeModel: () => resourceTreeModel,
        } as unknown as SDK.ResourceTreeModel.ResourceTreeFrame,
        {
          url: 'http://www.example.org/',
          unreachableUrl: () => null,
          resourceTreeModel: () => resourceTreeModel,
        } as unknown as SDK.ResourceTreeModel.ResourceTreeFrame,
      ]);
      resourceTreeModel.dispatchEventToListeners(SDK.ResourceTreeModel.Events.CachedResourcesLoaded, resourceTreeModel);

      assert.strictEqual(sidebar.cookieListTreeElement.childCount(), 2);
      assert.deepStrictEqual(
          sidebar.cookieListTreeElement.children().map(e => e.title),
          ['http://www.example.com', 'http://www.example.org']);
    });

    it('shows shared storage for origins using shared storage', async () => {
      sinon.stub(UI.ViewManager.ViewManager.instance(), 'showView').resolves();  // Silence console error
      const resourceTreeModel = target.model(SDK.ResourceTreeModel.ResourceTreeModel);
      assertNotNullOrUndefined(resourceTreeModel);
      sinon.stub(resourceTreeModel, 'frames').returns([
        {
          url: 'http://www.example.com/',
          unreachableUrl: () => null,
          resourceTreeModel: () => resourceTreeModel,
        } as unknown as SDK.ResourceTreeModel.ResourceTreeFrame,
        {
          url: 'http://www.example.com/admin/',
          unreachableUrl: () => null,
          resourceTreeModel: () => resourceTreeModel,
        } as unknown as SDK.ResourceTreeModel.ResourceTreeFrame,
        {
          url: 'http://www.example.org/',
          unreachableUrl: () => null,
          resourceTreeModel: () => resourceTreeModel,
        } as unknown as SDK.ResourceTreeModel.ResourceTreeFrame,
        {
          url: 'http://www.example.net/',
          unreachableUrl: () => null,
          resourceTreeModel: () => resourceTreeModel,
        } as unknown as SDK.ResourceTreeModel.ResourceTreeFrame,
      ]);

      const securityOriginManager = target.model(SDK.SecurityOriginManager.SecurityOriginManager);
      assertNotNullOrUndefined(securityOriginManager);
      sinon.stub(securityOriginManager, 'securityOrigins').returns([
        'http://www.example.com/',
        'http://www.example.org/',
        'http://www.example.net/',
      ]);

      const sharedStorageModel = target.model(Application.SharedStorageModel.SharedStorageModel);
      console.error('model', JSON.stringify(sharedStorageModel));  // debug
      assertNotNullOrUndefined(sharedStorageModel);
      const setTrackingSpy = sinon.stub(sharedStorageModel.storageAgent, 'invoke_setSharedStorageTracking').resolves({
        getError: () => undefined,
      });
      const getMetadataSpy = sinon.stub(sharedStorageModel.storageAgent, 'invoke_getSharedStorageMetadata');
      getMetadataSpy.resolves({
        metadata: METADATA,
        getError: () => undefined,
      });
      getMetadataSpy.withArgs({ownerOrigin: 'http://www.example.org/'}).resolves({
        metadata: METADATA,
        getError: () => 'origin does not exist in database',
      });

      Application.ResourcesPanel.ResourcesPanel.instance({forceNew: true});
      const sidebar = await Application.ResourcesPanel.ResourcesPanel.showAndGetSidebar();

      const listener = new SharedStorageTreeElementListener(sidebar);
      const addedPromise = listener.waitForElementsAdded(2);
      resourceTreeModel.dispatchEventToListeners(SDK.ResourceTreeModel.Events.CachedResourcesLoaded, resourceTreeModel);
      await addedPromise;

      assert.isTrue(setTrackingSpy.calledOnceWithExactly({enable: true}));
      assert.strictEqual(getMetadataSpy.callCount, 5);

      assert.strictEqual(sidebar.sharedStorageListTreeElement.childCount(), 2);
      assert.deepStrictEqual(
          sidebar.sharedStorageListTreeElement.children().map(e => e.title),
          ['http://www.example.com/', 'http://www.example.net/']);
    });
  };
  describe('without tab target', () => tests(() => createTarget()));
  describe('with tab target', () => tests(() => {
                                const tabTarget = createTarget({type: SDK.Target.Type.Tab});
                                createTarget({parentTarget: tabTarget, subtype: 'prerender'});
                                return createTarget({parentTarget: tabTarget});
                              }));
});
