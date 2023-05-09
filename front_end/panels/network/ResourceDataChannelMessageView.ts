// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/*
 * Copyright (C) 2012 Research In Motion Limited. All rights reserved.
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
 */

import * as Common from '../../core/common/common.js';
import * as Host from '../../core/host/host.js';
import * as i18n from '../../core/i18n/i18n.js';
import * as Platform from '../../core/platform/platform.js';
import * as SDK from '../../core/sdk/sdk.js';
import * as TextUtils from '../../models/text_utils/text_utils.js';
import * as DataGrid from '../../ui/legacy/components/data_grid/data_grid.js';
import * as SourceFrame from '../../ui/legacy/components/source_frame/source_frame.js';
import * as UI from '../../ui/legacy/legacy.js';

import {BinaryResourceView} from './BinaryResourceView.js';
import dataChannelMessageViewStyles from './dataChannelMessageView.css.js';

const UIStrings = {
  /**
   *@description Text in Event Source Messages View of the Network panel
   */
  data: 'Data',
  /**
   *@description Text in Resource Data Channel Message View of the Network panel
   */
  length: 'Length',
  /**
   *@description Text that refers to the time
   */
  time: 'Time',
  /**
   *@description Data grid name for Data Channel Message data grids
   */
  dataChannelMessage: 'Data Channel Message',
  /**
   *@description Text to clear everything
   */
  clearAll: 'Clear All',
  /**
   *@description Text to filter result items
   */
  filter: 'Filter',
  /**
   *@description Text in Resource Data Channel Message View of the Network panel
   */
  selectMessageToBrowseItsContent: 'Select message to browse its content.',
  /**
   *@description Text in Resource Data Channel Message View of the Network panel
   */
  copyMessageD: 'Copy message...',
  /**
   *@description A context menu item in the Resource Data Channel Message View of the Network panel
   */
  copyMessage: 'Copy message',
  /**
   *@description Text to clear everything
   */
  clearAllL: 'Clear all',
  /**
   *@description Text for binary message in Resource Data Channel Message View of the Network panel
   */
  binaryMessage: 'Binary Message',
  /**
   *@description Text for everything
   */
  all: 'All',
  /**
   *@description Text in Resource Data Channel Message View of the Network panel
   */
  send: 'Send',
  /**
   *@description Text in Resource Data Channel Message View of the Network panel
   */
  receive: 'Receive',
  /**
   *@description Text for something not available
   */
  na: 'N/A',
  /**
   *@description Example for placeholder text
   */
  enterRegex: 'Enter regex, for example: (data)?channel',
};
const str_ = i18n.i18n.registerUIStrings('panels/network/ResourceDataChannelMessageView.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);
const i18nLazyString = i18n.i18n.getLazilyComputedLocalizedString.bind(undefined, str_);
export class ResourceDataChannelMessageView extends UI.Widget.VBox {
  private readonly request: SDK.NetworkRequest.NetworkRequest;
  private readonly splitWidget: UI.SplitWidget.SplitWidget;
  private dataGrid: DataGrid.SortableDataGrid.SortableDataGrid<unknown>;
  private readonly timeComparator:
      (arg0: DataGrid.SortableDataGrid.SortableDataGridNode<ResourceDataChannelMessageNode>,
       arg1: DataGrid.SortableDataGrid.SortableDataGridNode<ResourceDataChannelMessageNode>) => number;
  private readonly mainToolbar: UI.Toolbar.Toolbar;
  private readonly clearAllButton: UI.Toolbar.ToolbarButton;
  private readonly filterTypeCombobox: UI.Toolbar.ToolbarComboBox;
  private filterType: string|null;
  private readonly filterTextInput: UI.Toolbar.ToolbarInput;
  private filterRegex: RegExp|null;
  private readonly frameEmptyWidget: UI.EmptyWidget.EmptyWidget;
  private readonly selectedNode: ResourceDataChannelMessageNode|null;
  private currentSelectedNode?: ResourceDataChannelMessageNode|null;

  private messageFilterSetting: Common.Settings.Setting<string> =
      Common.Settings.Settings.instance().createSetting('networkDataChannelMessageFilter', '');

  constructor(request: SDK.NetworkRequest.NetworkRequest) {
    super();

    this.element.classList.add('datachannel-message-view');
    this.request = request;

    this.splitWidget = new UI.SplitWidget.SplitWidget(false, true, 'resourceDataChannelMessageSplitViewState');
    this.splitWidget.show(this.element);

    const columns = ([
      {id: 'data', title: i18nString(UIStrings.data), sortable: false, weight: 88},
      {
        id: 'length',
        title: i18nString(UIStrings.length),
        sortable: false,
        align: DataGrid.DataGrid.Align.Right,
        weight: 5,
      },
      {id: 'time', title: i18nString(UIStrings.time), sortable: true, weight: 7},
    ] as DataGrid.DataGrid.ColumnDescriptor[]);

    this.dataGrid = new DataGrid.SortableDataGrid.SortableDataGrid({
      displayName: i18nString(UIStrings.dataChannelMessage),
      columns,
      editCallback: undefined,
      deleteCallback: undefined,
      refreshCallback: undefined,
    });
    this.dataGrid.setRowContextMenuCallback(onRowContextMenu.bind(this));
    this.dataGrid.setStickToBottom(true);
    this.dataGrid.setCellClass('datachannel-message-view-td');
    this.timeComparator =
        (ResourceDataChannelMessageNodeTimeComparator as
             (arg0: DataGrid.SortableDataGrid.SortableDataGridNode<ResourceDataChannelMessageNode>,
              arg1: DataGrid.SortableDataGrid.SortableDataGridNode<ResourceDataChannelMessageNode>) => number);
    this.dataGrid.sortNodes(this.timeComparator, false);
    this.dataGrid.markColumnAsSortedBy('time', DataGrid.DataGrid.Order.Ascending);
    this.dataGrid.addEventListener(DataGrid.DataGrid.Events.SortingChanged, this.sortItems, this);

    this.dataGrid.setName('ResourceDataChannelMessageView');
    this.dataGrid.addEventListener(DataGrid.DataGrid.Events.SelectedNode, event => {
      void this.onMessageSelected(event);
    }, this);
    this.dataGrid.addEventListener(DataGrid.DataGrid.Events.DeselectedNode, this.onFrameDeselected, this);

    this.mainToolbar = new UI.Toolbar.Toolbar('');

    this.clearAllButton = new UI.Toolbar.ToolbarButton(i18nString(UIStrings.clearAll), 'clear');
    this.clearAllButton.addEventListener(UI.Toolbar.ToolbarButton.Events.Click, this.clearMessages, this);
    this.mainToolbar.appendToolbarItem(this.clearAllButton);

    this.filterTypeCombobox =
        new UI.Toolbar.ToolbarComboBox(this.updateFilterSetting.bind(this), i18nString(UIStrings.filter));
    for (const filterItem of _filterTypes) {
      const option = this.filterTypeCombobox.createOption(filterItem.label(), filterItem.name);
      this.filterTypeCombobox.addOption(option);
    }
    this.mainToolbar.appendToolbarItem(this.filterTypeCombobox);
    this.filterType = null;

    const placeholder = i18nString(UIStrings.enterRegex);
    this.filterTextInput = new UI.Toolbar.ToolbarInput(placeholder, '', 0.4);
    this.filterTextInput.addEventListener(UI.Toolbar.ToolbarInput.Event.TextChanged, this.updateFilterSetting, this);
    const filter = this.messageFilterSetting.get();
    if (filter) {
      this.filterTextInput.setValue(filter);
    }
    this.filterRegex = null;
    this.mainToolbar.appendToolbarItem(this.filterTextInput);

    const mainContainer = new UI.Widget.VBox();
    mainContainer.element.appendChild(this.mainToolbar.element);
    this.dataGrid.asWidget().show(mainContainer.element);
    mainContainer.setMinimumSize(0, 72);
    this.splitWidget.setMainWidget(mainContainer);

    this.frameEmptyWidget = new UI.EmptyWidget.EmptyWidget(i18nString(UIStrings.selectMessageToBrowseItsContent));
    this.splitWidget.setSidebarWidget(this.frameEmptyWidget);

    this.selectedNode = null;
    if (filter) {
      this.applyFilter(filter);
    }

    function onRowContextMenu(
        this: ResourceDataChannelMessageView, contextMenu: UI.ContextMenu.ContextMenu,
        genericNode: DataGrid.DataGrid.DataGridNode<unknown>): void {
      const node = (genericNode as ResourceDataChannelMessageNode);
      const binaryView = node.binaryView();
      if (binaryView) {
        binaryView.addCopyToContextMenu(contextMenu, i18nString(UIStrings.copyMessageD));
      } else {
        contextMenu.clipboardSection().appendItem(
            i18nString(UIStrings.copyMessage),
            Host.InspectorFrontendHost.InspectorFrontendHostInstance.copyText.bind(
                Host.InspectorFrontendHost.InspectorFrontendHostInstance, node.data.data));
      }
      contextMenu.footerSection().appendItem(i18nString(UIStrings.clearAllL), this.clearMessages.bind(this));
    }
  }

  override wasShown(): void {
    this.refresh();
    this.registerCSSFiles([dataChannelMessageViewStyles]);
    this.request.addEventListener(SDK.NetworkRequest.Events.DataChannelMessageAdded, this.messageAdded, this);
  }

  override willHide(): void {
    this.request.removeEventListener(SDK.NetworkRequest.Events.DataChannelMessageAdded, this.messageAdded, this);
  }

  private messageAdded(event: Common.EventTarget.EventTargetEvent<SDK.NetworkRequest.DataChannelMessage>): void {
    const message = event.data;
    if (!this.messageFilter(message)) {
      return;
    }
    this.dataGrid.insertChild(new ResourceDataChannelMessageNode(this.request.url(), message));
  }

  private messageFilter(message: SDK.NetworkRequest.DataChannelMessage): boolean {
    if (this.filterType && message.type !== this.filterType) {
      return false;
    }
    return !this.filterRegex || this.filterRegex.test(message.text);
  }

  private clearMessages(): void {
    // TODO(allada): actially remove messages from request.
    _clearFrameOffsets.set(this.request, this.request.dataChannelMessages().length);
    this.refresh();
  }

  private updateFilterSetting(): void {
    const text = this.filterTextInput.value();
    this.messageFilterSetting.set(text);
    this.applyFilter(text);
  }

  private applyFilter(text: string): void {
    const type = (this.filterTypeCombobox.selectedOption() as HTMLOptionElement).value;
    this.filterRegex = text ? new RegExp(text, 'i') : null;
    this.filterType = type === 'all' ? null : type;
    this.refresh();
  }

  private async onMessageSelected(event: Common.EventTarget.EventTargetEvent<DataGrid.DataGrid.DataGridNode<unknown>>):
      Promise<void> {
    this.currentSelectedNode = (event.data as ResourceDataChannelMessageNode);
    const content = this.currentSelectedNode.dataText();

    const binaryView = this.currentSelectedNode.binaryView();
    if (binaryView) {
      this.splitWidget.setSidebarWidget(binaryView);
      return;
    }

    const jsonView = await SourceFrame.JSONView.JSONView.createView(content);
    if (jsonView) {
      this.splitWidget.setSidebarWidget(jsonView);
      return;
    }

    this.splitWidget.setSidebarWidget(new SourceFrame.ResourceSourceFrame.ResourceSourceFrame(
        TextUtils.StaticContentProvider.StaticContentProvider.fromString(
            this.request.url(), Common.ResourceType.resourceTypes.DataChannel, content),
        ''));
  }

  private onFrameDeselected(): void {
    this.currentSelectedNode = null;
    this.splitWidget.setSidebarWidget(this.frameEmptyWidget);
  }

  refresh(): void {
    this.dataGrid.rootNode().removeChildren();

    const url = this.request.url();
    let messages = this.request.dataChannelMessages();
    const offset = _clearFrameOffsets.get(this.request) || 0;
    messages = messages.slice(offset);
    messages = messages.filter(this.messageFilter.bind(this));
    messages.forEach(message => this.dataGrid.insertChild(new ResourceDataChannelMessageNode(url, message)));
  }

  private sortItems(): void {
    this.dataGrid.sortNodes(this.timeComparator, !this.dataGrid.isSortOrderAscending());
  }
}

// TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration)
// eslint-disable-next-line @typescript-eslint/naming-convention
export const _filterTypes: UI.FilterBar.Item[] = [
  {name: 'all', label: i18nLazyString(UIStrings.all), title: undefined},
  {name: 'send', label: i18nLazyString(UIStrings.send), title: undefined},
  {name: 'receive', label: i18nLazyString(UIStrings.receive), title: undefined},
];

export class ResourceDataChannelMessageNode extends DataGrid.SortableDataGrid.SortableDataGridNode<unknown> {
  private readonly url: Platform.DevToolsPath.UrlString;
  readonly message: SDK.NetworkRequest.DataChannelMessage;
  private dataTextInternal: string;
  private binaryViewInternal: BinaryResourceView|null;

  constructor(url: Platform.DevToolsPath.UrlString, message: SDK.NetworkRequest.DataChannelMessage) {
    let length = String(message.text.length);
    const time = new Date(message.time * 1000);
    const timeText = ('0' + time.getHours()).substr(-2) + ':' + ('0' + time.getMinutes()).substr(-2) + ':' +
        ('0' + time.getSeconds()).substr(-2) + '.' + ('00' + time.getMilliseconds()).substr(-3);
    const timeNode = document.createElement('div');
    UI.UIUtils.createTextChild(timeNode, timeText);
    UI.Tooltip.Tooltip.install(timeNode, time.toLocaleString());

    let dataText: string = message.text;
    let description: string;

    if (!message.binary) {
      description = dataText;
    } else {
      length = Platform.NumberUtilities.bytesToString(Platform.StringUtilities.base64ToSize(message.text));
      description = i18nString(UIStrings.binaryMessage);
    }

    super({data: description, length: length, time: timeNode});

    this.url = url;
    this.message = message;
    this.dataTextInternal = dataText;

    this.binaryViewInternal = null;
  }

  override createCells(element: Element): void {
    element.classList.toggle(
        'datachannel-message-view-row-send', this.message.type === SDK.NetworkRequest.DataChannelMessageType.Send);
    element.classList.toggle(
        'datachannel-message-view-row-receive', this.message.type === SDK.NetworkRequest.DataChannelMessageType.Receive);
    super.createCells(element);
  }

  override nodeSelfHeight(): number {
    return 21;
  }

  dataText(): string {
    return this.dataTextInternal;
  }

  binaryView(): BinaryResourceView|null {
    if (!this.message.binary) {
      return null;
    }

    if (!this.binaryViewInternal) {
      if (this.dataTextInternal.length > 0) {
        this.binaryViewInternal = new BinaryResourceView(
            this.dataTextInternal, Platform.DevToolsPath.EmptyUrlString, Common.ResourceType.resourceTypes.DataChannel);
      }
    }
    return this.binaryViewInternal;
  }
}

// TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration)
// eslint-disable-next-line @typescript-eslint/naming-convention
export function ResourceDataChannelMessageNodeTimeComparator(
    a: ResourceDataChannelMessageNode, b: ResourceDataChannelMessageNode): number {
  return a.message.time - b.message.time;
}

// TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration)
// eslint-disable-next-line @typescript-eslint/naming-convention
const _clearFrameOffsets = new WeakMap<SDK.NetworkRequest.NetworkRequest, number>();
