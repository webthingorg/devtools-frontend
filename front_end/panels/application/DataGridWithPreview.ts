// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as i18n from '../../core/i18n/i18n.js';
import * as DataGrid from '../../ui/legacy/components/data_grid/data_grid.js';
import * as UI from '../../ui/legacy/legacy.js';
import * as VisualLogging from '../../ui/visual_logging/visual_logging.js';

const UIStrings = {
  /**
   *@description Name for the "DOM Storage Items" table that shows the content of the DOM Storage.
   */
  domStorageItems: 'DOM Storage Items',
  /**
   *@description Text in DOMStorage Items View of the Application panel
   */
  selectAValueToPreview: 'Select a value to preview',
  /**
   *@description Text for announcing a DOM Storage key/value item has been deleted
   */
  domStorageItemDeleted: 'The storage item was deleted.',
  /**
   *@description Text for announcing that the "DOM Storage Items" table was cleared, that is, all
   * entries were deleted.
   */
  domStorageItemsCleared: 'DOM Storage Items cleared',
  /**
   *@description Text for announcing number of entries after filtering
   *@example {5} PH1
   */
  domStorageNumberEntries: 'Number of entries shown in table: {PH1}',
};
const str_ = i18n.i18n.registerUIStrings('panels/application/DataGridWithPreview.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

interface Callbacks {
  refreshItems: () => void;
  removeItem: (key: string) => void;
  setItem: (key: string, value: string) => void;
  createPreview: (key: string, value: string) => Promise<UI.Widget.Widget|null>;
  setCanDeleteSelected: (canSelect: boolean) => void;
  filter: (items: string[][], keyfunc: (item: string[]) => string) => string[][];
}

export class DataGridWithPreview {
  private dataGrid: DataGrid.DataGrid.DataGridImpl<unknown>;
  private readonly splitWidget: UI.SplitWidget.SplitWidget;
  private readonly previewPanel: UI.Widget.VBox;
  private preview: UI.Widget.Widget|null;
  private previewValue: string|null;

  private callbacks: Callbacks;

  constructor(parent: HTMLElement, columns: DataGrid.DataGrid.ColumnDescriptor[], callbacks: Callbacks) {
    this.callbacks = callbacks;
    this.dataGrid = new DataGrid.DataGrid.DataGridImpl({
      displayName: i18nString(UIStrings.domStorageItems),
      columns,
      editCallback: this.editingCallback.bind(this),
      deleteCallback: this.deleteCallback.bind(this),
      refreshCallback: this.callbacks.refreshItems.bind(this),
    });
    this.dataGrid.addEventListener(DataGrid.DataGrid.Events.SelectedNode, event => {
      void this.previewEntry(event.data);
    });
    this.dataGrid.addEventListener(DataGrid.DataGrid.Events.DeselectedNode, () => {
      void this.previewEntry(null);
    });
    this.dataGrid.addEventListener(
        DataGrid.DataGrid.Events.SortingChanged, this.callbacks.refreshItems.bind(this), this);
    this.dataGrid.setStriped(true);
    this.dataGrid.setName('dom-storage-items-view');

    this.splitWidget = new UI.SplitWidget.SplitWidget(
        /* isVertical: */ false, /* secondIsSidebar: */ true, 'dom-storage-split-view-state');
    this.splitWidget.show(parent);

    this.previewPanel = new UI.Widget.VBox();
    this.previewPanel.setMinimumSize(0, 50);
    this.previewPanel.element.setAttribute('jslog', `${VisualLogging.pane('preview').track({resize: true})}`);
    const resizer = this.previewPanel.element.createChild('div', 'preview-panel-resizer');
    const dataGridWidget = this.dataGrid.asWidget();
    dataGridWidget.setMinimumSize(0, 50);
    this.splitWidget.setMainWidget(dataGridWidget);
    this.splitWidget.setSidebarWidget(this.previewPanel);
    this.splitWidget.installResizer(resizer);

    this.preview = null;
    this.previewValue = null;
  }

  showPreview(preview: UI.Widget.Widget|null, value: string|null): void {
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
    const value = entry && entry.data && entry.data.value;
    if (entry && entry.data && entry.data.value) {
      const preview = await this.callbacks.createPreview(entry.key, value as string);
      // Selection could've changed while the preview was loaded
      if (entry.selected) {
        this.showPreview(preview, value);
      }
    } else {
      this.showPreview(null, value);
    }
  }

  private editingCallback(
      editingNode: DataGrid.DataGrid.DataGridNode<unknown>, columnIdentifier: string, oldText: string,
      newText: string): void {
    if (columnIdentifier === 'key') {
      if (typeof oldText === 'string') {
        this.callbacks.removeItem(oldText);
      }
      this.callbacks.setItem(newText, editingNode.data.value || '');
      this.removeDupes(editingNode);
    } else {
      this.callbacks.setItem(editingNode.data.key || '', newText);
    }
  }

  private removeDupes(masterNode: DataGrid.DataGrid.DataGridNode<unknown>): void {
    const rootNode = this.dataGrid.rootNode();
    const children = rootNode.children;
    for (let i = children.length - 1; i >= 0; --i) {
      const childNode = children[i];
      if ((childNode.data.key === masterNode.data.key) && (masterNode !== childNode)) {
        rootNode.removeChild(childNode);
      }
    }
  }

  private deleteCallback(node: DataGrid.DataGrid.DataGridNode<unknown>): void {
    if (!node || node.isCreationNode) {
      return;
    }

    this.callbacks.removeItem(node.data.key);

    UI.ARIAUtils.alert(i18nString(UIStrings.domStorageItemDeleted));
  }

  clearItems(): void {
    if (!this.dataGrid) {
      return;
    }

    this.dataGrid.rootNode().removeChildren();
    this.dataGrid.addCreationNode(false);
    UI.ARIAUtils.alert(i18nString(UIStrings.domStorageItemsCleared));
    this.callbacks.setCanDeleteSelected(false);
  }

  removeItem(key: string): void {
    if (!this.dataGrid) {
      return;
    }

    const rootNode = this.dataGrid.rootNode();
    const children = rootNode.children;

    for (let i = 0; i < children.length; ++i) {
      const childNode = children[i];
      if (childNode.data.key === key) {
        rootNode.removeChild(childNode);
        this.callbacks.setCanDeleteSelected(children.length > 1);
        return;
      }
    }
  }

  addItem(key: string, value: string): void {
    if (!this.dataGrid) {
      return;
    }

    const rootNode = this.dataGrid.rootNode();
    const children = rootNode.children;

    for (let i = 0; i < children.length; ++i) {
      if (children[i].data.key === key) {
        return;
      }
    }

    const childNode = new DataGrid.DataGrid.DataGridNode({key, value}, false);
    rootNode.insertChild(childNode, children.length - 1);
  }

  updateItem(key: string, value: string): void {
    if (!this.dataGrid) {
      return;
    }

    const childNode = this.dataGrid.rootNode().children.find(
        (child: DataGrid.DataGrid.DataGridNode<unknown>) => child.data.key === key);
    if (!childNode) {
      return;
    }
    if (childNode.data.value !== value) {
      childNode.data.value = value;
      childNode.refresh();
    }
    if (!childNode.selected) {
      return;
    }
    if (this.previewValue !== value) {
      void this.previewEntry(childNode);
    }
    this.callbacks.setCanDeleteSelected(true);
  }

  showItems(items: string[][]): void {
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
    const filteredItems = (item: string[]): string => `${item[0]} ${item[1]}`;
    const sortDirection = this.dataGrid.isSortOrderAscending() ? 1 : -1;
    const filteredList =
        this.callbacks.filter(items, filteredItems).sort(function(item1: string[], item2: string[]): number {
          return sortDirection * (item1[0] > item2[0] ? 1 : -1);
        });
    for (const item of filteredList) {
      const key = item[0];
      const value = item[1];
      const node = new DataGrid.DataGrid.DataGridNode({key: key, value: value}, false);
      node.selectable = true;
      rootNode.appendChild(node);
      if (!selectedNode || key === selectedKey) {
        selectedNode = node;
      }
    }
    if (selectedNode) {
      selectedNode.selected = true;
    }
    this.dataGrid.addCreationNode(false);
    this.callbacks.setCanDeleteSelected(Boolean(selectedNode));
    UI.ARIAUtils.alert(i18nString(UIStrings.domStorageNumberEntries, {PH1: filteredList.length}));
  }

  deleteSelectedItem(): void {
    if (!this.dataGrid || !this.dataGrid.selectedNode) {
      return;
    }

    this.deleteCallback(this.dataGrid.selectedNode);
  }
}
