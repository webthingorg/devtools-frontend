// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as ComponentsModule from '../../../../front_end/components/components.js';
import type * as BindingsModule from '../../../../front_end/bindings/bindings.js';
import type * as SDKModule from '../../../../front_end/sdk/sdk.js';
import type * as WorkspaceModule from '../../../../front_end/workspace/workspace.js';

import {createTarget} from '../helpers/EnvironmentHelpers.js';
import {describeWithMockConnection} from '../helpers/MockConnection.js';
import {assertNotNull} from '../helpers/DOMHelpers.js';

const {assert} = chai;

describeWithMockConnection('Linkifier', async () => {
  let Components: typeof ComponentsModule;
  let SDK: typeof SDKModule;
  let Bindings: typeof BindingsModule;
  let Workspace: typeof WorkspaceModule;

  before(async () => {
    Components = await import('../../../../front_end/components/components.js');
    SDK = await import('../../../../front_end/sdk/sdk.js');
    Bindings = await import('../../../../front_end/bindings/bindings.js');
    Workspace = await import('../../../../front_end/workspace/workspace.js');
  });

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
    const binding = Bindings.DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance({
      forceNew: true,
      targetManager: target.targetManager(),
      workspace: Workspace.Workspace.WorkspaceImpl.instance(),
    });
    return {target, linkifier, binding};
  }

  it('creates an anchor with pending if the debugger is disabled', () => {
    const {target, linkifier} = setUpEnvironment();

    const debuggerModel = target.model(SDK.DebuggerModel.DebuggerModel);
    assertNotNull(debuggerModel);
    debuggerModel.suspendModel();

    const scriptId = 'script1';
    const anchor = linkifier.maybeLinkifyScriptLocation(target, scriptId, '', 4);

    assertNotNull(anchor);
    const info = Components.Linkifier.Linkifier.linkInfo(anchor);
    assertNotNull(info);
    assert.isNull(info.uiLocation);
  });

  it('updates uiLocation for LiveLocation without script', done => {
    const {target, linkifier} = setUpEnvironment();

    const debuggerModel = target.model(SDK.DebuggerModel.DebuggerModel);
    assertNotNull(debuggerModel);
    debuggerModel.suspendModel();

    const scriptId = 'script1';
    const anchor = linkifier.maybeLinkifyScriptLocation(target, scriptId, '', 4);
    assertNotNull(anchor);

    const spy = sinon.spy(linkifier, '_updateAnchor');

    // trigger scriptparssedevent
    debuggerModel.resumeModel();
    // const script = new SDK.Script.Script(
    //     debuggerModel, scriptId, 'https://mail.google.com/', 0, 0, 1, 0, 0, '', false, false, '', true, 1, null, 0,
    //     '', null, '');
    const callback: MutationCallback = function(mutations: MutationRecord[]) {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          const info = Components.Linkifier.Linkifier.linkInfo(anchor);
          assertNotNull(info);
          assertNotNull(info.uiLocation);
          sinon.assert.calledOnce(spy);
          done();
        }
      }
    };
    const observer = new MutationObserver(callback);
    observer.observe(anchor, {childList: true});
    observer.disconnect();
  });
});
