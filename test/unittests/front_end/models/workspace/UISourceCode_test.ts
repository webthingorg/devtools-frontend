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
  it('can return name', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    const urlStringTagExample =
        'http://www.example.com:8080/testing/test?isTest=true' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);

    const sut = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    assert.strictEqual(sut.name(), 'test?isTest=true');
  });

  it('can return url', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    const urlStringTagExample = 'https://example.com/' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);

    const sut = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    assert.strictEqual(sut.url(), 'https://example.com/');
  });

  it('can return canononical script ID', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    const urlStringTagExample = 'https://example.com/' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);
    contentTypeStub.name.returns('nameExample');

    const sut = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    assert.strictEqual(sut.canononicalScriptId(), 'nameExample,https://example.com/');
  });

  it('can return parent URL', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    const urlStringTagExample =
        'http://www.example.com:8080/testing/test?isTest=true' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);

    const sut = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    assert.strictEqual(sut.parentURL(), 'http://www.example.com:8080/testing');
  });

  it('can return origin', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    const urlStringTagExample =
        'http://www.example.com:8080/testing/test?isTest=true' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);

    const sut = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    assert.strictEqual(sut.origin(), 'http://www.example.com:8080');
  });

  it('can return trimmed display name', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    const urlStringTagExample = 'http://www.example.com:8080/testing/' +
            'test'.repeat(30) + '?isTest=true' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);

    const sut = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    assert.strictEqual(sut.displayName(false), 'test'.repeat(24) + 'tes…');
  });

  it('can return untrimmed display name', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    const urlStringTagExample = 'http://www.example.com:8080/testing/' +
            'test'.repeat(30) + '?isTest=true' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);

    const sut = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    assert.strictEqual(sut.displayName(true), 'test'.repeat(30) + '?isTest=true');
  });

  it('can request project metadata', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    projectStub.requestMetadata.resolves(null);
    const urlStringTagExample = 'http//www.example.com' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);

    const sut = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    assert.strictEqual(await sut.requestMetadata(), null);
  });

  it('can return full display name', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    projectStub.fullDisplayName.returns('Test Name');
    const urlStringTagExample = 'http://www.example.com:8080/testing/' +
            'test'.repeat(30) + '?isTest=true' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);

    const sut = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    assert.strictEqual(sut.fullDisplayName(), 'Test Name');
  });

  it('can return MIME type', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    projectStub.mimeType.returns('Test Type');
    const urlStringTagExample = 'http://www.example.com:8080/testing/' +
            'test'.repeat(30) + '?isTest=true' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);

    const sut = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    assert.strictEqual(sut.mimeType(), 'Test Type');
  });

  it('can return display name', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    const urlStringTagExample =
        'http://www.example.com:8080/testing/test?isTest=true' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);

    const sut = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    assert.strictEqual(sut.displayName(), 'test?isTest=true');
  });

  it('can return whether or not the project can be renamed', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    projectStub.canRename.returns(true);
    const urlStringTagExample =
        'http://www.example.com:8080/testing/test?isTest=true' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);

    const sut = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    assert.isTrue(sut.canRename());
  });

  it('can rename a project', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    projectStub.workspace.returns(sinon.createStubInstance(Workspace.Workspace.WorkspaceImpl));
    const urlStringTagExample =
        'http://www.example.com:8080/testing/test?isTest=true' as Platform.DevToolsPath.UrlString;
    const rawPathstringExample = 'newName.html' as Platform.DevToolsPath.RawPathString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);
    const sut = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);
    projectStub.rename.callsFake((uiSourceCode, rawPathstringExample, innerCallback) => {
      innerCallback(true, rawPathstringExample);
    });

    await sut.rename(rawPathstringExample);

    assert.strictEqual(sut.name(), 'newName.html');
  });

  it('deletes file by calling the project deleteFile function', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    const urlStringTagExample =
        'http://www.example.com:8080/testing/test?isTest=true' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);
    const sut = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    sut.remove();

    sinon.assert.calledOnce(projectStub.deleteFile);
  });

  it('can return content URL', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    const urlStringTagExample =
        'http://www.example.com:8080/testing/test?isTest=true' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);
    const sut = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    const contentURL = sut.contentURL();

    assert.strictEqual(contentURL, 'http://www.example.com:8080/testing/test?isTest=true');
  });

  it('can return content type', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    const urlStringTagExample =
        'http://www.example.com:8080/testing/test?isTest=true' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);
    const sut = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    const contentType = sut.contentType();

    assert.strictEqual(contentType, contentTypeStub);
  });

  it('can request content', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    const deferredContentStub = {content: 'Example', isEncoded: true} as TextUtils.ContentProvider.DeferredContent;
    projectStub.requestFileContent.resolves(deferredContentStub);
    const urlStringTagExample =
        'http://www.example.com:8080/testing/test?isTest=true' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);
    const sut = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    const content = await sut.requestContent();

    assert.strictEqual(content, deferredContentStub);
  });

  it('check if the content is encoded', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    const deferredContentStub = {content: 'Example', isEncoded: true} as TextUtils.ContentProvider.DeferredContent;
    projectStub.requestFileContent.resolves(deferredContentStub);
    const urlStringTagExample =
        'http://www.example.com:8080/testing/test?isTest=true' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);
    const sut = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    const encodedContent = await sut.contentEncoded();

    assert.isTrue(encodedContent);
  });

  it('can commit content', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    projectStub.workspace.returns(sinon.createStubInstance(Workspace.Workspace.WorkspaceImpl));
    const urlStringTagExample =
        'http://www.example.com:8080/testing/test?isTest=true' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);
    const sut = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    sut.addRevision('New Content');
    const newContent = await sut.requestContent();

    assert.deepEqual(newContent, {content: 'New Content', isEncoded: false});
  });

  it('can check if there are commits', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    projectStub.workspace.returns(sinon.createStubInstance(Workspace.Workspace.WorkspaceImpl));
    const urlStringTagExample =
        'http://www.example.com:8080/testing/test?isTest=true' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);
    const sut = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    const hasCommitsBefore = sut.hasCommits();
    sut.addRevision('New Content');
    await sut.requestContent();
    const hasCommitsAfter = sut.hasCommits();

    assert.isFalse(hasCommitsBefore);
    assert.isTrue(hasCommitsAfter);
  });

  it('can set a working copy', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    projectStub.workspace.returns(sinon.createStubInstance(Workspace.Workspace.WorkspaceImpl));
    const urlStringTagExample =
        'http://www.example.com:8080/testing/test?isTest=true' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);
    const sut = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    sut.setWorkingCopy('Working Copy Example');
    const workingCopy = sut.workingCopy();

    assert.strictEqual(workingCopy, 'Working Copy Example');
  });

  it('can reset working copy', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    projectStub.workspace.returns(sinon.createStubInstance(Workspace.Workspace.WorkspaceImpl));
    const urlStringTagExample =
        'http://www.example.com:8080/testing/test?isTest=true' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);
    const sut = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    sut.setWorkingCopy('Working Copy Example');
    sut.resetWorkingCopy();
    const workingCopy = sut.workingCopy();

    assert.strictEqual(workingCopy, '');
  });

  it('can set content', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    projectStub.workspace.returns(sinon.createStubInstance(Workspace.Workspace.WorkspaceImpl));
    const urlStringTagExample =
        'http://www.example.com:8080/testing/test?isTest=true' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);
    const sut = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    sut.setContent('New Content', true);
    const newContent = await sut.requestContent();

    assert.deepEqual(newContent, {content: 'New Content', isEncoded: false});
  });

  it('can set working copy getter function', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    projectStub.workspace.returns(sinon.createStubInstance(Workspace.Workspace.WorkspaceImpl));
    const urlStringTagExample =
        'http://www.example.com:8080/testing/test?isTest=true' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);
    const sut = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    sut.setWorkingCopyGetter(() => {
      return 'Example Function';
    });
    const newContent = sut.workingCopy();

    assert.strictEqual(newContent, 'Example Function');
  });

  it('can check if working copy is dirty', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    projectStub.workspace.returns(sinon.createStubInstance(Workspace.Workspace.WorkspaceImpl));
    const urlStringTagExample =
        'http://www.example.com:8080/testing/test?isTest=true' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);
    const sut = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    const isDirtyBefore = sut.isDirty();
    sut.setWorkingCopy('Working Copy Example');
    const isDirtyAfter = sut.isDirty();

    assert.isFalse(isDirtyBefore);
    assert.isTrue(isDirtyAfter);
  });

  it('can return extension', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    const urlStringTagExample = 'http://www.example.com:8080/testing/test.html' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);
    const sut = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    const content = sut.extension();

    assert.strictEqual(content, 'html');
  });

  it('can commit working copy', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    projectStub.workspace.returns(sinon.createStubInstance(Workspace.Workspace.WorkspaceImpl));
    const urlStringTagExample =
        'http://www.example.com:8080/testing/test?isTest=true' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);
    const sut = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    const hasCommitsBefore = sut.hasCommits();
    sut.setWorkingCopy('Working Copy Example');
    sut.commitWorkingCopy();
    const hasCommitsAfter = sut.hasCommits();

    assert.isFalse(hasCommitsBefore);
    assert.isTrue(hasCommitsAfter);
  });

  it('can return content', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    projectStub.workspace.returns(sinon.createStubInstance(Workspace.Workspace.WorkspaceImpl));
    const urlStringTagExample = 'http://www.example.com:8080/testing/test.html' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);
    const sut = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);
    sut.setContent('Example Content', true);

    const content = sut.content();

    assert.strictEqual(content, 'Example Content');
  });

  it('can return load error', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    const deferredContentStub = {content: 'Content with error', isEncoded: true, error: 'Example Error'} as
        TextUtils.ContentProvider.DeferredContent;
    projectStub.requestFileContent.resolves(deferredContentStub);
    projectStub.workspace.returns(sinon.createStubInstance(Workspace.Workspace.WorkspaceImpl));
    const urlStringTagExample = 'http://www.example.com:8080/testing/test.html' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);
    const sut = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);
    await sut.requestContent();

    const returnedError = sut.loadError();

    assert.strictEqual(returnedError, 'Example Error');
  });

  it('can search content', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    projectStub.workspace.returns(sinon.createStubInstance(Workspace.Workspace.WorkspaceImpl));
    const urlStringTagExample = 'http://www.example.com:8080/testing/test.html' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);
    const sut = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);
    sut.setContent('Example Content', true);

    const searchResult = await sut.searchInContent('Content', true, false);

    assert.deepEqual(searchResult, [{lineNumber: 0, lineContent: 'Example Content', columnNumber: 8}]);
  });

  it('can check if content is loaded', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    projectStub.workspace.returns(sinon.createStubInstance(Workspace.Workspace.WorkspaceImpl));
    const urlStringTagExample = 'http://www.example.com:8080/testing/test.html' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);
    const sut = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    const contentLoadedCheckBefore = sut.contentLoaded();
    sut.setContent('Example Content', true);
    const contentLoadedCheckAfter = sut.contentLoaded();

    assert.isFalse(contentLoadedCheckBefore);
    assert.isTrue(contentLoadedCheckAfter);
  });

  it('can return UI location', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    projectStub.workspace.returns(sinon.createStubInstance(Workspace.Workspace.WorkspaceImpl));
    const urlStringTagExample = 'http://www.example.com:8080/testing/test.html' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);
    const sut = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    const uiLocation = sut.uiLocation(5);

    assert.strictEqual(uiLocation.lineNumber, 5);
    assert.strictEqual(uiLocation.uiSourceCode, sut);
  });

  it('can add message', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    const messageStub = sinon.createStubInstance(Workspace.UISourceCode.Message);
    const urlStringTagExample = 'http://www.example.com:8080/testing/test.html' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);
    const sut = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    sut.addMessage(messageStub);
    const messages = sut.messages();
    const expectedResult = new Set<Workspace.UISourceCode.Message>([messageStub]);

    assert.deepEqual(messages, expectedResult);
  });

  it('can add line message', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    const urlStringTagExample = 'http://www.example.com:8080/testing/test.html' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);
    const sut = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    sut.addLineMessage(Workspace.UISourceCode.Message.Level.Error, 'Example Message', 5);
    const messagesSet = sut.messages();
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
    const urlStringTagExample = 'http://www.example.com:8080/testing/test.html' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);
    const sut = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);
    sut.addMessage(messageStub);

    const messagesLengthBefore = sut.messages().size;
    sut.removeMessage(messageStub);
    const messagesLengthAfter = sut.messages().size;

    assert.strictEqual(messagesLengthBefore, 1);
    assert.strictEqual(messagesLengthAfter, 0);
  });

  it('can set decoration data', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    const urlStringTagExample = 'http://www.example.com:8080/testing/test.html' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);
    const sut = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    sut.setDecorationData('example type', 'example data');

    assert.strictEqual(sut.getDecorationData('example type'), 'example data');
  });

  it('can disable editing', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    const urlStringTagExample = 'http://www.example.com:8080/testing/test.html' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);
    const sut = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);

    sut.disableEdit();

    assert.isTrue(sut.editDisabled());
  });

  it('checkContentUpdated updates if content is null', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    projectStub.workspace.returns(sinon.createStubInstance(Workspace.Workspace.WorkspaceImpl));
    projectStub.canSetFileContent.returns(true);
    const deferredContentStub = {content: null, isEncoded: true} as TextUtils.ContentProvider.DeferredContent;
    projectStub.requestFileContent.resolves(deferredContentStub);
    const urlStringTagExample =
        'http://www.example.com:8080/testing/test?isTest=true' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);
    const sut = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);
    const content = await sut.requestContent();

    await sut.checkContentUpdated();

    assert.deepEqual(content, deferredContentStub);
  });

  it('checkContentUpdated updates if there is content', async () => {
    const projectStub = sinon.createStubInstance(Bindings.ContentProviderBasedProject.ContentProviderBasedProject);
    projectStub.workspace.returns(sinon.createStubInstance(Workspace.Workspace.WorkspaceImpl));
    projectStub.canSetFileContent.returns(true);
    const deferredContentStub = {content: 'Example Content', isEncoded: true} as
        TextUtils.ContentProvider.DeferredContent;
    projectStub.requestFileContent.resolves(deferredContentStub);
    const urlStringTagExample =
        'http://www.example.com:8080/testing/test?isTest=true' as Platform.DevToolsPath.UrlString;
    const contentTypeStub = sinon.createStubInstance(Common.ResourceType.ResourceType);
    const sut = new Workspace.UISourceCode.UISourceCode(projectStub, urlStringTagExample, contentTypeStub);
    const content = await sut.requestContent();

    await sut.checkContentUpdated();

    assert.deepEqual(content, deferredContentStub);
  });
});
