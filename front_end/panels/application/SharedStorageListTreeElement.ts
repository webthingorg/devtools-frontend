// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../core/common/common.js';
import type * as Platform from '../../core/platform/platform.js';

import {ApplicationPanelTreeElement} from './ApplicationPanelTreeElement.js';
import {type ResourcesPanel} from './ResourcesPanel.js';
import {SharedStorageEventsView} from './SharedStorageEventsView.js';

export class SharedStorageListTreeElement extends ApplicationPanelTreeElement {
  private readonly expandedSetting: Common.Settings.Setting<boolean>;
  private readonly categoryName: string;
  private categoryLink: Platform.DevToolsPath.UrlString|null;
  private view: SharedStorageEventsView;

  constructor(resourcesPanel: ResourcesPanel, categoryName: string, settingsKey: string, settingsDefault = false) {
    super(resourcesPanel, categoryName, false);
    this.expandedSetting =
        Common.Settings.Settings.instance().createSetting('resources' + settingsKey + 'Expanded', settingsDefault);
    this.categoryName = categoryName;
    this.categoryLink = null;
    this.view = new SharedStorageEventsView();
  }

  get itemURL(): Platform.DevToolsPath.UrlString {
    return 'category://' + this.categoryName as Platform.DevToolsPath.UrlString;
  }

  setLink(link: Platform.DevToolsPath.UrlString): void {
    this.categoryLink = link;
  }

  onselect(selectedByUser: boolean|undefined): boolean {
    super.onselect(selectedByUser);
    this.resourcesPanel.showView(this.view);
    return false;
  }

  onattach(): void {
    super.onattach();
    if (this.expandedSetting.get()) {
      this.expand();
    }
  }

  onexpand(): void {
    this.expandedSetting.set(true);
  }

  oncollapse(): void {
    this.expandedSetting.set(false);
  }
}
