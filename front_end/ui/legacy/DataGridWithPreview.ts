// Copyright 2024 The Chromium Authors. All rights reserved.
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
import * as i18n from '../../core/i18n/i18n.js';
import * as VisualLogging from '../visual_logging/visual_logging.js';

import * as DataGrid from './components/data_grid/data_grid.js';
import {ARIAUtils, EmptyWidget, SplitWidget, Widget} from './legacy.js';

const UIStrings = {
  /**
   *@description Preview text when viewing storage in Application panel
   */
  selectAValueToPreview: 'Select a value to preview',
  /**
   *@description Text for announcing number of entries after filtering
   *@example {5} PH1
   */
  numberEntries: 'Number of entries shown in table: {PH1}',
};
const str_ = i18n.i18n.registerUIStrings('ui/legacy/DataGridWithPreview.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

interface Callbacks<ItemType> {
  refreshItems?: () => void;
  removeItem?: (key: string) => void;
  setItem?: (key: string, value: string) => void;
  createPreview: (key: string, value: string) => Promise<Widget.Widget|null>;
  setCanDeleteSelected: (canSelect: boolean) => void;
  filter: (items: ItemType[], keyfunc: (item: ItemType) => string) => ItemType[];
  createNode: (item: ItemType) => DataGrid.DataGrid.DataGridNode<ItemType>;
  keyFunc: (item: ItemType) => string;
  sortFunc: (a: ItemType, b: ItemType) => number;
}

interface Messages {
  title: string;
  itemDeleted: string;
  itemsCleared: string;
}

export class DataGridWithPreview<ItemType> {
  private dataGrid: DataGrid.DataGrid.DataGridImpl<unknown>;
  private readonly splitWidget: SplitWidget.SplitWidget;
  private readonly previewPanel: Widget.VBox;
  private preview: Widget.Widget|null;
  private previewValue: string|null;

  private callbacks: Callbacks<ItemType>;
  private messages: Messages;

  constructor(
      parent: HTMLElement, columns: DataGrid.DataGrid.ColumnDescriptor[], callbacks: Callbacks<ItemType>,
      messages: Messages) {
    this.callbacks = callbacks;
    this.messages = messages;
    this.dataGrid = new DataGrid.DataGrid.DataGridImpl({
      displayName: this.messages.title,
      columns,
      editCallback: this.callbacks.setItem && this.editingCallback.bind(this),
      deleteCallback: this.callbacks.removeItem && this.deleteCallback.bind(this),
      refreshCallback: this.callbacks.refreshItems?.bind(this),
    });
    this.dataGrid.addEventListener(DataGrid.DataGrid.Events.SelectedNode, event => {
      void this.previewEntry(event.data);
    });
    this.dataGrid.addEventListener(DataGrid.DataGrid.Events.DeselectedNode, () => {
      void this.previewEntry(null);
    });
    if (this.callbacks.refreshItems) {
      this.dataGrid.addEventListener(
          DataGrid.DataGrid.Events.SortingChanged, this.callbacks.refreshItems.bind(this), this);
    }
    this.dataGrid.setStriped(true);
    this.dataGrid.setName('dom-storage-items-view');

    this.splitWidget = new SplitWidget.SplitWidget(
        /* isVertical: */ false, /* secondIsSidebar: */ true, 'dom-storage-split-view-state');
    this.splitWidget.show(parent);

    this.previewPanel = new Widget.VBox();
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

    this.showPreview(null, null);
  }

  clearItems(): void {
    if (!this.dataGrid) {
      return;
    }

    this.dataGrid.rootNode().removeChildren();
    this.dataGrid.addCreationNode(false);
    ARIAUtils.alert(this.messages.itemsCleared);
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

  addItem(item: ItemType): void {
    if (!this.dataGrid) {
      return;
    }

    const rootNode = this.dataGrid.rootNode();
    const children = rootNode.children;

    const key = this.callbacks.keyFunc(item);

    for (let i = 0; i < children.length; ++i) {
      if (children[i].data.key === key) {
        return;
      }
    }

    const childNode = this.callbacks.createNode(item);
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

  showItems(items: ItemType[]): void {
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
    const keyFunc = this.callbacks.keyFunc;
    const sortDirection = this.dataGrid.isSortOrderAscending() ? 1 : -1;
    const filteredList =
        this.callbacks.filter(items, keyFunc).sort((a, b) => sortDirection * this.callbacks.sortFunc(a, b));
    for (const item of filteredList) {
      const key = keyFunc(item);
      const node = this.callbacks.createNode(item);
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
    ARIAUtils.alert(i18nString(UIStrings.numberEntries, {PH1: filteredList.length}));
  }

  deleteSelectedItem(): void {
    if (!this.dataGrid || !this.dataGrid.selectedNode) {
      return;
    }

    this.deleteCallback(this.dataGrid.selectedNode);
  }

  private editingCallback(
      editingNode: DataGrid.DataGrid.DataGridNode<unknown>, columnIdentifier: string, oldText: string,
      newText: string): void {
    if (columnIdentifier === 'key') {
      if (typeof oldText === 'string') {
        this.callbacks.removeItem?.(oldText);
      }
      this.callbacks.setItem?.(newText, editingNode.data.value || '');
      this.removeDupes(editingNode);
    } else {
      this.callbacks.setItem?.(editingNode.data.key || '', newText);
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

    this.callbacks.removeItem?.(node.data.key);

    ARIAUtils.alert(this.messages.itemDeleted);
  }

  showPreview(preview: Widget.Widget|null, value: string|null): void {
    if (this.preview && this.previewValue === value) {
      return;
    }
    if (this.preview) {
      this.preview.detach();
    }
    if (!preview) {
      preview = new EmptyWidget.EmptyWidget(i18nString(UIStrings.selectAValueToPreview));
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
}
