// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {goToResource, waitFor} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {assertSelectedElementsNodeTextIncludes} from '../helpers/elements-helpers.js';
import {expandIssue, navigateToIssuesTab, revealNodeInElementsPanel} from '../helpers/issues-helpers.js';


describe('The Issues tab', async () => {
  it('should reveal an element in the Elements panelwhen the node icon is clicked', async () => {
    await goToResource('elements/element-reveal-oopif-inline-issue.html');

    await navigateToIssuesTab();
    await expandIssue();
    await revealNodeInElementsPanel();
    await waitFor('.violating-frame');

    await assertSelectedElementsNodeTextIncludes('alert("This should be blocked by CSP");');
  });
});
