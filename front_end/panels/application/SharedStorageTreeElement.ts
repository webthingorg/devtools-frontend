// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as Platform from '../../core/platform/platform.js';

import {ApplicationPanelTreeElement} from './ApplicationPanelTreeElement.js';
import {type ResourcesPanel} from './ResourcesPanel.js';
import {SharedStorageItemsView} from './SharedStorageItemsView.js';
import {type SharedStorageForOrigin} from './SharedStorageModel.js';

export class SharedStorageTreeElement extends ApplicationPanelTreeElement {
  #view: SharedStorageItemsView;

  constructor(resourcesPanel: ResourcesPanel, sharedStorage: SharedStorageForOrigin) {
    super(resourcesPanel, sharedStorage.securityOrigin, false);
    this.#view = new SharedStorageItemsView(sharedStorage);
  }

  get itemURL(): Platform.DevToolsPath.UrlString {
    return 'shared-storage://' as Platform.DevToolsPath.UrlString;
  }

  onselect(selectedByUser: boolean|undefined): boolean {
    super.onselect(selectedByUser);
    this.resourcesPanel.showView(this.#view);
    return false;
  }
}
