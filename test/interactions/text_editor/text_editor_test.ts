// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';

import {click, pressKey, typeText, waitFor} from '../../shared/helper.js';
import {it} from '../../shared/mocha-extensions.js';
import {loadComponentDocExample, preloadForCodeCoverage} from '../helpers/shared.js';

import type {ElementHandle} from 'puppeteer';

async function getEditorContent(textEditor: ElementHandle): Promise<string|null|undefined> {
  return textEditor.evaluate(node => node.shadowRoot?.querySelector('.cm-editor')?.textContent);
}

describe('text editor', async () => {
  preloadForCodeCoverage('text_editor/basic.html');

  it('can insert and delete some text', async () => {
    await loadComponentDocExample('text_editor/basic.html');
    const textEditor = await waitFor('devtools-text-editor');

    await click('.cm-editor', {root: textEditor});
    await typeText('Some text here');

    assert.strictEqual(await getEditorContent(textEditor), 'Some text here');

    await pressKey('Backspace');
    await pressKey('Backspace');

    assert.strictEqual(await getEditorContent(textEditor), 'Some text he');
  });
});
