// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as SDK from '../../../../front_end/core/sdk/sdk.js';
import * as Bindings from '../../../../front_end/models/bindings/bindings.js';
import * as Persistence from '../../../../front_end/models/persistence/persistence.js';
import * as Workspace from '../../../../front_end/models/workspace/workspace.js';
import type * as Platform from '../../../../front_end/core/platform/platform.js';
import * as Common from '../../../../front_end/core/common/common.js';

export function setUpEnvironment() {
  const workspace = Workspace.Workspace.WorkspaceImpl.instance();
  const targetManager = SDK.TargetManager.TargetManager.instance();
  const resourceMapping = new Bindings.ResourceMapping.ResourceMapping(targetManager, workspace);
  const debuggerWorkspaceBinding = Bindings.DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance(
      {forceNew: true, resourceMapping, targetManager});
  const breakpointManager = Bindings.BreakpointManager.BreakpointManager.instance(
      {forceNew: true, targetManager, workspace, debuggerWorkspaceBinding});
  Persistence.Persistence.PersistenceImpl.instance({forceNew: true, workspace, breakpointManager});
  const networkPersistenceManager =
      Persistence.NetworkPersistenceManager.NetworkPersistenceManager.instance({forceNew: true, workspace});
  return {networkPersistenceManager};
}

export async function createWorkspaceProject(
    baseUrl: Platform.DevToolsPath.UrlString, files: Array<{path: string, content: string, name: string}>) {
  const {networkPersistenceManager} = setUpEnvironment();
  const fileSystem = {
    fileSystemPath: () => baseUrl,
    fileSystemBaseURL: baseUrl + '/',
    type: () => Workspace.Workspace.projectTypes.FileSystem,
    fileSystemInternal: {
      supportsAutomapping: () => false,
    },
  } as unknown as Persistence.FileSystemWorkspaceBinding.FileSystem;

  const uiSourceCodes = new Map<string, Workspace.UISourceCode.UISourceCode>();
  for (const file of files) {
    const url = Common.ParsedURL.ParsedURL.concatenate(baseUrl, '/', file.path, file.name);
    uiSourceCodes.set(url, {
      requestContent: () => Promise.resolve({content: file.content}),
      url: () => url,
      project: () => {
        return {...fileSystem, requestFileBlob: () => new Blob([file.content])};
      },
      name: () => file.name,
      setWorkingCopy: () => {},
      commitWorkingCopy: () => {},
    } as unknown as Workspace.UISourceCode.UISourceCode);
  }

  const mockProject = {
    uiSourceCodes: () => Array.from(uiSourceCodes.values()),
    id: () => baseUrl,
    fileSystemPath: () => baseUrl,
    uiSourceCodeForURL: (url: string) => {
      return uiSourceCodes.get(url) || null;
    },
    type: () => Workspace.Workspace.projectTypes.FileSystem,
    initialGitFolders: () => [],
    fileSystemInternal: {
      type: () => 'filesystem',
    },
  } as unknown as Workspace.Workspace.Project;

  await networkPersistenceManager.setProject(mockProject);
  const workspace = Workspace.Workspace.WorkspaceImpl.instance();
  workspace.addProject(mockProject);
  return networkPersistenceManager;
}
