// Copyright (c) 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as SDK from '../../../../../front_end/core/sdk/sdk.js';
import * as Console from '../../../../../front_end/panels/console/console.js';

const {assert} = chai;

describe('ConsoleFormat', () => {
  describe('format', () => {
    it('deals with empty format string', () => {
      assert.deepNestedPropertyVal(Console.ConsoleFormat.format('', []), 'tokens', []);
    });

    it('yields unused arguments', () => {
      const argNumber = SDK.RemoteObject.RemoteObject.fromLocalObject(42);
      const argString = SDK.RemoteObject.RemoteObject.fromLocalObject('Hello World!');
      const argSymbol = SDK.RemoteObject.RemoteObject.fromLocalObject(Symbol('My very special Symbol'));
      const {args} = Console.ConsoleFormat.format('This string is boring!', [argNumber, argString, argSymbol]);
      assert.lengthOf(args, 3);
      assert.strictEqual(args[0], argNumber);
      assert.strictEqual(args[1], argString);
      assert.strictEqual(args[2], argSymbol);
    });

    it('deals with format strings without formatting specifiers', () => {
      assert.deepNestedPropertyVal(
          Console.ConsoleFormat.format('This string does NOT contain specifiers', []), 'tokens', [
            {
              type: 'string',
              value: 'This string does NOT contain specifiers',
            },
          ]);
    });

    it('replaces %% with %', () => {
      assert.deepNestedPropertyVal(Console.ConsoleFormat.format('Go 100%%, and then another 50%%!', []), 'tokens', [
        {
          type: 'string',
          value: 'Go 100%, and then another 50%!',
        },
      ]);
    });

    it('deals with trailing %', () => {
      assert.deepNestedPropertyVal(Console.ConsoleFormat.format('75%', []), 'tokens', [
        {
          type: 'string',
          value: '75%',
        },
      ]);
    });

    it('deals with %o and %O', () => {
      const argFirst = SDK.RemoteObject.RemoteObject.fromLocalObject({'first': 1});
      const argSecond = SDK.RemoteObject.RemoteObject.fromLocalObject({'second': 2});
      const {tokens} = Console.ConsoleFormat.format('%o %O', [argFirst, argSecond]);
      assert.lengthOf(tokens, 3);
      assert.propertyVal(tokens[0], 'type', 'optimal');
      assert.propertyVal(tokens[0], 'value', argFirst);
      assert.propertyVal(tokens[1], 'type', 'string');
      assert.propertyVal(tokens[1], 'value', ' ');
      assert.propertyVal(tokens[2], 'type', 'generic');
      assert.propertyVal(tokens[2], 'value', argSecond);
    });

    it('deals with %c', () => {
      assert.deepNestedPropertyVal(
          Console.ConsoleFormat.format(
              '%cColorful%c!',
              [
                SDK.RemoteObject.RemoteObject.fromLocalObject('color: red'),
                SDK.RemoteObject.RemoteObject.fromLocalObject('color: black'),
              ]),
          'tokens', [
            {
              type: 'style',
              value: 'color: red',
            },
            {
              type: 'string',
              value: 'Colorful',
            },
            {
              type: 'style',
              value: 'color: black',
            },
            {
              type: 'string',
              value: '!',
            },
          ]);
    });

    it('eats arguments with %_', () => {
      const argFirst = SDK.RemoteObject.RemoteObject.fromLocalObject({'first': 1});
      const argSecond = SDK.RemoteObject.RemoteObject.fromLocalObject({'second': 2});
      const argThird = SDK.RemoteObject.RemoteObject.fromLocalObject({'third': 3});
      const {tokens, args} = Console.ConsoleFormat.format('This is%_ some %_text!', [argFirst, argSecond, argThird]);
      assert.lengthOf(args, 1);
      assert.strictEqual(args[0], argThird);
      assert.lengthOf(tokens, 1);
      assert.propertyVal(tokens[0], 'type', 'string');
      assert.propertyVal(tokens[0], 'value', 'This is some text!');
    });

    it('leaves unsatisfied formatting specifiers in place', () => {
      assert.deepNestedPropertyVal(Console.ConsoleFormat.format('%_ %O %o %d %i %f %s %c', []), 'tokens', [
        {
          type: 'string',
          value: '%_ %O %o %d %i %f %s %c',
        },
      ]);
    });

    it('deals with %s', () => {
      assert.deepNestedPropertyVal(
          Console.ConsoleFormat.format(
              '%s%s%s!',
              [
                SDK.RemoteObject.RemoteObject.fromLocalObject('Hello'),
                SDK.RemoteObject.RemoteObject.fromLocalObject(' '),
                SDK.RemoteObject.RemoteObject.fromLocalObject('World'),
              ]),
          'tokens', [
            {
              type: 'string',
              value: 'Hello World!',
            },
          ]);
      assert.deepNestedPropertyVal(
          Console.ConsoleFormat.format(
              '%s!',
              [
                SDK.RemoteObject.RemoteObject.fromLocalObject('%s %s'),
                SDK.RemoteObject.RemoteObject.fromLocalObject('Hello'),
                SDK.RemoteObject.RemoteObject.fromLocalObject('World'),
              ]),
          'tokens', [
            {
              type: 'string',
              value: 'Hello World!',
            },
          ]);
    });

    it('deals with %d, %i, and %f', () => {
      assert.deepNestedPropertyVal(
          Console.ConsoleFormat.format(
              '%d %i %f',
              [
                SDK.RemoteObject.RemoteObject.fromLocalObject(42.1),
                SDK.RemoteObject.RemoteObject.fromLocalObject(21.5),
                SDK.RemoteObject.RemoteObject.fromLocalObject(3.1415),
              ]),
          'tokens', [
            {
              type: 'string',
              value: '42 21 3.1415',
            },
          ]);
      assert.deepNestedPropertyVal(
          Console.ConsoleFormat.format(
              '%f %i %d',
              [
                SDK.RemoteObject.RemoteObject.fromLocalObject(Symbol('Some %s')),
                SDK.RemoteObject.RemoteObject.fromLocalObject('Some %s'),
                SDK.RemoteObject.RemoteObject.fromLocalObject(false),
              ]),
          'tokens', [
            {
              type: 'string',
              value: 'NaN NaN NaN',
            },
          ]);
    });

    it('strips unsupported ANSI SGR sequence', () => {
      assert.deepNestedPropertyVal(Console.ConsoleFormat.format('\u001b[255m', []), 'tokens', []);
    });

    it('leaves broken ANSI SGR sequences in place', () => {
      assert.deepNestedPropertyVal(Console.ConsoleFormat.format('Bar\u001b[90', []), 'tokens', [
        {
          type: 'string',
          value: 'Bar\u001b[90',
        },
      ]);
      assert.deepNestedPropertyVal(Console.ConsoleFormat.format('\u001b[39FOO', []), 'tokens', [
        {
          type: 'string',
          value: '\u001b[39FOO',
        },
      ]);
    });

    it('deals with ANSI color escape codes', () => {
      [
          // Foreground codes
          [30, 'color: black'],
          [31, 'color: red'],
          [32, 'color: green'],
          [33, 'color: yellow'],
          [34, 'color: blue'],
          [35, 'color: magenta'],
          [36, 'color: cyan'],
          [37, 'color: lightGray'],
          [39, 'color: default'],
          [90, 'color: darkGray'],
          [91, 'color: lightRed'],
          [92, 'color: lightGreen'],
          [93, 'color: lightYellow'],
          [94, 'color: lightBlue'],
          [95, 'color: lightMagenta'],
          [96, 'color: lightCyan'],
          [97, 'color: white'],
          // Background codes
          [40, 'background-color: black'],
          [41, 'background-color: red'],
          [42, 'background-color: green'],
          [43, 'background-color: yellow'],
          [44, 'background-color: blue'],
          [45, 'background-color: magenta'],
          [46, 'background-color: cyan'],
          [47, 'background-color: lightGray'],
          [49, 'background-color: default'],
          [100, 'background-color: darkGray'],
          [101, 'background-color: lightRed'],
          [102, 'background-color: lightGreen'],
          [103, 'background-color: lightYellow'],
          [104, 'background-color: lightBlue'],
          [105, 'background-color: lightMagenta'],
          [106, 'background-color: lightCyan'],
          [107, 'background-color: white'],
      ].forEach(([code, value]) => {
        assert.deepNestedPropertyVal(Console.ConsoleFormat.format('\u001b[' + code + 'm', []), 'tokens', [
          {
            type: 'style',
            value,
          },
        ]);
      });
    });
  });
});
