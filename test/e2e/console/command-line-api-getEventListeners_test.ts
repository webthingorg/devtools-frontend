// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {
  goToResource,
} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {
  checkCommandResultFunction,
  navigateToConsoleTab,
} from '../helpers/console-helpers.js';

const checkCommandResult = checkCommandResultFunction(0);

describe('The Console Tab', async function() {
  describe('returns the correct values when using the getEventListeners method', async () => {
    const testCases = [
      {
        command: 'innerListeners();',
        expectedResult: '{keydown: Array(2), wheel: Array(1)}',
        failureMessage: 'inner listeners are not displayed correctly',
      },
      {
        command: 'removeInnerListeners(); getEventListeners(innerElement());',
        expectedResult: '{keydown: Array(1)}',
        failureMessage: 'inner listeners after removal are not displayed correctly',
      },
      {
        command: 'getEventListeners(document.getElementById("outer"));',
        expectedResult: '{mousemove: Array(1), mousedown: Array(1), keydown: Array(1), keyup: Array(1)}',
        failureMessage: 'outer listeners are not displayed correctly',
      },
      {
        command: 'getEventListeners(document.getElementById("button"));',
        expectedResult: '{click: Array(1), mouseover: Array(1)}',
        failureMessage: 'attribute event listeners are not displayed correctly',
      },
      {
        command: 'getEventListeners(window);',
        expectedResult: '{popstate: Array(1)}',
        failureMessage: 'window listeners are not displayed correctly',
      },
      {
        command: 'getEventListeners(document.getElementById("empty"));',
        expectedResult: '{}',
        failureMessage: 'empty listeners are not displayed correctly',
      },
      {
        command: 'getEventListeners(document.getElementById("invalid"));',
        expectedResult: '{}',
        failureMessage: 'invalid listeners are not displayed correctly',
      },
      {
        command: 'getEventListeners({});',
        expectedResult: '{}',
        failureMessage: 'object listeners are not displayed correctly',
      },
      {
        command: 'getEventListeners(null);',
        expectedResult: '{}',
        failureMessage: 'null listeners are not displayed correctly',
      },
      {
        command: 'getEventListeners(undefined);',
        expectedResult: '{}',
        failureMessage: 'undefined listeners are not displayed correctly',
      },
    ];

    testCases.forEach(testCase => {
      it(`for the command \"${testCase['command']}\"`, async () => {
        await goToResource('../resources/console/command-line-api-getEventListeners.html');
        await navigateToConsoleTab();
        await checkCommandResult(
            testCase['command'],
            testCase['expectedResult'],
            testCase['failureMessage'],
        );
      });
    });
  });
});
