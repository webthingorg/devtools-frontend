// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../../../../front_end/core/common/common.js';
import * as Platform from '../../../../../front_end/core/platform/platform.js';
import * as SDK from '../../../../../front_end/core/sdk/sdk.js';
import * as Protocol from '../../../../../front_end/generated/protocol.js';
import * as Bindings from '../../../../../front_end/models/bindings/bindings.js';
import * as Workspace from '../../../../../front_end/models/workspace/workspace.js';
import {createTarget} from '../../helpers/EnvironmentHelpers.js';
import {describeWithMockConnection} from '../../helpers/MockConnection.js';
import {MockExecutionContext} from '../../helpers/MockExecutionContext.js';

async function addMessage(
    helper: Bindings.PresentationConsoleMessageHelper.PresentationConsoleMessageHelper, target: SDK.Target.Target,
    url: Platform.DevToolsPath.UrlString) {
  const details = {line: 2, column: 1, url};
  const message = new SDK.ConsoleModel.ConsoleMessage(
      target.model(SDK.RuntimeModel.RuntimeModel), SDK.ConsoleModel.FrontendMessageSource.ConsoleAPI,
      Protocol.Log.LogEntryLevel.Error, 'test message', details);
  await helper.consoleMessageAdded(message);
  return message;
}

function addUISourceCode(url: Platform.DevToolsPath.UrlString) {
  const workspace = Workspace.Workspace.WorkspaceImpl.instance();
  const project = new Bindings.ContentProviderBasedProject.ContentProviderBasedProject(
      workspace, 'test-project', Workspace.Workspace.projectTypes.Network, 'test-project', false);
  const uiSourceCode = new Workspace.UISourceCode.UISourceCode(
      project, url, Common.ResourceType.ResourceType.fromMimeType('application/text'));
  project.addUISourceCode(uiSourceCode);
  return uiSourceCode;
}

async function addScript(
    helper: Bindings.PresentationConsoleMessageHelper.PresentationConsoleMessageHelper,
    debuggerModel: SDK.DebuggerModel.DebuggerModel, executionContext: SDK.RuntimeModel.ExecutionContext,
    url: Platform.DevToolsPath.UrlString): Promise<Workspace.UISourceCode.UISourceCode> {
  const helperParsedScriptSourcePromise = new Promise<void>((resolve, reject) => {
    const originalParsedScriptSource = helper.parsedScriptSource;
    sinon.stub(helper, 'parsedScriptSource')
        .callsFake(e => originalParsedScriptSource.call(helper, e).then(() => resolve()).catch(e => reject(e)));
  });

  const script = debuggerModel.parsedScriptSource(
      'scriptId' as Protocol.Runtime.ScriptId, url, 0, 0, 3, 3, executionContext.id, '', undefined, false, undefined,
      false, false, 0, false, null, null, null, null, null);
  await helperParsedScriptSourcePromise;

  const uiSourceCode =
      Bindings.DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance().uiSourceCodeForScript(script);

  Platform.assertNotNullOrUndefined(uiSourceCode);
  return uiSourceCode;
}

describeWithMockConnection('PresentationConsoleMessageHelper', () => {
  const url = 'http://example.test/test.css' as Platform.DevToolsPath.UrlString;
  let helper: Bindings.PresentationConsoleMessageHelper.PresentationConsoleMessageHelper;
  let executionContext: SDK.RuntimeModel.ExecutionContext;

  beforeEach(() => {
    executionContext = new MockExecutionContext(createTarget());
    const {debuggerModel} = executionContext;
    Platform.assertNotNullOrUndefined(debuggerModel);
    helper = new Bindings.PresentationConsoleMessageHelper.PresentationConsoleMessageHelper(debuggerModel);

    const target = executionContext.target();
    const workspace = Workspace.Workspace.WorkspaceImpl.instance();
    const targetManager = target.targetManager();
    const resourceMapping = new Bindings.ResourceMapping.ResourceMapping(targetManager, workspace);
    Bindings.DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance(
        {forceNew: false, resourceMapping, targetManager});
  });

  it('attaches messages correctly when the events are ordered:  uiSourceCode, message, script', async () => {
    const uiSourceCode = addUISourceCode(url);
    const message = await addMessage(helper, executionContext.target(), url);

    assert.deepEqual(uiSourceCode.messages().size, 1);
    assert.deepEqual(Array.from(uiSourceCode.messages().values())[0].text(), message.messageText);

    const scriptUISourceCode = await addScript(helper, executionContext.debuggerModel, executionContext, url);

    assert.deepEqual(uiSourceCode.messages().size, 0);
    assert.deepEqual(scriptUISourceCode.messages().size, 1);
    assert.deepEqual(Array.from(scriptUISourceCode.messages().values())[0].text(), message.messageText);
  });

  it('attaches messages correctly when the events are ordered:  message, uiSourceCode, script', async () => {
    const message = await addMessage(helper, executionContext.target(), url);
    const uiSourceCode = addUISourceCode(url);

    assert.deepEqual(uiSourceCode.messages().size, 1);
    assert.deepEqual(Array.from(uiSourceCode.messages().values())[0].text(), message.messageText);

    const scriptUISourceCode = await addScript(helper, executionContext.debuggerModel, executionContext, url);

    assert.deepEqual(uiSourceCode.messages().size, 0);
    assert.deepEqual(scriptUISourceCode.messages().size, 1);
    assert.deepEqual(Array.from(scriptUISourceCode.messages().values())[0].text(), message.messageText);
  });

  it('attaches messages correctly when the events are ordered:  message, script, uiSourceCode', async () => {
    const message = await addMessage(helper, executionContext.target(), url);
    const scriptUISourceCode = await addScript(helper, executionContext.debuggerModel, executionContext, url);

    assert.deepEqual(scriptUISourceCode.messages().size, 1);
    assert.deepEqual(Array.from(scriptUISourceCode.messages().values())[0].text(), message.messageText);

    const uiSourceCode = addUISourceCode(url);

    assert.deepEqual(uiSourceCode.messages().size, 0);
    assert.deepEqual(scriptUISourceCode.messages().size, 1);
    assert.deepEqual(Array.from(scriptUISourceCode.messages().values())[0].text(), message.messageText);
  });

  it('attaches messages correctly when the events are ordered:  uiSourceCode, script, message', async () => {
    const uiSourceCode = addUISourceCode(url);
    const scriptUISourceCode = await addScript(helper, executionContext.debuggerModel, executionContext, url);
    const message = await addMessage(helper, executionContext.target(), url);

    assert.deepEqual(uiSourceCode.messages().size, 0);
    assert.deepEqual(scriptUISourceCode.messages().size, 1);
    assert.deepEqual(Array.from(scriptUISourceCode.messages().values())[0].text(), message.messageText);
  });

  it('attaches messages correctly when the events are ordered:  script, uiSourceCode, message', async () => {
    const scriptUISourceCode = await addScript(helper, executionContext.debuggerModel, executionContext, url);
    const uiSourceCode = addUISourceCode(url);
    const message = await addMessage(helper, executionContext.target(), url);

    assert.deepEqual(uiSourceCode.messages().size, 0);
    assert.deepEqual(scriptUISourceCode.messages().size, 1);
    assert.deepEqual(Array.from(scriptUISourceCode.messages().values())[0].text(), message.messageText);
  });

  it('attaches messages correctly when the events are ordered:  script, message, uiSourceCode', async () => {
    const scriptUISourceCode = await addScript(helper, executionContext.debuggerModel, executionContext, url);
    const message = await addMessage(helper, executionContext.target(), url);
    assert.deepEqual(scriptUISourceCode.messages().size, 1);
    assert.deepEqual(Array.from(scriptUISourceCode.messages().values())[0].text(), message.messageText);

    const uiSourceCode = addUISourceCode(url);
    assert.deepEqual(uiSourceCode.messages().size, 0);
  });
});
