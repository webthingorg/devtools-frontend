// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {describe, it} from 'mocha';

import {click, closeAllCloseableTabs, getBrowserAndPages, resourcesPath, waitFor} from '../../shared/helper.js';

describe('A user can navigate across', async () => {
  it('Console -> Sources', async () => {
    const {target} = getBrowserAndPages();
    const targetUrl = `${resourcesPath}/cross_tool/default.html`;
    await target.goto(targetUrl);
    await closeAllCloseableTabs();

    await click('#tab-console');
    await waitFor('.console-view');

    const console_message = await waitFor('div.console-group-messages span.source-code');
    await click('span.devtools-link', {root: console_message});

    await waitFor('.panel[aria-label="sources"]');
  });

  it('Console -> Issues', async () => {
    const {target} = getBrowserAndPages();
    const targetUrl = `${resourcesPath}/cross_tool/default.html`;
    await target.goto(targetUrl);
    await closeAllCloseableTabs();
    // Open Console panel
    await click('#tab-console');
    await waitFor('.console-view');

    // Navigate to Issues panel
    await waitFor('.infobar');
    await click('.infobar .infobar-button');
    await waitFor('.issues-pane');

    // Expand the first issue
    await click('li.issue.parent');

    // Expand the affected resources
    await click('li.parent', {root: await waitFor('ol.affected-resources')});
  });

  it('Elements -> Sources', async () => {
    const {target} = getBrowserAndPages();
    const targetUrl = `${resourcesPath}/cross_tool/default.html`;
    await target.goto(targetUrl);
    await closeAllCloseableTabs();

    // Open Elements panel
    await click('#tab-elements');
    await waitFor('.panel[aria-label="elements"]');

    const stylesPane = await waitFor('div.styles-pane');
    await click('div.styles-section-subtitle span.devtools-link', {root: stylesPane});

    await waitFor('.panel[aria-label="sources"]');
  });
});
