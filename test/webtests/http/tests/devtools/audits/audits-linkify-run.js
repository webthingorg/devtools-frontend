// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

(async function () {
  TestRunner.addResult('Tests that the report linkifies elements to other DevTools panels.\n');
  await TestRunner.navigatePromise('resources/audits-linkify.html');

  await TestRunner.loadModule('audits_test_runner');
  await TestRunner.showPanel('audits');

  AuditsTestRunner.getRunButton().click();
  await AuditsTestRunner.waitForResults();

  const resultElement = AuditsTestRunner.getResultsElement();
  const nodeElement = resultElement.querySelector('.lh-node[data-path]');
  const waitForLinkify = new Promise(resolve => {
    const observer = new MutationObserver(resolve);
    observer.observe(nodeElement, { childList: true });
  });
  await waitForLinkify;

  const waitForShowView = new Promise(resolve => {
    TestRunner.addSniffer(UI.ViewManager.prototype, 'showView', resolve);
  });
  const nodeLink = nodeElement.firstChild.shadowRoot.querySelector('.node-link');
  TestRunner.addResult(`\nClicking: ${nodeLink.textContent}`);
  nodeLink.click();
  const viewShown = await waitForShowView;
  TestRunner.addResult(`\nShowing view: ${viewShown}`);

  TestRunner.completeTest();
})();
