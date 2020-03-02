// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {describe, it} from 'mocha';
import {getBrowserAndPages, resetPages, resourcesPath} from '../../shared/helper.js';
import {assertElementScreenshotUnchanged} from '../../shared/screenshot.js';

describe('elements breadcrumbs', () => {
  beforeEach(async () => {
    await resetPages();
  });

  it('renders the breadcrumbs as expected', async () => {
    const {target} = getBrowserAndPages();
    await target.goto(`${resourcesPath}/elements/breadcrumbs.html`);
    const breadcrumbs = await target.$('#test-1 devtools-elements-breadcrumbs');

    await assertElementScreenshotUnchanged(breadcrumbs, 'elements-breadcrumbs-1.png');
  });
});
