// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as i18n from '../../core/i18n/i18n.js';

import type * as Platform from '../../core/platform/platform.js';
import * as UI from '../../ui/legacy/legacy.js';

import {ApplicationPanelTreeElement} from './ApplicationPanelTreeElement.js';
import {type ResourcesPanel} from './ResourcesPanel.js';
import {SharedStorageItemsView} from './SharedStorageItemsView.js';
import {type SharedStorage} from './components/SharedStorageModel.js';

const UIStrings = {
  /**
  *@description Text to clear content
  */
  clear: 'Clear',
};
const str_ = i18n.i18n.registerUIStrings('panels/application/SharedStorageTreeElement.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

export class SharedStorageTreeElement extends ApplicationPanelTreeElement {
  private view: SharedStorageItemsView;
  private sharedStorage: SharedStorage;

  constructor(resourcesPanel: ResourcesPanel, sharedStorage: SharedStorage) {
    super(resourcesPanel, sharedStorage.securityOrigin, false);
    this.view = new SharedStorageItemsView(sharedStorage);
    this.sharedStorage = sharedStorage;
  }

  get itemURL(): Platform.DevToolsPath.UrlString {
    return 'shared-storage://' as Platform.DevToolsPath.UrlString;
  }

  onselect(selectedByUser: boolean|undefined): boolean {
    super.onselect(selectedByUser);
    this.resourcesPanel.showView(this.view);
    return false;
  }

  onattach(): void {
    super.onattach();
    this.listItemElement.addEventListener('contextmenu', this.handleContextMenuEvent.bind(this), true);
  }

  private handleContextMenuEvent(event: MouseEvent): void {
    const contextMenu = new UI.ContextMenu.ContextMenu(event);
    contextMenu.defaultSection().appendItem(i18nString(UIStrings.clear), () => this.sharedStorage.clear());
    void contextMenu.show();
  }
}
