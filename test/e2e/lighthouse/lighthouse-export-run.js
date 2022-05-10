// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';

import {goToResource} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {getPanel, navigateToLighthouseTab} from '../helpers/lighthouse-helpers.js';

describe('The Lighthouse Tab', async () => {
  it('exporting works.', async () => {
    await navigateToLighthouseTab('resources/lighthouse-basic.html');

    LighthouseTestRunner.getRunButton().click();
    await LighthouseTestRunner.waitForResults();

    const resultsElement = LighthouseTestRunner.getResultsElement();
    const toolsMenu = resultsElement.querySelector('.lh-tools__dropdown');

    function waitForSave() {
      return new Promise(resolve => {
        TestRunner.addSniffer(Workspace.FileManager.prototype, 'save', (filename, content) => resolve(content));
      });
    }

    async function testExportHtml() {
      const reportHtmlPromise = waitForSave();
      toolsMenu.querySelector('a[data-action="save-html"').click();
      const reportHtml = await reportHtmlPromise;

      let auditElements = resultsElement.querySelectorAll('.lh-audit');
      TestRunner.addResult(`\n# of .lh-audit divs (original): ${auditElements.length}`);

      const exportedReportIframe = resultsElement.ownerDocument.createElement('iframe');
      exportedReportIframe.srcdoc = reportHtml;
      resultsElement.parentElement.append(exportedReportIframe);
      await new Promise(resolve => exportedReportIframe.addEventListener('load', resolve));

      auditElements = exportedReportIframe.contentDocument.querySelectorAll('.lh-audit');
      TestRunner.addResult(`\n# of .lh-audit divs (exported html): ${auditElements.length}`);
    }

    async function testExportJson() {
      const reportJsonPromise = waitForSave();
      toolsMenu.querySelector('a[data-action="save-json"').click();
      const reportJson = await reportJsonPromise;
      const lhr = JSON.parse(reportJson);
      TestRunner.addResult(`\n# of audits (json): ${Object.keys(lhr.audits).length}`);
    }

    TestRunner.addResult('++++++++ testExportHtml');
    await testExportHtml();

    TestRunner.addResult('\n++++++++ testExportJson');
    await testExportJson();

    TestRunner.completeTest();
  });
});
