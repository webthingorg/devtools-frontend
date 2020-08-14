// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {describe, it} from 'mocha';

import {goToResource, waitFor} from '../../shared/helper.js';
import {assertContentOfSelectedElementsNode} from '../helpers/elements-helpers.js';
import {expandIssue, navigateToIssuesTab, revealNodeInElementsPanel} from '../helpers/issues-helpers.js';


describe('The Issues tab to Elements panel', async () => {
  it('should reveal an element in the Elements tab, when clicked on node icon', async () => {
    await goToResource('elements/element-reveal-oopf-inline-issue.html');

    await navigateToIssuesTab();
    await expandIssue();
    await revealNodeInElementsPanel();

    await waitFor('.selection .fill');
    assertContentOfSelectedElementsNode('<script>\u200Balert("This should be blocked by CSP");\u200B</script>\u200B');
  });
});
