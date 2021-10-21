// Copyright (c) 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as Platform from '../../core/platform/platform.js';
import * as i18n from '../../core/i18n/i18n.js';
import * as SDK from '../../core/sdk/sdk.js';
import * as LitHtml from '../../ui/lit-html/lit-html.js';
import * as ReportView from '../../ui/components/report_view/report_view.js';
import * as UI from '../../ui/legacy/legacy.js';
import * as Protocol from '../../generated/protocol.js';

import {NotRestoredReasonDescription} from './BackForwardCacheStrings.js';
import backForwardCacheViewStyles from './backForwardCacheView.css.js';

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
  /**
   * @description Status text for the status of the back-forward cache status indicating that
   * the back-forward cache was not used and a normal navigation occured instead.
   */
  normalNavigation: 'Normal navigation (Not restored from back-forward cache)',
  /**
   * @description Status text for the status of the back-forward cache status indicating that
   * the back-forward cache was used to restore the page instead of reloading it.
   */
  restoredFromBFCache: 'Restored from back-forward cache',
  /**
   * @description Category text for the reasons which need to be cleaned up on the websites in
   * order to make the page eligible for the back-forward cache.
   */
  pageSupportNeeded: 'Actionable',
  /**
   * @description Category text for the reasons which are circumstantial and cannot be addressed
   * by developers.
   */
  circumstantial: 'Not Actionable',
  /**
   * @description Explanation text appended to a reason why the usage of the back-forward cache
   * is not possible, if in a future version of Chrome this reason will not prevent the usage
   * of the back-forward cache anymore.
   */
  supportPending: 'Pending Support',
  /**
   * @description Button name for showing whether BFCache is available in the pages.
   */
  runTest: 'Run Test',
};
const str_ = i18n.i18n.registerUIStrings('panels/application/BackForwardCacheView.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

export class BackForwardCacheView extends UI.ThrottledWidget.ThrottledWidget {
  constructor() {
    super(true, 1000);
    this.getMainResourceTreeModel()?.addEventListener(
        SDK.ResourceTreeModel.Events.MainFrameNavigated, this.onBackForwardCacheUpdate, this);
    this.getMainResourceTreeModel()?.addEventListener(
        SDK.ResourceTreeModel.Events.BackForwardCacheDetailsUpdated, this.onBackForwardCacheUpdate, this);
    this.update();
  }

  wasShown(): void {
    super.wasShown();
    this.registerCSSFiles([backForwardCacheViewStyles]);
  }

  private onBackForwardCacheUpdate(): void {
    this.update();
  }

  async doUpdate(): Promise<void> {
    const data = {reportTitle: i18nString(UIStrings.backForwardCacheTitle)};
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

  private bfCacheTestButton!: HTMLButtonElement;

  private renderButton(): void {
    this.bfCacheTestButton = UI.UIUtils.createTextButton(
        i18nString(UIStrings.runTest), () => this.navigateAwayAndBack(), 'runTest-button',
        /* primary */ true);
    this.setDefaultFocusedElement(this.bfCacheTestButton);
    this.contentElement.style.overflow = 'auto';
  }

  private async goBackOneHistoryEntry(): Promise<void> {
    SDK.TargetManager.TargetManager.instance().removeModelListener(
        SDK.ResourceTreeModel.ResourceTreeModel, SDK.ResourceTreeModel.Events.FrameNavigated,
        this.goBackOneHistoryEntry, this);
    const mainTarget = SDK.TargetManager.TargetManager.instance().mainTarget();
    if (mainTarget) {
      const resourceTreeModel = mainTarget.model(SDK.ResourceTreeModel.ResourceTreeModel);
      if (resourceTreeModel) {
        const historyResults = await resourceTreeModel.navigationHistory();
        if (historyResults) {
          resourceTreeModel.navigateToHistoryEntry(historyResults.entries[historyResults.currentIndex - 1]);
        }
      }
    }
  }

  private async navigateAwayAndBack(): Promise<void> {
    // Checking BFCache Compatibility

    const mainTarget = SDK.TargetManager.TargetManager.instance().mainTarget();
    if (!mainTarget) {
      return;
    }
    const resourceTreeModel = mainTarget.model(SDK.ResourceTreeModel.ResourceTreeModel);

    // This event is removed by inside of goBackOneHistoryEntry().
    SDK.TargetManager.TargetManager.instance().addModelListener(
        SDK.ResourceTreeModel.ResourceTreeModel, SDK.ResourceTreeModel.Events.FrameNavigated,
        this.goBackOneHistoryEntry, this);

    if (resourceTreeModel) {
      // We can know whether the current page can use BFCache
      // as the browser navigates to another unrelated page and goes back to the current page.
      // We chose "chrome://version" because it must be cross-site.
      // Ideally, We want to have our own testing page like "chrome: //bfcache-test".
      resourceTreeModel.navigate('chrome://version/');
    }
  }

  private renderMainFrameInformation(mainFrame: SDK.ResourceTreeModel.ResourceTreeFrame|null): LitHtml.TemplateResult {
    this.renderButton();
    if (!mainFrame) {
      return LitHtml.html`<${ReportView.ReportView.ReportKey.litTagName}>${i18nString(UIStrings.mainFrame)}</${
          ReportView.ReportView.ReportKey.litTagName}>
      <${ReportView.ReportView.ReportValue.litTagName}>
      ${i18nString(UIStrings.unavailable)}
      </${ReportView.ReportView.ReportValue.litTagName}>`;
    }
    return LitHtml.html`
      <${ReportView.ReportView.ReportSectionHeader.litTagName}>${i18nString(UIStrings.lastMainFrameNavigation)}</${
        ReportView.ReportView.ReportSectionHeader.litTagName}>
      <${ReportView.ReportView.ReportSectionHeader.litTagName}>
      ${this.bfCacheTestButton}
      </${ReportView.ReportView.ReportSectionHeader.litTagName}>
      <${ReportView.ReportView.ReportKey.litTagName}>${i18nString(UIStrings.url)}</${
        ReportView.ReportView.ReportKey.litTagName}>
      <${ReportView.ReportView.ReportValue.litTagName}>${mainFrame.url}</${
        ReportView.ReportView.ReportValue.litTagName}>
      <${ReportView.ReportView.ReportKey.litTagName}>${i18nString(UIStrings.bfcacheStatus)}</${
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
        return i18nString(UIStrings.restoredFromBFCache);
      case false:
        return i18nString(UIStrings.normalNavigation);
    }
    return i18nString(UIStrings.unknown);
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
      ${this.renderExplanations(UIStrings.pageSupportNeeded, pageSupportNeeded)}
      ${this.renderExplanations(UIStrings.supportPending, supportPending)}
      ${this.renderExplanations(UIStrings.circumstantial, circumstantial)}
    `;
    // clang-format on
  }

  private renderExplanations(category: string, explanations: Protocol.Page.BackForwardCacheNotRestoredExplanation[]):
      LitHtml.TemplateResult {
    return LitHtml.html`
      ${
        explanations.length > 0 ? LitHtml.html`
          <${ReportView.ReportView.ReportKey.litTagName}>${category}</${ReportView.ReportView.ReportKey.litTagName}>
          <${ReportView.ReportView.ReportValue.litTagName}>
          <ul class='not-restored-reason-list'>${explanations.map(explanation => this.renderReason(explanation))}</ul>
          </${ReportView.ReportView.ReportValue.litTagName}>
        ` :
                                  LitHtml.nothing}
    `;
  }

  private renderReason(explanation: Protocol.Page.BackForwardCacheNotRestoredExplanation): LitHtml.TemplateResult {
    return LitHtml.html`
      <li>${explanation.reason} : ${
        (explanation.reason in NotRestoredReasonDescription) ?
            LitHtml.html`${NotRestoredReasonDescription[explanation.reason].name()}` :
            LitHtml.nothing} </li>
    `;
  }
}
