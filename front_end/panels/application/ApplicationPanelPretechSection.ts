// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as i18n from '../../core/i18n/i18n.js';
import type * as Platform from '../../core/platform/platform.js';
import * as UI from '../../ui/legacy/legacy.js';
import type * as SDK from '../../core/sdk/sdk.js';

import {ExpandableApplicationPanelTreeElement} from './ApplicationPanelTreeElement.js';
import {type ResourcesPanel} from './ResourcesPanel.js';

import {PretechView} from './pretech/PretechView.js';

const UIStrings = {
  /**
  *@description Text in Application Panel Sidebar of the Application panel
  */
  preloadingAndPrerendering: 'Preloading & Prerendering',
};
const str_ = i18n.i18n.registerUIStrings('panels/application/ApplicationPanelPretechSection.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

export class PretechTreeElement extends ExpandableApplicationPanelTreeElement {
  private model?: SDK.PrerenderingModel.PrerenderingModel;
  private view?: PretechView;

  constructor(resourcesPanel: ResourcesPanel) {
    super(resourcesPanel, i18nString(UIStrings.preloadingAndPrerendering), 'Preloading & Prerendering');

    const icon = UI.Icon.Icon.create('mediumicon-fetch', 'resource-tree-item');
    // FIXME
    this.setLink(
        'https://developer.chrome.com/docs/devtools/storage/cache/?utm_source=devtools' as
        Platform.DevToolsPath.UrlString);
    this.setLeadingIcons([icon]);
  }

  initialize(model: SDK.PrerenderingModel.PrerenderingModel): void {
    this.model = model;
  }

  onselect(selectedByUser?: boolean): boolean {
    super.onselect(selectedByUser);

    if (!this.model) {
      return false;
    }

    if (!this.view) {
      this.view = new PretechView(this.model);
    }

    this.showView(this.view);
    // Host.userMetrics.panelShown(Host.UserMetrics.PanelCodes[Host.UserMetrics.PanelCodes.pretech]);
    return false;
  }
}
