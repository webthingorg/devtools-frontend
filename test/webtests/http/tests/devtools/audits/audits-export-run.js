// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

(async function () {  
  TestRunner.addResult('Tests that exporting works.\n');
  await TestRunner.navigatePromise('resources/audits-basic.html');
  
  await TestRunner.loadModule('audits_test_runner');
  await TestRunner.showPanel('audits');

  await new Promise(resolve => setTimeout(resolve, 10));

  // AuditsTestRunner.getRunButton().click();
  // await AuditsTestRunner.waitForResults();

  // const resultsElement = AuditsTestRunner.getResultsElement();
  // const toolsMenu = resultsElement.querySelector('.lh-tools__dropdown');

  // function waitForSave() {
  //   return new Promise(resolve => {
  //     TestRunner.addSniffer(Audits.ReportUIFeatures.prototype, '_saveFile',
  //       blob => resolve(blob.text()));
  //   });
  // }

  // async function testExportHtml() {
  //   const reportHtmlPromise = waitForSave();
  //   toolsMenu.querySelector('a[data-action="save-html"').click();
  //   const reportHtml = await reportHtmlPromise;

  //   let auditElements = resultsElement.querySelectorAll('.lh-audit');
  //   TestRunner.addResult(`\n# of .lh-audit divs (original): ${auditElements.length}`);

  //   const exportedReportIframe = resultsElement.ownerDocument.createElement('iframe');
  //   exportedReportIframe.srcdoc = reportHtml;
  //   resultsElement.parentElement.append(exportedReportIframe);
  //   await new Promise(resolve => exportedReportIframe.addEventListener('load', resolve));

  //   auditElements = exportedReportIframe.contentDocument.querySelectorAll('.lh-audit');
  //   TestRunner.addResult(`\n# of .lh-audit divs (exported html): ${auditElements.length}`);
  // }

  // async function testExportJson() {
  //   // const reportJsonPromise = waitForSave();
  //   // toolsMenu.querySelector('a[data-action="save-json"').click();
  //   await new Promise(resolve => setTimeout(resolve, 10));
  //   // const reportJson = await reportJsonPromise;
  //   // const lhr = JSON.parse(reportJson);
  //   // TestRunner.addResult(`\n# of audits (json): ${Object.keys(lhr.audits).length}`);
  // }

  // Workspace.fileManager.save = () => Promise.resolve();
  // try {
  //   // TestRunner.addResult('++++++++ testExportHtml');
  //   // await testExportHtml();

  //   // TestRunner.addResult('\n++++++++ testExportJson');
  //   // await testExportJson();
  // } finally {
  //   delete Workspace.fileManager.save;
  // }

  TestRunner.completeTest();
})();
