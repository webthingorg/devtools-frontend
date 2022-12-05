// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import type * as Platform from '../../../../../front_end/core/platform/platform.js';
import * as Bindings from "../../../../../front_end/models/bindings/bindings.js";
import * as Workspace from "../../../../../front_end/models/workspace/workspace.js";
import * as SDK from "../../../../../front_end/core/sdk/sdk.js";
import * as Protocol from '../../../../../front_end/generated/protocol.js';
import type * as Host from '../../../../../front_end/core/host/host.js';
import { createTarget } from "../../helpers/EnvironmentHelpers.js";
import { describeWithMockConnection } from "../../helpers/MockConnection.js";
import {assertNotNullOrUndefined} from '../../../../../front_end/core/platform/platform.js';

interface LoadResult {
  success: boolean;
  content: string;
  errorDescription: Host.ResourceLoader.LoadErrorDescription;
}


describeWithMockConnection('CompilerScriptMapping', () => {
  const sourceMapContent = JSON.stringify({
    'version': 3,
    'file': '/script.js',
    'mappings': '',
    'sources': [
      '/original-script.js',
    ],
  });  

  const loadSourceMap = async(_url: string): Promise<LoadResult> => {
    return {
      success: true,
      content: sourceMapContent,
      errorDescription: {message: '', statusCode: 0, netError: 0, netErrorName: '', urlValid: true},
    };
  };

  it.only('uses url for a worker\'s source maps from frame', async () => {
    SDK.PageResourceLoader.PageResourceLoader.instance(
        {forceNew: true, loadOverride: loadSourceMap, maxConcurrentLoads: 1, loadTimeout: 2000});

    const frameUrl = 'https://frame-host/index.html' as Platform.DevToolsPath.UrlString;
    const scriptUrl = 'https://script-host/script.js' as Platform.DevToolsPath.UrlString;
    const sourceUrl = 'script.js' as Platform.DevToolsPath.UrlString;
    const sourceMapUrl = 'script.js.map' as Platform.DevToolsPath.UrlString;

    const target =
        createTarget({id: 'main' as Protocol.Target.TargetID, name: 'main', type: SDK.Target.Type.Frame});
    const debuggerModel = target.model(SDK.DebuggerModel.DebuggerModel);
    assertNotNullOrUndefined(debuggerModel);
    
    const targetManager = target.targetManager();
    const workspace = Workspace.Workspace.WorkspaceImpl.instance();
    const resourceMapping = new Bindings.ResourceMapping.ResourceMapping(targetManager, workspace);
    const debuggerWorkspaceBinding = Bindings.DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance({forceNew: false, resourceMapping, targetManager});
    const compilerScriptMapping = new Bindings.CompilerScriptMapping.CompilerScriptMapping(debuggerModel, workspace, debuggerWorkspaceBinding);
    Bindings.IgnoreListManager.IgnoreListManager.instance({forceNew: false, debuggerWorkspaceBinding});

    target.setInspectedURL(frameUrl);
    debuggerModel.parsedScriptSource('1' as Protocol.Runtime.ScriptId, sourceUrl, 0, 0, 3, 3, 1, '', null, false, sourceMapUrl, false, false, 10, false, null, null, null, null, null);
    const scripts = debuggerModel.scripts();
    assert.lengthOf(scripts, 1);
    const script = scripts[0];

    const sourceMapManager = debuggerModel.sourceMapManager();
    // const script = new SDK.Script.Script(
    //     debuggerModel, '1' as Protocol.Runtime.ScriptId, scriptUrl, 0, 0, 0, 0, 0, '', false, false, sourceMapUrl,
    //     false, 0, null, null, null, null, null, null);

    // sourceMapManager.attachSourceMap(script, sourceUrl, sourceMapUrl);

    // Wait until the source map has attached.

    const sourceMap = await sourceMapManager.sourceMapForClientPromise(script);
    assertNotNullOrUndefined(sourceMap);
    const originalURLs = sourceMap.sourceURLs();
    assert.lengthOf(originalURLs, 1);

    let uiSourceCode;
    while (true) {
      uiSourceCode = compilerScriptMapping.uiSourceCodeForURL(originalURLs[0], script.isContentScript());
      if (uiSourceCode !== null) {
        break;
      };
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    console.log(uiSourceCode);
    assertNotNullOrUndefined(uiSourceCode);
    const expectedUISourceCode = Workspace.Workspace.WorkspaceImpl.instance().uiSourceCodeForURL(originalURLs[0]);
    assert.deepEqual(uiSourceCode, expectedUISourceCode);
  });
});

