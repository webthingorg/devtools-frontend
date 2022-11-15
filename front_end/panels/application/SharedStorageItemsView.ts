// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../core/common/common.js';
import * as i18n from '../../core/i18n/i18n.js';
import type * as Protocol from '../../generated/protocol.js';
import * as TextUtils from '../../models/text_utils/text_utils.js';
import * as DataGrid from '../../ui/legacy/components/data_grid/data_grid.js';
import type * as Platform from '../../core/platform/platform.js';
import * as SourceFrame from '../../ui/legacy/components/source_frame/source_frame.js';
import * as UI from '../../ui/legacy/legacy.js';
import * as ApplicationComponents from './components/components.js';

import {SharedStorageForOrigin} from './SharedStorageModel.js';
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
  #sharedStorage: SharedStorageForOrigin;
  readonly #outerSplitWidget: UI.SplitWidget.SplitWidget;
  readonly #innerSplitWidget: UI.SplitWidget.SplitWidget;
  #metadataView: ApplicationComponents.SharedStorageMetadataView.SharedStorageMetadataView;
  #dataGrid: DataGrid.DataGrid.DataGridImpl<unknown>;
  readonly #previewPanel: UI.Widget.VBox;
  #preview: UI.Widget.Widget|null;
  #previewValue: string|null;
  #eventListeners: Common.EventTarget.EventDescriptor[];

  constructor(sharedStorage: SharedStorageForOrigin) {
    super(i18nString(UIStrings.sharedStorage), 'sharedStoragePanel');

    this.#sharedStorage = sharedStorage;

    this.element.classList.add('storage-view', 'table');

    const columns = ([
      {id: 'key', title: i18nString(UIStrings.key), sortable: false, editable: true, longText: true, weight: 50},
      {id: 'value', title: i18nString(UIStrings.value), sortable: false, editable: true, longText: true, weight: 50},
    ] as DataGrid.DataGrid.ColumnDescriptor[]);
    this.#dataGrid = new DataGrid.DataGrid.DataGridImpl({
      displayName: i18nString(UIStrings.sharedStorageItems),
      columns,
      editCallback: this.#editingCallback.bind(this),
      deleteCallback: this.#deleteCallback.bind(this),
      refreshCallback: this.refreshItems.bind(this),
    });
    this.#dataGrid.addEventListener(DataGrid.DataGrid.Events.SelectedNode, event => {
      void this.#previewEntry(event.data);
    });
    this.#dataGrid.addEventListener(DataGrid.DataGrid.Events.DeselectedNode, () => {
      void this.#previewEntry(null);
    });
    this.#dataGrid.setStriped(true);
    this.#dataGrid.setName('SharedStorageItemsView');

    const dataGridWidget = this.#dataGrid.asWidget();
    dataGridWidget.setMinimumSize(0, 100);

    this.#metadataView = new ApplicationComponents.SharedStorageMetadataView.SharedStorageMetadataView(
        sharedStorage, sharedStorage.securityOrigin);
    this.#metadataView.setMinimumSize(0, 275);
    const innerResizer = this.#metadataView.element.createChild('div', 'metadata-view-resizer');

    this.#innerSplitWidget = new UI.SplitWidget.SplitWidget(
        /* isVertical: */ false, /* secondIsSidebar: */ false, 'sharedStorageInnerSplitViewState');
    this.#innerSplitWidget.setSidebarWidget(this.#metadataView);
    this.#innerSplitWidget.setMainWidget(dataGridWidget);
    this.#innerSplitWidget.installResizer(innerResizer);

    this.#previewPanel = new UI.Widget.VBox();
    this.#previewPanel.setMinimumSize(0, 25);
    const outerResizer = this.#previewPanel.element.createChild('div', 'preview-panel-resizer');

    this.#outerSplitWidget = new UI.SplitWidget.SplitWidget(
        /* isVertical: */ false, /* secondIsSidebar: */ true, 'sharedStorageOuterSplitViewState');
    this.#outerSplitWidget.show(this.element);
    this.#outerSplitWidget.setMainWidget(this.#innerSplitWidget);
    this.#outerSplitWidget.setSidebarWidget(this.#previewPanel);
    this.#outerSplitWidget.installResizer(outerResizer);

    this.#preview = null;
    this.#previewValue = null;
    this.#showPreview(null, null);

    this.#eventListeners = [];
    Common.EventTarget.removeEventListeners(this.#eventListeners);
    this.#sharedStorage = sharedStorage;
    this.#eventListeners = [
      this.#sharedStorage.addEventListener(
          SharedStorageForOrigin.Events.SharedStorageChanged, this.#sharedStorageChanged, this),
    ];
  }

  static async createView(sharedStorage: SharedStorageForOrigin): Promise<SharedStorageItemsView> {
    const view = new SharedStorageItemsView(sharedStorage);
    await view.updateEntriesOnly();
    return view;
  }

  async updateEntriesOnly(): Promise<void> {
    await this.#sharedStorage.getEntries().then(entries => entries && this.#showSharedStorageItems(entries));
  }

  async #sharedStorageChanged(): Promise<void> {
    if (!this.isShowing() || !this.#dataGrid) {
      return;
    }
    await this.refreshItems();
  }

  async refreshItems(): Promise<void> {
    await this.#metadataView.doUpdate();
    await this.updateEntriesOnly();
  }

  async deleteSelectedItem(): Promise<void> {
    if (!this.#dataGrid || !this.#dataGrid.selectedNode) {
      return;
    }

    await this.#deleteCallback(this.#dataGrid.selectedNode);
  }

  async deleteAllItems(): Promise<void> {
    if (!this.hasFilter()) {
      await this.#sharedStorage.clear();
      await this.#sharedStorageItemsCleared();
      UI.ARIAUtils.alert(i18nString(UIStrings.sharedStorageItemsCleared));
      return;
    }

    for (const node of this.#dataGrid.rootNode().children) {
      if (node.data.key) {
        await this.#sharedStorage.deleteEntry(node.data.key);
      }
    }

    await this.#sharedStorageItemsCleared();
    UI.ARIAUtils.alert(i18nString(UIStrings.sharedStorageFilteredItemsCleared));
  }

  async #editingCallback(
      editingNode: DataGrid.DataGrid.DataGridNode<unknown>, columnIdentifier: string, oldText: string,
      newText: string): Promise<void> {
    if (columnIdentifier === 'key') {
      if (typeof oldText === 'string') {
        await this.#sharedStorage.deleteEntry(oldText);
      }
      await this.#sharedStorage.setEntry(newText, editingNode.data.value || '', false);
      this.#removeDupes(editingNode);
    } else {
      await this.#sharedStorage.setEntry(editingNode.data.key || '', newText, false);
    }
  }

  #removeDupes(masterNode: DataGrid.DataGrid.DataGridNode<unknown>): void {
    const rootNode = this.#dataGrid.rootNode();
    const children = rootNode.children;
    for (let i = children.length - 1; i >= 0; --i) {
      const childNode = children[i];
      if ((childNode.data.key === masterNode.data.key) && (masterNode !== childNode)) {
        rootNode.removeChild(childNode);
      }
    }
  }

  #showSharedStorageItems(items: Protocol.Storage.SharedStorageEntry[]): void {
    const rootNode = this.#dataGrid.rootNode();
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
    this.#dataGrid.addCreationNode(false);
    this.setCanDeleteSelected(Boolean(selectedNode));
    UI.ARIAUtils.alert(i18nString(UIStrings.sharedStorageNumberEntries, {PH1: filteredList.length}));
  }

  async #deleteCallback(node: DataGrid.DataGrid.DataGridNode<unknown>): Promise<void> {
    if (!node || node.isCreationNode || !this.#sharedStorage) {
      return;
    }

    await this.#sharedStorage.deleteEntry(node.data.key);
    await this.refreshItems();
    UI.ARIAUtils.alert(i18nString(UIStrings.sharedStorageItemDeleted));
  }

  async #sharedStorageItemsCleared(): Promise<void> {
    if (!this.isShowing() || !this.#dataGrid) {
      return;
    }

    this.#dataGrid.rootNode().removeChildren();
    this.#dataGrid.addCreationNode(false);
    this.setCanDeleteSelected(false);
    await this.#metadataView.doUpdate();
  }

  #showPreview(preview: UI.Widget.Widget|null, value: string|null): void {
    if (this.#preview && this.#previewValue === value) {
      return;
    }
    if (this.#preview) {
      this.#preview.detach();
    }
    if (!preview) {
      preview = new UI.EmptyWidget.EmptyWidget(i18nString(UIStrings.selectAValueToPreview));
    }
    this.#previewValue = value;
    this.#preview = preview;
    preview.show(this.#previewPanel.contentElement);
  }

  async #previewEntry(entry: DataGrid.DataGrid.DataGridNode<unknown>|null): Promise<void> {
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
        this.#showPreview(preview, wrappedEntryString);
      }
    } else {
      this.#showPreview(null, wrappedEntryString);
    }
  }

  getOuterSplitWidgetForTesting(): UI.SplitWidget.SplitWidget {
    return this.#outerSplitWidget;
  }

  getInnerSplitWidgetForTesting(): UI.SplitWidget.SplitWidget {
    return this.#innerSplitWidget;
  }

  getDataGridForTesting(): DataGrid.DataGrid.DataGridImpl<unknown> {
    return this.#dataGrid;
  }

  getEntriesForTesting(): Array<Protocol.Storage.SharedStorageEntry> {
    const result = new Array<Protocol.Storage.SharedStorageEntry>();
    const rootNode = this.#dataGrid.rootNode();
    for (const node of rootNode.children) {
      if (node.data.key) {
        result.push(node.data as unknown as Protocol.Storage.SharedStorageEntry);
      }
    }
    return result;
  }
}
