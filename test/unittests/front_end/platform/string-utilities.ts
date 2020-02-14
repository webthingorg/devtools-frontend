// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {StringUtilities} from '../../../../front_end/platform/platform.js';

const {assert} = chai;

describe('StringUtilities', () => {
  describe('escapeCharacters', () => {
    it('escapes the given characters', () => {
      const inputString = 'My string with a single quote \' in the middle';
      const charsToEscape = '\'';
      const outputString = StringUtilities.escapeCharacters(inputString, charsToEscape);

      assert.equal(outputString, 'My string with a single quote \\\' in the middle');
    });

    it('leaves the string alone if the characters are not found', () => {
      const inputString = 'Just a boring string';
      const charsToEscape = '\'';
      const outputString = StringUtilities.escapeCharacters(inputString, charsToEscape);
      assert.equal(outputString, inputString);
    });
  });

  describe('collapseWhitespace', () => {
    it('collapses consecutive whitespace chars down to a single one', () => {
      const inputString = 'look                at this!';
      const outputString = StringUtilities.collapseWhitespace(inputString);
      assert.equal(outputString, 'look at this!');
    });

    it('matches globally and collapses all whitespace sections', () => {
      const inputString = 'a     b           c';
      const outputString = StringUtilities.collapseWhitespace(inputString);
      assert.equal(outputString, 'a b c');
    });
  });
});
