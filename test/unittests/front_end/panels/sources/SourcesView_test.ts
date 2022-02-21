// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import * as Sources from '../../../../../front_end/panels/sources/sources.js';
import * as UI from '../../../../../front_end/ui/legacy/legacy.js';
import * as SDK from '../../../../../front_end/core/sdk/sdk.js';
import * as Workspace from '../../../../../front_end/models/workspace/workspace.js';
import * as Bindings from '../../../../../front_end/models/bindings/bindings.js';
import * as Persistence from '../../../../../front_end/models/persistence/persistence.js';
import * as Root from '../../../../../front_end/core/root/root.js';
import {initializeGlobalVars, deinitializeGlobalVars} from '../../helpers/EnvironmentHelpers.js';
import * as Common from '../../../../../front_end/core/common/common.js';

describe('SourcesView', () => {
  before(async () => {
    await initializeGlobalVars();
    const actionRegistryInstance = UI.ActionRegistry.ActionRegistry.instance({forceNew: true});
    const workspace = Workspace.Workspace.WorkspaceImpl.instance();
    const forceNew = true;
    const targetManager = SDK.TargetManager.TargetManager.instance();
    const debuggerWorkspaceBinding =
        Bindings.DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance({forceNew, targetManager, workspace});
    const breakpointManager = Bindings.BreakpointManager.BreakpointManager.instance(
        {forceNew: true, targetManager, workspace, debuggerWorkspaceBinding});
    Persistence.Persistence.PersistenceImpl.instance({forceNew: true, workspace, breakpointManager});
    UI.ShortcutRegistry.ShortcutRegistry.instance({forceNew: true, actionRegistry: actionRegistryInstance});
    Root.Runtime.experiments.register('sourcesPrettyPrint', 'Automatically pretty print in the Sources Panel');
  });
  after(async () => {
    await deinitializeGlobalVars();
  });

  it('removes view when renamed file requires a different viewer', async () => {
    const sourcesView = new Sources.SourcesView.SourcesView();
    const workspace = Workspace.Workspace.WorkspaceImpl.instance();
    const fileSystem = {
      mimeType: () => 'text/html',
      canSetFileContent: () => true,
      rename: (
          uiSourceCode: Workspace.UISourceCode.UISourceCode, newName: string,
          callback: (arg0: boolean, arg1?: string, arg2?: string, arg3?: Common.ResourceType.ResourceType) => void) => {
        const newURL = 'file:///path/to/overrides/' + newName;
        const newContentType = newName.endsWith('.jpg') ? Common.ResourceType.resourceTypes.Image :
                                                          Common.ResourceType.resourceTypes.Document;
        callback(true, newName, newURL, newContentType);
      },
      workspace: () => workspace,
      type: () => Workspace.Workspace.projectTypes.FileSystem,
    } as unknown as Persistence.FileSystemWorkspaceBinding.FileSystem;

    const uiSourceCode = new Workspace.UISourceCode.UISourceCode(
        fileSystem, 'file:///path/to/overrides/example.html', Common.ResourceType.resourceTypes.Document);
    sourcesView.viewForFile(uiSourceCode);

    assert.isTrue(sourcesView.hasSourceView(uiSourceCode));

    // Rename, but contentType stays the same
    await uiSourceCode.rename('newName.html');
    assert.isTrue(sourcesView.hasSourceView(uiSourceCode));

    // Rename which changes contentType
    await uiSourceCode.rename('image.jpg');
    assert.isFalse(sourcesView.hasSourceView(uiSourceCode));
  });
});
