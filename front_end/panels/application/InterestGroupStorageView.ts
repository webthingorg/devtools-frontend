// Copyright 2021 The Chromium Authors. All rights reserved.
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
import * as TextUtils from '../../models/text_utils/text_utils.js';
import * as DataGrid from '../../ui/legacy/components/data_grid/data_grid.js';
import * as SourceFrame from '../../ui/legacy/components/source_frame/source_frame.js';
import * as UI from '../../ui/legacy/legacy.js';

import type {InterestGroupStorageModel} from './InterestGroupStorageModel.js';
import {Events as InterestGroupStorageModelEvents} from './InterestGroupStorageModel.js';
import {StorageItemsView} from './StorageItemsView.js';

const UIStrings = {
  /**
  *@description Text in InterestGroupStorage Items View of the Application panel
  */
  interestGroupStorage: 'Interest Group Storage',
  /**
  *@description Text in InterestGroupStorage Items View of the Application panel
  */
  type: 'Access Type',
  /**
  *@description Text in InterestGroupStorage Items View of the Application panel
  */
  owner: 'Owner',
  /**
  *@description Text in InterestGroupStorage Items View of the Application panel
  */
  name: 'name',
  /**
  *@description Data grid name for Interest Group Storage Items data grids
  */
  interestGroupStorageItems: 'InterestGroup Storage Items',
  /**
  *@description Text in DOMStorage Items View of the Application panel
  */
  selectAValueToPreview: 'Select a value to preview',
  /**
   *@description Text for announcing number of entries after filtering
   *@example {5} PH1
   */
  interestGroupStorageNumberEntries: 'Number of entries shown in table: {PH1}',
};
const str_ = i18n.i18n.registerUIStrings('panels/application/InterestGroupStorageView.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);
export class InterestGroupStorageView extends StorageItemsView {
  private models: Array<InterestGroupStorageModel>;
  private dataGrid: DataGrid.DataGrid.DataGridImpl<unknown>;
  private readonly splitWidget: UI.SplitWidget.SplitWidget;
  private readonly previewPanel: UI.Widget.VBox;
  private preview: UI.Widget.Widget|null;
  private previewValue: string|null;
  private eventListeners: Common.EventTarget.EventDescriptor[];

  constructor() {
    super(i18nString(UIStrings.interestGroupStorage), 'interestGroupStoragePanel');

    this.models = [];

    this.element.classList.add('storage-view', 'table');

    const columns = ([
      {id: 'type', title: i18nString(UIStrings.type), sortable: true, editable: false, longText: true, weight: 50},
      {id: 'owner', title: i18nString(UIStrings.owner), sortable: true, editable: false, longText: true, weight: 50},
      {id: 'name', title: i18nString(UIStrings.name), sortable: true, editable: false, longText: true, weight: 50},
    ] as DataGrid.DataGrid.ColumnDescriptor[]);
    this.dataGrid = new DataGrid.DataGrid.DataGridImpl({
      displayName: i18nString(UIStrings.interestGroupStorageItems),
      columns,
      refreshCallback: this.refreshItems.bind(this),
    });
    this.dataGrid.addEventListener(DataGrid.DataGrid.Events.SelectedNode, event => {
      void this.previewEntry(event.data);
    });
    this.dataGrid.addEventListener(DataGrid.DataGrid.Events.DeselectedNode, () => {
      void this.previewEntry(null);
    });
    this.dataGrid.setStriped(true);
    this.dataGrid.setName('InterestGroupStorageView');

    this.splitWidget = new UI.SplitWidget.SplitWidget(
        /* isVertical: */ false, /* secondIsSidebar: */ true, 'interestGroupStorageSplitViewState');
    this.splitWidget.show(this.element);

    this.previewPanel = new UI.Widget.VBox();
    this.previewPanel.setMinimumSize(0, 50);
    const resizer = this.previewPanel.element.createChild('div', 'preview-panel-resizer');
    const dataGridWidget = this.dataGrid.asWidget();
    dataGridWidget.setMinimumSize(0, 50);
    this.splitWidget.setMainWidget(dataGridWidget);
    this.splitWidget.setSidebarWidget(this.previewPanel);
    this.splitWidget.installResizer(resizer);

    this.preview = null;
    this.previewValue = null;

    this.showPreview(null, null);

    this.eventListeners = [];
  }

  setModels(models: Array<InterestGroupStorageModel>): void {
    Common.EventTarget.removeEventListeners(this.eventListeners);
    this.models = models;
    this.eventListeners = [];
    for (const model of models) {
      this.eventListeners.push(
          model.addEventListener(InterestGroupStorageModelEvents.InterestGroupAccess, this.interestGroupAccess, this));
    }
    this.refreshItems;
  }

  private interestGroupAccess(): void {
    this.refreshItems();
  }

  private showInterestGroupStorageItems(items: string[][]): void {
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
    const filteredItems = (item: string[]): string => `${item[0]} ${item[1]} ${item[2]}`;
    const filteredList = this.filter(items, filteredItems);
    for (const item of filteredList) {
      const type = item[0];
      const owner = item[1];
      const name = item[2];
      const key = owner + '/' + name;
      const node = new DataGrid.DataGrid.DataGridNode({key: key, type: type, owner: owner, name: name}, false);
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
    this.setCanDeleteSelected(false);
    UI.ARIAUtils.alert(i18nString(UIStrings.interestGroupStorageNumberEntries, {PH1: filteredList.length}));
  }

  refreshItems(): void {
    this.showInterestGroupStorageItems(
        this.models.map(y => y.getItems()).flat().map(x => [x.type, x.ownerOrigin, x.name]));
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
    if (entry && entry.data && entry.data) {
      const details = await this.models[0].getInterestGroupDetails(entry.data.owner, entry.data.name);
      const jsonDetails = JSON.stringify(details);
      const url = `interestgroup://${entry.data.owner}/${entry.data.name}`;
      const provider = TextUtils.StaticContentProvider.StaticContentProvider.fromString(
          url, Common.ResourceType.resourceTypes.XHR, jsonDetails);
      const preview = await SourceFrame.PreviewFactory.PreviewFactory.createPreview(provider, 'text/plain');
      // Selection could've changed while the preview was loaded
      if (entry.selected) {
        this.showPreview(preview, jsonDetails);
      }
    } else {
      this.showPreview(null, null);
    }
  }
}
