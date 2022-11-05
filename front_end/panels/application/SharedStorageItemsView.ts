// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/*
 * Copyright (C) 2008 Nokia Inc.  All rights reserved.
 * Copyright (C) 2013 Samsung Electronics. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import * as Common from '../../core/common/common.js';
import * as i18n from '../../core/i18n/i18n.js';
import type * as Protocol from '../../generated/protocol.js';
import * as TextUtils from '../../models/text_utils/text_utils.js';
import * as DataGrid from '../../ui/legacy/components/data_grid/data_grid.js';
import type * as Platform from '../../core/platform/platform.js';
import * as SourceFrame from '../../ui/legacy/components/source_frame/source_frame.js';
import * as UI from '../../ui/legacy/legacy.js';
import * as ApplicationComponents from './components/components.js';

import {SharedStorage} from './SharedStorageModel.js';
import {StorageItemsView} from './StorageItemsView.js';

const UIStrings = {
  /**
  *@description Text in SharedStorage Items View of the Application panel
  */
  sharedStorage: 'Shared Storage',
  /**
  *@description Text in SharedStorage Items View of the Application panel
  */
  key: 'Key',
  /**
  *@description Text for the value of something
  */
  value: 'Value',
  /**
  *@description Name for the "Shared Storage Items" table that shows the content of the Shared Storage.
  */
  sharedStorageItems: 'Shared Storage Items',
  /**
   *@description Text for announcing that the "Shared Storage Items" table was cleared, that is, all
   * entries were deleted.
   */
  sharedStorageItemsCleared: 'Shared Storage items cleared',
  /**
   *@description Text for announcing that the filtered "Shared Storage Items" table was cleared, that is,
   * all filtered entries were deleted.
   */
  sharedStorageFilteredItemsCleared: 'Shared Storage filtered items cleared',
  /**
  *@description Text in SharedStorage Items View of the Application panel
  */
  selectAValueToPreview: 'Select a value to preview',
  /**
   *@description Text for announcing a Shared Storage key/value item has been deleted
   */
  sharedStorageItemDeleted: 'The storage item was deleted.',
  /**
   *@description Text for announcing number of entries after filtering
   *@example {5} PH1
   */
  sharedStorageNumberEntries: 'Number of entries shown in table: {PH1}',
};
const str_ = i18n.i18n.registerUIStrings('panels/application/SharedStorageItemsView.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);
export class SharedStorageItemsView extends StorageItemsView {
  private sharedStorage: SharedStorage;
  private metadataView: ApplicationComponents.SharedStorageMetadataView.SharedStorageMetadataView;
  private dataGrid: DataGrid.DataGrid.DataGridImpl<unknown>;
  private readonly outerSplitWidget: UI.SplitWidget.SplitWidget;
  private readonly previewPanel: UI.Widget.VBox;
  private preview: UI.Widget.Widget|null;
  private previewValue: string|null;
  private eventListeners: Common.EventTarget.EventDescriptor[];

  constructor(sharedStorage: SharedStorage) {
    super(i18nString(UIStrings.sharedStorage), 'sharedStoragePanel');

    this.sharedStorage = sharedStorage;

    this.element.classList.add('storage-view', 'table');

    const columns = ([
      {id: 'key', title: i18nString(UIStrings.key), sortable: false, editable: false, longText: true, weight: 50},
      {id: 'value', title: i18nString(UIStrings.value), sortable: false, editable: false, longText: true, weight: 50},
    ] as DataGrid.DataGrid.ColumnDescriptor[]);
    this.dataGrid = new DataGrid.DataGrid.DataGridImpl({
      displayName: i18nString(UIStrings.sharedStorageItems),
      columns,
      editCallback: undefined,
      deleteCallback: this.deleteCallback.bind(this),
      refreshCallback: this.refreshItems.bind(this),
    });
    this.dataGrid.addEventListener(DataGrid.DataGrid.Events.SelectedNode, event => {
      void this.previewEntry(event.data);
    });
    this.dataGrid.addEventListener(DataGrid.DataGrid.Events.DeselectedNode, () => {
      void this.previewEntry(null);
    });
    this.dataGrid.setStriped(true);
    this.dataGrid.setName('SharedStorageItemsView');

    this.outerSplitWidget = new UI.SplitWidget.SplitWidget(
        /* isVertical: */ false, /* secondIsSidebar: */ true, 'sharedStorageSplitViewState');
    this.outerSplitWidget.show(this.element);

    this.previewPanel = new UI.Widget.VBox();
    this.previewPanel.setMinimumSize(0, 50);
    const outerResizer = this.previewPanel.element.createChild('div', 'preview-panel-resizer');

    const dataGridWidget = this.dataGrid.asWidget();
    dataGridWidget.setMinimumSize(0, 50);

    this.metadataView = new ApplicationComponents.SharedStorageMetadataView.SharedStorageMetadataView(
        sharedStorage, sharedStorage.securityOrigin);
    this.metadataView.setMinimumSize(0, 150);
    const innerResizer = this.metadataView.element.createChild('div', 'metadata-view-resizer');

    const topPanel = new UI.SplitWidget.SplitWidget(
        /* isVertical: */ false, /* secondIsSidebar: */ false, 'sharedStorageSplitViewState');
    topPanel.setSidebarWidget(this.metadataView);
    topPanel.setMainWidget(dataGridWidget);
    topPanel.installResizer(innerResizer);

    this.outerSplitWidget.setMainWidget(topPanel);
    this.outerSplitWidget.setSidebarWidget(this.previewPanel);
    this.outerSplitWidget.installResizer(outerResizer);

    this.preview = null;
    this.previewValue = null;

    this.showPreview(null, null);

    this.eventListeners = [];
    void this.setStorage(sharedStorage);
  }

  async setStorage(sharedStorage: SharedStorage): Promise<void> {
    Common.EventTarget.removeEventListeners(this.eventListeners);
    this.sharedStorage = sharedStorage;
    this.eventListeners = [
      this.sharedStorage.addEventListener(SharedStorage.Events.SharedStorageChanged, this.sharedStorageChanged, this),
    ];
    await this.refreshItems();
  }

  private async sharedStorageChanged(
      event: Common.EventTarget.EventTargetEvent<SharedStorage.SharedStorageChangedEvent>): Promise<void> {
    if (!this.isShowing() || !this.dataGrid) {
      return;
    }
    void event;
    await this.refreshItems();
  }

  async refreshItems(): Promise<void> {
    await this.metadataView.doUpdate();
    await this.sharedStorage.getEntries().then(entries => entries && this.showSharedStorageItems(entries));
  }

  async deleteSelectedItem(): Promise<void> {
    if (!this.dataGrid || !this.dataGrid.selectedNode) {
      return;
    }

    await this.deleteCallback(this.dataGrid.selectedNode);
  }

  async deleteAllItems(): Promise<void> {
    if (!this.hasFilter()) {
      await this.sharedStorage.clear();
      await this.sharedStorageItemsCleared();
      UI.ARIAUtils.alert(i18nString(UIStrings.sharedStorageItemsCleared));
      return;
    }

    for (const node of this.dataGrid.rootNode().children) {
      if (node.data.key) {
        await this.sharedStorage.deleteEntry(node.data.key);
      }
    }

    await this.sharedStorageItemsCleared();
    UI.ARIAUtils.alert(i18nString(UIStrings.sharedStorageFilteredItemsCleared));
  }

  private showSharedStorageItems(items: Protocol.Storage.SharedStorageEntry[]): void {
    const rootNode = this.dataGrid.rootNode();
    let selectedKey: null = null;
    for (const node of rootNode.children) {
      if (!node.selected) {
        continue;
      }
      selectedKey = node.data.key;
      break;
    }
    rootNode.removeChildren();
    let selectedNode: DataGrid.DataGrid.DataGridNode<unknown>|null = null;
    const filteredItems = (item: Protocol.Storage.SharedStorageEntry): string => `${item.key} ${item.value}`;
    const filteredList = this.filter(items, filteredItems);
    for (const item of filteredList) {
      const node = new DataGrid.DataGrid.DataGridNode({key: item.key, value: item.value}, false);
      node.selectable = true;
      rootNode.appendChild(node);
      if (!selectedNode || item.key === selectedKey) {
        selectedNode = node;
      }
    }
    if (selectedNode) {
      selectedNode.selected = true;
    }
    this.dataGrid.addCreationNode(false);
    this.setCanDeleteSelected(Boolean(selectedNode));
    UI.ARIAUtils.alert(i18nString(UIStrings.sharedStorageNumberEntries, {PH1: filteredList.length}));
  }

  private async deleteCallback(node: DataGrid.DataGrid.DataGridNode<unknown>): Promise<void> {
    if (!node || node.isCreationNode || !this.sharedStorage) {
      return;
    }

    await this.sharedStorage.deleteEntry(node.data.key);
    await this.refreshItems();
    UI.ARIAUtils.alert(i18nString(UIStrings.sharedStorageItemDeleted));
  }

  private async sharedStorageItemsCleared(): Promise<void> {
    if (!this.isShowing() || !this.dataGrid) {
      return;
    }

    this.dataGrid.rootNode().removeChildren();
    this.dataGrid.addCreationNode(false);
    this.setCanDeleteSelected(false);
    await this.metadataView.doUpdate();
  }

  private showPreview(preview: UI.Widget.Widget|null, value: string|null): void {
    if (this.preview && this.previewValue === value) {
      return;
    }
    if (this.preview) {
      this.preview.detach();
    }
    if (!preview) {
      preview = new UI.EmptyWidget.EmptyWidget(i18nString(UIStrings.selectAValueToPreview));
    }
    this.previewValue = value;
    this.preview = preview;
    preview.show(this.previewPanel.contentElement);
  }

  private async previewEntry(entry: DataGrid.DataGrid.DataGridNode<unknown>|null): Promise<void> {
    const key = entry && entry.data && entry.data.key;
    const value = entry && entry.data && entry.data.value;
    const wrappedEntry = key && value && {key: key as string, value: value as string};
    const wrappedEntryString: string|null = wrappedEntry ? JSON.stringify(wrappedEntry) : null;
    if (entry && entry.data && entry.data.key && entry.data.value) {
      const url = `shared-storage://${entry.key}` as Platform.DevToolsPath.UrlString;
      const provider = TextUtils.StaticContentProvider.StaticContentProvider.fromString(
          url, Common.ResourceType.resourceTypes.XHR, (wrappedEntryString as string));
      const preview = await SourceFrame.PreviewFactory.PreviewFactory.createPreview(provider, 'text/plain');
      // Selection could've changed while the preview was loaded
      if (entry.selected) {
        this.showPreview(preview, wrappedEntryString);
      }
    } else {
      this.showPreview(null, wrappedEntryString);
    }
  }
}
