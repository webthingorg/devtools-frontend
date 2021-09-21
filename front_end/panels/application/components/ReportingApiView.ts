// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as i18n from '../../../core/i18n/i18n.js';
import * as SDK from '../../../core/sdk/sdk.js';
import * as DataGrid from '../../../ui/components/data_grid/data_grid.js';
import * as ComponentHelpers from '../../../ui/components/helpers/helpers.js';
import * as UI from '../../../ui/legacy/legacy.js';
import * as LitHtml from '../../../ui/lit-html/lit-html.js';

import type * as Protocol from '../../../generated/protocol.js';
import * as SourceFrame from '../../../ui/legacy/components/source_frame/source_frame.js';
import * as Root from '../../../core/root/root.js';

import reportingApiGridStyles from './reportingApiGrid.css.js';
import reportingApiViewStyles from './reportingApiView.css.js';

const UIStrings = {
  /**
  *@description Placeholder text instructing the user how to display a Reporting API
  *report body (https://developers.google.com/web/updates/2018/09/reportingapi#sending).
  */
  clickToDisplayBody: 'Click on any report to display its body',
  /**
  *@description Placeholder text when there are no Reporting API reports.
  *(https://developers.google.com/web/updates/2018/09/reportingapi#sending)
  */
  noReportsToDisplay: 'No reports to display',
  /**
  *@description Placeholder text when there are no Reporting API endpoints.
  *(https://developers.google.com/web/updates/2018/09/reportingapi#tldr)
  */
  noEndpointsToDisplay: 'No endpoints to display',
};
const str_ = i18n.i18n.registerUIStrings('panels/application/components/ReportingApiView.ts', UIStrings);
export const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

const {render, html} = LitHtml;

export class ReportingApiView extends UI.SplitWidget.SplitWidget {
  constructor() {
    super(/* isVertical: */ false, /* secondIsSidebar: */ true);
    const reportingApiReportsView = new ReportingApiReportsView();
    const reportingApiEndpointsView = new ReportingApiEndpointsView();
    const resizer = reportingApiReportsView.element.createChild('div');
    this.setMainWidget(reportingApiReportsView);
    this.setSidebarWidget(reportingApiEndpointsView);
    this.installResizer(resizer);
    const mainTarget = SDK.TargetManager.TargetManager.instance().mainTarget();
    const networkManager = mainTarget && mainTarget.model(SDK.NetworkManager.NetworkManager);
    if (networkManager) {
      networkManager.enableReportingApi();
    }
  }
}

class ReportingApiReportsView extends UI.SplitWidget.SplitWidget {
  private readonly reportsGrid = new ReportsGrid();
  private reports: Protocol.Network.ReportingApiReport[] = [];

  constructor() {
    super(/* isVertical: */ false, /* secondIsSidebar: */ true);
    const topPanel = new UI.Widget.VBox();
    const bottomPanel = new UI.Widget.VBox();
    const resizer = topPanel.element.createChild('div');
    this.setMainWidget(topPanel);
    this.setSidebarWidget(bottomPanel);
    this.installResizer(resizer);

    topPanel.contentElement.appendChild(this.reportsGrid);
    this.reportsGrid.addEventListener('cellfocused', this.onFocus.bind(this));

    bottomPanel.contentElement.classList.add('placeholder');
    const centered = bottomPanel.contentElement.createChild('div');
    centered.textContent = i18nString(UIStrings.clickToDisplayBody);

    const mainTarget = SDK.TargetManager.TargetManager.instance().mainTarget();
    const networkManager = mainTarget && mainTarget.model(SDK.NetworkManager.NetworkManager);
    if (networkManager) {
      networkManager.addEventListener(
          SDK.NetworkManager.Events.ReportingApiReportAdded, event => this.onReportAdded(event.data), this);
      networkManager.addEventListener(
          SDK.NetworkManager.Events.ReportingApiReportUpdated, event => this.onReportUpdated(event.data), this);
    }
  }

  wasShown(): void {
    super.wasShown();
    const sbw = this.sidebarWidget();
    if (sbw) {
      sbw.registerCSSFiles([reportingApiViewStyles]);
    }
  }

  private onReportAdded(report: Protocol.Network.ReportingApiReport): void {
    this.reports.push(report);
    this.reportsGrid.data = {reports: this.reports};
  }

  private onReportUpdated(report: Protocol.Network.ReportingApiReport): void {
    const index = this.reports.findIndex(oldReport => oldReport.id === report.id);
    this.reports[index] = report;
    this.reportsGrid.data = {reports: this.reports};
  }

  private async onFocus(event: Event): Promise<void> {
    const focusedEvent = event as DataGrid.DataGridEvents.BodyCellFocusedEvent;
    const cell = focusedEvent.data.row.cells.find(cell => cell.columnId === 'id');
    const report = cell && this.reports.find(report => report.id === cell.value);
    if (report) {
      const jsonView = await SourceFrame.JSONView.JSONView.createView(JSON.stringify(report.body));
      if (jsonView) {
        this.setSidebarWidget(jsonView);
        return;
      }
    }
  }
}

export interface ReportsGridData {
  reports: Protocol.Network.ReportingApiReport[];
}

export class ReportsGrid extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-resources-reports-grid`;

  private readonly shadow = this.attachShadow({mode: 'open'});
  private reports: Protocol.Network.ReportingApiReport[] = [];
  private protocolMonitorExperimentEnabled = false;

  connectedCallback(): void {
    this.shadow.adoptedStyleSheets = [reportingApiGridStyles];
    this.protocolMonitorExperimentEnabled = Root.Runtime.experiments.isEnabled('protocolMonitor');
    this.render();
  }

  set data(data: ReportsGridData) {
    this.reports = data.reports;
    this.render();
  }

  private render(): void {
    const reportsGridData: DataGrid.DataGridController.DataGridControllerData = {
      columns: [
        {
          id: 'url',
          title: i18n.i18n.lockedString('URL'),
          widthWeighting: 30,
          hideable: false,
          visible: true,
        },
        {
          id: 'type',
          title: i18n.i18n.lockedString('Type'),
          widthWeighting: 10,
          hideable: false,
          visible: true,
        },
        {
          id: 'status',
          title: i18n.i18n.lockedString('Status'),
          widthWeighting: 10,
          hideable: false,
          visible: true,
        },
        {
          id: 'destination',
          title: i18n.i18n.lockedString('Destination'),
          widthWeighting: 10,
          hideable: false,
          visible: true,
        },
        {
          id: 'timestamp',
          title: i18n.i18n.lockedString('Timestamp'),
          widthWeighting: 20,
          hideable: false,
          visible: true,
        },
        {
          id: 'body',
          title: i18n.i18n.lockedString('Body'),
          widthWeighting: 20,
          hideable: false,
          visible: true,
        },
      ],
      rows: this.buildReportRows(),
    };

    if (this.protocolMonitorExperimentEnabled) {
      reportsGridData.columns.unshift(
          {id: 'id', title: 'ID', widthWeighting: 30, hideable: false, visible: true},
      );
    }

    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
    render(html`
      <div class="reporting-container">
        <div class="reporting-header">Reports</div>
        ${this.reports.length > 0 ? html`
          <${DataGrid.DataGridController.DataGridController.litTagName} .data=${
              reportsGridData as DataGrid.DataGridController.DataGridControllerData}>
          </${DataGrid.DataGridController.DataGridController.litTagName}>
        ` : html`
          <div class="reporting-footer">
            <div>${i18nString(UIStrings.noReportsToDisplay)}</div>
          </div>
        `}
      </div>
    `, this.shadow);
    // clang-format on
  }

  private buildReportRows(): DataGrid.DataGridUtils.Row[] {
    return this.reports.map(report => ({
                              cells: [
                                {columnId: 'id', value: report.id},
                                {columnId: 'url', value: report.initiatorUrl},
                                {columnId: 'type', value: report.type},
                                {columnId: 'status', value: report.status},
                                {columnId: 'destination', value: report.destination},
                                {columnId: 'timestamp', value: new Date(report.timestamp * 1000).toLocaleString()},
                                {columnId: 'body', value: JSON.stringify(report.body)},
                              ],
                            }));
  }
}

class ReportingApiEndpointsView extends UI.Widget.VBox {
  private readonly endpointsGrid = new EndpointsGrid();

  constructor() {
    super();
    this.contentElement.appendChild(this.endpointsGrid);
  }
}

export class EndpointsGrid extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-resources-endpoints-grid`;

  private readonly shadow = this.attachShadow({mode: 'open'});

  connectedCallback(): void {
    this.shadow.adoptedStyleSheets = [reportingApiGridStyles];
    this.render();
  }

  private render(): void {
    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
    render(html`
      <div class="reporting-container">
        <div class="reporting-header">Endpoints</div>
        <div class="reporting-footer">
          <div>${i18nString(UIStrings.noEndpointsToDisplay)}</div>
        </div>
      </div>
    `, this.shadow);
    // clang-format on
  }
}

ComponentHelpers.CustomElements.defineComponent('devtools-resources-reports-grid', ReportsGrid);
ComponentHelpers.CustomElements.defineComponent('devtools-resources-endpoints-grid', EndpointsGrid);

declare global {
  interface HTMLElementTagNameMap {
    'devtools-resources-reports-grid': ReportsGrid;
    'devtools-resources-endpoints-grid': EndpointsGrid;
  }
}
