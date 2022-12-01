// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import type * as Platform from '../../../../../front_end/core/platform/platform.js';
import * as Bindings from "../../../../../front_end/models/bindings/bindings.js";
import * as Workspace from "../../../../../front_end/models/workspace/workspace.js";
import * as SDK from "../../../../../front_end/core/sdk/sdk.js";
import * as Protocol from '../../../../../front_end/generated/protocol.js';

import { createTarget } from "../../helpers/EnvironmentHelpers.js";
import { describeWithMockConnection } from "../../helpers/MockConnection.js";
import {assertNotNullOrUndefined} from '../../../../../front_end/core/platform/platform.js';

describeWithMockConnection('CompilerScriptMapping', () => {
  let target: SDK.Target.Target;

  const SCRIPTS = [
    {
      // Inline script with sourceURL comment that should be kept track of in ResourceScriptMapping.
      scriptId: '1' as Protocol.Runtime.ScriptId,
      startLine: 4,
      startColumn: 8,
      endLine: 8,
      endColumn: 0,
      sourceURL: 'http://google.com/index.html' as Platform.DevToolsPath.UrlString,
      hasSourceURLComment: true,
    },
    {
      // Inline script with sourceURL comment that should not be kept of track in ResourceScriptMapping.
      scriptId: '2' as Protocol.Runtime.ScriptId,
      startLine: 10,
      startColumn: 8,
      endLine: 18,
      endColumn: 0,
      sourceURL: 'http://google.com/index.html' as Platform.DevToolsPath.UrlString,
      hasSourceURLComment: false,
    },
    {
      // Regular script with that should be kept track of in ResourceScriptMapping.
      scriptId: '3' as Protocol.Runtime.ScriptId,
      startLine: 0,
      startColumn: 0,
      endLine: 11,
      endColumn: 27,
      sourceURL: 'http://google.com/test.js' as Platform.DevToolsPath.UrlString,
      hasSourceURLComment: false,
    },
  ];

  beforeEach(() => {
    target = createTarget();
    // @ts-ignore layout test global
    const resourceMapping = new Bindings.ResourceMapping.ResourceMapping(
        SDK.TargetManager.TargetManager.instance(),
        Workspace.Workspace.WorkspaceImpl.instance(),
    );
    Bindings.DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance({
      forceNew: true,
      resourceMapping,
      targetManager: target.targetManager(),
    });
  })

  it('can retrieve the source mapped UISourceCode', async () => {
    const debuggerModel = target.model(SDK.DebuggerModel.DebuggerModel);
    assertNotNullOrUndefined(debuggerModel);
    const resourceScriptMapping = new Bindings.ResourceScriptMapping.ResourceScriptMapping(debuggerModel, Workspace.Workspace.WorkspaceImpl.instance(), Bindings.DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance());
    
    const executionContextId = 1;
    const hash = '';

    SCRIPTS.forEach(({scriptId, startLine, startColumn, endLine, endColumn, sourceURL, hasSourceURLComment}) => {
      debuggerModel.parsedScriptSource(
          scriptId, sourceURL, startLine, startColumn, endLine, endColumn, executionContextId, hash, undefined, false,
          undefined, hasSourceURLComment, false, length, false, null, null, null, null, null);
    });

    const parsedScripts = debuggerModel.scripts();
    for (const script of parsedScripts) {
      const actualUISourceCode = resourceScriptMapping.uiSourceCodeForScript(script);
      const expectedUISourceCode = (script.isInlineScript() && !script.hasSourceURL) ? null : Workspace.Workspace.WorkspaceImpl.instance().uiSourceCodeForURL(script.sourceURL);
      assert.deepEqual(actualUISourceCode, expectedUISourceCode);
    }
  })
});

