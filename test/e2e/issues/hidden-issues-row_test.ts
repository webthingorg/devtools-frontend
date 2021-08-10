// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';

import {$$, assertNotNullOrUndefined, enableExperiment, goToResource} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {getHiddenIssuesRow, getHiddenIssuesRowBody, getHideIssuesMenu, getHideIssuesMenuItem, getIssueHeaderByTitle, ISSUE, navigateToIssuesTab} from '../helpers/issues-helpers.js';

// eslint-disable-next-line mocha/no-exclusive-tests
describe.only('Hide issues row', async () => {
  it('should be visible after hiding an issue', async () => {
    await enableExperiment('hideIssuesFeature');
    await goToResource('issues/sab-issue.rawresponse');
    await navigateToIssuesTab();

    const issueTitle = 'SharedArrayBuffer usage is restricted to cross-origin isolated sites';
    const issueHeader = await getIssueHeaderByTitle(issueTitle);
    assertNotNullOrUndefined(issueHeader);
    await issueHeader.hover();
    const hideIssuesMenuBtn = await getHideIssuesMenu();
    await hideIssuesMenuBtn.click();
    const menuItem = await getHideIssuesMenuItem();
    assertNotNullOrUndefined(menuItem);
    const issue = await $$(ISSUE);
    assert.isNotEmpty(issue);
    await menuItem.click();
    const hiddenIssuesRow = await getHiddenIssuesRow();
    assertNotNullOrUndefined(hiddenIssuesRow);
  });
  it('should expand after clicking', async () => {
    await enableExperiment('hideIssuesFeature');
    await goToResource('issues/sab-issue.rawresponse');
    await navigateToIssuesTab();

    const issueTitle = 'SharedArrayBuffer usage is restricted to cross-origin isolated sites';
    const issueHeader = await getIssueHeaderByTitle(issueTitle);
    assertNotNullOrUndefined(issueHeader);
    await issueHeader.hover();
    const hideIssuesMenuBtn = await getHideIssuesMenu();
    await hideIssuesMenuBtn.click();
    const menuItem = await getHideIssuesMenuItem();
    assertNotNullOrUndefined(menuItem);
    const issue = await $$(ISSUE);
    assert.isNotEmpty(issue);
    await menuItem.click();
    const hiddenIssuesRow = await getHiddenIssuesRow();
    assertNotNullOrUndefined(hiddenIssuesRow);
    await hiddenIssuesRow.click();
    const hiddenIssuesRowBody = await getHiddenIssuesRowBody();
    assertNotNullOrUndefined(hiddenIssuesRowBody);
    const classes = await hiddenIssuesRow.evaluate(node => node.classList.toString());
    assert.include(classes, 'expanded');
  });

  it('should contain issue after clicking', async () => {
    await enableExperiment('hideIssuesFeature');
    await goToResource('issues/sab-issue.rawresponse');
    await navigateToIssuesTab();

    const issueTitle = 'SharedArrayBuffer usage is restricted to cross-origin isolated sites';
    const issueHeader = await getIssueHeaderByTitle(issueTitle);
    assertNotNullOrUndefined(issueHeader);
    await issueHeader.hover();
    const hideIssuesMenuBtn = await getHideIssuesMenu();
    await hideIssuesMenuBtn.click();
    const menuItem = await getHideIssuesMenuItem();
    assertNotNullOrUndefined(menuItem);
    const issue = await $$(ISSUE);
    assert.isNotEmpty(issue);
    await menuItem.click();
    const hiddenIssuesRow = await getHiddenIssuesRow();
    assertNotNullOrUndefined(hiddenIssuesRow);
    await hiddenIssuesRow.click();
    const hiddenIssuesRowBody = await getHiddenIssuesRowBody();
    assertNotNullOrUndefined(hiddenIssuesRowBody);
    const firstChild = await hiddenIssuesRowBody.$eval('.hidden-issue', node => node.classList.toString());
    assertNotNullOrUndefined(firstChild);
    assert.include(firstChild, 'hidden-issue');
  });
});
