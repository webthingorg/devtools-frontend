// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;
import * as Root from '../../../../../front_end/core/root/root.js';
import * as SDK from '../../../../../front_end/core/sdk/sdk.js';
import * as Workspace from '../../../../../front_end/models/workspace/workspace.js';
import * as Bindings from '../../../../../front_end/models/bindings/bindings.js';
import type * as Platform from '../../../../../front_end/core/platform/platform.js';
import * as Protocol from '../../../../../front_end/generated/protocol.js';

import {describeWithRealConnection} from '../../helpers/RealConnection.js';
import {createUISourceCode} from '../../helpers/UISourceCodeHelpers.js';
import {assertNotNullOrUndefined} from '../../../../../front_end/core/platform/platform.js';

describeWithRealConnection('BreakpointManager', () => {
  const URL = 'file:///tmp/example.html' as Platform.DevToolsPath.UrlString;
  const SCRIPT_ID = 'SCRIPT_ID' as Protocol.Runtime.ScriptId;
  const BREAKPOINT_ID = 'BREAKPOINT_ID' as Protocol.Debugger.BreakpointId;
  const JS_MIME_TYPE = 'text/javascript';

  class TestDebuggerModel extends SDK.DebuggerModel.DebuggerModel {
    constructor(target: SDK.Target.Target) {
      super(target);
    }

    async setBreakpointByURL(
        _url: Platform.DevToolsPath.UrlString, _lineNumber: number, _columnNumber?: number,
        _condition?: string): Promise<SDK.DebuggerModel.SetBreakpointResult> {
      return Promise.resolve(
          {breakpointId: BREAKPOINT_ID, locations: [new SDK.DebuggerModel.Location(this, SCRIPT_ID, 42)]});
    }

    scriptForId(scriptId: string): SDK.Script.Script|null {
      if (scriptId === SCRIPT_ID) {
        return new SDK.Script.Script(
            this, scriptId as Protocol.Runtime.ScriptId, URL, 0, 0, 0, 0, 0, '', false, false, undefined, false, 0,
            null, null, null, null, null, null);
      }
      return null;
    }
  }

  function createFakeScriptMapping(debuggerModel: TestDebuggerModel, SCRIPT_ID: Protocol.Runtime.ScriptId):
      Bindings.DebuggerWorkspaceBinding.DebuggerSourceMapping {
    const sdkLocation = new SDK.DebuggerModel.Location(debuggerModel, SCRIPT_ID as Protocol.Runtime.ScriptId, 0);
    const mapping = {
      rawLocationToUILocation: (_: SDK.DebuggerModel.Location) => null,
      uiLocationToRawLocations:
          (_uiSourceCode: Workspace.UISourceCode.UISourceCode, _lineNumber: number,
           _columnNumber?: number) => [sdkLocation],
    };
    return mapping;
  }

  it('triggers breakpoint synchronization on an instrumentation break', async () => {
    Root.Runtime.experiments.enableForTest(Root.Runtime.ExperimentName.INSTRUMENTATION_BREAKPOINTS);

    const breakpointManager = Bindings.BreakpointManager.BreakpointManager.instance();
    assertNotNullOrUndefined(breakpointManager);

    const targetManager = SDK.TargetManager.TargetManager.instance();
    const target = targetManager.mainTarget();
    assertNotNullOrUndefined(target);

    const {uiSourceCode} = createUISourceCode({url: URL, mimeType: JS_MIME_TYPE});
    const breakpoint = await breakpointManager.setBreakpoint(uiSourceCode, 0, 0, '', true);
    // Ensure that all updates have happened before continuing.
    await breakpoint.updateBreakpoint();

    // Create a new DebuggerModel and notify the breakpoint engine about it.
    const debuggerModel = new TestDebuggerModel(target);
    breakpointManager.modelAdded(debuggerModel);
    breakpoint.modelAdded(debuggerModel);

    // Retrieve the ModelBreakpoint that is linked to our DebuggerModel.
    const modelBreakpoint = breakpoint.modelBreakpoint(debuggerModel);
    assertNotNullOrUndefined(modelBreakpoint);

    // Make sure that we do not have properly resolved the breakpoint yet.
    await breakpoint.updateBreakpoint();
    assertNotNullOrUndefined(modelBreakpoint.currentState);
    assert.lengthOf(modelBreakpoint.currentState.positions, 1);
    assert.isEmpty(modelBreakpoint.currentState.positions[0].scriptId);

    const mapping = createFakeScriptMapping(debuggerModel, SCRIPT_ID);
    Bindings.DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance().addSourceMapping(mapping);

    const callFrameId = 'id' as Protocol.Debugger.CallFrameId;
    const location = {scriptId: SCRIPT_ID, lineNumber: 0};
    const remoteObj = {type: Protocol.Runtime.RemoteObjectType.Function};
    const callFrame = {callFrameId, functionName: '', location, url: URL, scopeChain: [], this: remoteObj};

    // Make sure that after a pause event, we have successfully updated the breakpoint.
    await debuggerModel.pausedScript([callFrame], Protocol.Debugger.PausedEventReason.Instrumentation, undefined, []);
    assertNotNullOrUndefined(modelBreakpoint.currentState);
    assert.lengthOf(modelBreakpoint.currentState.positions, 1);
    assert.strictEqual(modelBreakpoint.currentState.positions[0].scriptId, SCRIPT_ID);

    // Clean up.
    breakpointManager.removeBreakpoint(breakpoint, true);
    breakpointManager.modelRemoved(debuggerModel);
  });

  it('allows awaiting on scheduled update in debugger', async () => {
    const breakpointManager = Bindings.BreakpointManager.BreakpointManager.instance();
    assertNotNullOrUndefined(breakpointManager);

    const {uiSourceCode, project} = createUISourceCode({url: URL, mimeType: 'text/javascript'});
    const targetManager = SDK.TargetManager.TargetManager.instance();
    const target = targetManager.mainTarget();
    assertNotNullOrUndefined(target);

    const debuggerModel = new TestDebuggerModel(target);
    const breakpoint = await breakpointManager.setBreakpoint(uiSourceCode, 42, 0, '', true);

    const modelBreakpoint = new Bindings.BreakpointManager.ModelBreakpoint(
        debuggerModel, breakpoint, breakpointManager.debuggerWorkspaceBinding);
    const mapping = createFakeScriptMapping(debuggerModel, SCRIPT_ID);
    Bindings.DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance().addSourceMapping(mapping);
    assert.isNull(breakpoint.currentState);
    const update = modelBreakpoint.scheduleUpdateInDebugger();
    assert.isNull(breakpoint.currentState);
    await update;
    assert.strictEqual(breakpoint.currentState?.positions[0]?.lineNumber, 13);
    Bindings.DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance().removeSourceMapping(mapping);
    breakpointManager.removeBreakpoint(breakpoint, true);
    Workspace.Workspace.WorkspaceImpl.instance().removeProject(project);
  });
});
