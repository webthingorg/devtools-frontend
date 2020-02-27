// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {performance} from 'perf_hooks';
import {resetPages, storeGeneratedResults} from '../../shared/helper.js';

describe('Boot performance', () => {
  beforeEach(async () => {
    await resetPages();
  });

  it('runs 37 times', async () => {
    const times = [];
    for (let run = 0; run < 37; run++) {
      const start = performance.now();
      await resetPages();
      times.push(performance.now() - start);
    }

    times.sort();
    await storeGeneratedResults('boot-perf.json', JSON.stringify(times));
  }).timeout(90000);  // 90 second timeout just for this item.
});
