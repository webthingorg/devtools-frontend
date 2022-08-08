// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as SDK from '../../../../front_end/core/sdk/sdk.js';
import * as Bindings from '../../../../front_end/models/bindings/bindings.js';
import * as Persistence from '../../../../front_end/models/persistence/persistence.js';
import * as Workspace from '../../../../front_end/models/workspace/workspace.js';

import {createTarget} from './EnvironmentHelpers.js';

export async function setUpEnvironment() {
  const workspace = Workspace.Workspace.WorkspaceImpl.instance();
  const targetManager = SDK.TargetManager.TargetManager.instance();
  const debuggerWorkspaceBinding =
      Bindings.DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance({forceNew: true, targetManager, workspace});
  const breakpointManager = Bindings.BreakpointManager.BreakpointManager.instance(
      {forceNew: true, targetManager, workspace, debuggerWorkspaceBinding});
  Persistence.Persistence.PersistenceImpl.instance({forceNew: true, workspace, breakpointManager});
  const networkPersistenceManager =
      Persistence.NetworkPersistenceManager.NetworkPersistenceManager.instance({forceNew: true, workspace});
  return {networkPersistenceManager};
}

export async function setUpHeaderOverrides() {
  const target = createTarget();
  const {networkPersistenceManager} = await setUpEnvironment();
  const fileSystem = {
    fileSystemPath: () => 'file:///path/to/overrides',
    fileSystemBaseURL: 'file:///path/to/overrides/',
    // uiSourceCodeForURL: (url: string): Workspace.UISourceCode.UISourceCode | null => uiSourceCodeMap.get(url) || null,
  } as unknown as Persistence.FileSystemWorkspaceBinding.FileSystem;

  const globalHeaders = `[
    {
      "applyTo": "*",
      "headers": {
        "age": "overridden"
      }
    }
  ]`;

  const exampleHeaders = `[
    {
      "applyTo": "index.html",
      "headers": {
        "index-only": "only added to index.html"
      }
    },
    {
      "applyTo": "*.css",
      "headers": {
        "css-only": "only added to css files"
      }
    },
    {
      "applyTo": "path/to/*.js",
      "headers": {
        "another-header": "only added to specific path"
      }
    }
  ]`;

  const exampleSourceCode = {
    requestContent: () => {
      return Promise.resolve({content: exampleHeaders});
    },
    url: () => 'file:///path/to/overrides/www.example.com/.headers',
    project: () => fileSystem,
    name: () => '.headers',
  } as unknown as Workspace.UISourceCode.UISourceCode;

  const globalSourceCode = {
    requestContent: () => {
      return Promise.resolve({content: globalHeaders});
    },
    url: () => 'file:///path/to/overrides/.headers',
    project: () => fileSystem,
    name: () => '.headers',
  } as unknown as Workspace.UISourceCode.UISourceCode;

  const helloSourceCode = {
    requestContent: () => {
      return Promise.resolve({content: 'Hello World!'});
    },
    url: () => 'file:///path/to/overrides/www.example.com/helloWorld.html',
    project: () => {
      return {...fileSystem, requestFileBlob: () => new Blob(['Hello World'])};
    },
    name: () => 'helloWorld.html',
  } as unknown as Workspace.UISourceCode.UISourceCode;

  const uiSourceCodeMap = new Map<string, Workspace.UISourceCode.UISourceCode>();
  uiSourceCodeMap.set(exampleSourceCode.url(), exampleSourceCode);
  uiSourceCodeMap.set(globalSourceCode.url(), globalSourceCode);
  uiSourceCodeMap.set(helloSourceCode.url(), helloSourceCode);

  const mockProject = {
    uiSourceCodes: () => [exampleSourceCode, globalSourceCode, helloSourceCode],
    id: () => 'file:///path/to/overrides',
    fileSystemPath: () => 'file:///path/to/overrides',
    uiSourceCodeForURL: (url: string): Workspace.UISourceCode.UISourceCode | null => uiSourceCodeMap.get(url) || null,
  } as unknown as Workspace.Workspace.Project;

  await networkPersistenceManager.setProject(mockProject);
  sinon.stub(target.fetchAgent(), 'invoke_enable');
  await networkPersistenceManager.updateInterceptionPatternsForTests();
  return {target, networkPersistenceManager};
}
