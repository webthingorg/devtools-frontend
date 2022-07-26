// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import * as Workspace from '../../../../../front_end/models/workspace/workspace.js';
import * as Common from '../../../../../front_end/core/common/common.js';
import type * as Platform from '../../../../../front_end/core/platform/platform.js';
import * as Bindings from '../../../../../front_end/models/bindings/bindings.js';
import type * as TextUtils from '../../../../../front_end/models/text_utils/text_utils.js';

describe('UISourceCode', () => {
  it('can be instantiated correctly', () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    const urlStringTagExample = 'https://example.com/' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);

    const uiSourceCode = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    assert.isNotNull(uiSourceCode);
  });

  it('can return name', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    const urlStringTagExample =
        'http://username@www.example.com:8080/testing/test?isTest=true' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);

    const uiSourceCode = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    assert.strictEqual(uiSourceCode.name(), 'test?isTest=true');
  });

  it('can return url', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    const urlStringTagExample = 'https://example.com/' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);

    const uiSourceCode = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    assert.strictEqual(uiSourceCode.url(), 'https://example.com/');
  });

  it('can return canononical script ID', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    const urlStringTagExample = 'https://example.com/' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);
    contentTypeStub.name.returns('nameExample');

    const uiSourceCode = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    assert.strictEqual(uiSourceCode.canononicalScriptId(), 'nameExample,https://example.com/');
  });

  it('can return parent URL', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    const urlStringTagExample =
        'http://username@www.example.com:8080/testing/test?isTest=true' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);

    const uiSourceCode = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    assert.strictEqual(uiSourceCode.parentURL(), 'http://www.example.com:8080/testing');
  });

  it('can return origin', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    const urlStringTagExample =
        'http://username@www.example.com:8080/testing/test?isTest=true' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);

    const uiSourceCode = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    assert.strictEqual(uiSourceCode.origin(), 'http://www.example.com:8080');
  });

  it('can return trimmed display name', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    const urlStringTagExample = 'http://username@www.example.com:8080/testing/' +
            'test'.repeat(30) + '?isTest=true' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);

    const uiSourceCode = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    assert.strictEqual(uiSourceCode.displayName(false), 'test'.repeat(24) + 'tes…');
  });

  it('can return untrimmed display name', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    const urlStringTagExample = 'http://username@www.example.com:8080/testing/' +
            'test'.repeat(30) + '?isTest=true' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);

    const uiSourceCode = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    assert.strictEqual(uiSourceCode.displayName(true), 'test'.repeat(30) + '?isTest=true');
  });

  it('can request project metadata', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    projectStub.requestMetadata.resolves(null);
    const urlStringTagExample = 'http{isEncoded: true}://username@www.example.com:8080/testing/' +
            'test'.repeat(30) + '?isTest=true' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);

    const uiSourceCode = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    assert.strictEqual(await uiSourceCode.requestMetadata(), null);
  });

  it('can return full display name', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    projectStub.fullDisplayName.returns('Test Name');
    const urlStringTagExample = 'http://username@www.example.com:8080/testing/' +
            'test'.repeat(30) + '?isTest=true' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);

    const uiSourceCode = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    assert.strictEqual(uiSourceCode.fullDisplayName(), 'Test Name');
  });

  it('can return MIME type', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    projectStub.mimeType.returns('Test Type');
    const urlStringTagExample = 'http://username@www.example.com:8080/testing/' +
            'test'.repeat(30) + '?isTest=true' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);

    const uiSourceCode = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    assert.strictEqual(uiSourceCode.mimeType(), 'Test Type');
  });

  it('can return display name', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    const urlStringTagExample =
        'http://username@www.example.com:8080/testing/test?isTest=true' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);

    const uiSourceCode = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    assert.strictEqual(uiSourceCode.displayName(), 'test?isTest=true');
  });

  it('can return whether or not the project can be renamed', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    projectStub.canRename.returns(true);
    const urlStringTagExample =
        'http://username@www.example.com:8080/testing/test?isTest=true' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);

    const uiSourceCode = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    assert.isTrue(uiSourceCode.canRename());
  });

  it('can rename a project', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    projectStub.workspace.returns(sinon.createStubInstance(Workspace.Workspace.WorkspaceImpl));
    const urlStringTagExample =
        'http://username@www.example.com:8080/testing/test?isTest=true' as Platform.DevToolsPath.UrlString;
    const rawPathstringExample = 'newName.html' as Platform.DevToolsPath.RawPathString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);

    const uiSourceCode = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);
    projectStub.rename.callsArgWith(2, uiSourceCode, rawPathstringExample);
    await uiSourceCode.rename(rawPathstringExample);

    assert.strictEqual(uiSourceCode.name(), 'newName.html');
  });

  it('deletes file by calling the project deleteFile function', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    const urlStringTagExample =
        'http://username@www.example.com:8080/testing/test?isTest=true' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);
    const uiSourceCode = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    uiSourceCode.remove();

    sinon.assert.calledOnce(projectStub.deleteFile);
  });

  it('can return content URL', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    const urlStringTagExample =
        'http://username@www.example.com:8080/testing/test?isTest=true' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);
    const uiSourceCode = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    const contentURL = uiSourceCode.contentURL();

    assert.strictEqual(contentURL, 'http://username@www.example.com:8080/testing/test?isTest=true');
  });

  it('can return content type', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    const urlStringTagExample =
        'http://username@www.example.com:8080/testing/test?isTest=true' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);
    const uiSourceCode = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    const contentType = uiSourceCode.contentType();

    assert.strictEqual(contentType, contentTypeStub);
  });

  it('can request content', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    const defferedContentStub = {content: 'Example', isEncoded: true} as TextUtils.ContentProvider.DeferredContent;
    projectStub.requestFileContent.resolves(defferedContentStub);
    const urlStringTagExample =
        'http://username@www.example.com:8080/testing/test?isTest=true' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);
    const uiSourceCode = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    const content = await uiSourceCode.requestContent();

    assert.strictEqual(content, defferedContentStub);
  });

  it('check if the content is encoded', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    const defferedContentStub = {content: 'Example', isEncoded: true} as TextUtils.ContentProvider.DeferredContent;
    projectStub.requestFileContent.resolves(defferedContentStub);
    const urlStringTagExample =
        'http://username@www.example.com:8080/testing/test?isTest=true' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);
    const uiSourceCode = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    const encodedContent = await uiSourceCode.contentEncoded();

    assert.isTrue(encodedContent);
  });

  it('can commit content', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    projectStub.workspace.returns(sinon.createStubInstance(Workspace.Workspace.WorkspaceImpl));
    const urlStringTagExample =
        'http://username@www.example.com:8080/testing/test?isTest=true' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);
    const uiSourceCode = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    uiSourceCode.addRevision('New Content');
    const newContent = await uiSourceCode.requestContent();

    assert.deepEqual(newContent, {content: 'New Content', isEncoded: false});
  });

  it('can check if there are commits', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    projectStub.workspace.returns(sinon.createStubInstance(Workspace.Workspace.WorkspaceImpl));
    const urlStringTagExample =
        'http://username@www.example.com:8080/testing/test?isTest=true' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);
    const uiSourceCode = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    const hasCommitsBefore = uiSourceCode.hasCommits();
    uiSourceCode.addRevision('New Content');
    await uiSourceCode.requestContent();
    const hasCommitsAfter = uiSourceCode.hasCommits();

    assert.isFalse(hasCommitsBefore);
    assert.isTrue(hasCommitsAfter);
  });

  it('can set a working copy', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    projectStub.workspace.returns(sinon.createStubInstance(Workspace.Workspace.WorkspaceImpl));
    const urlStringTagExample =
        'http://username@www.example.com:8080/testing/test?isTest=true' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);
    const uiSourceCode = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    uiSourceCode.setWorkingCopy('Working Copy Example');
    const workingCopy = uiSourceCode.workingCopy();

    assert.strictEqual(workingCopy, 'Working Copy Example');
  });

  it('can reset working copy', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    projectStub.workspace.returns(sinon.createStubInstance(Workspace.Workspace.WorkspaceImpl));
    const urlStringTagExample =
        'http://username@www.example.com:8080/testing/test?isTest=true' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);
    const uiSourceCode = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    uiSourceCode.setWorkingCopy('Working Copy Example');
    uiSourceCode.resetWorkingCopy();
    const workingCopy = uiSourceCode.workingCopy();

    assert.strictEqual(workingCopy, '');
  });

  it('can set content', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    projectStub.workspace.returns(sinon.createStubInstance(Workspace.Workspace.WorkspaceImpl));
    const urlStringTagExample =
        'http://username@www.example.com:8080/testing/test?isTest=true' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);
    const uiSourceCode = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    uiSourceCode.setContent('New Content', true);
    const newContent = await uiSourceCode.requestContent();

    assert.deepEqual(newContent, {content: 'New Content', isEncoded: false});
  });

  it('can set working copy getter function', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    projectStub.workspace.returns(sinon.createStubInstance(Workspace.Workspace.WorkspaceImpl));
    const urlStringTagExample =
        'http://username@www.example.com:8080/testing/test?isTest=true' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);
    const uiSourceCode = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    uiSourceCode.setWorkingCopyGetter(() => {
      return 'Example Function';
    });
    const newContent = uiSourceCode.workingCopy();

    assert.strictEqual(newContent, 'Example Function');
  });

  it('can check if working copy is dirty', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    projectStub.workspace.returns(sinon.createStubInstance(Workspace.Workspace.WorkspaceImpl));
    const urlStringTagExample =
        'http://username@www.example.com:8080/testing/test?isTest=true' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);
    const uiSourceCode = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    const isDirtyBefore = uiSourceCode.isDirty();
    uiSourceCode.setWorkingCopy('Working Copy Example');
    const isDirtyAfter = uiSourceCode.isDirty();

    assert.isFalse(isDirtyBefore);
    assert.isTrue(isDirtyAfter);
  });

  it('can return extension', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    const urlStringTagExample =
        'http://username@www.example.com:8080/testing/test.html' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);
    const uiSourceCode = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    const content = uiSourceCode.extension();

    assert.strictEqual(content, 'html');
  });

  it('can commit working copy', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    projectStub.workspace.returns(sinon.createStubInstance(Workspace.Workspace.WorkspaceImpl));
    const urlStringTagExample =
        'http://username@www.example.com:8080/testing/test?isTest=true' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);
    const uiSourceCode = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    const hasCommitsBefore = uiSourceCode.hasCommits();
    uiSourceCode.setWorkingCopy('Working Copy Example');
    uiSourceCode.commitWorkingCopy();
    const hasCommitsAfter = uiSourceCode.hasCommits();

    assert.isFalse(hasCommitsBefore);
    assert.isTrue(hasCommitsAfter);
  });

  it('can return content', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    projectStub.workspace.returns(sinon.createStubInstance(Workspace.Workspace.WorkspaceImpl));
    const urlStringTagExample =
        'http://username@www.example.com:8080/testing/test.html' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);
    const uiSourceCode = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);
    uiSourceCode.setContent('Example Content', true);

    const content = uiSourceCode.content();

    assert.strictEqual(content, 'Example Content');
  });

  it('can return load error', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    const defferedContentStub = {content: 'Content with error', isEncoded: true, error: 'Example Error'} as
        TextUtils.ContentProvider.DeferredContent;
    projectStub.requestFileContent.resolves(defferedContentStub);
    projectStub.workspace.returns(sinon.createStubInstance(Workspace.Workspace.WorkspaceImpl));
    const urlStringTagExample =
        'http://username@www.example.com:8080/testing/test.html' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);
    const uiSourceCode = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);
    await uiSourceCode.requestContent();

    const returnedError = uiSourceCode.loadError();

    assert.strictEqual(returnedError, 'Example Error');
  });

  it('can search content', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    projectStub.workspace.returns(sinon.createStubInstance(Workspace.Workspace.WorkspaceImpl));
    const urlStringTagExample =
        'http://username@www.example.com:8080/testing/test.html' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);
    const uiSourceCode = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);
    uiSourceCode.setContent('Example Content', true);

    const searchResult = await uiSourceCode.searchInContent('Content', true, false);

    assert.deepEqual(searchResult, [{lineNumber: 0, lineContent: 'Example Content', columnNumber: 8}]);
  });

  it('can check if content is loaded', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    projectStub.workspace.returns(sinon.createStubInstance(Workspace.Workspace.WorkspaceImpl));
    const urlStringTagExample =
        'http://username@www.example.com:8080/testing/test.html' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);
    const uiSourceCode = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);
    uiSourceCode.setContent('Example Content', true);

    const contentLoadedCheck = uiSourceCode.contentLoaded();

    assert.isTrue(contentLoadedCheck);
  });

  it('can return UI location', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    projectStub.workspace.returns(sinon.createStubInstance(Workspace.Workspace.WorkspaceImpl));
    const urlStringTagExample =
        'http://username@www.example.com:8080/testing/test.html' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);
    const uiSourceCode = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    const UILocation = uiSourceCode.uiLocation(5);

    assert.strictEqual(UILocation.lineNumber, 5);
  });

  it('can add message', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    const messageStub = sinon.createStubInstance(Workspace.UISourceCode.Message);
    const urlStringTagExample =
        'http://username@www.example.com:8080/testing/test.html' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);
    const uiSourceCode = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    uiSourceCode.addMessage(messageStub);
    const messages = uiSourceCode.messages();
    const expectedResult = new Set<Workspace.UISourceCode.Message>([messageStub]);

    assert.deepEqual(messages, expectedResult);
  });

  it('can add line message', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    const urlStringTagExample =
        'http://username@www.example.com:8080/testing/test.html' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);
    const uiSourceCode = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    uiSourceCode.addLineMessage(Workspace.UISourceCode.Message.Level.Error, 'Example Message', 5);
    const messagesSet = uiSourceCode.messages();
    const addedMessage = messagesSet.values().next().value;

    assert.strictEqual(messagesSet.size, 1);
    assert.strictEqual(addedMessage.levelInternal, 'Error');
    assert.strictEqual(addedMessage.textInternal, 'Example Message');
    assert.strictEqual(addedMessage.range.startLine, 5);
    assert.strictEqual(addedMessage.range.endLine, 5);
  });

  it('can remove message', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    const messageStub = sinon.createStubInstance(Workspace.UISourceCode.Message);
    const urlStringTagExample =
        'http://username@www.example.com:8080/testing/test.html' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);
    const uiSourceCode = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);
    uiSourceCode.addMessage(messageStub);

    const messagesLengthBefore = uiSourceCode.messages().size;
    uiSourceCode.removeMessage(messageStub);
    const messagesLengthAfter = uiSourceCode.messages().size;

    assert.strictEqual(messagesLengthBefore, 1);
    assert.strictEqual(messagesLengthAfter, 0);
  });

  it('can set decoration data', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    const urlStringTagExample =
        'http://username@www.example.com:8080/testing/test.html' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);
    const uiSourceCode = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    uiSourceCode.setDecorationData('example type', 'example data');

    assert.strictEqual(uiSourceCode.getDecorationData('example type'), 'example data');
  });

  it('can disable editing', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    const urlStringTagExample =
        'http://username@www.example.com:8080/testing/test.html' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);
    const uiSourceCode = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    uiSourceCode.disableEdit();

    assert.isTrue(uiSourceCode.editDisabled());
  });
});
