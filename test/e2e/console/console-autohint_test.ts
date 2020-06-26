// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import {describe, it} from 'mocha';

import {click, getBrowserAndPages, typeText, waitFor, waitForNone} from '../../shared/helper.js';
import {CONSOLE_TAB_SELECTOR, focusConsolePrompt} from '../helpers/console-helpers.js';

/* eslint-disable @typescript-eslint/no-unused-vars */

describe('The Console Tab', async () => {
  async function evaluateFunctionInConsole(fn: () => void) {
    const m = fn.toString().match(/\{((?:.|\r?\n)*)\}/);
    if (!m) {
      throw new Error('Could not parse function');
    }
    await typeText(m[1]);
  }

  async function getHintForInput(input: string) {
    const {frontend} = getBrowserAndPages();
    const appearPromise = waitFor('.autocomplete-tooltip');
    // CodeMirror does some internal debouncing/throttling
    // 100ms seems to be a good delay to make sure
    await frontend.keyboard.type(input, {delay: 50});
    await waitForNone('.suggest-box');
    const element = await appearPromise;

    return frontend.evaluate(e => {
      return e.textContent.replace(/\s+/g, '');
    }, element);
  }


  function addTestCase(name: string, input: string, expectation: string, fn: (() => void)|null = null) {
    it.only(name, async () => {
      await click(CONSOLE_TAB_SELECTOR);
      await focusConsolePrompt();

      if (fn) {
        await evaluateFunctionInConsole(fn);
      }

      const hint = await getHintForInput(input);
      assert.deepEqual(hint, `ƒ(${expectation})`);
    });
  }


  addTestCase('shows the correct autohint for a builtin method', 'open(', '?url,?target,?features');
  addTestCase('shows the correct autohint for a builtin method on an object', 'Math.log(', 'x');
  addTestCase('shows the correct autohint for rest parameters', 'console.log(1,', '...data');
  addTestCase(
      'shows the correct autohint for a combination of fixed and rest parameters', 'const process = window.setTimeout(',
      'callback,ms,...args');
  addTestCase(
      'shows the correct autohint for a combination of fixed and optional parameters',
      'document.body.addEventListener(', 'type,listener,?options');
  addTestCase(
      'shows the correct autohint for a bound function', 'boundAddClickListener(x => x,', 'listener,?options', () => {
        const boundAddClickListener = document.addEventListener.bind(document, 'click');
      });
  addTestCase(
      'shows the correct autohint for destructured parameters', 'userFunctionWithDestructuring(', 'obj,arr', () => {
        // @ts-ignore
        function userFunctionWithDestructuring({something1}, [sommething2, something3]) {}
      });

  const boundFunctions = () => {
    // @ts-ignore
    function originalFunction(a, b, c, ...more) {
    }
    const secondFunction = originalFunction.bind(null, 'a');
    const thirdFunction = secondFunction.bind(null, 'b');
    const fourthFunction = thirdFunction.bind(null, 'c');
    const fifthFunction = fourthFunction.bind(null, 'more');
    const aLotBound = originalFunction.bind(null, 'a', 'b', 'c', 'd', 'e', 'f');
  };

  addTestCase(
      'shows the correct autohint for fixed and rest parameters with multiple bounds', 'originalFunction(',
      'a,b,c,...more', boundFunctions);
  addTestCase(
      'shows the correct autohint for fixed and rest parameters with multiple bounds', 'secondFunction(', 'b,c,...more',
      boundFunctions);
  addTestCase(
      'shows the correct autohint for fixed and rest parameters with multiple bounds', 'thirdFunction(', 'c,...more',
      boundFunctions);
  addTestCase(
      'shows the correct autohint for fixed and rest parameters with multiple bounds', 'fourthFunction(', '...more',
      boundFunctions);
  addTestCase(
      'shows the correct autohint for fixed and rest parameters with multiple bounds', 'fifthFunction(', '...more',
      boundFunctions);
  addTestCase(
      'shows the correct autohint for fixed and rest parameters with multiple bounds', 'aLotBound(', '...more',
      boundFunctions);
});
