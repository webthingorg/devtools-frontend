// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as SDK from '../../core/sdk/sdk.js';

// TODO(crbug/1282837): This is too naive and doesn't support
// most (anticipated) uses of the ANSI color sequences (i.e.
// setting both foreground and background color).
const ANSI_COLOR_CODES = new Map([
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
]);

export type FormatToken = {
  type: 'generic'|'optimal',
  value: SDK.RemoteObject.RemoteObject,
}|{
  type: 'string' | 'style',
  value: string,
};

/**
 * This is the front-end part of the Formatter function specified in the
 * Console Standard (https://console.spec.whatwg.org/#formatter). Here we
 * assume that all type conversions have already happened in V8 before and
 * are only concerned with performing the actual substitutions and dealing
 * with generic and optimal object formatting as well as styling.
 *
 * @param fmt the format string.
 * @param args the substitution arguments for `fmt`.
 * @returns a list of `FormatToken`s as well as the unused arguments.
 */
export const format = (fmt: string, args: SDK.RemoteObject.RemoteObject[]): {
  tokens: FormatToken[],
  args: SDK.RemoteObject.RemoteObject[],
} => {
  function flushString(): void {
    if (fmtIndex > 0) {
      const type = 'string';
      const value = fmt.substring(0, fmtIndex);
      tokens.push({type, value});
      fmt = fmt.substring(fmtIndex);
      fmtIndex = 0;
    }
  }

  const tokens: FormatToken[] = [];
  let fmtIndex = 0, argIndex = 0;
  while (fmtIndex < fmt.length) {
    const char = fmt.charAt(fmtIndex);
    if (char === '\u001b' && fmt.charAt(fmtIndex + 1) === '[') {
      const endIndex = fmt.indexOf('m', fmtIndex + 2);
      if (endIndex === -1) {
        fmtIndex++;
      } else {
        const value = ANSI_COLOR_CODES.get(parseInt(fmt.substring(fmtIndex + 2, endIndex), 10));
        if (value !== undefined) {
          flushString();  // Flush any pending string first
          const type = 'style';
          tokens.push({type, value});
        }
        fmt = fmt.substring(0, fmtIndex) + fmt.substring(endIndex + 1);
      }
      continue;
    }
    if (char !== '%') {
      fmtIndex++;
      continue;
    }
    let substitution = undefined;
    const specifier = fmt.charAt(fmtIndex + 1);
    switch (specifier) {
      case 'c':
        if (argIndex < args.length) {
          flushString();  // Flush any pending string first
          substitution = '';
          const type = 'style';
          const value = args[argIndex++].description ?? '';
          tokens.push({type, value});
        }
        break;
      case 'o':
      case 'O':
        if (argIndex < args.length) {
          flushString();  // Flush any pending string first
          substitution = '';
          const type = (specifier === 'O') ? 'generic' : 'optimal';
          const value = args[argIndex++];
          tokens.push({type, value});
        }
        break;
      case '%':
        substitution = '%';
        break;
      case '_':
        if (argIndex < args.length) {
          argIndex++;
          substitution = '';
        }
        break;
      case 's':
        if (argIndex < args.length) {
          const {description} = args[argIndex++];
          substitution = description ?? '';
        }
        break;
      case 'd':
      case 'i':
        if (argIndex < args.length) {
          const {value} = args[argIndex++];
          substitution = typeof value !== 'number' ? NaN : Math.floor(value);
        }
        break;
      case 'f':
        if (argIndex < args.length) {
          const {value} = args[argIndex++];
          substitution = typeof value !== 'number' ? NaN : value;
        }
        break;
    }
    if (substitution !== undefined) {
      fmt = fmt.substring(0, fmtIndex) + substitution + fmt.substring(fmtIndex + 2);
    } else {
      fmtIndex++;
    }
  }
  flushString();
  return {tokens, args: args.slice(argIndex)};
};
