// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';

import {
  getBrowserAndPages,
  goToResource,
} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {getCurrentConsoleMessages, navigateToConsoleTab, typeIntoConsole} from '../helpers/console-helpers.js';

describe('The Console Tab', async () => {
  it('returns the correct values when using the getEventListeners method', async () => {
    await goToResource('../resources/console/command-line-api-getEventListeners.html');
    await navigateToConsoleTab();
    const {frontend} = getBrowserAndPages();

    await typeIntoConsole(frontend, 'getEventListeners(document.getElementById("button"));');
    await typeIntoConsole(frontend, 'getEventListeners(document.getElementById("empty"));');

    const result = (await getCurrentConsoleMessages());
    assert.strictEqual(result[0], '{click: Array(1), mouseover: Array(1)}');
    assert.strictEqual(result[1], '{}');
  });
});
