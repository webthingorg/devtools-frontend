// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {click, getBrowserAndPages, goToResource, waitFor} from '../../shared/helper.js';

import type {BrowserAndPages} from '../../conductor/puppeteer-state.js';

export async function lighthousePanelContentIsLoaded() {
  await waitFor('.view-container[aria-label="Lighthouse panel"]');
}

export async function navigateToLighthouseTab(path?: string): Promise<BrowserAndPages> {
  await click('#tab-lighthouse');
  await lighthousePanelContentIsLoaded();
  if (path) {
    await goToResource(path);
  }

  return getBrowserAndPages();
}

export async function isGenerateReportButtonDisabled() {
  const button = await waitFor('.lighthouse-start-view .primary-button');
  return button.evaluate(element => (element as HTMLButtonElement).disabled);
}
