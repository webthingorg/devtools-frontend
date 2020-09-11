// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = require('chai');

import * as puppeteer from 'puppeteer';
import {getBrowserAndPages} from '../../conductor/puppeteer-state.js';
import {$textContent, tabBackward, tabForward, click, $, activeElementTextContent, selectTextFromNodeToNode, typeText, pasteText} from '../../shared/helper.js';

declare global {
  function reset(): void;
  let injection: boolean|undefined;
}

describe('Keyboard navigation', () => {
  before(async () => {
    const {target} = getBrowserAndPages();

    await target.goto('http://localhost:8000/demo/simple.html', {waitUntil: 'domcontentloaded'});
  });

  afterEach(async () => {
    const {target} = getBrowserAndPages();

    await target.evaluate(() => {
      globalThis.reset();
    });
  });

  describe('after clicking on a property name', () => {
    it('can tab into its value', async () => {
      const {target} = getBrowserAndPages();

      await click($textContent('color'));
      await target.keyboard.press('Tab');

      const textContent = await activeElementTextContent();

      assert.strictEqual(textContent, 'red');
    });

    it('can alter the name', async () => {
      await click($textContent('color'));
      await typeText('background-color');

      const textContent = await activeElementTextContent();

      assert.strictEqual(textContent, 'background-color');
    });

    it('can hit enter to persist a name change', async () => {
      const {target} = getBrowserAndPages();

      await click($textContent('color'));
      await typeText('background-color');
      await target.keyboard.press('Enter');

      const textContent = await activeElementTextContent();

      assert.strictEqual(textContent, 'background-color');
    });

    it('can hit escape to cancel a name change', async () => {
      const {target} = getBrowserAndPages();

      await click($textContent('color'));
      await typeText('background-color');
      await target.keyboard.press('Escape');

      const textContent = await activeElementTextContent();

      assert.strictEqual(textContent, 'color');
    });

    it('can alter the value', async () => {
      await click($textContent('red'));
      await typeText('white');

      const textContent = await activeElementTextContent();

      assert.strictEqual(textContent, 'white');
    });

    // Pasting is broken in Puppeteer
    it.skip('[crbug.com/1126047]: can paste a new value', async () => {
      await click($textContent('red'));
      await pasteText('white');

      const textContent = await activeElementTextContent();

      assert.strictEqual(textContent, 'white');
    });

    it('can cancel the value change', async () => {
      const {target} = getBrowserAndPages();

      await click($textContent('red'));
      await typeText('white');
      await target.keyboard.press('Escape');

      await tabForward();
      await tabBackward();

      const textContent = await activeElementTextContent();

      assert.strictEqual(textContent, 'red');
    });

    it('can cancel and later commit the value change', async () => {
      const {target} = getBrowserAndPages();

      await click($textContent('red'));
      await typeText('white');
      await target.keyboard.press('Escape');

      await tabForward();
      await tabBackward();

      await typeText('yellow');
      await target.keyboard.press('Enter');

      const textContent = await activeElementTextContent();

      assert.strictEqual(textContent, 'yellow');
    });

    it('can cancel and later commit a name change', async () => {
      const {target} = getBrowserAndPages();

      await click($textContent('color'));
      await typeText('background-color');
      await target.keyboard.press('Escape');

      await tabForward();
      await tabBackward();

      await typeText('new-color-value');

      const textContent = await activeElementTextContent();

      assert.strictEqual(textContent, 'new-color-value');
    });

    it('can cancel, commit and then reset name change', async () => {
      const {target} = getBrowserAndPages();

      await click($textContent('color'));
      await typeText('background-color');
      await target.keyboard.press('Escape');

      await tabForward();
      await tabBackward();

      await typeText('new-color-value');
      await target.keyboard.press('Enter');

      await click($textContent('Reset'));

      // The previous element should be back in the DOM again.
      await click($textContent('color'));

      const textContent = await activeElementTextContent();

      assert.strictEqual(textContent, 'color');
    });
  });

  describe('after clicking on the selector', () => {
    it('can hit enter to commit', async () => {
      const {target} = getBrowserAndPages();

      await click($textContent('html'));
      await typeText('.new-selector');
      await target.keyboard.press('Enter');

      const textContent = await activeElementTextContent();

      assert.strictEqual(textContent, '.new-selector');
    });

    it('can hit escape to cancel', async () => {
      const {target} = getBrowserAndPages();

      await click($textContent('html'));
      await typeText('.new-selector');
      await target.keyboard.press('Escape');

      const textContent = await activeElementTextContent();

      assert.strictEqual(textContent, 'html, body, .whatever');
    });

    it('can cancel, commit and then reset selectors change', async () => {
      const {target} = getBrowserAndPages();

      await click($textContent('html'));
      await typeText('html, body, .new-selector');
      await target.keyboard.press('Escape');

      await tabForward();
      await tabBackward();

      await typeText('html, body, .devtools');
      await target.keyboard.press('Enter');

      await click($textContent('Reset'));

      // The previous element should be back in the DOM again.
      await click($textContent('html'));

      const textContent = await activeElementTextContent();

      assert.strictEqual(textContent, 'html, body, .whatever');
    });

    it('can cancel, commit and then add a new selector', async () => {
      const {target} = getBrowserAndPages();

      await click($textContent('html'));
      await typeText('html, body, .new-selector');
      await target.keyboard.press('Escape');

      await tabForward();
      await tabBackward();

      await typeText('html, body, .devtools');
      await target.keyboard.press('Enter');

      await click($textContent('Add new rule'));

      // The previous element should be back in the DOM again.
      await click($textContent('html'));

      const textContent = await activeElementTextContent();

      assert.strictEqual(textContent, 'html, body, .devtools, .new');
    });

    it('can not contain HTML elements', async () => {
      const {target} = getBrowserAndPages();

      await click($textContent('html'));
      await typeText(
          '<img src="data:image/gif;base64&#44R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" onload="globalThis.injection = true;" />');
      await target.keyboard.press('Enter');

      const injected = await target.evaluate(() => {
        return globalThis.injection;
      });

      assert.strictEqual(injected, undefined, 'Injection should not have happened');
    });
  });

  describe('can copy-paste CSS representation', () => {
    it('can select full text', async () => {
      const textSelection = await selectTextFromNodeToNode($textContent('}'), $textContent('html'), 'up');

      assert.strictEqual(textSelection, `html, body, .whatever {
    color: red;
    padding: 0;
    background-color: last-value;
}
`);
    });

    it('can select full text when expanded', async () => {
      const {target} = getBrowserAndPages();
      await click($textContent('padding'));

      await tabForward();
      await target.keyboard.press('Space');

      const textSelection = await selectTextFromNodeToNode($textContent('}'), $textContent('html'), 'up');

      assert.strictEqual(textSelection, `html, body, .whatever {
    color: red;
    padding: 0;
    padding-top: 0;
    padding-right: 0;
    padding-bottom: 0;
    padding-left: 0;
    background-color: last-value;
}
`);
    });

    it('can select full text of disabled rule when expanded', async () => {
      const {target} = getBrowserAndPages();
      await click($textContent('padding'));

      await tabBackward();
      await target.keyboard.press('Space');
      await tabForward();

      await tabForward();
      await target.keyboard.press('Space');

      const textSelection = await selectTextFromNodeToNode($textContent('}'), $textContent('html'), 'up');

      assert.strictEqual(textSelection, `html, body, .whatever {
    color: red;
    /* padding: 0; */
    /* padding-top: 0; */
    /* padding-right: 0; */
    /* padding-bottom: 0; */
    /* padding-left: 0; */
    background-color: last-value;
}
`);
    });
  });

  describe('with a property that can be disabled', () => {
    async function disablePadding() {
      const {target} = getBrowserAndPages();
      await click($textContent('padding'));
      await tabBackward();
      await target.keyboard.press('Space');
    }

    async function assertCheckboxShape(effectCheckboxSelector: Promise<puppeteer.ElementHandle<Element>|null>):
        Promise<puppeteer.ElementHandle<HTMLInputElement>> {
      const effectCheckbox = await effectCheckboxSelector;
      if (!effectCheckbox) {
        throw new Error('Could not find checkbox to change selector effect.');
      }
      return (effectCheckbox as puppeteer.ElementHandle<HTMLInputElement>);
    }

    it('can be disabled', async () => {
      await disablePadding();

      const effectCheckbox = await assertCheckboxShape($('[aria-label="Enable padding"]'));
      const isChecked = await effectCheckbox.evaluate(node => node.checked);

      assert.strictEqual(isChecked, false, 'Checkbox to disable padding should be checked');
    });

    it('can be disabled and reenabled', async () => {
      const {target} = getBrowserAndPages();
      await disablePadding();
      await target.keyboard.press('Space');

      const effectCheckbox = await assertCheckboxShape($('[aria-label="Disable padding"]'));
      const isChecked = await effectCheckbox.evaluate(node => node.checked);

      assert.strictEqual(isChecked, true, 'Checkbox to disable padding should be checked');
    });

    it('can be disabled and then can be reset', async () => {
      await disablePadding();

      await click($textContent('Reset'));

      const effectCheckbox = await assertCheckboxShape($('[aria-label="Disable padding"]'));
      const isChecked = await effectCheckbox.evaluate(node => node.checked);

      assert.strictEqual(isChecked, true, 'Checkbox to disable padding should be checked');
    });
  });
});
