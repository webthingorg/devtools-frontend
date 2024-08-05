// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import {assert} from 'chai';

import {click, debuggerStatement, getBrowserAndPages, goToResource, step} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {
  assertGutterDecorationForDomNodeExists,
  forcePseudoState,
  getComputedStylesForDomNode,
  removePseudoState,
  waitForContentOfSelectedElementsNode,
  waitForDomNodeToBeHidden,
  waitForDomNodeToBeVisible,
  waitForElementsStyleSection,
  waitForPartialContentOfSelectedElementsNode,
} from '../helpers/elements-helpers.js';

const TARGET_SHOWN_ON_HOVER_SELECTOR = '.show-on-hover';
const TARGET_SHOWN_ON_FOCUS_SELECTOR = '.show-on-focus';
const TARGET_SHOWN_ON_TARGET_SELECTOR = '#show-on-target';

// Flaky test group.
describe('[crbug.com/1280763]: The Elements tab', () => {
  it('can force :hover state for selected DOM node', async () => {
    const {frontend} = getBrowserAndPages();

    await goToResource('elements/hover.html');

    await waitForElementsStyleSection();

    await step('Ensure the correct node is selected after opening a file', async () => {
      await waitForContentOfSelectedElementsNode('<body>\u200B');
    });

    await step('Select div that we can focus', async () => {
      await frontend.keyboard.press('ArrowRight');
      await waitForContentOfSelectedElementsNode('<div id=\u200B"hover">\u200B…\u200B</div>\u200B');
    });

    await forcePseudoState(':hover');
    await assertGutterDecorationForDomNodeExists();
    await waitForDomNodeToBeVisible(TARGET_SHOWN_ON_HOVER_SELECTOR);

    const displayComputedStyle = await getComputedStylesForDomNode(TARGET_SHOWN_ON_HOVER_SELECTOR, 'display');
    assert.strictEqual(displayComputedStyle, 'inline');
  });

  it('can force :target state for selected DOM node', async () => {
    const {frontend} = getBrowserAndPages();

    await goToResource('elements/target.html');

    await waitForElementsStyleSection();

    await step('Ensure the correct node is selected after opening a file', async () => {
      await waitForContentOfSelectedElementsNode('<body>\u200B');
    });

    await step('Select element that we can target', async () => {
      await frontend.keyboard.press('ArrowRight');
      await waitForContentOfSelectedElementsNode(
          '<span id=\u200B"show-on-target">\u200BSome text here, only shown on :target\u200B</span>\u200B');
    });

    await forcePseudoState(':target');
    await assertGutterDecorationForDomNodeExists();
    await waitForDomNodeToBeVisible(TARGET_SHOWN_ON_TARGET_SELECTOR);

    const displayComputedStyle = await getComputedStylesForDomNode(TARGET_SHOWN_ON_TARGET_SELECTOR, 'display');
    assert.strictEqual(displayComputedStyle, 'inline');
  });

  it('can force :focus state for selected DOM node', async () => {
    const {frontend} = getBrowserAndPages();

    await goToResource('elements/focus.html');

    await waitForElementsStyleSection();

    await step('Ensure the correct node is selected after opening a file', async () => {
      await waitForContentOfSelectedElementsNode('<body>\u200B');
    });

    await step('Select div that we can focus', async () => {
      await frontend.keyboard.press('ArrowRight');
      await waitForContentOfSelectedElementsNode('<div id=\u200B"focus" tabindex=\u200B"0">\u200B…\u200B</div>\u200B');
    });

    await forcePseudoState(':focus');
    await assertGutterDecorationForDomNodeExists();
    await waitForDomNodeToBeVisible(TARGET_SHOWN_ON_FOCUS_SELECTOR);

    const displayComputedStyle = await getComputedStylesForDomNode(TARGET_SHOWN_ON_FOCUS_SELECTOR, 'display');
    assert.strictEqual(displayComputedStyle, 'inline');

    const backgroundColorComputedStyle = await getComputedStylesForDomNode('#focus', 'backgroundColor');
    assert.strictEqual(backgroundColorComputedStyle, 'rgb(0, 128, 0)');
  });

  it('can remove :focus state', async () => {
    const {frontend} = getBrowserAndPages();

    await goToResource('elements/focus.html');

    await waitForElementsStyleSection();

    await step('Ensure the correct node is selected after opening a file', async () => {
      await waitForContentOfSelectedElementsNode('<body>\u200B');
    });

    await step('Select div that we can focus', async () => {
      await frontend.keyboard.press('ArrowRight');
      await waitForContentOfSelectedElementsNode('<div id=\u200B"focus" tabindex=\u200B"0">\u200B…\u200B</div>\u200B');
    });

    await forcePseudoState(':focus');
    await assertGutterDecorationForDomNodeExists();
    await waitForDomNodeToBeVisible(TARGET_SHOWN_ON_FOCUS_SELECTOR);

    const displayComputedStyle = await getComputedStylesForDomNode(TARGET_SHOWN_ON_FOCUS_SELECTOR, 'display');
    assert.strictEqual(displayComputedStyle, 'inline');

    const backgroundColorComputedStyle = await getComputedStylesForDomNode('#focus', 'backgroundColor');
    assert.strictEqual(backgroundColorComputedStyle, 'rgb(0, 128, 0)');

    await removePseudoState(':focus');
    await waitForDomNodeToBeHidden(TARGET_SHOWN_ON_FOCUS_SELECTOR);

    await debuggerStatement(frontend);

    const hiddenDisplayStyle = await getComputedStylesForDomNode(TARGET_SHOWN_ON_FOCUS_SELECTOR, 'display');
    assert.strictEqual(hiddenDisplayStyle, 'none');
  });

  it('can toggle emulate a focused page', async () => {
    const {frontend, target} = getBrowserAndPages();

    await goToResource('elements/dissapearing-popup.html');
    await waitForElementsStyleSection();

    await step('Ensure the correct node is selected after opening a file', async () => {
      await waitForContentOfSelectedElementsNode('<body>\u200B');
    });

    await step('Navigate to #query input', async () => {
      await frontend.keyboard.press('ArrowRight');
      await waitForContentOfSelectedElementsNode('<input id=\u200B"query" type=\u200B"text">\u200B');
    });

    await step('Verify #result is hidden', async () => {
      await frontend.keyboard.press('ArrowDown');
      await waitForPartialContentOfSelectedElementsNode('<p id=\u200B"result" class=\u200B"hide">\u200B');
    });

    await step('Verify #result is visible', async () => {
      await forcePseudoState('Emulate a focused page');
      // await click('[aria-label="Toggle Element State"]');
      // await click('[title="Emulate a focused page"]');
      await target.keyboard.press('Tab');
      await waitForPartialContentOfSelectedElementsNode('<p id=\u200B"result" class>\u200B');
    });

    await step('Verify #result is hidden', async () => {
      await removePseudoState('Emulate a focused page');
      // await click('[title="Emulate a focused page"]');
      await target.keyboard.press('Tab');
      await waitForPartialContentOfSelectedElementsNode('<p id=\u200B"result" class=\u200B"hide">\u200B');
    });
  });

  it('shows the right specific elements for <input>', async () => {
    const {frontend} = getBrowserAndPages();

    await goToResource('elements/specific-pseudo-states.html');
    await waitForElementsStyleSection();

    // Ensure the correct node is selected after opening a file
    await waitForContentOfSelectedElementsNode('<body>\u200B');

    // Navigate to inputElement
    await frontend.keyboard.press('ArrowRight');
    await waitForContentOfSelectedElementsNode('<input id=\u200B"inputElement">\u200B');

    // Open force specific element state table
    await click('[aria-label="Toggle Element State"]');
    await click('[title="Force specific element state"]');

    const expected: {[key: string]: boolean} = {
      'enabled': false,
      'disabled': false,
      'valid': false,
      'invalid': false,
      'user-valid': false,
      'user-invalid': false,
      'required': false,
      'optional': false,
      'read-only': true,
      'read-write': false,
      'in-range': true,
      'out-of-range': true,
      'visited': true,
      'link': true,
      'checked': true,
      'indeterminate': true,
      'placeholder-shown': false,
      'autofill': false,
    };

    for (const key in expected) {
      const buttonSelector = `pierce/#${key}`;
      const button = await frontend.waitForSelector(buttonSelector);
      assert.isTrue(
          await button?.isHidden() === expected[key],
          `Button ${key} should be ${expected[key] ? 'visible' : 'hidden'}`);
    }
  });
  // it('shows the right specific elements for <textarea>', async () => {
  //   const {frontend} = getBrowserAndPages();

  //   await goToResource('elements/specific-pseudo-states.html');
  //   await waitForElementsStyleSection();

  //   // Ensure the correct node is selected after opening a file
  //   await waitForContentOfSelectedElementsNode('<body>\u200B');

  //   // Navigate to textareaElement
  //   await frontend.keyboard.press('ArrowRight');
  //   await frontend.keyboard.press('ArrowRight');
  //   await waitForContentOfSelectedElementsNode('<textarea id=\u200B"textareaElement">\u200B');

  //   // Open force specific element state table
  //   await click('[aria-label="Toggle Element State"]');
  //   await click('[title="Force specific element state"]');

  //   const expected: {[key: string]: boolean} = {
  //     'enabled' : false,
  //     'disabled': false,
  //     'valid'   : false,
  //     'invalid' : false,
  //     'user-valid': false,
  //     'user-invalid': false,
  //     'required': false,
  //     'optional': false,
  //     'read-only': true,
  //     'read-write': false,
  //     'in-range': true,
  //     'out-of-range': true,
  //     'visited': true,
  //     'link': true,
  //     'checked': true,
  //     'indeterminate': true,
  //     'placeholder-shown': false,
  //     'autofill': true,
  //   };

  //   for (const key in expected) {
  //     const buttonSelector = `pierce/#${key}`;
  //     const button = await frontend.waitForSelector(buttonSelector);
  //     assert.isTrue(await button?.isHidden() === expected[key], `Button ${key} should be ${expected[key] ? 'visible' : 'hidden'}`);
  //   }
  // });
});
