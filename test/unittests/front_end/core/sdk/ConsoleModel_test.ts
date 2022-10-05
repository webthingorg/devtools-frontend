// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import {assertNotNullOrUndefined} from '../../../../../front_end/core/platform/platform.js';
import type * as Platform from '../../../../../front_end/core/platform/platform.js';
import type * as SDKModule from '../../../../../front_end/core/sdk/sdk.js';
import type * as Protocol from '../../../../../front_end/generated/protocol.js';
import * as Common from '../../../../../front_end/core/common/common.js';
import {
  createTarget,
} from '../../helpers/EnvironmentHelpers.js';

import {
  describeWithMockConnection,
} from '../../helpers/MockConnection.js';

describeWithMockConnection('ConsoleMessage', () => {
  let SDK: typeof SDKModule;
  before(async () => {
    SDK = await import('../../../../../front_end/core/sdk/sdk.js');
  });
  const scriptId1 = '1' as Protocol.Runtime.ScriptId;
  const scriptId2 = '2' as Protocol.Runtime.ScriptId;

  function newMessage({
    source = SDK.ConsoleModel.FrontendMessageSource.ConsoleAPI,
    message = 'Message',
    url,
    scriptId,
    executionContextId,
    stackTrace,
  }: {
    source?: SDKModule.ConsoleModel.MessageSource,
    message?: string,
    url?: Platform.DevToolsPath.UrlString,
    scriptId?: Protocol.Runtime.ScriptId,
    executionContextId?: number,
    stackTrace?: Protocol.Runtime.StackTrace,
  }) {
    return new SDK.ConsoleModel.ConsoleMessage(
        null, source, null, message, {url, executionContextId, scriptId, stackTrace});
  }

  it('compares using message', () => {
    const a = newMessage({});
    const b = newMessage({});
    const c = newMessage({message: 'DifferentMessage'});
    assert.isTrue(a.isEqual(b));
    assert.isFalse(b.isEqual(c));
    assert.isFalse(c.isEqual(a));
    assert.isTrue(c.isEqual(c));
  });

  it('compares using source', () => {
    const a = newMessage({});
    const b = newMessage({});
    const c = newMessage({source: SDK.ConsoleModel.FrontendMessageSource.CSS});
    assert.isTrue(a.isEqual(b));
    assert.isFalse(b.isEqual(c));
    assert.isFalse(c.isEqual(a));
  });

  it('compares using url', () => {
    const a = newMessage({});
    const b = newMessage({url: 'http://a.b/c' as Platform.DevToolsPath.UrlString});
    const c = newMessage({url: 'http://a.b/c' as Platform.DevToolsPath.UrlString});
    const d = newMessage({url: 'http://a.b/d' as Platform.DevToolsPath.UrlString});
    assert.isFalse(a.isEqual(b));
    assert.isTrue(b.isEqual(c));
    assert.isFalse(c.isEqual(d));
    assert.isFalse(d.isEqual(a));
  });

  it('compares using execution context and script id', () => {
    const a = newMessage({});
    const b = newMessage({executionContextId: 5, scriptId: scriptId1});
    const c = newMessage({executionContextId: 5, scriptId: scriptId1});
    const d = newMessage({executionContextId: 6, scriptId: scriptId1});
    const e = newMessage({executionContextId: 5, scriptId: scriptId2});
    assert.isFalse(a.isEqual(b));
    assert.isFalse(b.isEqual(a));
    assert.isTrue(b.isEqual(c));
    assert.isFalse(c.isEqual(d));
    assert.isFalse(c.isEqual(e));
  });

  it('compares using script ids in stack traces', () => {
    const functionName = 'foo';
    const url = 'http://localhost/foo.js';
    const lineNumber = 1;
    const columnNumber = 1;
    const a =
        newMessage({stackTrace: {callFrames: [{functionName, scriptId: scriptId1, url, lineNumber, columnNumber}]}});
    const b =
        newMessage({stackTrace: {callFrames: [{functionName, scriptId: scriptId2, url, lineNumber, columnNumber}]}});
    assert.isFalse(a.isEqual(b));
  });

  it('logs a message on main frame navigation', async () => {
    Common.Settings.Settings.instance().moduleSetting('preserveConsoleLog').set(true);
    const consoleLog = sinon.spy(Common.Console.Console.instance(), 'log');
    const tabTarget = createTarget({type: SDK.Target.Type.Tab});
    const mainFrameUnderTabTarget = createTarget({type: SDK.Target.Type.Frame, parentTarget: tabTarget});
    const mainFrameWithoutTabTarget = createTarget({type: SDK.Target.Type.Frame});
    const subframeTarget = createTarget({type: SDK.Target.Type.Frame, parentTarget: mainFrameWithoutTabTarget});
    SDK.ConsoleModel.ConsoleModel.instance({forceNew: true});
    const navigateTarget = (target: SDKModule.Target.Target) => {
      const resourceTreeModel = target.model(SDK.ResourceTreeModel.ResourceTreeModel);
      assertNotNullOrUndefined(resourceTreeModel);
      resourceTreeModel.dispatchEventToListeners(SDK.ResourceTreeModel.Events.CachedResourcesLoaded, resourceTreeModel);
      const frame = {url: 'http://example.com/', backForwardCacheDetails: {}} as
          SDKModule.ResourceTreeModel.ResourceTreeFrame;
      resourceTreeModel.dispatchEventToListeners(SDK.ResourceTreeModel.Events.MainFrameNavigated, frame);
    };
    navigateTarget(subframeTarget);
    assert.isTrue(consoleLog.notCalled);

    navigateTarget(mainFrameUnderTabTarget);
    assert.isTrue(consoleLog.calledOnce);
    assert.isTrue(consoleLog.calledOnceWith('Navigated to http://example.com/'));

    navigateTarget(mainFrameWithoutTabTarget);
    assert.isTrue(consoleLog.calledTwice);
    assert.isTrue(consoleLog.secondCall.calledWith('Navigated to http://example.com/'));
  });

  it('clears when main frame global object cleared', async () => {
    Common.Settings.Settings.instance().moduleSetting('preserveConsoleLog').set(false);
    const tabTarget = createTarget({type: SDK.Target.Type.Tab});
    const mainFrameUnderTabTarget = createTarget({type: SDK.Target.Type.Frame, parentTarget: tabTarget});
    const mainFrameWithoutTabTarget = createTarget({type: SDK.Target.Type.Frame});
    const subframeTarget = createTarget({type: SDK.Target.Type.Frame, parentTarget: mainFrameWithoutTabTarget});
    const clearGlobalObjectOnTarget = (target: SDKModule.Target.Target) => {
      const resourceTreeModel = target.model(SDK.ResourceTreeModel.ResourceTreeModel);
      assertNotNullOrUndefined(resourceTreeModel);
      resourceTreeModel.dispatchEventToListeners(SDK.ResourceTreeModel.Events.CachedResourcesLoaded, resourceTreeModel);

      const debuggerModel = target.model(SDK.DebuggerModel.DebuggerModel);
      assertNotNullOrUndefined(debuggerModel);
      debuggerModel.dispatchEventToListeners(SDK.DebuggerModel.Events.GlobalObjectCleared, debuggerModel);
    };

    let consoleClearEvents = 0;
    SDK.ConsoleModel.ConsoleModel.instance({forceNew: true})
        .addEventListener(SDK.ConsoleModel.Events.ConsoleCleared, () => ++consoleClearEvents);

    clearGlobalObjectOnTarget(subframeTarget);
    assert.strictEqual(consoleClearEvents, 0);

    clearGlobalObjectOnTarget(mainFrameUnderTabTarget);
    assert.strictEqual(consoleClearEvents, 1);

    clearGlobalObjectOnTarget(mainFrameWithoutTabTarget);
    assert.strictEqual(consoleClearEvents, 2);
  });
});
