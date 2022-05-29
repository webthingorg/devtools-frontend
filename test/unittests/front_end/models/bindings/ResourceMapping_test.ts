// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../../../../front_end/core/common/common.js';
import type * as Platform from '../../../../../front_end/core/platform/platform.js';
import type * as SDKModule from '../../../../../front_end/core/sdk/sdk.js';
import type * as Protocol from '../../../../../front_end/generated/protocol.js';
import * as Bindings from '../../../../../front_end/models/bindings/bindings.js';
import * as Workspace from '../../../../../front_end/models/workspace/workspace.js';
import {createTarget} from '../../helpers/EnvironmentHelpers.js';
import {describeWithMockConnection} from '../../helpers/MockConnection.js';

const {assert} = chai;

describeWithMockConnection('ResourceMapping', () => {
  let SDK: typeof SDKModule;
  before(async () => {
    SDK = await import('../../../../../front_end/core/sdk/sdk.js');
  });

  let debuggerModel: SDKModule.DebuggerModel.DebuggerModel;
  let resourceTreeModel: SDKModule.ResourceTreeModel.ResourceTreeModel;
  let resourceMapping: Bindings.ResourceMapping.ResourceMapping;
  let workspace: Workspace.Workspace.WorkspaceImpl;
  beforeEach(() => {
    const target = createTarget();
    const targetManager = target.targetManager();
    workspace = Workspace.Workspace.WorkspaceImpl.instance();
    resourceMapping = Bindings.ResourceMapping.ResourceMapping.instance({
      forceNew: true,
      targetManager,
      workspace,
    });
    resourceTreeModel =
        target.model(SDK.ResourceTreeModel.ResourceTreeModel) as SDKModule.ResourceTreeModel.ResourceTreeModel;
    debuggerModel = target.model(SDK.DebuggerModel.DebuggerModel) as SDKModule.DebuggerModel.DebuggerModel;
  });

  const embedderName = 'http://example.com/index.html' as Platform.DevToolsPath.UrlString;
  const url = embedderName;
  const scriptId = '4' as Protocol.Runtime.ScriptId;
  const executionContextId = 1;
  const hash = '';
  const startLine = 4;
  const startColumn = 14;
  const endLine = 9;
  const endColumn = 0;
  const length = 78;
  const frameId = 'main' as Protocol.Page.FrameId;
  const mimeType = 'text/html';

  describe('uiLocationToJSLocations', () => {
    it('correctly maps inline <script>s with //# sourceURL annotations', () => {
      const sourceURL = 'webpack:///src/foo.ts' as Platform.DevToolsPath.UrlString;

      // Inject the HTML document resource.
      const frame = resourceTreeModel.frameAttached(frameId, null) as SDKModule.ResourceTreeModel.ResourceTreeFrame;
      frame.addResource(new SDK.Resource.Resource(
          resourceTreeModel, null, url, url, frameId, null, Common.ResourceType.ResourceType.fromMimeType(mimeType),
          mimeType, null, null));

      // Register the inline script with the Debugger domain.
      debuggerModel.parsedScriptSource(
          scriptId, sourceURL, startLine, startColumn, endLine, endColumn, executionContextId, hash, undefined, false,
          undefined, true, false, length, false, null, null, null, null, embedderName);

      const uiSourceCode = workspace.uiSourceCodeForURL(url) as Workspace.UISourceCode.UISourceCode;
      assert.isNotNull(uiSourceCode);
      const locations = resourceMapping.uiLocationToJSLocations(uiSourceCode, startLine, startColumn);
      assert.strictEqual(locations.length, 1);
      const [location] = locations;
      assert.strictEqual(location.scriptId, scriptId);
      assert.strictEqual(location.lineNumber, 0);
      assert.strictEqual(location.columnNumber, 0);
    });

    it('correctly maps inline <script>s without //# sourceURL annotations', () => {
      // Inject the HTML document resource.
      const frame = resourceTreeModel.frameAttached(frameId, null) as SDKModule.ResourceTreeModel.ResourceTreeFrame;
      frame.addResource(new SDK.Resource.Resource(
          resourceTreeModel, null, url, url, frameId, null, Common.ResourceType.ResourceType.fromMimeType(mimeType),
          mimeType, null, null));

      // Register the inline script with the Debugger domain.
      debuggerModel.parsedScriptSource(
          scriptId, url, startLine, startColumn, endLine, endColumn, executionContextId, hash, undefined, false,
          undefined, false, false, length, false, null, null, null, null, embedderName);

      const uiSourceCode = workspace.uiSourceCodeForURL(url) as Workspace.UISourceCode.UISourceCode;
      assert.isNotNull(uiSourceCode);
      const locations = resourceMapping.uiLocationToJSLocations(uiSourceCode, 6, 2);
      assert.strictEqual(locations.length, 1);
      const [location] = locations;
      assert.strictEqual(location.scriptId, scriptId);
      assert.strictEqual(location.lineNumber, 6);
      assert.strictEqual(location.columnNumber, 2);
    });
  });

  describe('jsLocationToUILocation', () => {
    it('correctly maps inline <script>s with //# sourceURL annotations', () => {
      const sourceURL = 'webpack:///(webpack-dev-server)/foo.js' as Platform.DevToolsPath.UrlString;

      // Inject the HTML document resource.
      const frame = resourceTreeModel.frameAttached(frameId, null) as SDKModule.ResourceTreeModel.ResourceTreeFrame;
      frame.addResource(new SDK.Resource.Resource(
          resourceTreeModel, null, url, url, frameId, null, Common.ResourceType.ResourceType.fromMimeType(mimeType),
          mimeType, null, null));

      // Register the inline script with the Debugger domain.
      debuggerModel.parsedScriptSource(
          scriptId, sourceURL, startLine, startColumn, endLine, endColumn, executionContextId, hash, undefined, false,
          undefined, false, false, length, false, null, null, null, null, embedderName);

      const rawLocation = debuggerModel.createRawLocationByScriptId(scriptId, 6, 2);
      const uiLocation = resourceMapping.jsLocationToUILocation(rawLocation);
      assert.isNotNull(uiLocation);
      assert.strictEqual(uiLocation?.uiSourceCode, workspace.uiSourceCodeForURL(url));
      assert.strictEqual(uiLocation?.lineNumber, 6);
      assert.strictEqual(uiLocation?.columnNumber, 2);
    });

    it('correctly maps inline <script>s without //# sourceURL annotations', () => {
      // Inject the HTML document resource.
      const frame = resourceTreeModel.frameAttached(frameId, null) as SDKModule.ResourceTreeModel.ResourceTreeFrame;
      frame.addResource(new SDK.Resource.Resource(
          resourceTreeModel, null, url, url, frameId, null, Common.ResourceType.ResourceType.fromMimeType(mimeType),
          mimeType, null, null));

      // Register the inline script with the Debugger domain.
      debuggerModel.parsedScriptSource(
          scriptId, url, startLine, startColumn, endLine, endColumn, executionContextId, hash, undefined, false,
          undefined, false, false, length, false, null, null, null, null, embedderName);

      const rawLocation = debuggerModel.createRawLocationByScriptId(scriptId, 6, 2);
      const uiLocation = resourceMapping.jsLocationToUILocation(rawLocation);
      assert.isNotNull(uiLocation);
      assert.strictEqual(uiLocation?.uiSourceCode, workspace.uiSourceCodeForURL(url));
      assert.strictEqual(uiLocation?.lineNumber, 6);
      assert.strictEqual(uiLocation?.columnNumber, 2);
    });
  });
});
