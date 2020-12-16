// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Root from '../root/root.js';
import * as UI from '../ui/ui.js';

// eslint-disable-next-line rulesdir/es_modules_import
import type * as CSSOverview from './css_overview.js';

import * as i18n from '../i18n/i18n.js';
export const UIStrings = {
  /**
  *@description Label to explain why top values are ignored
  */
  topAppliedToAStatically: 'Top applied to a statically positioned element',
};
const str_ = i18n.i18n.registerUIStrings('css_overview/css_overview-meta.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

let loadedCSSOverviewModule: (typeof CSSOverview|undefined);

async function loadCSSOverviewModule(): Promise<typeof CSSOverview> {
  if (!loadedCSSOverviewModule) {
    // Side-effect import resources in module.json
    await Root.Runtime.Runtime.instance().loadModulePromise('css_overview');
    loadedCSSOverviewModule = await import('./css_overview.js');
  }
  return loadedCSSOverviewModule;
}

UI.ViewManager.registerViewExtension({
  location: UI.ViewManager.ViewLocationValues.PANEL,
  id: 'cssoverview',
  commandPrompt: 'Show CSS Overview',
  title: i18nString(UIStrings.topAppliedToAStatically),
  order: 95,
  async loadView() {
    const CSSOverview = await loadCSSOverviewModule();
    return CSSOverview.CSSOverviewPanel.CSSOverviewPanel.instance();
  },
  experiment: Root.Runtime.ExperimentName.CSS_OVERVIEW,
});
