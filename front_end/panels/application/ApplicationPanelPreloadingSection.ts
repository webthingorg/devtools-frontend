// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as i18n from '../../core/i18n/i18n.js';
import type * as Platform from '../../core/platform/platform.js';
import * as UI from '../../ui/legacy/legacy.js';
// import * as Host from '../../core/host/host.js';

import {ExpandableApplicationPanelTreeElement} from './ApplicationPanelTreeElement.js';
import {type ResourcesPanel} from './ResourcesPanel.js';

import {type PreloadingModel} from './PreloadingModel.js';
import {PreloadingView} from './PreloadingView.js';

const UIStrings = {
  /**
  *@description Text in Application Panel Sidebar of the Application panel
  */
  preloading: 'Preloading',
};
const str_ = i18n.i18n.registerUIStrings('panels/application/ApplicationPanelPreloadingSection.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);
export class PreloadingTreeElement extends ExpandableApplicationPanelTreeElement {
  private model?: PreloadingModel;
  private view?: PreloadingView;

  constructor(resourcesPanel: ResourcesPanel) {
    super(resourcesPanel, i18nString(UIStrings.preloading), 'Preloading');

    // FIXME
    const icon = UI.Icon.Icon.create('mediumicon-database', 'resource-tree-item');
    // FIXME
    this.setLink(
        'https://developer.chrome.com/docs/devtools/storage/cache/?utm_source=devtools' as
        Platform.DevToolsPath.UrlString);
    this.setLeadingIcons([icon]);
  }

  initialize(model: PreloadingModel): void {
    this.model = model;
  }

  onselect(selectedByUser?: boolean): boolean {
    super.onselect(selectedByUser);

    if (!this.model) {
      return false;
    }

    if (!this.view) {
      this.view = new PreloadingView(this.model);
    }

    this.showView(this.view);
    // Host.userMetrics.panelShown(Host.UserMetrics.PanelCodes[Host.UserMetrics.PanelCodes.preloading]);
    return false;
  }
}
