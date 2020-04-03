// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {$, $textContent, click, getBrowserAndPages, resourcesPath, waitFor, waitForElementWithTextContent} from '../../shared/helper.js';

export async function navigateToMemoryTab({targetToInspect}: {targetToInspect: string}) {
  const {target} = getBrowserAndPages();
  await target.goto(`${resourcesPath}/memory/${targetToInspect}`);
  await click('[aria-label="Memory"]');

  // Make sure the memory tab is shown on the screen
  await waitFor('.profile-launcher-view-content');
}

export async function selectAllocationInstrumentationOption() {
  await click(await $textContent('Allocation instrumentation on timeline'));
}

export async function startAllocationInstrumentation() {
  await click(await $textContent('Start'));

  await waitFor('.heap-snapshot-view');
}

export async function finishHeapsnapshotRecording() {
  await click('[aria-label="Stop recording heap profile"]');

  await waitForElementWithTextContent('Save');
}

export async function selectAllocationViewOnHeapsnapshot() {
  const {frontend} = await getBrowserAndPages();
  const dropdown = await $('select[aria-label="Perspective"]');
  await click(dropdown);

  // We can't click on an option in a select, as that is on the browser level
  await frontend.keyboard.press('ArrowDown');
  await frontend.keyboard.press('ArrowDown');
  await frontend.keyboard.press('Enter');
}
