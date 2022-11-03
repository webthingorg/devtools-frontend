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
  getCurrentConsoleInfoMessages,
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

    await typeIntoConsoleAndWaitForResult(frontend, 'runTestsInPage(getEventListeners);');

    const result = (await getCurrentConsoleInfoMessages());
    assert.strictEqual(result[0], innerListeners, 'inner listeners are not displayed correctly');
    assert.strictEqual(
        result[1], innerListenersAfterRemoval, 'inner listeners after removal are not displayed correctly');
    assert.strictEqual(result[2], outerListeners, 'outer listeners are not displayed correctly');
    assert.strictEqual(result[3], attributeEventListeners, 'attribute event listeners are not displayed correctly');
    assert.strictEqual(result[4], windowListeners, 'window listeners are not displayed correctly');
    assert.strictEqual(result[5], emptyListeners, 'empty listeners are not displayed correctly');
    assert.strictEqual(result[6], invalidListeners, 'invalid listeners are not displayed correctly');
    assert.strictEqual(result[7], objectListeners, 'object listeners are not displayed correctly');
    assert.strictEqual(result[8], nullListeners, 'null listeners are not displayed correctly');
    assert.strictEqual(result[9], undefinedListeners, 'undefined listeners are not displayed correctly');
  });
});
