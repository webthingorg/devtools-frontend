// Copyright (c) 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as i18n from '../../core/i18n/i18n.js';
import * as SDK from '../../core/sdk/sdk.js';
import * as LitHtml from '../../third_party/lit-html/lit-html.js';
import * as WebComponents from '../../ui/components/components.js';
import * as UI from '../../ui/legacy/legacy.js';

const UIStrings = {
  /**
   * @description Title text in Back-forward Cache view of the Application panel
   */
  mainFrame: 'Main Frame',
  /**
   * @description Section header text in Back-forward Cache view of the Application panel
   */
  lastMainFrameNavigation: 'Last Main Frame Navigation',
  /**
   * @description Title text in Back-forward Cache view of the Application panel
   */
  backForwardCacheTitle: 'Back-forward Cache',
  /**
   * @description Status text for the status of the main frame
   */
  unavailable: 'unavailable',
  /**
   * @description Entry name text in the Back-forward Cache view of the Application panel
   */
  url: 'URL',
  /**
   * @description Entry name text in the Back-forward Cache view of the Application panel
   */
  bfcacheStatus: 'Back-forward Cache Status',
  /**
   * @description Status text for the status of the back-forward cache status
   */
  unknown: 'unknown',
};
const str_ = i18n.i18n.registerUIStrings('panels/application/BackForwardCacheView.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

export class BackForwardCacheView extends UI.ThrottledWidget.ThrottledWidget {
  constructor() {
    super(true, 1000);
    this.getMainResourceTreeModel()?.addEventListener(
        SDK.ResourceTreeModel.Events.MainFrameNavigated, this.onMainFrameNavigated, this);
    this.update();
  }

  private onMainFrameNavigated(): void {
    this.update();
  }

  async doUpdate(): Promise<void> {
    const data = {reportTitle: i18nString(UIStrings.backForwardCacheTitle)};
    const html = LitHtml.html`
      <devtools-report .data=${data as WebComponents.ReportView.ReportData}>
      ${this.renderMainFrameInformation(this.getMainFrame())}
      </devtools-report>
    `;
    LitHtml.render(html, this.contentElement);
  }

  private getMainResourceTreeModel(): SDK.ResourceTreeModel.ResourceTreeModel|null {
    const mainTarget = SDK.SDKModel.TargetManager.instance().mainTarget();
    return mainTarget?.model(SDK.ResourceTreeModel.ResourceTreeModel) || null;
  }

  private getMainFrame(): SDK.ResourceTreeModel.ResourceTreeFrame|null {
    return this.getMainResourceTreeModel()?.mainFrame || null;
  }

  private renderMainFrameInformation(mainFrame: SDK.ResourceTreeModel.ResourceTreeFrame|null): LitHtml.TemplateResult {
    if (!mainFrame) {
      return LitHtml.html`<devtools-report-key>${i18nString(UIStrings.mainFrame)}</devtools-report-key>
      <devtools-report-value>
      ${i18nString(UIStrings.unavailable)}
      </devtools-report-value>`;
    }
    return LitHtml.html`
      <devtools-report-section-header>${i18nString(UIStrings.lastMainFrameNavigation)}</devtools-report-section-header>
      <devtools-report-key>${i18nString(UIStrings.url)}</devtools-report-key>
      <devtools-report-value>${mainFrame.url}</devtools-report-value>
      <devtools-report-key>${i18nString(UIStrings.bfcacheStatus)}</devtools-report-key>
      <devtools-report-value>${i18nString(UIStrings.unknown)}</devtools-report-value>
    `;
  }
}
