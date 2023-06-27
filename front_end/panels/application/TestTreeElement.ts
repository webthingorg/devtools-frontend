// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as i18n from '../../core/i18n/i18n.js';
import type * as Platform from '../../core/platform/platform.js';
import type * as SDK from '../../core/sdk/sdk.js';
import * as UI from '../../ui/legacy/legacy.js';
import type * as Protocol from '../../generated/protocol.js';

import {ExpandableApplicationPanelTreeElement} from './ApplicationPanelTreeElement.js';
import {type ResourcesPanel} from './ResourcesPanel.js';
import type * as ProtocolProxyApi from '../../generated/protocol-proxy-api.js';

const UIStrings = {
  /**
   *@description Text in Application Panel Sidebar of the Application panel
   */
  opfs: 'OPFS',
  /**
   *@description Text in Application Panel Sidebar of the Application panel
   */
  populateListWithMockData: 'Populate List',
};

const str_ = i18n.i18n.registerUIStrings('panels/application/TestTreeElement.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

export class TestTreeElement extends ExpandableApplicationPanelTreeElement {
  private agent?: ProtocolProxyApi.OriginPrivateFileSystemApi;
  constructor(resourcesPanel: ResourcesPanel) {
    super(resourcesPanel, i18nString(UIStrings.opfs), 'Origin Private File System');
    const databaseIcon = UI.Icon.Icon.create('database', 'resource-tree-item');
    const folder = new ExpandableApplicationPanelTreeElement(resourcesPanel, i18nString(UIStrings.opfs), 'Folder');
    folder.setLink('https://web.dev/origin-private-file-system/' as Platform.DevToolsPath.UrlString);
    this.setLeadingIcons([databaseIcon]);
    this.appendChild(folder);
  }

  initialize(target: SDK.Target.Target): void {
    this.agent = target.originPrivateFileSystemAgent();
    const params: Protocol.OriginPrivateFileSystem.PopulateListWithMockDataRequest = {storageKey: 'abc.com'};
    void this.agent.invoke_populateListWithMockData(params);
  }

  override onattach(): void {
    super.onattach();
    this.listItemElement.addEventListener('contextmenu', this.handleContextMenuEvent.bind(this), true);
  }

  private handleContextMenuEvent(event: MouseEvent): void {
    const contextMenu = new UI.ContextMenu.ContextMenu(event);
    contextMenu.defaultSection().appendItem(
        i18nString(UIStrings.populateListWithMockData), this.populateListWithMockData.bind(this));
    void contextMenu.show();
  }

  private populateListWithMockData(): void {
    return;
  }
}
