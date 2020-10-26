// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {findIcon, getActualFlexDirections, IconInfo, rotateFlexDirectionIcon} from '../../../../front_end/elements/CSSPropertyIconResolver.js';

const {assert} = chai;

describe('CSSPropertyIconResolver', () => {
  function mapFromStyle(style: {[key: string]: string|undefined}) {
    const result = new Map();
    for (const key of Object.keys(style)) {
      result.set(key, style[key]);
    }
    return result;
  }

  function reverse(info: IconInfo): IconInfo {
    info.scaleY *= -1;
    return info;
  }

  it('can computed actual directions for row and column', () => {
    const tests = [
      {
        style: {
          'direction': 'ltr',
        },
        expected: {
          row: 'left-to-right',
          column: 'top-to-bottom',
        },
      },
      {
        style: {
          'direction': 'ltr',
          'writing-mode': 'vertical-rl',
        },
        expected: {
          row: 'top-to-bottom',
          column: 'right-to-left',
        },
      },
      {
        style: {
          'direction': 'ltr',
          'writing-mode': 'vertical-lr',
        },
        expected: {
          row: 'top-to-bottom',
          column: 'left-to-right',
        },
      },
      {
        style: {
          'direction': 'ltr',
          'writing-mode': 'tb',
        },
        expected: {
          row: 'top-to-bottom',
          column: 'right-to-left',
        },
      },
      {
        style: {
          'direction': 'ltr',
          'writing-mode': 'tb-rl',
        },
        expected: {
          row: 'top-to-bottom',
          column: 'right-to-left',
        },
      },
      {
        style: {
          'direction': 'rtl',
        },
        expected: {
          row: 'right-to-left',
          column: 'top-to-bottom',
        },
      },
      {
        style: {
          'direction': 'rtl',
          'writing-mode': 'vertical-rl',
        },
        expected: {
          row: 'bottom-to-top',
          column: 'right-to-left',
        },
      },
      {
        style: {
          'direction': 'rtl',
          'writing-mode': 'vertical-lr',
        },
        expected: {
          row: 'bottom-to-top',
          column: 'left-to-right',
        },
      },
      {
        style: {
          'direction': 'rtl',
          'writing-mode': 'tb',
        },
        expected: {
          row: 'bottom-to-top',
          column: 'right-to-left',
        },
      },
      {
        style: {
          'direction': 'rtl',
          'writing-mode': 'tb-rl',
        },
        expected: {
          row: 'bottom-to-top',
          column: 'right-to-left',
        },
      },
    ];

    for (const test of tests) {
      assert.deepEqual(
          getActualFlexDirections(mapFromStyle(test.style)), test.expected,
          `Test ${JSON.stringify(test.style)} failed.`);
    }
  });

  it('can rotate the icon', () => {
    assert.deepEqual(rotateFlexDirectionIcon('left-to-right'), {
      iconName: 'flex-direction-icon',
      rotate: -90,
      scaleX: -1,
      scaleY: 1,
    });
    assert.deepEqual(rotateFlexDirectionIcon('right-to-left'), {
      iconName: 'flex-direction-icon',
      rotate: 90,
      scaleX: 1,
      scaleY: 1,
    });
    assert.deepEqual(rotateFlexDirectionIcon('top-to-bottom'), {
      iconName: 'flex-direction-icon',
      rotate: 0,
      scaleX: 1,
      scaleY: 1,
    });
    assert.deepEqual(rotateFlexDirectionIcon('bottom-to-top'), {
      iconName: 'flex-direction-icon',
      rotate: 0,
      scaleX: 1,
      scaleY: -1,
    });
  });

  it('can find an icon for flex-direction row', () => {
    const tests = [
      {
        style: {
          'direction': 'ltr',
        },
        expected: 'left-to-right',
      },
      {
        style: {
          'direction': 'ltr',
          'writing-mode': 'tb',
        },
        expected: 'top-to-bottom',
      },
      {
        style: {
          'direction': 'ltr',
          'writing-mode': 'vertical-lr',
        },
        expected: 'top-to-bottom',
      },
      {
        style: {
          'direction': 'ltr',
          'writing-mode': 'vertical-rl',
        },
        expected: 'top-to-bottom',
      },
      {
        style: {
          'direction': 'ltr',
          'writing-mode': 'tb-rl',
        },
        expected: 'top-to-bottom',
      },
      {
        style: {
          'direction': 'rtl',
        },
        expected: 'right-to-left',
      },
      {
        style: {
          'direction': 'rtl',
          'writing-mode': 'tb',
        },
        expected: 'bottom-to-top',
      },
      {
        style: {
          'direction': 'rtl',
          'writing-mode': 'vertical-lr',
        },
        expected: 'bottom-to-top',
      },
      {
        style: {
          'direction': 'rtl',
          'writing-mode': 'vertical-rl',
        },
        expected: 'bottom-to-top',
      },
      {
        style: {
          'direction': 'rtl',
          'writing-mode': 'tb-rl',
        },
        expected: 'bottom-to-top',
      },
    ];
    for (const test of tests) {
      assert.deepEqual(
          findIcon('flex-direction: row', mapFromStyle(test.style)), rotateFlexDirectionIcon(test.expected),
          `Test 'flex-direction: row'(${JSON.stringify(test.style)}) failed.`);

      assert.deepEqual(
          findIcon('flex-direction: row-reverse', mapFromStyle(test.style)),
          reverse(rotateFlexDirectionIcon(test.expected)),
          `Test 'flex-direction: row-reverse'(${JSON.stringify(test.style)}) failed.`);
    }
  });

  it('can find an icon for flex-direction: column and column-reverse', () => {
    const tests = [
      {
        style: {
          'direction': 'ltr',
        },
        expected: 'top-to-bottom',
      },
      {
        style: {
          'writing-mode': 'vertical-rl',
        },
        expected: 'right-to-left',
      },
      {
        style: {
          'writing-mode': 'vertical-lr',
        },
        expected: 'left-to-right',
      },
    ];

    for (const test of tests) {
      assert.deepEqual(
          findIcon('flex-direction: column', mapFromStyle(test.style)), rotateFlexDirectionIcon(test.expected),
          `Test 'flex-direction: column'(${JSON.stringify(test.style)}) failed.`);

      assert.deepEqual(
          findIcon('flex-direction: column-reverse', mapFromStyle(test.style)),
          reverse(rotateFlexDirectionIcon(test.expected)),
          `Test 'flex-direction: column-reverse'(${JSON.stringify(test.style)}) failed.`);
    }
  });
});
