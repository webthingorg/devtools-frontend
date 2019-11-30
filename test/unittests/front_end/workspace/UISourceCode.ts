// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import {default as UISourceCode, LineMarker, UISourceCodeMetadata} from '../../../../front_end/workspace/UISourceCode.js';
import {Project} from '../../../../front_end/workspace/WorkspaceImpl.js';
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

  it('starts with no decorations', () => {
    const project = new DummyProject();
    const url = 'https://www.google.com/search/result';
    const contentType = new ResourceType('name', 'title', new ResourceCategory('title', 'shortTitle'), false);
    const uiSourceCode = new UISourceCode(project, url, contentType);
    assert.deepEqual(uiSourceCode.allDecorations(), [], 'decorations did not start empty');
    assert.equal(uiSourceCode.decorationsForType('type1'), null, 'decorationsForType did not start empty');
  });

  it('can add a decoration and retrieve it', () => {
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
