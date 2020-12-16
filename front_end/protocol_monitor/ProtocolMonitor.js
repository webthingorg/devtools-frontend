// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as DataGrid from '../data_grid/data_grid.js';
import * as Host from '../host/host.js';
import * as i18n from '../i18n/i18n.js';
import * as ProtocolClient from '../protocol_client/protocol_client.js';
import * as SDK from '../sdk/sdk.js';
import * as SourceFrame from '../source_frame/source_frame.js';
import * as TextUtils from '../text_utils/text_utils.js';
import * as Components from '../ui/components/components.js';
import * as UI from '../ui/ui.js';

export const UIStrings = {
  /**
  *@description Text for one or a group of functions
  */
  method: 'Method',
  /**
  *@description Text in Protocol Monitor of the Protocol Monitor tab
  */
  direction: 'Direction',
  /**
  *@description Text in Protocol Monitor of the Protocol Monitor tab
  */
  request: 'Request',
  /**
  *@description Text for a network response
  */
  response: 'Response',
  /**
  *@description Text for timestamps of items
  */
  timestamp: 'Timestamp',
  /**
  *@description Text in Protocol Monitor of the Protocol Monitor tab
  */
  target: 'Target',
  /**
  *@description Text to record a series of actions for analysis
  */
  record: 'Record',
  /**
  *@description Text to clear everything
  */
  clearAll: 'Clear all',
  /**
  *@description Data grid name for Protocol Monitor data grids
  */
  protocolMonitor: 'Protocol Monitor',
  /**
  *@description Text to filter result items
  */
  filter: 'Filter',
  /**
  *@description Text for the documentation of something
  */
  documentation: 'Documentation',
  /**
  *@description Cell text content in Protocol Monitor of the Protocol Monitor tab
  *@example {30} PH1
  */
  sMs: '{PH1} ms',
  /**
  *@description Text in Protocol Monitor of the Protocol Monitor tab
  */
  noMessageSelected: 'No message selected',
};
const str_ = i18n.i18n.registerUIStrings('protocol_monitor/ProtocolMonitor.js', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

export class ProtocolMonitorImpl extends UI.Widget.VBox {
  constructor() {
    super(true);
    this._started = false;
    this._startTime = 0;
    /**
     * @type {!Map<number, !Components.DataGridUtils.Row>}
     */
    this._dataGridRowForId = new Map();
    this.registerRequiredCSS('protocol_monitor/protocolMonitor.css', {enableLegacyPatching: true});
    const topToolbar = new UI.Toolbar.Toolbar('protocol-monitor-toolbar', this.contentElement);
    const recordButton = new UI.Toolbar.ToolbarToggle(
        i18nString(UIStrings.record), 'largeicon-start-recording', 'largeicon-stop-recording');
    recordButton.addEventListener(UI.Toolbar.ToolbarButton.Events.Click, () => {
      recordButton.setToggled(!recordButton.toggled());
      this._setRecording(recordButton.toggled());
    });
    recordButton.setToggleWithRedColor(true);
    topToolbar.appendToolbarItem(recordButton);
    recordButton.setToggled(true);

    const clearButton = new UI.Toolbar.ToolbarButton(i18nString(UIStrings.clearAll), 'largeicon-clear');
    clearButton.addEventListener(UI.Toolbar.ToolbarButton.Events.Click, () => {
      this._newDataGrid.data = {
        ...this._newDataGrid.data,
        rows: [],
      };
    });
    topToolbar.appendToolbarItem(clearButton);

    const split = new UI.SplitWidget.SplitWidget(true, true, 'protocol-monitor-panel-split', 250);
    split.show(this.contentElement);
    this._infoWidget = new InfoWidget();
    const component = new Components.DataGridController.DataGridController();
    this._newDataGrid = component;
    component.data = {
      columns: [
        {id: 'method', title: ls`Method`, sortable: false, widthWeighting: 1, visible: true, hideable: false},
        {id: 'direction', title: ls`Direction`, sortable: true, widthWeighting: 1, visible: false, hideable: true},
        {id: 'request', title: ls`Request`, sortable: false, widthWeighting: 1, visible: true, hideable: true},
        {id: 'response', title: ls`Response`, sortable: false, widthWeighting: 1, visible: true, hideable: true},
        {id: 'timestamp', title: ls`Timestamp`, sortable: true, widthWeighting: 1, visible: false, hideable: true},
        {id: 'target', title: ls`Target`, sortable: true, widthWeighting: 1, visible: false, hideable: true},
      ],
      rows: [],
    };
    split.setMainViewToComponent(this._newDataGrid);
    split.setSidebarWidget(this._infoWidget);
    // this._dataGrid.addEventListener(
    //     DataGrid.DataGrid.Events.SelectedNode, event => this._infoWidget.render(event.data.data));
    // this._dataGrid.addEventListener(DataGrid.DataGrid.Events.DeselectedNode, event => this._infoWidget.render(null));
    // this._dataGrid.setHeaderContextMenuCallback(this._innerHeaderContextMenu.bind(this));
    // this._dataGrid.setRowContextMenuCallback(this._innerRowContextMenu.bind(this));


    // this._dataGrid.addEventListener(DataGrid.DataGrid.Events.SortingChanged, this._sortDataGrid.bind(this));
    // this._dataGrid.setStickToBottom(true);
    // this._dataGrid.sortNodes(
    //     DataGrid.SortableDataGrid.SortableDataGrid.NumericComparator.bind(null, 'timestamp'), false);

    const keys = ['method', 'request', 'response', 'direction'];
    this._filterParser = new TextUtils.TextUtils.FilterParser(keys);
    this._suggestionBuilder = new UI.FilterSuggestionBuilder.FilterSuggestionBuilder(keys);

    this._textFilterUI = new UI.Toolbar.ToolbarInput(
        i18nString(UIStrings.filter), '', 1, .2, '', this._suggestionBuilder.completions.bind(this._suggestionBuilder),
        true);
    this._textFilterUI.addEventListener(UI.Toolbar.ToolbarInput.Event.TextChanged, event => {
      const query = /** @type {string} */ (event.data);
      const filters = this._filterParser.parse(query);
      this._newDataGrid.data = {
        ...this._newDataGrid.data,
        filters,
      };
    });
    topToolbar.appendToolbarItem(this._textFilterUI);
  }

  // TODO: context menu links for filters and also for links to documentation?
  // _innerRowContextMenu(contextMenu, node) {
  //   contextMenu.defaultSection().appendItem(i18nString(UIStrings.filter), () => {
  //     this._textFilterUI.setValue(`method:${node.data.method}`, true);
  //   });
  //   contextMenu.defaultSection().appendItem(i18nString(UIStrings.documentation), () => {
  //     const [domain, method] = node.data.method.split('.');
  //     const type = node.data.direction === 'sent' ? 'method' : 'event';
  //     Host.InspectorFrontendHost.InspectorFrontendHostInstance.openInNewTab(
  //         `https://chromedevtools.github.io/devtools-protocol/tot/${domain}#${type}-${method}`);
  //   });
  // }

  /**
   * @override
   */
  wasShown() {
    if (this._started) {
      return;
    }
    this._started = true;
    this._startTime = Date.now();
    this._setRecording(true);
  }

  /**
   * @param {boolean} recording
   */
  _setRecording(recording) {
    const test = ProtocolClient.InspectorBackend.test;
    if (recording) {
      // TODO: TS thinks that properties are read-only because
      // in TS test is defined as a namespace.
      // @ts-ignore
      test.onMessageSent = this._messageSent.bind(this);
      // @ts-ignore
      test.onMessageReceived = this._messageReceived.bind(this);
    } else {
      // @ts-ignore
      test.onMessageSent = null;
      // @ts-ignore
      test.onMessageReceived = null;
    }
  }

  /**
   * @param {?SDK.SDKModel.Target} target
   * @return {string}
   */
  _targetToString(target) {
    if (!target) {
      return '';
    }
    return target.decorateLabel(
        `${target.name()} ${target === SDK.SDKModel.TargetManager.instance().mainTarget() ? '' : target.id()}`);
  }

  /**
   * @param {*} message
   * @param {?ProtocolClient.InspectorBackend.TargetBase} target
   */
  _messageReceived(message, target) {
    if ('id' in message) {
      const existingRow = this._dataGridRowForId.get(message.id);
      if (!existingRow) {
        return;
      }
      const allExistingRows = this._newDataGrid.data.rows;
      const matchingExistingRowIndex = allExistingRows.findIndex(r => existingRow === r);
      const newRowWithUpdate = {
        ...existingRow,
        cells: existingRow.cells.map(cell => {
          if (cell.columnId === 'response') {
            return {
              ...cell,
              value: JSON.stringify(message.result || message.error),

            };
          }
          return cell;
        })
      };

      const newRowsArray = [...this._newDataGrid.data.rows];
      newRowsArray[matchingExistingRowIndex] = newRowWithUpdate;
      this._dataGridRowForId.delete(message.id);
      this._newDataGrid.data = {
        ...this._newDataGrid.data,
        rows: newRowsArray,
      };
      return;
    }

    const sdkTarget = /** @type {?SDK.SDKModel.Target} */ (target);
    /** @type {!Components.DataGridUtils.Row} */
    const newRow = {
      cells: [
        {columnId: 'method', value: message.method},
        {columnId: 'request', value: '', renderer: Components.DataGridRenderers.codeBlockRenderer}, {
          columnId: 'response',
          value: JSON.stringify(message.params),
          renderer: Components.DataGridRenderers.codeBlockRenderer
        },
        {
          columnId: 'timestamp', value: Date.now() - this._startTime
        },
        {
          columnId: 'direction', value: 'received'
        },
        {
          columnId: 'target', value: this._targetToString(sdkTarget)
        }
      ],
      hidden: false,
    };

    this._newDataGrid.data = {...this._newDataGrid.data, rows: this._newDataGrid.data.rows.concat([newRow])};
  }

  /**
   * @param {{domain: string, method: string, params: !Object, id: number}} message
   * @param {?ProtocolClient.InspectorBackend.TargetBase} target
   */
  _messageSent(message, target) {
    const sdkTarget = /** @type {?SDK.SDKModel.Target} */ (target);
    const newRow = {
      cells: [
        {columnId: 'method', value: message.method}, {
          columnId: 'request',
          value: JSON.stringify(message.params),
          renderer: Components.DataGridRenderers.codeBlockRenderer
        },
        {columnId: 'response', value: '(pending)', renderer: Components.DataGridRenderers.codeBlockRenderer},
        {columnId: 'timestamp', value: Date.now() - this._startTime },
        {columnId: 'direction', value: 'sent'},
        {
          columnId: 'target', value: this._targetToString(sdkTarget)
        }
      ],
      hidden: false,
    };
    this._dataGridRowForId.set(message.id, newRow);
    this._newDataGrid.data = {...this._newDataGrid.data, rows: this._newDataGrid.data.rows.concat([newRow])};
  }
}

export class InfoWidget extends UI.Widget.VBox {
  constructor() {
    super();
    this._tabbedPane = new UI.TabbedPane.TabbedPane();
    this._tabbedPane.appendTab('request', i18nString(UIStrings.request), new UI.Widget.Widget());
    this._tabbedPane.appendTab('response', i18nString(UIStrings.response), new UI.Widget.Widget());
    this._tabbedPane.show(this.contentElement);
    this._tabbedPane.selectTab('response');
    this.render(null);
  }

  /**
   * @param {?{method: string, direction: string, request: ?Object, response: ?Object, timestamp: number}} data
   */
  render(data) {
    const requestEnabled = data && data.direction === 'sent';
    this._tabbedPane.setTabEnabled('request', !!requestEnabled);
    if (!data) {
      this._tabbedPane.changeTabView(
          'request', new UI.EmptyWidget.EmptyWidget(i18nString(UIStrings.noMessageSelected)));
      this._tabbedPane.changeTabView(
          'response', new UI.EmptyWidget.EmptyWidget(i18nString(UIStrings.noMessageSelected)));
      return;
    }
    if (!requestEnabled) {
      this._tabbedPane.selectTab('response');
    }

    this._tabbedPane.changeTabView('request', SourceFrame.JSONView.JSONView.createViewSync(data.request));
    this._tabbedPane.changeTabView('response', SourceFrame.JSONView.JSONView.createViewSync(data.response));
  }
}

/**
 * @typedef {{
 *  id: string,
 *  title: string,
 *  visible: boolean,
 *  sortable: boolean,
 *  hideable: boolean,
 *  weight: number,
 * }}
 */
// @ts-ignore typedef
export let ProtocolColumnConfig;
