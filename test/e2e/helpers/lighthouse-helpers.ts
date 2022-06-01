// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {click, goToResource, waitFor} from '../../shared/helper.js';




export async function lighthousePanelContentIsLoaded() {
  await waitFor('.view-container[aria-label="Lighthouse panel"]');
}

export async function navigateToLighthouseTab(path?:string) {
  await click('#tab-lighthouse');
  await lighthousePanelContentIsLoaded();
}


// export async function navigateToLighthouseTab() {
//   await click('#tab-lighthouse');
//   await waitFor('[aria-label="layers"]');

//   // Make sure the lighthouse start view is shown
//   await waitFor('.lighthouse-start-view-fr');
// }

export async function isGenerateReportButtonDisabled() {
  const button = await waitFor('.lighthouse-start-view .primary-button');
  return button.evaluate(element => (element as HTMLButtonElement).disabled);
}
