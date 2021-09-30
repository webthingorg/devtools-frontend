// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assertNotNullOrUndefined, enableExperiment, goTo, goToResource} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import * as puppeteer from 'puppeteer';
import {getTestRunnerConfigSetting} from '../../conductor/test_runner_config.js';
import {ensureResourceSectionIsExpanded, expandIssue, getIssueByTitle, getResourcesElement, navigateToIssuesTab, waitForTableFromResourceSectionContents} from '../helpers/issues-helpers.js';

describe('Cross-origin portal post message issue', async () => {
  beforeEach(async () => {
    //await goTo('https://charmed-chartreuse-august.glitch.me/');
    await goToResource('issues/cross-origin-portal-post.html');
  });






  it.only('should display correct information', async () => {
   // await goToResource('issues/cross-origin-portal-post.html');
    await navigateToIssuesTab();
    // const {frontend} = getBrowserAndPages();
    // frontend.evaluate(() => {
    //   const issue = {
    //     'code': 'GenericIssue',
    //     'details': {
    //       'genericIssueDetails': {
    //         'errorType': 'CrossOriginPortalPostMessageError',
    //         'frameId': '123456',
    //       },
    //     },
    //   };
    //   // @ts-ignore
    //   window.addIssueForTest(issue);
    // });
    await expandIssue();
    const issueElement = await getIssueByTitle('Cross-origin portal post message blocked');
    assertNotNullOrUndefined(issueElement);
  });
});
