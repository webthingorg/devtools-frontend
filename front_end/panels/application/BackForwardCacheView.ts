// Copyright (c) 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as i18n from '../../core/i18n/i18n.js';
import * as SDK from '../../core/sdk/sdk.js';
import * as Protocol from '../../generated/protocol.js';
import * as Buttons from '../../ui/components/buttons/buttons.js';
import * as IconButton from '../../ui/components/icon_button/icon_button.js';
import * as ReportView from '../../ui/components/report_view/report_view.js';
import * as UI from '../../ui/legacy/legacy.js';
import * as LitHtml from '../../ui/lit-html/lit-html.js';

import {NotRestoredReasonDescription} from './BackForwardCacheStrings.js';
import backForwardCacheViewStyles from './backForwardCacheView.css.js';

const UIStrings = {
  /**
   * @description Title text in Back-forward Cache view of the Application panel
   */
  mainFrame: 'Main Frame',
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
  targetURL: 'Target URL',
  /**
   * @description Status text for the status of the back-forward cache status
   */
  unknown: 'unknown',
  /**
   * @description Status text for the status of the back-forward cache status indicating that
   * the back-forward cache was used to restore the page instead of reloading it.
   */
  restoredFromBFCache: 'Restored from back-forward cache',
  /**
   * @description Button name for showing whether BFCache is available in the pages.
   */
  runTest: 'Run Test',
  /**
   * @description Explanation of the BFcache Test when the users open the BFcache page of the devtools first
   */
  bfCacheInitialExplanation:
      'Checks if this site in its current state is being served from Back-forward Cache. This can change at any time based on these Back-Forward Cache criteria',
  /**
   * @description Explanation for the result when BFCache cannot be used
   */
  bfCacheEnable: 'Some issues prevent this site from being served from BackForward cache',
  /**
   * @description Link Text about explanation of BFCache
   */
  learnMore: 'Learn more:back-forward cache eligibility',
  /**
   * @description URL about explanation of BFCache
   */
  bfCacheURL: 'https://web.dev/bfcache/',
  /**
   * @description Explanation for 'pending support' items which prevent the page from being eligible
   * for back-forward cache.
   */
  testResult: 'Test Result',
  /**
   * @description Explanation of being during running test
   */
  runningTest: 'Running Test...',
};
const str_ = i18n.i18n.registerUIStrings('panels/application/BackForwardCacheView.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

export class BackForwardCacheView extends UI.ThrottledWidget.ThrottledWidget {
  constructor() {
    super(true, 1000);
    this.update();
    const mainFrame = this.getMainFrame();
    if (mainFrame) {
      this.bfCacheStatusHTML = LitHtml.html`
    <${ReportView.ReportView.ReportExplanation.litTagName}>
    <div style="display: block;">
    <div>
    <${ReportView.ReportView.ReportSection.litTagName}>
    <div>
    ${i18nString(UIStrings.bfCacheInitialExplanation)}
    </div>
    </${ReportView.ReportView.ReportSection.litTagName}>
    </div><div>
    <${ReportView.ReportView.ReportSection.litTagName}>
      <${Buttons.Button.Button.litTagName}
            class="runTest-button"
            .variant=${Buttons.Button.Variant.PRIMARY}
            @click=${this.navigateAwayAndBack}>
            ${i18nString(UIStrings.runTest)}
      </${Buttons.Button.Button.litTagName}>
    </${ReportView.ReportView.ReportSection.litTagName}>
    </${ReportView.ReportView.ReportExplanation.litTagName}>`;
    } else {
      this.bfCacheStatusHTML = LitHtml.html``;
    }
  }

  private bfCacheStatusHTML: LitHtml.TemplateResult;

  wasShown(): void {
    super.wasShown();
    this.registerCSSFiles([backForwardCacheViewStyles]);
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

  private renderBackForwardCacheTestResult(): void {
    SDK.TargetManager.TargetManager.instance().removeModelListener(
        SDK.ResourceTreeModel.ResourceTreeModel, SDK.ResourceTreeModel.Events.FrameNavigated,
        this.renderBackForwardCacheTestResult, this);

    this.bfCacheStatusHTML = this.getBackForwardCacheTestResultHTML();
    this.update();
  }

  private async goBackOneHistoryEntry(): Promise<void> {
    SDK.TargetManager.TargetManager.instance().removeModelListener(
        SDK.ResourceTreeModel.ResourceTreeModel, SDK.ResourceTreeModel.Events.FrameNavigated,
        this.goBackOneHistoryEntry, this);

    this.bfCacheStatusHTML = LitHtml.html`
      <${ReportView.ReportView.ReportSectionHeader.litTagName}>
        ${i18nString(UIStrings.runningTest)}
      </${ReportView.ReportView.ReportSectionHeader.litTagName}>
      `;

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
    if (!mainFrame) {
      return LitHtml.html`<${ReportView.ReportView.ReportKey.litTagName}>${i18nString(UIStrings.mainFrame)}</${
          ReportView.ReportView.ReportKey.litTagName}>
      <${ReportView.ReportView.ReportValue.litTagName}>
      ${i18nString(UIStrings.unavailable)}
      </${ReportView.ReportView.ReportValue.litTagName}>`;
    }
    return LitHtml.html`
      ${this.bfCacheStatusHTML}
      ${this.maybeRenderExplanations(mainFrame.backForwardCacheDetails.explanations)}
      <${ReportView.ReportView.ReportSection.litTagName}>
      <a href='${i18nString(UIStrings.bfCacheURL)}'>${i18nString(UIStrings.learnMore)}</a>
      </${ReportView.ReportView.ReportSection.litTagName}>
    `;
  }

  private getBackForwardCacheTestResultHTML(): LitHtml.TemplateResult {
    const mainFrame = this.getMainFrame();

    if (mainFrame) {
      const status = mainFrame.backForwardCacheDetails.restoredFromCache;
      switch (status) {
        case true:
          return LitHtml.html`
      <${ReportView.ReportView.ReportSection.litTagName}>
          <${Buttons.Button.Button.litTagName}
            class="runTest-button"
            .variant=${Buttons.Button.Variant.PRIMARY}
            @click=${this.navigateAwayAndBack}>
            ${i18nString(UIStrings.runTest)}
      </${Buttons.Button.Button.litTagName}>
      </${ReportView.ReportView.ReportSection.litTagName}>
      <${ReportView.ReportView.ReportSectionHeader.litTagName}>
        ${i18nString(UIStrings.testResult)}
      </${ReportView.ReportView.ReportSectionHeader.litTagName}>
      <${ReportView.ReportView.ReportSection.litTagName}>
          <${IconButton.Icon.Icon.litTagName} class="inline-icon" .data=${{
            iconName: 'ic_checkmark_16x16',
            color: 'green',
            width: '16px',
            height: '16px',
          } as IconButton.Icon.IconData} title=${i18nString(UIStrings.mainFrame)}></${IconButton.Icon.Icon.litTagName}>
          ${i18nString(UIStrings.restoredFromBFCache)}
      </${ReportView.ReportView.ReportSection.litTagName}>
      <${ReportView.ReportView.ReportSection.litTagName}>
      <${ReportView.ReportView.ReportKey.litTagName}>${i18nString(UIStrings.targetURL)}</${
              ReportView.ReportView.ReportKey.litTagName}>
      <${ReportView.ReportView.ReportValue.litTagName}>${mainFrame.url}</${
              ReportView.ReportView.ReportValue.litTagName}>
      </${ReportView.ReportView.ReportSection.litTagName}>
      `;
        case false:
          return LitHtml.html`
      <${ReportView.ReportView.ReportSection.litTagName}>
      <${Buttons.Button.Button.litTagName}
            .variant=${Buttons.Button.Variant.PRIMARY}
            @click=${this.navigateAwayAndBack}>
            ${i18nString(UIStrings.runTest)}
      </${Buttons.Button.Button.litTagName}>
      </${ReportView.ReportView.ReportSection.litTagName}>
      <${ReportView.ReportView.ReportSectionHeader.litTagName}>
        ${i18nString(UIStrings.testResult)}
      </${ReportView.ReportView.ReportSectionHeader.litTagName}>
      <${ReportView.ReportView.ReportSection.litTagName}>
      ${i18nString(UIStrings.bfCacheEnable)}
      </${ReportView.ReportView.ReportSection.litTagName}>
      <${ReportView.ReportView.ReportSection.litTagName}>
      <${ReportView.ReportView.ReportKey.litTagName}>${i18nString(UIStrings.targetURL)}</${
              ReportView.ReportView.ReportKey.litTagName}>
      <${ReportView.ReportView.ReportValue.litTagName}>${mainFrame.url}</${
              ReportView.ReportView.ReportValue.litTagName}>
      </${ReportView.ReportView.ReportSection.litTagName}>
      `;
      }
    }
    return LitHtml.html`${i18nString(UIStrings.unknown)}`;
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
      ${this.renderExplanations(pageSupportNeeded)}
      ${this.renderExplanations(supportPending)}
      ${this.renderExplanations(circumstantial)}
    `;
    // clang-format on
  }

  private renderExplanations(explanations: Protocol.Page.BackForwardCacheNotRestoredExplanation[]):
      LitHtml.TemplateResult {
    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
    return LitHtml.html`
      ${explanations.length > 0 ? LitHtml.html`
${explanations.map(explanation => this.renderReason(explanation))}
      ` : LitHtml.nothing}
    `;
    // clang-format on
  }

  private renderReason(explanation: Protocol.Page.BackForwardCacheNotRestoredExplanation): LitHtml.TemplateResult {
    return LitHtml.html`
      <${ReportView.ReportView.ReportExplanation.litTagName}>
      <${IconButton.Icon.Icon.litTagName} class="inline-icon" .data=${{
      iconName: 'circled_exclamation_icon',
      color: 'orange',
      width: '16px',
      height: '16px',
    } as IconButton.Icon.IconData} title=${i18nString(UIStrings.mainFrame)}></${IconButton.Icon.Icon.litTagName}>
      ${explanation.reason} : ${
        (explanation.reason in NotRestoredReasonDescription) ?
            LitHtml.html`${NotRestoredReasonDescription[explanation.reason].name()}` :
            LitHtml.nothing} </${ReportView.ReportView.ReportExplanation.litTagName}>
    `;
  }
}
