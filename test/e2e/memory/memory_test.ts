// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {describe, it} from 'mocha';

import {getBrowserAndPages} from '../../shared/helper.js';
import {navigateToMemoryTab, takeHeapSnapshot} from '../helpers/memory-helpers.js';

describe('The Memory Panel', async () => {
  it('Loads content', async () => {
    const {target} = getBrowserAndPages();
    navigateToMemoryTab(target);
  });

  it('Can take several heap snapshots ', async () => {
    const {target} = getBrowserAndPages();
    navigateToMemoryTab(target);
    takeHeapSnapshot();
    takeHeapSnapshot();
  });
});
