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
  *@description Label for an item in the Application Panel Sidebar of the Application panel
  */
  clickToDisplayBody: 'Click on any report to display its body',
};
const str_ = i18n.i18n.registerUIStrings('panels/application/components/ReportingApiView.ts', UIStrings);
export const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

// export class ReportingApiViewWrapper extends UI.ThrottledWidget.ThrottledWidget {
export class ReportingApiView extends UI.Widget.VBox {
  private readonly reportingApiReportsView = new ReportingApiReportsView();
  private readonly reportingApiEndpointsView = new ReportingApiEndpointsView();
  private splitWidget: UI.SplitWidget.SplitWidget;
  private networkManager: SDK.NetworkManager.NetworkManager|null;

  constructor() {
    super();
    this.splitWidget = new UI.SplitWidget.SplitWidget(
        /* isVertical: */ false, /* secondIsSidebar: */ true, 'cookieItemsSplitViewState');
    this.splitWidget.show(this.element);
    const resizer = this.reportingApiReportsView.element.createChild('div', 'preview-panel-resizer');
    this.splitWidget.setMainWidget(this.reportingApiReportsView);
    this.splitWidget.setSidebarWidget(this.reportingApiEndpointsView);
    this.splitWidget.installResizer(resizer);
    // this.doUpdate();
    const mainTarget = SDK.TargetManager.TargetManager.instance().mainTarget();
    this.networkManager = mainTarget && mainTarget.model(SDK.NetworkManager.NetworkManager);
    if (this.networkManager) {
      this.networkManager.enableReportingApi();
    }
  }

  // doUpdate(): void { // is this even needed
  //   this.reportingApiReportsView.doUpdate();
  //   this.reportingApiEndpointsView.doUpdate();
  // }

  willHide(): void {
    if (this.networkManager) {
      this.networkManager.enableReportingApi(false);
    }
  }
}

class ReportingApiReportsView extends UI.Widget.VBox {
  private splitWidget: UI.SplitWidget.SplitWidget;
  private topPanel: UI.Widget.VBox;
  private bottomPanel: UI.Widget.VBox;
  private readonly reportsGrid = new ReportsGrid();
  private reports: Protocol.Network.ReportingApiReport[] = [];

  constructor() {
    super();

    this.splitWidget = new UI.SplitWidget.SplitWidget(
        /* isVertical: */ false, /* secondIsSidebar: */ true, 'cookieItemsSplitViewState');
    this.splitWidget.show(this.element);

    this.topPanel = new UI.Widget.VBox();
    this.bottomPanel = new UI.Widget.VBox();
    this.bottomPanel.contentElement.classList.add('flex-center');
    const resizer = this.topPanel.element.createChild('div', 'preview-panel-resizer');

    this.splitWidget.setMainWidget(this.topPanel);
    this.splitWidget.setSidebarWidget(this.bottomPanel);
    this.splitWidget.installResizer(resizer);

    this.topPanel.contentElement.appendChild(this.reportsGrid);
    this.reportsGrid.addEventListener('cellfocused', this.onFocus.bind(this));

    const centered = this.bottomPanel.contentElement.createChild('div');
    centered.textContent = i18nString(UIStrings.clickToDisplayBody);

    const mainTarget = SDK.TargetManager.TargetManager.instance().mainTarget();
    // const model = mainTarget && mainTarget.model(SDK.NetworkManager.NetworkManager);
    const networkManager = mainTarget && mainTarget.model(SDK.NetworkManager.NetworkManager);
    // if (model) {
    // const networkManager = model(NetworkManager);
    if (networkManager) {
      networkManager.addEventListener(
          SDK.NetworkManager.Events.ReportingApiReportAdded, event => this.onReportAdded(event.data), this);
      networkManager.addEventListener(
          SDK.NetworkManager.Events.ReportingApiReportUpdated, event => this.onReportUpdated(event.data), this);
    }
    // }

    // this.doUpdate();
  }

  wasShown(): void {
    super.wasShown();
    // this.splitWidget.registerCSSFiles([reportingApiViewStyles]);
    this.registerCSSFiles([reportingApiViewStyles]);
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
        this.splitWidget.setSidebarWidget(jsonView);
        return;
      }
    }
  }

  // async doUpdate(): Promise<void> {
  //   const mainTarget = SDK.TargetManager.TargetManager.instance().mainTarget();
  //   const model = mainTarget && mainTarget.model(SDK.NetworkManager.NetworkManager);
  //   // if (model) {
  //   //   const {reports} = await model.getReportingApiReports();
  //   //   this.reportsGrid.data = {reports};
  //   // }
  // }
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
        {id: 'url', title: 'URL', widthWeighting: 30, hideable: false, visible: true},
        {id: 'type', title: 'Type', widthWeighting: 10, hideable: false, visible: true},
        {id: 'status', title: 'Status', widthWeighting: 10, hideable: false, visible: true},
        {id: 'destination', title: 'Destination', widthWeighting: 10, hideable: false, visible: true},
        {id: 'timestamp', title: 'Timestamp', widthWeighting: 20, hideable: false, visible: true},
        {id: 'body', title: 'Body', widthWeighting: 20, hideable: false, visible: true},
      ],
      rows: this.buildReportRows(),
    };

    if (this.protocolMonitorExperimentEnabled) {
      reportsGridData.columns.unshift(
          {id: 'id', title: 'ID', widthWeighting: 30, hideable: false, visible: true},
      );
    }

    LitHtml.render(
        LitHtml.html`
      <div class="container">
        <div class="heading">Reports</div>
      ${
            this.reports.length > 0 ? LitHtml.html`
            <${DataGrid.DataGridController.DataGridController.litTagName} .data=${
                                          reportsGridData as DataGrid.DataGridController.DataGridControllerData}></${
                                          DataGrid.DataGridController.DataGridController.litTagName}>
      ` :
                                      LitHtml.html`
        <div class="rest">
          <div>No reports to display</div>
        </div>
      `}
      </div>
    `,
        this.shadow);
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
    // this.doUpdate();
  }

  // async doUpdate(): Promise<void> {
  //   const mainTarget = SDK.TargetManager.TargetManager.instance().mainTarget();
  //   const model = mainTarget && mainTarget.model(SDK.NetworkManager.NetworkManager);
  //   // if (model) {
  //   //   const endpoints = await model.getReportingApiEndpoints();
  //   //   this.endpointsGrid.data = {endpoints: endpoints.result};
  //   //   // this.endpointsGrid.data = {endpoints: ''};
  //   // }
  // }
}

export type Endpoint = {
  origin: string,
  name: string,
  url: string,
  // network_isolation_key: string,
  // [key: string]: string|boolean|number,
};

export interface EndpointsGridData {
  endpoints: string;
}

export class EndpointsGrid extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-resources-endpoints-grid`;

  private readonly shadow = this.attachShadow({mode: 'open'});
  private endpoints: Endpoint[] = [];

  connectedCallback(): void {
    this.shadow.adoptedStyleSheets = [reportingApiGridStyles];
    this.render();
  }

  set data(data: EndpointsGridData) {
    this.endpoints = data.endpoints ? JSON.parse(data.endpoints) : [];
    this.render();
  }

  private render(): void {
    // const mainTarget = SDK.TargetManager.TargetManager.instance().mainTarget();
    // const model = mainTarget?.model(SDK.ResourceTreeModel.ResourceTreeModel);
    // const origin = model?.getMainSecurityOrigin();

    // const filtered = this.endpoints.filter((endpoint: any) => endpoint.origin === origin);
    // const filtered = this.endpoints;

    // const a = filtered.reduce((acc: Endpoint, val: Endpoint) => {
    //   const foo =
    //       val.groups.map((gr: any) => ({...gr, origin: val.origin, network_isolation_key: val.network_isolation_key}));
    //   return acc.concat(foo);
    // }, []);

    // const b = a.reduce((acc: any, val: any) => {
    //   const foo = val.endpoints.map(
    //       (gr: any) => ({...gr, origin: val.origin, network_isolation_key: val.network_isolation_key, name: val.name}));
    //   return acc.concat(foo);
    // }, []);

    const endpointsGridData: DataGrid.DataGridController.DataGridControllerData = {
      columns: [
        {id: 'origin', title: 'Origin', widthWeighting: 30, hideable: false, visible: true},
        {id: 'name', title: 'Name', widthWeighting: 20, hideable: false, visible: true},
        {id: 'url', title: 'URL', widthWeighting: 30, hideable: false, visible: true},
      ],
      rows: this.buildEndpointRows(b),
    };

    LitHtml.render(
        LitHtml.html`
      <div class="container">
        <div class="heading">Endpoints</div>
      ${
            this.endpoints.length > 0 ?
                LitHtml.html`
        <${DataGrid.DataGridController.DataGridController.litTagName} .data=${
                    endpointsGridData as DataGrid.DataGridController.DataGridControllerData}></${
                    DataGrid.DataGridController.DataGridController.litTagName}>
      ` :
                LitHtml.html`
        <div class="rest">
          <div>No endpoints to display</div>
        </div>
      `}
      </div>
    `,
        this.shadow);
  }

  private buildEndpointRows(data: Endpoint[]): DataGrid.DataGridUtils.Row[] {
    return data.map(endpoint => ({
                      cells: [
                        {columnId: 'origin', value: endpoint.origin},
                        {columnId: 'name', value: endpoint.name},
                        {columnId: 'url', value: endpoint.url},
                      ],
                    }));
  }
}

ComponentHelpers.CustomElements.defineComponent('devtools-resources-reports-grid', ReportsGrid);
ComponentHelpers.CustomElements.defineComponent('devtools-resources-endpoints-grid', EndpointsGrid);

declare global {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLElementTagNameMap {
    'devtools-resources-reports-grid': ReportsGrid;
    'devtools-resources-endpoints-grid': EndpointsGrid;
  }
}
