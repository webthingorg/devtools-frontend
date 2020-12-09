// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';

import {$$, click, goToResource, waitFor, waitForFunction} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {openSourcesPanel} from '../helpers/sources-helpers.js';

describe('Display error information next to affected lines', async () => {
  beforeEach(async () => {
    await goToResource('network/trusted-type-violations-report-only.rawresponse');
    await openSourcesPanel();
    const element = await waitFor('[aria-label="trusted-type-violations-report-only.rawresponse, file"]');
    element.click();
  });

  it('Error icon should be displayed', async () => {
    const issueIconComponents = await waitForFunction(async () => {
      const icons = await $$('devtools-icon.text-editor-line-decoration-icon-error');
      return icons.length === 1 ? icons : undefined;
    });
    const messages: string[] = [];
    const expectedMessages = [
      '[Report Only] Refused to create a TrustedTypePolicy named \'policy2\' because it violates the following Content Security Policy directive: "trusted-types policy1".',
      '[Report Only] This document requires \'TrustedHTML\' assignment.',
    ];
    for (const issueIconComponent of issueIconComponents) {
      await click(issueIconComponent);
      const vbox = await waitFor('div.vbox.flex-auto.no-pointer-events');  // await waitFor('.vbox');
      const rowMessages = await $$('.text-editor-row-message', vbox);

      for (const rowMessage of rowMessages) {
        const messageText = await rowMessage.evaluate(x => (x instanceof HTMLElement) ? x.innerText : '');
        messages.push(messageText);
      }
    }
    assert.deepEqual(messages, expectedMessages);
  });
  it('Errors icon should be correct', async () => {
    const issueIconComponents = await waitForFunction(async () => {
      const icons = await $$('devtools-icon.text-editor-line-decoration-icon-error');
      return icons.length === 1 ? icons : undefined;
    });
    for (const issueIconComponent of issueIconComponents) {
      const issueIcon = await waitFor('.icon-basic', issueIconComponent);
      const imageSrc = await issueIcon.evaluate(x => window.getComputedStyle(x).backgroundImage);
      const splitImageSrc = imageSrc.substring(5, imageSrc.length - 2).split('/');
      const imageFile = splitImageSrc[splitImageSrc.length - 1];
      assert.strictEqual(imageFile, 'error_icon.svg');
    }
  });
  it('Issues icon should reveal Issues Tab', async () => {
    const issueIconComponents = await waitForFunction(async () => {
      const icons = await $$('devtools-icon.text-editor-line-decoration-icon-issue');
      return icons.length === 1 ? icons : undefined;
    });
    const issueIconComponent = issueIconComponents[0];
    await click(issueIconComponent);

    const vbox = await waitFor('div.vbox.flex-auto.no-pointer-events');
    const rowMessage = await waitFor('.text-editor-row-message', vbox);
    const issueTitle = await rowMessage.evaluate(x => (x instanceof HTMLElement) ? x.innerText : '');
    const issueIcon = await waitFor('.text-editor-row-message-icon', rowMessage);
    issueIcon.click();

    const expandedIssues = new Set();
    await waitFor('.issue');
    const issues = await $$('.issue');
    for (const issue of issues) {
      const expanded = await issue.evaluate(x => x.classList.contains('expanded'));
      if (expanded) {
        const titleHandler = await waitFor('.title', issue);
        const title = await titleHandler.evaluate(x => (x instanceof HTMLElement) ? x.innerText : '');
        expandedIssues.add(title);
      }
    }
    assert.isTrue(expandedIssues.has(issueTitle));
  });
});
