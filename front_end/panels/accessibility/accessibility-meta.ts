// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as i18n from '../../core/i18n/i18n.js';
import * as UI from '../../ui/legacy/legacy.js';

import type * as Accessibility from './accessibility.js';

const UIStrings = {
  /**
   * @description Text for accessibility of the web page
   */
  accessibility: 'Accessibility',
  /**
   * @description Command for showing the 'Accessibility' tool
   */
  shoAccessibility: 'Show Accessibility',
};
const str_ = i18n.i18n.registerUIStrings('panels/accessibility/accessibility-meta.ts', UIStrings);
const i18nLazyString = i18n.i18n.getLazilyComputedLocalizedString.bind(undefined, str_);

function loadAccessibilityModule(): Promise<typeof Accessibility> {
  return import('./accessibility.js');
}

UI.ViewManager.registerViewExtension({
  location: UI.ViewManager.ViewLocationValues.ELEMENTS_SIDEBAR,
  id: 'accessibility.view',
  title: i18nLazyString(UIStrings.accessibility),
  commandPrompt: i18nLazyString(UIStrings.shoAccessibility),
  order: 10,
  persistence: UI.ViewManager.ViewPersistence.PERMANENT,
  async loadView() {
    const Accessibility = await loadAccessibilityModule();
    return new Accessibility.AccessibilitySidebarView.AccessibilitySidebarView();
  },
});
