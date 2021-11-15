// Copyright (c) 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as Platform from '../../core/platform/platform.js';
import * as i18n from '../../core/i18n/i18n.js';
import * as Buttons from '../../ui/components/buttons/buttons.js';
import * as SDK from '../../core/sdk/sdk.js';
import * as LitHtml from '../../ui/lit-html/lit-html.js';
import * as ReportView from '../../ui/components/report_view/report_view.js';
import * as UI from '../../ui/legacy/legacy.js';
import * as Protocol from '../../generated/protocol.js';
import * as IconButton from '../../ui/components/icon_button/icon_button.js';

import {NotRestoredReasonDescription} from './BackForwardCacheStrings.js';
import backForwardCacheViewStyles from './backForwardCacheView.css.js';

const UIStrings = {
  /**
   * @description Title text in Back-Forward Cache view of the Application panel
   */
  mainFrame: 'Main Frame',
  /**
   * @description Title text in Back-Forward Cache view of the Application panel
   */
  backForwardCacheTitle: 'Back-Forward Cache',
  /**
   * @description Status text for the status of the main frame
   */
  unavailable: 'unavailable',
  /**
   * @description Entry name text in the Back-Forward Cache view of the Application panel
   */
  url: 'URL:',
  /**
   * @description Entry name text in the Back-Forward Cache view of the Application panel
   */
  bfcacheStatus: 'Back-Forward Cache Status: ',
  /**
   * @description Status text for the status of the Back-Forward Cache status
   */
  unknown: 'unknown',
  /**
   * @description Status text for the status of the Back-Forward Cache status indicating that
   * the Back-Forward Cache was not used and a normal navigation occured instead.
   */
  normalNavigation:
      'Not served from from Back/forward cache. The last navigation was a normal navigation event. To trigger Back/forward cache, use Chrome\'s Back/forward button. ',
  /**
   * @description Status text for the status of the Back-Forward Cache status indicating that
   * the Back-Forward Cache was used to restore the page instead of reloading it.
   */
  restoredFromBFCache: 'Successfully served from Back/forward cache. ',
  /**
   * @description Label for a list of reasons which prevent the page from being eligible for
   * Back-Forward Cache. These reasons are actionable i.e. they can be cleaned up to make the
   * page eligible for Back-Forward Cache.
   */
  pageSupportNeeded: 'Actionable',
  /**
   * @description Explanation for actionable items which prevent the page from being eligible
   * for Back-Forward Cache.
   */
  pageSupportNeededExplanation:
      'These reasons are actionable i.e. they can be cleaned up to make the page eligible for Back-Forward Cache.',
  /**
   * @description Label for a list of reasons which prevent the page from being eligible for
   * Back-Forward Cache. These reasons are circumstantial / not actionable i.e. they cannot be
   * cleaned up by developers to make the page eligible for Back-Forward Cache.
   */
  circumstantial: 'Not Actionable',
  /**
   * @description Explanation for circumstantial/non-actionable items which prevent the page from being eligible
   * for Back-Forward Cache.
   */
  circumstantialExplanation:
      'These reasons are not actionable i.e. caching was prevented by something outside of the direct control of the page.',
  /**
   * @description Label for a list of reasons which prevent the page from being eligible for
   * Back-Forward Cache. These reasons are pending support by chrome i.e. in a future version
   * of chrome they will not prevent Back-Forward Cache usage anymore.
   */
  supportPending: 'Pending Support',
  /**
   * @description Button name for showing whether BFCache is available in the pages.
   */
  runTest: 'Test Back/forward cache',
  /**
   * @description Explanation of being during running test
   */
  runningTest: 'Running Test...',
  /**
   * @description Explanation of the Back-Forward Cache Test when the users open the Back-Forward Cache page of the devtools first
   */
  bfCacheInitialExplanation:
      'Checks if this site in its current state is being served from Back-Forward Cache. This can change at any time based on these Back-Forward Cache criteria.',
  /**
   * @description Link Text about explanation of Back-Forward Cache
   */
  learnMore: 'Learn more: Back-Forward Cache eligibility',
  /**
   * @description Explanation for 'pending support' items which prevent the page from being eligible
   * for Back-Forward Cache.
   */
  supportPendingExplanation:
      'Chrome support for these reasons is pending i.e. they will not prevent the page from being eligible for Back-Forward Cache in a future version of Chrome.',
};
const str_ = i18n.i18n.registerUIStrings('panels/application/BackForwardCacheView.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

const enum ScreenStatusType {
  First = 'First',
  Running = 'Running',
  Result = 'Result',
}

export class BackForwardCacheView extends UI.ThrottledWidget.ThrottledWidget {
  constructor() {
    super(true, 1000);
    this.getMainResourceTreeModel()?.addEventListener(
        SDK.ResourceTreeModel.Events.MainFrameNavigated, this.onBackForwardCacheUpdate, this);
    this.getMainResourceTreeModel()?.addEventListener(
        SDK.ResourceTreeModel.Events.BackForwardCacheDetailsUpdated, this.onBackForwardCacheUpdate, this);
    this.update();
    this.screenStatus = ScreenStatusType.First;
  }

  private screenStatus: ScreenStatusType;

  wasShown(): void {
    super.wasShown();
    this.registerCSSFiles([backForwardCacheViewStyles]);
  }

  private onBackForwardCacheUpdate(): void {
    this.update();
  }

  async doUpdate(): Promise<void> {
    const html = LitHtml.html`
      ${this.renderMainFrameInformation(this.getMainFrame())}
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

  private renderBackForwardCacheTestResult(): void {
    SDK.TargetManager.TargetManager.instance().removeModelListener(
        SDK.ResourceTreeModel.ResourceTreeModel, SDK.ResourceTreeModel.Events.FrameNavigated,
        this.renderBackForwardCacheTestResult, this);
    this.screenStatus = ScreenStatusType.Result;
    this.update();
  }

  private async goBackOneHistoryEntry(): Promise<void> {
    SDK.TargetManager.TargetManager.instance().removeModelListener(
        SDK.ResourceTreeModel.ResourceTreeModel, SDK.ResourceTreeModel.Events.FrameNavigated,
        this.goBackOneHistoryEntry, this);
    this.screenStatus = ScreenStatusType.Running;
    this.update();
    const mainTarget = SDK.TargetManager.TargetManager.instance().mainTarget();
    if (!mainTarget) {
      return;
    }
    const resourceTreeModel = mainTarget.model(SDK.ResourceTreeModel.ResourceTreeModel);
    if (!resourceTreeModel) {
      return;
    }
    const historyResults = await resourceTreeModel.navigationHistory();
    if (!historyResults) {
      return;
    }
    SDK.TargetManager.TargetManager.instance().addModelListener(
        SDK.ResourceTreeModel.ResourceTreeModel, SDK.ResourceTreeModel.Events.FrameNavigated,
        this.renderBackForwardCacheTestResult, this);
    resourceTreeModel.navigateToHistoryEntry(historyResults.entries[historyResults.currentIndex - 1]);
  }

  private async navigateAwayAndBack(): Promise<void> {
    // Checking BFCache Compatibility

    const mainTarget = SDK.TargetManager.TargetManager.instance().mainTarget();
    if (!mainTarget) {
      return;
    }
    const resourceTreeModel = mainTarget.model(SDK.ResourceTreeModel.ResourceTreeModel);

    if (resourceTreeModel) {
      // This event is removed by inside of goBackOneHistoryEntry().
      SDK.TargetManager.TargetManager.instance().addModelListener(
          SDK.ResourceTreeModel.ResourceTreeModel, SDK.ResourceTreeModel.Events.FrameNavigated,
          this.goBackOneHistoryEntry, this);

      // We can know whether the current page can use BFCache
      // as the browser navigates to another unrelated page and goes back to the current page.
      // We chose "chrome://version" because it must be cross-site.
      // Ideally, We want to have our own testing page like "chrome: //bfcache-test".
      resourceTreeModel.navigate('chrome://version/');
    }
  }

  private renderMainFrameInformation(mainFrame: SDK.ResourceTreeModel.ResourceTreeFrame|null): LitHtml.TemplateResult {
    const data = {reportTitle: i18nString(UIStrings.backForwardCacheTitle)};
    if (!mainFrame) {
      // clang-format off
      return LitHtml.html`
        <${ReportView.ReportView.Report.litTagName} .data=${data as ReportView.ReportView.ReportData}>
          <${ReportView.ReportView.ReportKey.litTagName}>
            ${i18nString(UIStrings.mainFrame)}
          </${ReportView.ReportView.ReportKey.litTagName}>
          <${ReportView.ReportView.ReportValue.litTagName}>
            ${i18nString(UIStrings.unavailable)}
          </${ReportView.ReportView.ReportValue.litTagName}>
        </${ReportView.ReportView.Report.litTagName}>
      `;
      // clang-format on
    }
    switch (this.screenStatus) {
      case ScreenStatusType.First:
        // clang-format off
        return LitHtml.html`
        <${ReportView.ReportView.Report.litTagName} .data=${data as ReportView.ReportView.ReportData}>
          <div class='report-explanation'>
            <${ReportView.ReportView.ReportSection.litTagName}>
              ${i18nString(UIStrings.bfCacheInitialExplanation)}
            </${ReportView.ReportView.ReportSection.litTagName}>
            <${ReportView.ReportView.ReportSection.litTagName}>
              <x-link href="https://web.dev/bfcache/" class="link">${i18nString(UIStrings.learnMore)}</x-link>
            </${ReportView.ReportView.ReportSection.litTagName}>
            <${ReportView.ReportView.ReportSection.litTagName}>
              <${Buttons.Button.Button.litTagName}
                .variant=${Buttons.Button.Variant.PRIMARY}
                @click=${this.navigateAwayAndBack}>
                ${i18nString(UIStrings.runTest)}
            </${Buttons.Button.Button.litTagName}>
            </${ReportView.ReportView.ReportSection.litTagName}>
          </div>
        </${ReportView.ReportView.Report.litTagName}>
        `;
        // clang-format on
      case ScreenStatusType.Running:
        // clang-format off
        return LitHtml.html`
        <${ReportView.ReportView.Report.litTagName} .data=${data as ReportView.ReportView.ReportData}>
          <${ReportView.ReportView.ReportSectionHeader.litTagName}>
            ${i18nString(UIStrings.runningTest)}
          </${ReportView.ReportView.ReportSectionHeader.litTagName}>
        </${ReportView.ReportView.Report.litTagName}>
        `;
        // clang-format on
      case ScreenStatusType.Result:
        // clang-format off
        return LitHtml.html`
        <${ReportView.ReportView.Report.litTagName}>
          <${ReportView.ReportView.ReportSectionHeader.litTagName}>
            ${i18nString(UIStrings.bfcacheStatus)}
          </${ReportView.ReportView.ReportSectionHeader.litTagName}>
          ${this.renderBackForwardCacheStatus(mainFrame.backForwardCacheDetails.restoredFromCache)}
          <${ReportView.ReportView.ReportSection.litTagName}>
            <div class="key">
              ${i18nString(UIStrings.url)}
            </div>
            <${ReportView.ReportView.ReportValue.litTagName}>
              ${mainFrame.url}
            </${ReportView.ReportView.ReportValue.litTagName}>
          </${ReportView.ReportView.ReportSection.litTagName}>
          <${ReportView.ReportView.ReportSection.litTagName}>
            <${Buttons.Button.Button.litTagName}
                  .variant=${Buttons.Button.Variant.PRIMARY}
                  @click=${this.navigateAwayAndBack}>
                  ${i18nString(UIStrings.runTest)}
            </${Buttons.Button.Button.litTagName}>
          </${ReportView.ReportView.ReportSection.litTagName}>
          <${ReportView.ReportView.ReportSectionDivider.litTagName}>
          </${ReportView.ReportView.ReportSectionDivider.litTagName}>
          ${this.maybeRenderExplanations(mainFrame.backForwardCacheDetails.explanations)}
          <${ReportView.ReportView.ReportSection.litTagName}>
            <x-link href="https://web.dev/bfcache/" class="link">${i18nString(UIStrings.learnMore)}</x-link>
          </${ReportView.ReportView.ReportSection.litTagName}>
        </${ReportView.ReportView.Report.litTagName}>
    `;
        // clang-format on
    }
  }

  private renderBackForwardCacheStatus(status: boolean|undefined): LitHtml.TemplateResult {
    // To add the icons in the future
    switch (status) {
      case true:
        // clang-format off
        return LitHtml.html`
          <${ReportView.ReportView.ReportSection.litTagName}>
            <${IconButton.Icon.Icon.litTagName} class="inline-icon" .data=${{
          iconName: 'ic_checkmark_16x16',
          color: 'green',
          width: '16px',
          height: '16px',
        } as IconButton.Icon.IconData} title=${i18nString(UIStrings.mainFrame)}>
            </${IconButton.Icon.Icon.litTagName}>
            ${i18nString(UIStrings.restoredFromBFCache)}
          </${ReportView.ReportView.ReportSection.litTagName}>
        `;
        // clang-format on
      case false:
        // clang-format off
        return LitHtml.html`
          <${ReportView.ReportView.ReportSection.litTagName}>
            ${i18nString(UIStrings.normalNavigation)}
          </${ReportView.ReportView.ReportSection.litTagName}>
        `;
        // clang-format on
    }
    // clang-format off
    return LitHtml.html`
    <${ReportView.ReportView.ReportSection.litTagName}>
      ${i18nString(UIStrings.unknown)}
    </${ReportView.ReportView.ReportSection.litTagName}>
    `;
    // clang-format on
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
      ${this.renderExplanations(i18nString(UIStrings.pageSupportNeeded), i18nString(UIStrings.pageSupportNeededExplanation), pageSupportNeeded)}
      ${this.renderExplanations(i18nString(UIStrings.supportPending), i18nString(UIStrings.supportPendingExplanation), supportPending)}
      ${this.renderExplanations(i18nString(UIStrings.circumstantial), i18nString(UIStrings.circumstantialExplanation), circumstantial)}
    `;
    // clang-format on
  }

  private renderExplanations(
      category: Platform.UIString.LocalizedString, explainerText: Platform.UIString.LocalizedString,
      explanations: Protocol.Page.BackForwardCacheNotRestoredExplanation[]): LitHtml.TemplateResult {
    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
    return LitHtml.html`
      ${explanations.length > 0 ? LitHtml.html`
        <${ReportView.ReportView.ReportSectionHeader.litTagName}>
          ${category}
          <${IconButton.Icon.Icon.litTagName} class="inline-icon" .data=${{
            iconName: 'help_outline',
            color: 'var(--color-text-secondary)',
            width: '16px',
            height: '16px',
            } as IconButton.Icon.IconData} title=${explainerText}></${IconButton.Icon.Icon.litTagName}>
        </${ReportView.ReportView.ReportSectionHeader.litTagName}>
          ${explanations.map(explanation => this.renderReason(explanation))}
      ` : LitHtml.nothing}
    `;
    // clang-format on
  }

  private renderReason(explanation: Protocol.Page.BackForwardCacheNotRestoredExplanation): LitHtml.TemplateResult {
    // clang-format off
    return LitHtml.html`
      <${ReportView.ReportView.ReportSection.litTagName}>
        ${
        (explanation.reason in NotRestoredReasonDescription) ?
            LitHtml.html`${NotRestoredReasonDescription[explanation.reason].name()}` :
            LitHtml.nothing}
      </${ReportView.ReportView.ReportSection.litTagName}>
      <${ReportView.ReportView.ReportSection.litTagName}>
        <div class='gray-text'>
          ${explanation.reason}
        </div>
      </${ReportView.ReportView.ReportSection.litTagName}>
    `;
    // clang-format on
  }
}
