// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

(async function() {
  TestRunner.addResult('Tests that Lighthouse panel displays a warning when important data may be cleared.\n');
  await TestRunner.navigatePromise('resources/lighthouse-basic.html');

  await TestRunner.loadModule('lighthouse_test_runner');
  await TestRunner.showPanel('lighthouse');

  const containerElement = LighthouseTestRunner.getContainerElement();
  const checkboxes = containerElement.querySelectorAll('.checkbox');
  for (const checkbox of checkboxes) {
    if (checkbox.textElement.textContent === 'Performance' || checkbox.textElement.textContent === 'Clear storage') {
      continue;
    }

    if (checkbox.checkboxElement.checked) {
      checkbox.checkboxElement.click();
    }
  }

  LighthouseTestRunner.dumpStartAuditState();

  const warningText = containerElement.querySelector('.lighthouse-warning-text');
  await TestRunner.evaluateInPageAsync('window.indexedDB.open("DataBase", 3);');
  LighthouseTestRunner.forcePageAuditabilityCheck();

  // Wait for warning event to be handled
  setTimeout(() => {
    TestRunner.addResult(`Warning Text: ${warningText.textContent}`);
    TestRunner.completeTest();
  }, 1000);
})();
