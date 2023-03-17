// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../../../../front_end/core/common/common.js';
import {assertNotNullOrUndefined} from '../../../../../front_end/core/platform/platform.js';
import * as Root from '../../../../../front_end/core/root/root.js';
import * as SDK from '../../../../../front_end/core/sdk/sdk.js';
import * as Protocol from '../../../../../front_end/generated/protocol.js';

import type * as Platform from '../../../../../front_end/core/platform/platform.js';
import * as Application from '../../../../../front_end/panels/application/application.js';
import * as UI from '../../../../../front_end/ui/legacy/legacy.js';
import {createTarget, stubNoopSettings} from '../../helpers/EnvironmentHelpers.js';
import {describeWithMockConnection, setMockConnectionResponseHandler} from '../../helpers/MockConnection.js';

const {assert} = chai;

class SharedStorageTreeElementListener {
  #sidebar: Application.ApplicationPanelSidebar.ApplicationPanelSidebar;
  #originsAdded: Array<String> = new Array<String>();

  constructor(sidebar: Application.ApplicationPanelSidebar.ApplicationPanelSidebar) {
    this.#sidebar = sidebar;

    this.#sidebar.sharedStorageTreeElementDispatcher.addEventListener(
        Application.ApplicationPanelSidebar.SharedStorageTreeElementDispatcher.Events.SharedStorageTreeElementAdded,
        this.#treeElementAdded, this);
  }

  dispose(): void {
    this.#sidebar.sharedStorageTreeElementDispatcher.removeEventListener(
        Application.ApplicationPanelSidebar.SharedStorageTreeElementDispatcher.Events.SharedStorageTreeElementAdded,
        this.#treeElementAdded, this);
  }

  #treeElementAdded(
      event: Common.EventTarget.EventTargetEvent<Application.ApplicationPanelSidebar.SharedStorageTreeElementDispatcher
                                                     .SharedStorageTreeElementAddedEvent>): void {
    this.#originsAdded.push(event.data.origin);
  }

  async waitForElementsAdded(expectedCount: number): Promise<void> {
    while (this.#originsAdded.length < expectedCount) {
      await this.#sidebar.sharedStorageTreeElementDispatcher.once(
          Application.ApplicationPanelSidebar.SharedStorageTreeElementDispatcher.Events.SharedStorageTreeElementAdded);
    }
  }
}

describeWithMockConnection('ApplicationPanelSidebar', () => {
  const tests = (targetFactory: () => SDK.Target.Target) => {
    let target: SDK.Target.Target;

    const TEST_ORIGIN_A = 'http://www.example.com/';
    const TEST_ORIGIN_B = 'http://www.example.org/';
    const TEST_ORIGIN_C = 'http://www.example.net/';

    const ID = 'AA' as Protocol.Page.FrameId;

    const EVENTS = [
      {
        accessTime: 0,
        type: Protocol.Storage.SharedStorageAccessType.DocumentAppend,
        mainFrameId: ID,
        ownerOrigin: TEST_ORIGIN_A,
        params: {key: 'key0', value: 'value0'} as Protocol.Storage.SharedStorageAccessParams,
      },
      {
        accessTime: 10,
        type: Protocol.Storage.SharedStorageAccessType.WorkletGet,
        mainFrameId: ID,
        ownerOrigin: TEST_ORIGIN_A,
        params: {key: 'key0'} as Protocol.Storage.SharedStorageAccessParams,
      },
      {
        accessTime: 15,
        type: Protocol.Storage.SharedStorageAccessType.WorkletLength,
        mainFrameId: ID,
        ownerOrigin: TEST_ORIGIN_A,
        params: {} as Protocol.Storage.SharedStorageAccessParams,
      },
      {
        accessTime: 20,
        type: Protocol.Storage.SharedStorageAccessType.DocumentClear,
        mainFrameId: ID,
        ownerOrigin: TEST_ORIGIN_C,
        params: {} as Protocol.Storage.SharedStorageAccessParams,
      },
      {
        accessTime: 100,
        type: Protocol.Storage.SharedStorageAccessType.WorkletSet,
        mainFrameId: ID,
        ownerOrigin: TEST_ORIGIN_C,
        params: {key: 'key0', value: 'value1', ignoreIfPresent: true} as Protocol.Storage.SharedStorageAccessParams,
      },
      {
        accessTime: 150,
        type: Protocol.Storage.SharedStorageAccessType.WorkletRemainingBudget,
        mainFrameId: ID,
        ownerOrigin: TEST_ORIGIN_C,
        params: {} as Protocol.Storage.SharedStorageAccessParams,
      },
    ];

    beforeEach(() => {
      stubNoopSettings();
      target = targetFactory();
      Root.Runtime.experiments.register(Root.Runtime.ExperimentName.PRELOADING_STATUS_PANEL, '', false);
      sinon.stub(UI.ViewManager.ViewManager.instance(), 'showView').resolves();  // Silence console error
    });

    it('shows cookies for all frames', async () => {
      SDK.TargetManager.TargetManager.instance().setScopeTarget(target);
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

    it('shows shared storages and events for origins using shared storage', async () => {
      SDK.TargetManager.TargetManager.instance().setScopeTarget(target);
      const securityOriginManager = target.model(SDK.SecurityOriginManager.SecurityOriginManager);
      assertNotNullOrUndefined(securityOriginManager);
      sinon.stub(securityOriginManager, 'securityOrigins').returns([
        TEST_ORIGIN_A,
        TEST_ORIGIN_B,
        TEST_ORIGIN_C,
      ]);

      const sharedStorageModel = target.model(Application.SharedStorageModel.SharedStorageModel);
      assertNotNullOrUndefined(sharedStorageModel);
      const setTrackingSpy = sinon.stub(sharedStorageModel.storageAgent, 'invoke_setSharedStorageTracking').resolves({
        getError: () => undefined,
      });

      Application.ResourcesPanel.ResourcesPanel.instance({forceNew: true});
      const sidebar = await Application.ResourcesPanel.ResourcesPanel.showAndGetSidebar();

      const listener = new SharedStorageTreeElementListener(sidebar);
      const addedPromise = listener.waitForElementsAdded(3);

      const resourceTreeModel = target.model(SDK.ResourceTreeModel.ResourceTreeModel);
      assertNotNullOrUndefined(resourceTreeModel);
      resourceTreeModel.dispatchEventToListeners(SDK.ResourceTreeModel.Events.CachedResourcesLoaded, resourceTreeModel);
      await addedPromise;

      assert.isTrue(setTrackingSpy.calledOnceWithExactly({enable: true}));

      assert.strictEqual(sidebar.sharedStorageListTreeElement.childCount(), 3);
      assert.deepStrictEqual(sidebar.sharedStorageListTreeElement.children().map(e => e.title), [
        TEST_ORIGIN_A,
        TEST_ORIGIN_B,
        TEST_ORIGIN_C,
      ]);

      sidebar.sharedStorageListTreeElement.view.setDefaultIdForTesting(ID);
      for (const event of EVENTS) {
        sharedStorageModel.dispatchEventToListeners(Application.SharedStorageModel.Events.SharedStorageAccess, event);
      }

      assert.deepEqual(sidebar.sharedStorageListTreeElement.view.getEventsForTesting(), EVENTS);
    });

    function parseEvent(eventString: string): {
      modelClass: new (arg1: SDK.Target.Target) => SDK.SDKModel.SDKModel<unknown>,
      event: Common.EventTarget.EventTargetEvent<unknown>,
    } {
      const components = eventString.split('.');
      assert.strictEqual(components.length, 4);
      assert.strictEqual(components[0], 'Application');
      // @ts-ignore
      const module = Application[components[0]];
      assertNotNullOrUndefined(module);
      const modelClass = module[components[1]];
      assertNotNullOrUndefined(modelClass);
      const events = module[components[2]];
      assertNotNullOrUndefined(events);
      const event = events[components[3]];
      assertNotNullOrUndefined(event);
      return {modelClass, event};
    }

    function parseExpectedCall(
        expectedCall: string, sidebar: Application.ApplicationPanelSidebar.ApplicationPanelSidebar): sinon.SinonSpy {
      const components = expectedCall.split('.');
      assert.strictEqual(components.length, 2);
      // @ts-ignore
      const object = sidebar[components[0]];
      assertNotNullOrUndefined(object);
      return sinon.spy(object, components[1]);
    }

    const testUiUpdate = (eventString: string, expectedCallString: string, inScope: boolean) => async () => {
      setMockConnectionResponseHandler('Storage.getSharedStorageEntries', () => ({}));
      setMockConnectionResponseHandler('Storage.setSharedStorageTracking', () => ({}));
      if (inScope) {
        SDK.TargetManager.TargetManager.instance().setScopeTarget(target);
      }
      Application.ResourcesPanel.ResourcesPanel.instance({forceNew: true});
      const sidebar = await Application.ResourcesPanel.ResourcesPanel.showAndGetSidebar();
      const {event, modelClass} = parseEvent(eventString);
      const expectedCall = parseExpectedCall(expectedCallString, sidebar);
      const model = target.model(modelClass);
      assertNotNullOrUndefined(model);
      // @ts-ignore
      model.dispatchEventToListeners(event, {addEventListener: () => {}});
      await new Promise(resolve => setTimeout(resolve, 0));
      assert.strictEqual(expectedCall.called, inScope);
    };

    it('adds database element on in scope event',
       testUiUpdate('Application.DatabaseModel.Events.DatabaseAdded', 'databasesListTreeElement.appendChild', true));
    it('adds database element on out of scope event',
       testUiUpdate('Application.DatabaseModel.Events.DatabaseAdded', 'databasesListTreeElement.appendChild', false));
    it('adds interest group event on in scope event',
       testUiUpdate(
           'Application.InterestGroupStorageModel.Events.InterestGroupAccess', 'interestGroupTreeElement.addEvent',
           true));
    it('adds interest group event on out of scope event',
       testUiUpdate(
           'Application.InterestGroupStorageModel.Events.InterestGroupAccess', 'interestGroupTreeElement.addEvent',
           false));
    it('adds DOM storage on in scope event',
       testUiUpdate(
           'Application.DOMStorageModel.Events.DOMStorageAdded', 'sessionStorageListTreeElement.appendChild', true));
    it('adds DOM storage on out of scope event',
       testUiUpdate(
           'Application.DOMStorageModel.Events.DOMStorageAdded', 'sessionStorageListTreeElement.appendChild', false));

    it('adds shared storage on in scope event',
       testUiUpdate(
           'Application.SharedStorageModel.Events.SharedStorageAdded', 'sharedStorageListTreeElement.appendChild',
           true));
    it('adds shared storage on in scope event',
       testUiUpdate(
           'Application.SharedStorageModel.Events.SharedStorageAdded', 'sharedStorageListTreeElement.appendChild',
           false));

  };
  describe('without tab target', () => tests(() => createTarget()));
  describe('with tab target', () => tests(() => {
                                const tabTarget = createTarget({type: SDK.Target.Type.Tab});
                                createTarget({parentTarget: tabTarget, subtype: 'prerender'});
                                return createTarget({parentTarget: tabTarget});
                              }));
});

describeWithMockConnection('IndexedDBTreeElement', () => {
  beforeEach(() => {
    stubNoopSettings();
    Root.Runtime.experiments.register(Root.Runtime.ExperimentName.PRELOADING_STATUS_PANEL, '', false);
  });

  const addsElement = (inScope: boolean) => () => {
    const target = createTarget();
    const model = target.model(Application.IndexedDBModel.IndexedDBModel);
    assertNotNullOrUndefined(model);
    if (inScope) {
      SDK.TargetManager.TargetManager.instance().setScopeTarget(target);
    }
    const panel = Application.ResourcesPanel.ResourcesPanel.instance({forceNew: true});
    const treeElement = new Application.ApplicationPanelSidebar.IndexedDBTreeElement(panel);

    assert.strictEqual(treeElement.childCount(), 0);
    model.dispatchEventToListeners(
        Application.IndexedDBModel.Events.DatabaseAdded,
        {databaseId: new Application.IndexedDBModel.DatabaseId('', ''), model});
    assert.strictEqual(treeElement.childCount(), inScope ? 1 : 0);
  };
  it('adds element on in scope event', addsElement(true));
  it('does not add element on out of scope event', addsElement(false));
});

describeWithMockConnection('ResourcesSection', () => {
  const tests = (inScope: boolean) => () => {
    let target: SDK.Target.Target;
    beforeEach(() => {
      stubNoopSettings();
      Root.Runtime.experiments.register(Root.Runtime.ExperimentName.PRELOADING_STATUS_PANEL, '', false);
      SDK.FrameManager.FrameManager.instance({forceNew: true});
      target = createTarget();
    });

    const FRAME_ID = 'frame-id' as Protocol.Page.FrameId;

    it('adds tree elements for a frame and resource', () => {
      if (inScope) {
        SDK.TargetManager.TargetManager.instance().setScopeTarget(target);
      }
      const panel = Application.ResourcesPanel.ResourcesPanel.instance({forceNew: true});
      const treeElement = new UI.TreeOutline.TreeElement();
      new Application.ApplicationPanelSidebar.ResourcesSection(panel, treeElement);

      const model = target.model(SDK.ResourceTreeModel.ResourceTreeModel);
      assertNotNullOrUndefined(model);

      assert.strictEqual(treeElement.childCount(), 0);
      const frame = model.frameAttached(FRAME_ID, null);
      assertNotNullOrUndefined(frame);
      assert.strictEqual(treeElement.childCount(), inScope ? 1 : 0);

      const mimeType = 'text/html';
      const url = 'http://example.com' as Platform.DevToolsPath.UrlString;
      const resource = new SDK.Resource.Resource(
          model, null, url, url, FRAME_ID, null, Common.ResourceType.ResourceType.fromMimeType(mimeType), mimeType,
          null, null);
      assert.strictEqual(treeElement.firstChild()?.childCount() ?? 0, 0);
      model.dispatchEventToListeners(SDK.ResourceTreeModel.Events.ResourceAdded, resource);
      assert.strictEqual(treeElement.firstChild()?.childCount() ?? 0, inScope ? 1 : 0);
    });

    it('picks up existing frames and resource', () => {
      const panel = Application.ResourcesPanel.ResourcesPanel.instance({forceNew: true});
      const treeElement = new UI.TreeOutline.TreeElement();
      new Application.ApplicationPanelSidebar.ResourcesSection(panel, treeElement);

      const model = target.model(SDK.ResourceTreeModel.ResourceTreeModel);
      assertNotNullOrUndefined(model);

      const frame = model.frameAttached(FRAME_ID, null);
      assertNotNullOrUndefined(frame);

      const mimeType = 'text/html';
      const url = 'http://example.com' as Platform.DevToolsPath.UrlString;
      const resource = new SDK.Resource.Resource(
          model, null, url, url, FRAME_ID, null, Common.ResourceType.ResourceType.fromMimeType(mimeType), mimeType,
          null, null);
      assert.strictEqual(treeElement.firstChild()?.childCount() ?? 0, 0);
      frame.addResource(resource);

      assert.strictEqual(treeElement.childCount(), 0);
      if (inScope) {
        SDK.TargetManager.TargetManager.instance().setScopeTarget(target);
      }
      assert.strictEqual(treeElement.childCount(), inScope ? 1 : 0);
      assert.strictEqual(treeElement.firstChild()?.childCount() ?? 0, inScope ? 1 : 0);
    });
  };

  describe('in scope', tests(true));
  describe('out of scope', tests(false));
});
