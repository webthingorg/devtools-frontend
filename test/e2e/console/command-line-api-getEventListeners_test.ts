// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';

import {
  getBrowserAndPages,
  goToResource,
} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {
  getLastConsoleMessages,
  navigateToConsoleTab,
  typeIntoConsoleAndWaitForResult,
} from '../helpers/console-helpers.js';

describe('The Console Tab', async () => {
  it('returns the correct values when using the getEventListeners method', async () => {
    await goToResource('../resources/console/command-line-api-getEventListeners.html');
    await navigateToConsoleTab();
    const {frontend} = getBrowserAndPages();
    const innerListeners = '{keydown: Array(2), wheel: Array(1)}';
    const innerListenersAfterRemoval = '{keydown: Array(1)}';
    const outerListeners = '{mousemove: Array(1), mousedown: Array(1), keydown: Array(1), keyup: Array(1)}';
    const attributeEventListeners = '{click: Array(1), mouseover: Array(1)}';
    const windowListeners = '{popstate: Array(1)}';
    const emptyListeners = '{}';
    const invalidListeners = '{}';
    const objectListeners = '{}';
    const nullListeners = '{}';
    const undefinedListeners = '{}';

    await typeIntoConsoleAndWaitForResult(frontend, 'innerListeners();');
    assert.strictEqual(await getLastConsoleMessages(), innerListeners, 'inner listeners are not displayed correctly');

    await typeIntoConsoleAndWaitForResult(frontend, 'removeInnerListeners();');
    await typeIntoConsoleAndWaitForResult(frontend, 'getEventListeners(innerElement());');
    assert.strictEqual(
        await getLastConsoleMessages(), innerListenersAfterRemoval,
        'inner listeners after removal are not displayed correctly');

    await typeIntoConsoleAndWaitForResult(frontend, 'getEventListeners(document.getElementById("outer"));');
    assert.strictEqual(await getLastConsoleMessages(), outerListeners, 'outer listeners are not displayed correctly');

    await typeIntoConsoleAndWaitForResult(frontend, 'getEventListeners(document.getElementById("button"));');
    assert.strictEqual(
        await getLastConsoleMessages(), attributeEventListeners,
        'attribute event listeners are not displayed correctly');

    await typeIntoConsoleAndWaitForResult(frontend, 'getEventListeners(window);');
    assert.strictEqual(await getLastConsoleMessages(), windowListeners, 'window listeners are not displayed correctly');

    await typeIntoConsoleAndWaitForResult(frontend, 'getEventListeners(document.getElementById("empty"));');
    assert.strictEqual(await getLastConsoleMessages(), emptyListeners, 'empty listeners are not displayed correctly');

    await typeIntoConsoleAndWaitForResult(frontend, 'getEventListeners(document.getElementById("invalid"));');
    assert.strictEqual(
        await getLastConsoleMessages(), invalidListeners, 'invalid listeners are not displayed correctly');

    await typeIntoConsoleAndWaitForResult(frontend, 'getEventListeners({});');
    assert.strictEqual(await getLastConsoleMessages(), objectListeners, 'object listeners are not displayed correctly');

    await typeIntoConsoleAndWaitForResult(frontend, 'getEventListeners(null);');
    assert.strictEqual(await getLastConsoleMessages(), nullListeners, 'null listeners are not displayed correctly');

    await typeIntoConsoleAndWaitForResult(frontend, 'getEventListeners(undefined);');
    assert.strictEqual(
        await getLastConsoleMessages(), undefinedListeners, 'undefined listeners are not displayed correctly');
  });
});
