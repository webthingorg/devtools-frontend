// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {describe, it} from 'mocha';

import {click, getBrowserAndPages, resourcesPath, waitFor} from '../../shared/helper.js';

describe('The Memory Panel', async () => {
  it('Loads content', async () => {
    const {target} = getBrowserAndPages();
    const targetUrl = `${resourcesPath}/memory/default.html`;
    await target.goto(targetUrl);

    await click('#tab-heap_profiler');
    await waitFor('[aria-label="heap_profiler"]');
  });

  it('Can take several heap snapshots ', async () => {
    const {target} = getBrowserAndPages();
    const targetUrl = `${resourcesPath}/memory/default.html`;
    await target.goto(targetUrl);

    await click('#tab-heap_profiler');
    await waitFor('[aria-label="heap_profiler"]');

    const new_snapshot_button = 'button[aria-label="Take heap snapshot"]';
    await click(new_snapshot_button);

    await waitFor('.profiles-toolbar');
    await waitFor('#profile-views');

    await click(new_snapshot_button);
  });
});
