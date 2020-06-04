// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {closeAllCloseableTabs, goToResource} from '../../shared/helper.js';

export async function prepareForCrossToolScenario() {
  await navigateToCrossToolIntegrationSite();
  await closeAllCloseableTabs();
}

export async function navigateToCrossToolIntegrationSite() {
  await goToResource('cross_tool/default.html');
}
