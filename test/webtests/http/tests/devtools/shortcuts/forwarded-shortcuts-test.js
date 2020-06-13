// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

(async function() {
  TestRunner.addResult('Tests that forwarded shortcuts are forwarded\n');

  await TestRunner.showPanel('sources');

  await TestRunner.evaluateInPageAsync(`
    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Control',
      code: 'ControlLeft',
      location: 1,
      ctrlKey: true,
      keyCode: 17
    }));
    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Shift',
      code: 'ShiftLeft',
      location: 1,
      ctrlKey: true,
      shiftKey: true,
      keyCode: 16
    }));
    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'P',
      code: 'KeyP',
      location: 0,
      ctrlKey: true,
      shiftKey: true,
      keyCode: 80
    }));
  `);

  await TestRunner.addSnifferPromise;

  TestRunner.completeTest();
})();
