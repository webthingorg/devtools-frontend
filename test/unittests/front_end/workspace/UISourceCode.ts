// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import {default as UISourceCode, Message, LineMarker, UISourceCodeMetadata} from '../../../../front_end/workspace/UISourceCode.js';
import {Project, projectTypes} from '../../../../front_end/workspace/WorkspaceImpl.js';
import {TextRange} from '../../../../front_end/text_utils/TextRange.js'
import {ResourceType, ResourceCategory} from '../../../../front_end/common/ResourceType.js'

class DummyProject extends Project {
};

describe('UISourceCode', () => {
  it('can be instantiated', () => {
    const project = new DummyProject();
    const url = 'https://www.google.com/search/result';
    const contentType = new ResourceType('name', 'title', new ResourceCategory('title', 'shortTitle'), false);
    const uiSourceCode = new UISourceCode(project, url, contentType);
    assert.deepEqual(uiSourceCode.project(), project, 'project was not set properly');
    assert.equal(uiSourceCode.url(), url, 'url was not set properly');
    assert.deepEqual(uiSourceCode.contentType(), contentType, 'contentType was not set properly');
  });

  it('sets default values for origin, parentURL and name for invalid URL', () => {
    const project = new DummyProject();
    const bogusURL = '.bogusURL.';
    const contentType = new ResourceType('name', 'title', new ResourceCategory('title', 'shortTitle'), false);
    const uiSourceCode = new UISourceCode(project, bogusURL, contentType);
    assert.equal(uiSourceCode.origin(), '', 'origin did not default to empty');
    assert.equal(uiSourceCode.parentURL(), '', 'parentURL did not default to empty');
    assert.equal(uiSourceCode.name(), bogusURL, 'name did not default to the input url');
  });

  it('sets origin, parentURL and name for valid URL', () => {
    const project = new DummyProject();
    const url = 'https://www.google.com/search/result';
    const contentType = new ResourceType('name', 'title', new ResourceCategory('title', 'shortTitle'), false);
    const uiSourceCode = new UISourceCode(project, url, contentType);
    assert.equal(uiSourceCode.origin(), 'https://www.google.com', 'origin was not set from url');
    assert.equal(uiSourceCode.parentURL(), 'https://www.google.com/search', 'parentURL was not set from url');
    assert.equal(uiSourceCode.name(), 'result', 'name was not set from url');
  });

  it('sets name including query params if present', () => {
    const project = new DummyProject();
    const url = 'https://www.google.com/search/result?abc=123';
    const contentType = new ResourceType('name', 'title', new ResourceCategory('title', 'shortTitle'), false);
    const uiSourceCode = new UISourceCode(project, url, contentType);
    assert.equal(uiSourceCode.name(), 'result?abc=123', 'name was not set including query params');
  });

  describe('displayName()', () => {
    it('decodes URI', () => {
      const project = new DummyProject();
      const url = 'https://www.google.com/search/result?abc=%20';
      const contentType = new ResourceType('name', 'title', new ResourceCategory('title', 'shortTitle'), false);
      const uiSourceCode = new UISourceCode(project, url, contentType);
      assert.equal(uiSourceCode.displayName(true), 'result?abc= ', 'displayName did not decode space character');
    });

    it('decodes URI for FileSystem type', () => {
      class FileSystemProjectType extends Project {
        type() { return projectTypes.FileSystem; }
      };
      const project = new FileSystemProjectType();
      const url = 'https://www.google.com/search/result?abc=%20';
      const contentType = new ResourceType('name', 'title', new ResourceCategory('title', 'shortTitle'), false);
      const uiSourceCode = new UISourceCode(project, url, contentType);
      assert.equal(uiSourceCode.displayName(true), 'result?abc= ', 'displayName did not decode space character');
    });

    it('trims > 100 characters with skipTrim == false', () => {
      const project = new DummyProject();
      const url = 'https://www.google.com/search/result?abc=' + 'a'.repeat(100);
      const contentType = new ResourceType('name', 'title', new ResourceCategory('title', 'shortTitle'), false);
      const uiSourceCode = new UISourceCode(project, url, contentType);
      assert.equal(uiSourceCode.displayName(false), `result?abc=${'a'.repeat(88)}\u2026`, 'displayName was not trimmed');
    });

    it('does not trim with skipTrim == true', () => {
      const project = new DummyProject();
      const url = 'https://www.google.com/search/result?abc=' + 'a'.repeat(100);
      const contentType = new ResourceType('name', 'title', new ResourceCategory('title', 'shortTitle'), false);
      const uiSourceCode = new UISourceCode(project, url, contentType);
      assert.equal(uiSourceCode.displayName(true), `result?abc=${'a'.repeat(100)}`, 'displayName was trimmed');
    });
  });

  describe('messages', () => {
    it ('starts empty', () => {
      const project = new DummyProject();
      const url = 'https://www.google.com/search/result';
      const contentType = new ResourceType('name', 'title', new ResourceCategory('title', 'shortTitle'), false);
      const uiSourceCode = new UISourceCode(project, url, contentType);
      assert.equal(uiSourceCode.messages().size, 0, 'messages was not empty');
    });

    it ('can add and retrieve a message', () => {
      const project = new DummyProject();
      const url = 'https://www.google.com/search/result';
      const contentType = new ResourceType('name', 'title', new ResourceCategory('title', 'shortTitle'), false);
      const uiSourceCode = new UISourceCode(project, url, contentType);

      const level = Message.Level.Error;
      const text = 'message text';
      const range = new TextRange(5, 0, 5, 10);
      const result = uiSourceCode.addMessage(level, text, range);
      const expectedResult = new Message(uiSourceCode, level, text, range);

      assert.deepEqual(result, expectedResult, 'return value was incorrect');
      assert.equal(uiSourceCode.messages().size, 1, 'messages was empty');
      assert.deepEqual(uiSourceCode.messages().values().next().value, expectedResult, 'message value was incorrect');
    });

    it ('can add a message using addLineMessage', () => {
      const project = new DummyProject();
      const url = 'https://www.google.com/search/result';
      const contentType = new ResourceType('name', 'title', new ResourceCategory('title', 'shortTitle'), false);
      const uiSourceCode = new UISourceCode(project, url, contentType);

      const level = Message.Level.Error;
      const text = 'message text';
      const lineNumber = 5;
      const columnNumber = 10;
      const result = uiSourceCode.addLineMessage(level, text, lineNumber, columnNumber);
      const expectedResult = new Message(uiSourceCode, level, text, new TextRange(5, 10, 5, 10));

      assert.deepEqual(result, expectedResult, 'return value was incorrect');
      assert.equal(uiSourceCode.messages().size, 1, 'messages was empty');
      assert.deepEqual(uiSourceCode.messages().values().next().value, expectedResult, 'message value was incorrect');
    });

    it ('can add the same message twice', () => {
      const project = new DummyProject();
      const url = 'https://www.google.com/search/result';
      const contentType = new ResourceType('name', 'title', new ResourceCategory('title', 'shortTitle'), false);
      const uiSourceCode = new UISourceCode(project, url, contentType);

      const level = Message.Level.Error;
      const text = 'message text';
      const range = new TextRange(5, 0, 5, 10);
      uiSourceCode.addMessage(level, text, range);
      uiSourceCode.addMessage(level, text, range);

      assert.equal(uiSourceCode.messages().size, 2, 'message not added twice');
    });

    it ('delete removes only one of duplicate messages', () => {
      const project = new DummyProject();
      const url = 'https://www.google.com/search/result';
      const contentType = new ResourceType('name', 'title', new ResourceCategory('title', 'shortTitle'), false);
      const uiSourceCode = new UISourceCode(project, url, contentType);

      const level = Message.Level.Error;
      const text = 'message text';
      const range = new TextRange(5, 0, 5, 10);
      const result = uiSourceCode.addMessage(level, text, range);
      uiSourceCode.addMessage(level, text, range);
      uiSourceCode.removeMessage(result);

      assert.equal(uiSourceCode.messages().size, 1, 'not exactly one message removed');
    });

    it ('can remove a message', () => {
      const project = new DummyProject();
      const url = 'https://www.google.com/search/result';
      const contentType = new ResourceType('name', 'title', new ResourceCategory('title', 'shortTitle'), false);
      const uiSourceCode = new UISourceCode(project, url, contentType);

      const level = Message.Level.Error;
      const text = 'message text';
      const range = new TextRange(5, 0, 5, 10);
      const result = uiSourceCode.addMessage(level, text, range);
      uiSourceCode.removeMessage(result);

      assert.equal(uiSourceCode.messages().size, 0, 'messages was not empty');
    });

    it ('removing an invalid message does nothing', () => {
      const project = new DummyProject();
      const url = 'https://www.google.com/search/result';
      const contentType = new ResourceType('name', 'title', new ResourceCategory('title', 'shortTitle'), false);
      const uiSourceCode = new UISourceCode(project, url, contentType);

      const level = Message.Level.Error;
      const text = 'message text';
      const range = new TextRange(5, 0, 5, 10);
      const neverAddedMessage = new Message(uiSourceCode, level, text, range);
      uiSourceCode.removeMessage(neverAddedMessage);

      assert.equal(uiSourceCode.messages().size, 0, 'messages was not empty');
    });
  });

  describe('decorations', () => {
    it('starts empty', () => {
      const project = new DummyProject();
      const url = 'https://www.google.com/search/result';
      const contentType = new ResourceType('name', 'title', new ResourceCategory('title', 'shortTitle'), false);
      const uiSourceCode = new UISourceCode(project, url, contentType);
      assert.deepEqual(uiSourceCode.allDecorations(), [], 'decorations did not start empty');
      assert.equal(uiSourceCode.decorationsForType('type1'), null, 'decorationsForType did not start empty');
    });

    it('can add and retrieve a decoration', () => {
      const project = new DummyProject();
      const url = 'https://www.google.com/search/result';
      const contentType = new ResourceType('name', 'title', new ResourceCategory('title', 'shortTitle'), false);
      const uiSourceCode = new UISourceCode(project, url, contentType);

      const range = new TextRange(5, 0, 5, 10);
      const type = 'type1';
      const data = {};
      uiSourceCode.addDecoration(range, type, data);

      const decorations = uiSourceCode.decorationsForType(type);
      const expectedDecoration = new LineMarker(range, type, data);

      assert.equal(decorations.size, 1, 'decorationsForType had too many decorations');
      assert.deepEqual(decorations.values().next().value, expectedDecoration, 'decorationsForType did not have the added decoration');

      const allDecorations = uiSourceCode.allDecorations();
      assert.equal(allDecorations.length, 1, 'allDecorations had too many decorations');
      assert.deepEqual(allDecorations[0], expectedDecoration, 'allDecorations did not have the added decoration');

      uiSourceCode.addLineDecoration(5, 'type2', data);

      const decorations2 = uiSourceCode.decorationsForType('type2');
      const expectedDecoration2 = new LineMarker(new TextRange(5, 0, 5, 0), 'type2', data);
      assert.deepEqual(decorations2.values().next().value, expectedDecoration2, 'TextRange created incorrectly');
    });

    it('can remove decorations', () => {
      const project = new DummyProject();
      const url = 'https://www.google.com/search/result';
      const contentType = new ResourceType('name', 'title', new ResourceCategory('title', 'shortTitle'), false);
      const uiSourceCode = new UISourceCode(project, url, contentType);

      const range = new TextRange(5, 0, 5, 10);
      const type = 'type1';
      const data = {};
      uiSourceCode.addDecoration(range, type, data);
      uiSourceCode.addDecoration(range, 'type2', data);

      uiSourceCode.removeDecorationsForType(type);

      assert.equal(uiSourceCode.decorationsForType(type).size, 0, 'decoration was not removed');

      const allDecorations = uiSourceCode.allDecorations();
      assert.equal(allDecorations.length, 1, 'decoration was not removed');
      const expectedDecoration = new LineMarker(range, 'type2', data);
      assert.deepEqual(allDecorations[0], expectedDecoration, 'allDecorations still has the other type');

      uiSourceCode.addDecoration(range, type, data);
      uiSourceCode.removeAllDecorations();

      assert.equal(uiSourceCode.allDecorations().length, 0, 'decorations were not removed');
      assert.equal(uiSourceCode.decorationsForType(type).size, 0, 'decoration was not removed');
      assert.equal(uiSourceCode.decorationsForType('type2').size, 0, 'decoration was not removed');
    });
  });

  describe('renaming', () => {

  });
});

describe('LineMarker', () => {
  it('can be instantiated', () => {
    const textRange = new TextRange(5, 0, 5, 10);
    const lineMarker = new LineMarker(textRange, 'someType', { a: 1 });
    assert.equal(lineMarker.range(), textRange, 'range was not set correctly');
    assert.equal(lineMarker.type(), 'someType', 'type was not set correctly');
    assert.deepEqual(lineMarker.data(), { a: 1 }, 'data was not set correctly');
  });
});

describe('UISourceCodeMetadata', () => {
  it('can be instantiated', () => {
    const modificationTime = new Date();
    const contentSize = 27;
    const metadata = new UISourceCodeMetadata(modificationTime, contentSize);
    assert.deepEqual(metadata.modificationTime, modificationTime, 'modificationTime was not set correctly');
    assert.equal(metadata.contentSize, contentSize, 'contentSize was not set correctly');
  });
});
