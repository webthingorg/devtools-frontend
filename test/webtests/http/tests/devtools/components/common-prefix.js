// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

(async function() {
  TestRunner.addResult(`Tests TextUtils.TextUtils.commonPrefix.\n`);

  TestRunner.runTestSuite([
    function testSimple(next) {
      var strings = ['prefix/foo', 'prefix/bar'];
      var result = TextUtils.TextUtils.commonPrefix(strings);
      TestRunner.addResult(result);
      next();
    },

    function testFilepaths(next) {
      var strings = ['c:\\win32\\calc.exe', 'c:\\win32\\notepad.exe', 'c:\\win32\\winmine.exe'];
      var result = TextUtils.TextUtils.commonPrefix(strings);
      TestRunner.addResult(result);
      next();
    },

    function testNoSharedPrefix(next) {
      var strings = ['foo', 'baz', 'bar'];
      var result = TextUtils.TextUtils.commonPrefix(strings);
      TestRunner.addResult(result);
      next();
    },

    function testNoStrings(next) {
      var strings = [];
      var result = TextUtils.TextUtils.commonPrefix(strings);
      TestRunner.addResult(result);
      next();
    },
  ]);
})();
