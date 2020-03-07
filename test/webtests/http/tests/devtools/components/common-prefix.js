// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

(async function() {
  TestRunner.addResult('Tests TextUtils.TextUtils.commonPrefix.\n');

  TestRunner.runTestSuite([
    function testSimple(next) {
      const strings = ['prefix/foo', 'prefix/bar'];
      const result = TextUtils.TextUtils.commonPrefix(strings);
      TestRunner.addResult(result);
      next();
    },

    function testFilepaths(next) {
      const strings = ['c:\\win32\\calc.exe', 'c:\\win32\\notepad.exe', 'c:\\win32\\winmine.exe'];
      const result = TextUtils.TextUtils.commonPrefix(strings);
      TestRunner.addResult(result);
      next();
    },

    function testNoSharedPrefix(next) {
      const strings = ['foo', 'baz', 'bar'];
      const result = TextUtils.TextUtils.commonPrefix(strings);
      TestRunner.addResult(result);
      next();
    },

    function testNoStrings(next) {
      const strings = [];
      const result = TextUtils.TextUtils.commonPrefix(strings);
      TestRunner.addResult(result);
      next();
    },
  ]);
})();
