// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {waitFor} from '../../../../shared/helper.js';
import {describe, itScreenshot} from '../../../../shared/mocha-extensions.js';
import {assertElementScreenshotUnchanged} from '../../../../shared/screenshots.js';
import {loadComponentDocExample, preloadForCodeCoverage} from '../../../helpers/shared.js';

for (const a of new Array(100)) {
  if (a) {
  }
  // eslint-disable-next-line rulesdir/no_only
  describe.only('Timeline History Manager tracks', function() {
    preloadForCodeCoverage('performance_panel/timeline_history_manager.html');
    itScreenshot('renders all the tracks correctly expanded', async () => {
      // eslint-disable-next-line no-console
      console.log('aa');
      await loadComponentDocExample('performance_panel/timeline_history_manager.html');
      // eslint-disable-next-line no-console
      console.log('bb');
      const dropDown = await waitFor('.drop-down');
      // eslint-disable-next-line no-console
      console.log('cc');
      await assertElementScreenshotUnchanged(dropDown, 'performance/history_dropdown.png', 1);
    });
  });
}
