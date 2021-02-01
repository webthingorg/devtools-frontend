// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {enableExperiment, goToResource} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {assertIssueTitle, expandIssue, navigateToIssuesTab} from '../helpers/issues-helpers.js';

describe('Low contrast issues', async () => {
  it('should report low contrast issues', async () => {
    await enableExperiment('contrastIssues');
    await goToResource('elements/low-contrast.html');
    await navigateToIssuesTab();
    await expandIssue();
    await assertIssueTitle('TODO');
  });
});
