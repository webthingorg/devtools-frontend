// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import * as Bindings from '../../../../../front_end/models/bindings/bindings.js';
import * as Common from '../../../../../front_end/core/common/common.js';
import * as SDK from '../../../../../front_end/core/sdk/sdk.js';
import * as Sources from '../../../../../front_end/panels/sources/sources.js';
import * as TextUtils from '../../../../../front_end/models/text_utils/text_utils.js';
import * as Workspace from '../../../../../front_end/models/workspace/workspace.js';
import {describeWithEnvironment} from '../../helpers/EnvironmentHelpers.js';
import * as Persistence from '../../../../../front_end/models/persistence/persistence.js';
import {assertNotNullOrUndefined} from '../../../../../front_end/core/platform/platform.js';

describeWithEnvironment('UISourceCodeFrame', () => {
  let workspace: Workspace.Workspace.WorkspaceImpl;

  beforeEach(() => {
    workspace = Workspace.Workspace.WorkspaceImpl.instance({forceNew: true});
    const targetManager = SDK.TargetManager.TargetManager.instance();
    const debuggerWorkspaceBinding =
        Bindings.DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance({forceNew: true, targetManager, workspace});
    Bindings.IgnoreListManager.IgnoreListManager.instance({forceNew: true, debuggerWorkspaceBinding});
    Bindings.CSSWorkspaceBinding.CSSWorkspaceBinding.instance({forceNew: true, targetManager, workspace});
    const breakpointManager = Bindings.BreakpointManager.BreakpointManager.instance(
        {forceNew: true, targetManager, workspace, debuggerWorkspaceBinding});
    Persistence.Persistence.PersistenceImpl.instance({forceNew: true, workspace, breakpointManager});
  });

  const content = `Line 1
  This is line two.
  And this is line three.`;

  it('reloads messages when transitioning from an unbound UISourceCode to a PersistenceBinding', async () => {
    const filesystemProject = sinon.createStubInstance(
        Persistence.FileSystemWorkspaceBinding.FileSystem,
        {mimeType: 'text/javascript', type: 'filesystem', workspace});
    const filesystemSC = new Workspace.UISourceCode.UISourceCode(
        filesystemProject, 'snippet:///my-snippet', Common.ResourceType.resourceTypes.Script);
    filesystemSC.setContent(content, false);

    const frame = new Sources.UISourceCodeFrame.UISourceCodeFrame(filesystemSC);
    frame.markAsRoot();
    const container = document.getElementById('__devtools-test-container-id');
    frame.show(container!);

    const networkProject =
        sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject, {type: 'network'});
    const networkSC = new Workspace.UISourceCode.UISourceCode(
        networkProject, 'debugger://VM 25 my-snippet', Common.ResourceType.resourceTypes.Script);

    // Simulate a Message arriving on the networked UISourceCode before the binding is established.
    const message = new Workspace.UISourceCode.Message(
        Workspace.UISourceCode.Message.Level.Error, 'something went wrong', undefined,
        new TextUtils.TextRange.TextRange(2, 0, 2, 5));
    networkSC.addMessage(message);

    let shownMessages = frame.textEditor.state.field(Sources.UISourceCodeFrame.showRowMessages, false);
    assert.isUndefined(shownMessages);

    const binding = new Persistence.Persistence.PersistenceBinding(networkSC, filesystemSC);
    await Persistence.Persistence.PersistenceImpl.instance().addBinding(binding);

    shownMessages = frame.textEditor.state.field(Sources.UISourceCodeFrame.showRowMessages, false);
    assertNotNullOrUndefined(shownMessages);
    assert.deepStrictEqual(shownMessages.messages.rows.flat(), [message]);

    frame.dispose();
  });
});
