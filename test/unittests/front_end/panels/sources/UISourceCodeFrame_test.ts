// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;
import {getTestContainer} from '../../helpers/DOMHelpers.js';
import {describeWithEnvironment} from '../../helpers/EnvironmentHelpers.js';

import * as Common from '../../../../../front_end/core/common/common.js';
import * as SDK from '../../../../../front_end/core/sdk/sdk.js';
import * as Bindings from '../../../../../front_end/models/bindings/bindings.js';
import * as Persistence from '../../../../../front_end/models/persistence/persistence.js';
import * as TextUtils from '../../../../../front_end/models/text_utils/text_utils.js';
import * as Workspace from '../../../../../front_end/models/workspace/workspace.js';
import * as Sources from '../../../../../front_end/panels/sources/sources.js';

function makeUISourceCode(url: string, content: string): Workspace.UISourceCode.UISourceCode {
  const type = Common.ResourceType.ResourceType.fromURL(url) || Common.ResourceType.resourceTypes.Script;
  const workspace = Workspace.Workspace.WorkspaceImpl.instance();
  const targetManager = SDK.TargetManager.TargetManager.instance();
  Bindings.DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance({
    forceNew: true,
    targetManager,
    workspace,
  });
  Bindings.CSSWorkspaceBinding.CSSWorkspaceBinding.instance({
    forceNew: true,
    targetManager,
    workspace,
  });
  const project = new Bindings.ContentProviderBasedProject.ContentProviderBasedProject(
      workspace, 'test_project', Workspace.Workspace.projectTypes.Debugger, 'test_project', false);
  workspace.addProject(project);
  const contentProvider = TextUtils.StaticContentProvider.StaticContentProvider.fromString(url, type, content);
  const uiSourceCode = project.createUISourceCode(url, type);
  const mimeType = Common.ResourceType.ResourceType.mimeFromURL(url) || 'text/javascript';
  project.addUISourceCodeWithProvider(uiSourceCode, contentProvider, null, mimeType);

  const breakpointManager = Bindings.BreakpointManager.BreakpointManager.instance({
    forceNew: true,
    targetManager,
    workspace,
    debuggerWorkspaceBinding: Bindings.DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance({
      forceNew: true,
      targetManager,
      workspace,
    }),
  });
  Persistence.Persistence.PersistenceImpl.instance({
    forceNew: true,
    breakpointManager,
    workspace,
  });
  return uiSourceCode;
}

describeWithEnvironment('FilePathScoreFunction', () => {
  it('creates an editor', async () => {
    const frame =
        new Sources.UISourceCodeFrame.UISourceCodeFrame(makeUISourceCode('test.js', 'let x = 10;\nconsole.log(x);'));
    frame.markAsRoot();
    frame.show(getTestContainer());
    await new Promise(a => setTimeout(a, 500));
    assert.isNotNull(frame.textEditor.parentNode);
    assert.isNotNull(frame.textEditor.editor.dom.querySelector('.cm-lineNumbers'));
    const keyword = frame.textEditor.editor.contentDOM.querySelector('.token-keyword');
    assert.isNotNull(keyword);
    assert.strictEqual(keyword?.textContent, 'let');
  });
});
