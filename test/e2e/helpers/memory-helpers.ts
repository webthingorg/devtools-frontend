// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as puppeteer from 'puppeteer';

import {click, resourcesPath, waitFor} from '../../shared/helper.js';

const NEW_HEAP_SNAPSHOT_BUTTON = 'button[aria-label="Take heap snapshot"]';

export async function navigateToMemoryTab(target: puppeteer.Page) {
  const targetUrl = `${resourcesPath}/memory/default.html`;
  await target.goto(targetUrl);
  await click('#tab-heap_profiler');
  await waitFor('[aria-label="heap_profiler"]');
}

export async function takeHeapSnapshot() {
  await click(NEW_HEAP_SNAPSHOT_BUTTON);
  await waitFor('.profiles-toolbar');
  await waitFor('#profile-views');
}
