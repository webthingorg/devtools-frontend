// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as ComponentsModule from '../../../../front_end/components/components.js';
import type * as BindingsModule from '../../../../front_end/bindings/bindings.js';
import type * as SDKModule from '../../../../front_end/sdk/sdk.js';
import type * as WorkspaceModule from '../../../../front_end/workspace/workspace.js';

import {createTarget, describeWithEnvironment} from '../helpers/EnvironmentHelpers.js';
import {describeWithMockConnection, dispatchEvent} from '../helpers/MockConnection.js';
import {assertNotNull} from '../helpers/DOMHelpers.js';

const {assert} = chai;

describeWithEnvironment('Linkifier', async () => {
  let SDK: typeof SDKModule;
  let Components: typeof ComponentsModule;
  let Bindings: typeof BindingsModule;
  let Workspace: typeof WorkspaceModule;

  before(async () => {
    SDK = await import('../../../../front_end/sdk/sdk.js');
    Components = await import('../../../../front_end/components/components.js');
    Bindings = await import('../../../../front_end/bindings/bindings.js');
    Workspace = await import('../../../../front_end/workspace/workspace.js');
  });

  describeWithMockConnection('Linkifier', async () => {
    function createLinkifier() {
      const maxLengthForDisplayedURLs = 100;
      const useLinkDecorator = false;
      const onLiveLocationUpdate = () => {};
      return new Components.Linkifier.Linkifier(maxLengthForDisplayedURLs, useLinkDecorator, onLiveLocationUpdate);
    }

    function setUpEnvironment() {
      const linkifier = createLinkifier();
      const target = createTarget();
      linkifier.targetAdded(target);
      const workspace = Workspace.Workspace.WorkspaceImpl.instance();
      const initParams = {
        forceNew: true,
        targetManager: target.targetManager(),
        workspace: workspace,
      };
      const binding = Bindings.DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance(initParams);
      Bindings.ResourceMapping.ResourceMapping.instance(initParams);
      Bindings.IgnoreListManager.IgnoreListManager.instance({forceNew: true, debuggerWorkspaceBinding: binding});
      return {target, linkifier};
    }

    it('creates an empty placeholder anchor if the debugger is disabled', () => {
      const {target, linkifier} = setUpEnvironment();

      const debuggerModel = target.model(SDK.DebuggerModel.DebuggerModel);
      assertNotNull(debuggerModel);
      debuggerModel.suspendModel();

      const scriptId = 'script';
      const lineNumber = 4;
      const url = '';
      const anchor = linkifier.maybeLinkifyScriptLocation(target, scriptId, url, lineNumber);
      assertNotNull(anchor);
      assert.strictEqual(anchor.textContent, '\u200b');

      const info = Components.Linkifier.Linkifier.linkInfo(anchor);
      assertNotNull(info);
      assert.isNull(info.uiLocation);
    });

    it('resolves url and updates link as soon as debugger is enabled', done => {
      const {target, linkifier} = setUpEnvironment();

      const debuggerModel = target.model(SDK.DebuggerModel.DebuggerModel);
      assertNotNull(debuggerModel);
      debuggerModel.suspendModel();

      const scriptId = 'script';
      const lineNumber = 4;
      // Explicitly set url to empty string and let it resolve through the live location.
      const url = '';
      const anchor = linkifier.maybeLinkifyScriptLocation(target, scriptId, url, lineNumber);
      assertNotNull(anchor);
      assert.strictEqual(anchor.textContent, '\u200b');

      debuggerModel.resumeModel();
      const scriptParsedEvent = {
        scriptId,
        url: 'https://www.google.com',
        startLine: 0,
        startColumn: 0,
        endLine: 10,
        endColumn: 10,
        executionContextId: 1234,
        hash: '',
        isLiveEdit: false,
        sourceMapURL: undefined,
        hasSourceURL: false,
        hasSyntaxError: false,
        length: 10,
      };
      dispatchEvent(target, 'Debugger.scriptParsed', scriptParsedEvent);

      const callback: MutationCallback = function(mutations: MutationRecord[]) {
        for (const mutation of mutations) {
          if (mutation.type === 'childList') {
            const info = Components.Linkifier.Linkifier.linkInfo(anchor);
            assertNotNull(info);
            assertNotNull(info.uiLocation);
            assert.strictEqual(anchor.textContent, `(index):${lineNumber + 1}`);
            observer.disconnect();
            done();
          }
        }
      };
      const observer = new MutationObserver(callback);
      observer.observe(anchor, {childList: true});
    });
  });
});
