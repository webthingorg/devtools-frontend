// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import {FilePathScoreFunction} from '../../../../front_end/sources/FilePathScoreFunction.js';

describe('FilePathScoreFunction', () => {
  describe('score', () => {
    let filterPathScoreFunction: FilePathScoreFunction;

    beforeEach(() => {
      filterPathScoreFunction = new FilePathScoreFunction('App');
    });

    it('should prefer filename match over path match', () => {
      const fileMatchScore = filterPathScoreFunction.score('/path/to/App.js', null);
      const pathMatchScore = filterPathScoreFunction.score('/path/to/App/whatever', null);

      assert.isTrue(fileMatchScore > pathMatchScore);
    });

    it('should prefer longer partial match', () => {
      const longMatchScore = filterPathScoreFunction.score('/path/to/App.js', null);
      const shortMatchScore = filterPathScoreFunction.score('/path/to/Ap.js', null);

      assert.isTrue(shortMatchScore < longMatchScore);
    });

    it('should prefer consecutive match', () => {
      const consecutiveMatchScore = filterPathScoreFunction.score('/path/to/App.js', null);
      const notConsecutiveMatchScore = filterPathScoreFunction.score('path/to/A_p_p.js', null);

      assert.isTrue(consecutiveMatchScore > notConsecutiveMatchScore);
    });

    it('should prefer path match at start', () => {
      const pathStartScore = filterPathScoreFunction.score('App/js/file.js', null);
      const midPathMatchScore = filterPathScoreFunction.score('public/App/js/file.js', null);

      assert.isTrue(pathStartScore > midPathMatchScore);
    });

    it('should prefer match at word start', () => {
      const wordStartMatchScore = filterPathScoreFunction.score('/js/App.js', null);
      const midWordMatchScore = filterPathScoreFunction.score('/js/someApp.js', null);

      assert.isTrue(wordStartMatchScore > midWordMatchScore);
    });

    it('should prefer caps match', () => {
      const capsMatchScore = filterPathScoreFunction.score('/js/App.js', null);
      const noCapsMatchScore = filterPathScoreFunction.score('/js/app.js', null);

      assert.isTrue(capsMatchScore > noCapsMatchScore);
    });

    it('should prefer shorter path', () => {
      const shortPathScore = filterPathScoreFunction.score('path/App.js', null);
      const longerPathScore = filterPathScoreFunction.score('longer/path/App.js', null);

      assert.isTrue(shortPathScore > longerPathScore);
    });

    it('should highlight matching filename, but not path', () => {
      const highlightsFullMatch = new Array<number>();
      const highlightsCamelCase = new Array<number>();
      const highlightsDash = new Array<number>();
      const highlightsUnderscore = new Array<number>();
      const highlightsDot = new Array<number>();
      const highlightsWhitespace = new Array<number>();

      filterPathScoreFunction.score('App/App.js', highlightsFullMatch);
      filterPathScoreFunction.score('App/MyApp.js', highlightsCamelCase);
      filterPathScoreFunction.score('App/My-App.js', highlightsDash);
      filterPathScoreFunction.score('App/My_App.js', highlightsUnderscore);
      filterPathScoreFunction.score('App/My.App.js', highlightsDot);
      filterPathScoreFunction.score('App/My App.js', highlightsWhitespace);

      assert.deepEqual(highlightsFullMatch, [4, 5, 6]);
      assert.deepEqual(highlightsCamelCase, [6, 7, 8]);
      assert.deepEqual(highlightsDash, [7, 8, 9]);
      assert.deepEqual(highlightsUnderscore, [7, 8, 9]);
      assert.deepEqual(highlightsDot, [7, 8, 9]);
      assert.deepEqual(highlightsWhitespace, [7, 8, 9]);
    });

    it('should highlight path when not matching filename', () => {
      const highlightsConsecutive = new Array<number>();
      const highlightsNonConsecutive = new Array<number>();

      filterPathScoreFunction.score('public/App/index.js', highlightsConsecutive);
      filterPathScoreFunction.score('public/A/p/p/index.js', highlightsNonConsecutive);

      assert.deepEqual(highlightsConsecutive, [7, 8, 9]);
      assert.deepEqual(highlightsNonConsecutive, [7, 9, 11]);
    });

    it('should highlight non consecutive match correctly', () => {
      const highlights = new Array<number>();

      filterPathScoreFunction.score('path/A-wesome-pp.js', highlights);

      assert.deepEqual(highlights, [5, 14, 15]);
    });

    it('should highlight full path match if filename only matches partially', () => {
      const highlights = new Array<number>();

      filterPathScoreFunction.score('App/someapp.js', highlights);

      assert.deepEqual(highlights, [0, 1, 2]);
    });
  });
});
