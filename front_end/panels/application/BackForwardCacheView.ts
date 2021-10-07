// Copyright (c) 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as Platform from '../../core/platform/platform.js';
import * as SDK from '../../core/sdk/sdk.js';
import * as LitHtml from '../../ui/lit-html/lit-html.js';
import * as ReportView from '../../ui/components/report_view/report_view.js';
import * as UI from '../../ui/legacy/legacy.js';
import * as Protocol from '../../generated/protocol.js';

import {BackForwardCacheUIStrings} from './BackForwardCacheStrings.js';

export class BackForwardCacheView extends UI.ThrottledWidget.ThrottledWidget {
  constructor() {
    super(true, 1000);
    this.getMainResourceTreeModel()?.addEventListener(
        SDK.ResourceTreeModel.Events.MainFrameNavigated, this.onBackForwardCacheUpdate, this);
    this.getMainResourceTreeModel()?.addEventListener(
        SDK.ResourceTreeModel.Events.BackForwardCacheDetailsUpdated, this.onBackForwardCacheUpdate, this);
    this.update();
  }

  private onBackForwardCacheUpdate(): void {
    this.update();
  }

  async doUpdate(): Promise<void> {
    const data = {reportTitle: BackForwardCacheUIStrings['backForwardCacheTitle'].name()};
    const html = LitHtml.html`
      <${ReportView.ReportView.Report.litTagName} .data=${data as ReportView.ReportView.ReportData}>
      ${this.renderMainFrameInformation(this.getMainFrame())}
      </${ReportView.ReportView.Report.litTagName}>
    `;
    LitHtml.render(html, this.contentElement, {host: this});
  }

  private getMainResourceTreeModel(): SDK.ResourceTreeModel.ResourceTreeModel|null {
    const mainTarget = SDK.TargetManager.TargetManager.instance().mainTarget();
    return mainTarget?.model(SDK.ResourceTreeModel.ResourceTreeModel) || null;
  }

  private getMainFrame(): SDK.ResourceTreeModel.ResourceTreeFrame|null {
    return this.getMainResourceTreeModel()?.mainFrame || null;
  }

  private renderMainFrameInformation(mainFrame: SDK.ResourceTreeModel.ResourceTreeFrame|null): LitHtml.TemplateResult {
    if (!mainFrame) {
      return LitHtml.html`<${ReportView.ReportView.ReportKey.litTagName}>${
          BackForwardCacheUIStrings['mainFrame'].name()}</${ReportView.ReportView.ReportKey.litTagName}>
      <${ReportView.ReportView.ReportValue.litTagName}>
      ${BackForwardCacheUIStrings['unavailable'].name()}
      </${ReportView.ReportView.ReportValue.litTagName}>`;
    }
    return LitHtml.html`
      <${ReportView.ReportView.ReportSectionHeader.litTagName}>${
        BackForwardCacheUIStrings['lastMainFrameNavigation'].name()}</${
        ReportView.ReportView.ReportSectionHeader.litTagName}>
      <${ReportView.ReportView.ReportKey.litTagName}>${BackForwardCacheUIStrings['url'].name()}</${
        ReportView.ReportView.ReportKey.litTagName}>
      <${ReportView.ReportView.ReportValue.litTagName}>${mainFrame.url}</${
        ReportView.ReportView.ReportValue.litTagName}>
      <${ReportView.ReportView.ReportKey.litTagName}>${BackForwardCacheUIStrings['bfcacheStatus'].name()}</${
        ReportView.ReportView.ReportKey.litTagName}>
      <${ReportView.ReportView.ReportValue.litTagName}>${
        this.renderBackForwardCacheStatus(
            mainFrame.backForwardCacheDetails.restoredFromCache)}</${ReportView.ReportView.ReportValue.litTagName}>
       ${this.maybeRenderExplanations(mainFrame.backForwardCacheDetails.explanations)}
    `;
  }

  private renderBackForwardCacheStatus(status: boolean|undefined): Platform.UIString.LocalizedString {
    switch (status) {
      case true:
        return BackForwardCacheUIStrings['restoredFromBFCache'].name();
      case false:
        return BackForwardCacheUIStrings['normalNavigation'].name();
    }
    return BackForwardCacheUIStrings['unknown'].name();
  }

  private maybeRenderExplanations(explanations: Protocol.Page.BackForwardCacheNotRestoredExplanation[]):
      LitHtml.TemplateResult|{} {
    if (explanations.length === 0) {
      return LitHtml.nothing;
    }

    const pageSupportNeeded = explanations.filter(
        explanation => explanation.type === Protocol.Page.BackForwardCacheNotRestoredReasonType.PageSupportNeeded);
    const supportPending = explanations.filter(
        explanation => explanation.type === Protocol.Page.BackForwardCacheNotRestoredReasonType.SupportPending);
    const circumstantial = explanations.filter(
        explanation => explanation.type === Protocol.Page.BackForwardCacheNotRestoredReasonType.Circumstantial);

    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
    return LitHtml.html`
      ${this.renderExplanations(BackForwardCacheUIStrings['pageSupportNeeded'].name(), pageSupportNeeded)}
      ${this.renderExplanations(BackForwardCacheUIStrings['supportPending'].name(), supportPending)}
      ${this.renderExplanations(BackForwardCacheUIStrings['circumstantial'].name(), circumstantial)}
    `;
    // clang-format on
  }

  private renderExplanations(description: string, explanations: Protocol.Page.BackForwardCacheNotRestoredExplanation[]):
      LitHtml.TemplateResult {
    return LitHtml.html`
      ${
        explanations.length > 0 ?
            LitHtml.html`
          <${ReportView.ReportView.ReportKey.litTagName}>${description}</${ReportView.ReportView.ReportKey.litTagName}>
          <${ReportView.ReportView.ReportValue.litTagName}>${
                explanations.map(explanation => LitHtml.html`<div>${explanation.reason}</div>`)}</${
                ReportView.ReportView.ReportValue.litTagName}>
        ` :
            LitHtml.nothing}
    `;
  }
}
