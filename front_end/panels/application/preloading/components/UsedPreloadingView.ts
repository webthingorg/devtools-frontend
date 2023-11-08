// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../../../core/common/common.js';
import * as i18n from '../../../../core/i18n/i18n.js';
import type * as Platform from '../../../../core/platform/platform.js';
import {assertNotNullOrUndefined} from '../../../../core/platform/platform.js';
import * as SDK from '../../../../core/sdk/sdk.js';
import * as Protocol from '../../../../generated/protocol.js';
import * as ComponentHelpers from '../../../../ui/components/helpers/helpers.js';
import * as IconButton from '../../../../ui/components/icon_button/icon_button.js';
import * as LegacyWrapper from '../../../../ui/components/legacy_wrapper/legacy_wrapper.js';
import * as Coordinator from '../../../../ui/components/render_coordinator/render_coordinator.js';
import * as ReportView from '../../../../ui/components/report_view/report_view.js';
import * as UI from '../../../../ui/legacy/legacy.js';
import * as LitHtml from '../../../../ui/lit-html/lit-html.js';
import * as PreloadingHelper from '../helper/helper.js';

import * as MismatchedPreloadingGrid from './MismatchedPreloadingGrid.js';
import {prefetchFailureReason, prerenderFailureReason} from './PreloadingString.js';
import usedPreloadingStyles from './usedPreloadingView.css.js';

const UIStrings = {
  /**
   *@description Header for preloading status.
   */
  speculativeLoadingStatusForThisPage: 'Speculative loading status for this page',
  /**
   *@description Label for failure reason of preloeading
   */
  detailsFailureReason: 'Failure reason',
  /**
   *@description Message that tells this page was prerendered.
   */
  downgradedPrefetchUsed:
      'The initiating page attempted to prerender this page\'s URL. The prerender failed, but the resulting response body was still used as a prefetch.',
  /**
   *@description Message that tells this page was prefetched.
   */
  prefetchUsed: 'This page was successfully prefetched.',
  /**
   *@description Message that tells this page was prerendered.
   */
  prerenderUsed: 'This page was successfully prerendered.',
  /**
   *@description Message that tells this page was prefetched.
   */
  prefetchFailed:
      'The initiating page attempted to prefetch this page\'s URL, but the prefetch failed, so a full navigation was performed instead.',
  /**
   *@description Message that tells this page was prerendered.
   */
  prerenderFailed:
      'The initiating page attempted to prerender this page\'s URL, but the prerender failed, so a full navigation was performed instead.',
  /**
   *@description Message that tells this page was not preloaded.
   */
  noPreloads: 'The initiating page did not attempt to speculatively load this page\'s URL.',
  /**
   *@description Header for current URL.
   */
  currentURL: 'Current URL',
  /**
   *@description Header for mismatched preloads.
   */
  preloadedURLs: 'URLs being speculatively loaded by the initiating page',
  /**
   *@description Header for summary.
   */
  speculativeLoadsInitiatedByThisPage: 'Speculative loads initiated by this page',
  /**
   *@description Link text to reveal rules.
   */
  viewAllRules: 'View all speculation rules',
  /**
   *@description Link text to reveal preloads.
   */
  viewAllSpeculations: 'View all speculations',
  /**
   *@description Link to learn more about Preloading
   */
  learnMore: 'Learn more: Speculative loading on developer.chrome.com',
  /**
   *@description FIXME
   */
  badgeSuccess: 'Success',
  /**
   *@description Label for button which links to Issues tab, specifying how many issues there are.
   */
  badgeSuccessWithCount: '{n, plural, =0 {No success} =1 {# success} other {# success}}',
  /**
   *@description FIXME
   */
  badgeFailure: 'Failure',
  /**
   *@description Label for button which links to Issues tab, specifying how many issues there are.
   */
  badgeFailureWithCount: '{n, plural, =0 {No failure} =1 {# failure} other {# failures}}',
  /**
   *@description FIXME
   */
  badgeNoPreloads: 'No preloads',
  /**
   *@description Label for button which links to Issues tab, specifying how many issues there are.
   */
  badgeNotCompletedPreloadsWithCount: '{n, plural, =1 {# not completed} other {# not completed}}',
};
const str_ = i18n.i18n.registerUIStrings('panels/application/preloading/components/UsedPreloadingView.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

const coordinator = Coordinator.RenderCoordinator.RenderCoordinator.instance();

export interface UsedPreloadingViewData {
  pageURL: Platform.DevToolsPath.UrlString;
  previousAttempts: SDK.PreloadingModel.PreloadingAttempt[];
  currentAttempts: SDK.PreloadingModel.PreloadingAttempt[];
}

// TODO(crbug.com/1167717): Make this a const enum again
// eslint-disable-next-line rulesdir/const_enum
export enum UsedKind {
  DowngradedPrerenderToPrefetchAndUsed = 'DowngradedPrerenderToPrefetchAndUsed',
  PrefetchUsed = 'PrefetchUsed',
  PrerenderUsed = 'PrerenderUsed',
  PrefetchFailed = 'PrefetchFailed',
  PrerenderFailed = 'PrerenderFailed',
  NoPreloads = 'NoPreloads',
}

export class UsedPreloadingView extends LegacyWrapper.LegacyWrapper.WrappableComponent<UI.Widget.VBox> {
  static readonly litTagName = LitHtml.literal`devtools-resources-used-preloading-view`;

  readonly #shadow = this.attachShadow({mode: 'open'});
  #data: UsedPreloadingViewData = {
    pageURL: '' as Platform.DevToolsPath.UrlString,
    previousAttempts: [],
    currentAttempts: [],
  };

  connectedCallback(): void {
    this.#shadow.adoptedStyleSheets = [usedPreloadingStyles];
  }

  set data(data: UsedPreloadingViewData) {
    this.#data = data;
    void this.#render();
  }

  async #render(): Promise<void> {
    await coordinator.write('UsedPreloadingView render', () => {
      LitHtml.render(this.#renderInternal(), this.#shadow, {host: this});
    });
  }

  #renderInternal(): LitHtml.LitTemplate {
    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
    return LitHtml.html`
      <${ReportView.ReportView.Report.litTagName}>
        ${this.#speculativeLoadingStatusForThisPageSections()}
  
        <${ReportView.ReportView.ReportSectionDivider.litTagName}></${
          ReportView.ReportView.ReportSectionDivider.litTagName}>

        ${this.#speculationsInitiatedByThisPageSummarySections()}

        <${ReportView.ReportView.ReportSectionDivider.litTagName}></${
          ReportView.ReportView.ReportSectionDivider.litTagName}>

        <${ReportView.ReportView.ReportSection.litTagName}>
          ${UI.XLink.XLink.create('https://developer.chrome.com/blog/prerender-pages/', i18nString(UIStrings.learnMore), 'link')}
        </${ReportView.ReportView.ReportSection.litTagName}>
      </${ReportView.ReportView.Report.litTagName}>
    `;
    // clang-format on
  }

  #speculativeLoadingStatusForThisPageSections(): LitHtml.LitTemplate {
    const forThisPage = this.#data.previousAttempts.filter(attempt => attempt.key.url === this.#data.pageURL);
    const prefetch =
        forThisPage.filter(attempt => attempt.key.action === Protocol.Preload.SpeculationAction.Prefetch)[0];
    const prerender =
        forThisPage.filter(attempt => attempt.key.action === Protocol.Preload.SpeculationAction.Prerender)[0];

    let kind = UsedKind.NoPreloads;
    // Prerender -> prefetch downgrade case
    //
    // This code does not handle the case SpecRules designate these preloads rather than prerenderer automatically downgrade prerendering.
    // TODO(https://crbug.com/1410709): Improve this logic once automatic downgrade implemented.
    if (prerender?.status === SDK.PreloadingModel.PreloadingStatus.Failure &&
        prefetch?.status === SDK.PreloadingModel.PreloadingStatus.Success) {
      kind = UsedKind.DowngradedPrerenderToPrefetchAndUsed;
    } else if (prefetch?.status === SDK.PreloadingModel.PreloadingStatus.Success) {
      kind = UsedKind.PrefetchUsed;
    } else if (prerender?.status === SDK.PreloadingModel.PreloadingStatus.Success) {
      kind = UsedKind.PrerenderUsed;
    } else if (prefetch?.status === SDK.PreloadingModel.PreloadingStatus.Failure) {
      kind = UsedKind.PrefetchFailed;
    } else if (prerender?.status === SDK.PreloadingModel.PreloadingStatus.Failure) {
      kind = UsedKind.PrerenderFailed;
    } else {
      kind = UsedKind.NoPreloads;
    }

    let badge;
    let basicMessage;
    switch (kind) {
      case UsedKind.DowngradedPrerenderToPrefetchAndUsed:
        basicMessage = LitHtml.html`${i18nString(UIStrings.downgradedPrefetchUsed)}`;
        break;
      case UsedKind.PrefetchUsed:
        badge = this.#successBadge();
        basicMessage = LitHtml.html`${i18nString(UIStrings.prefetchUsed)}`;
        break;
      case UsedKind.PrerenderUsed:
        badge = this.#successBadge();
        basicMessage = LitHtml.html`${i18nString(UIStrings.prerenderUsed)}`;
        break;
      case UsedKind.PrefetchFailed:
        badge = this.#failureBadge();
        basicMessage = LitHtml.html`${i18nString(UIStrings.prefetchFailed)}`;
        break;
      case UsedKind.PrerenderFailed:
        badge = this.#failureBadge();
        basicMessage = LitHtml.html`${i18nString(UIStrings.prerenderFailed)}`;
        break;
      case UsedKind.NoPreloads:
        badge = this.#neutralBadgeNoPreloads();
        basicMessage = LitHtml.html`${i18nString(UIStrings.noPreloads)}`;
        break;
    }

    let maybeFailureReasonMessage;
    if (kind === UsedKind.PrefetchFailed) {
      assertNotNullOrUndefined(prefetch);
      maybeFailureReasonMessage = prefetchFailureReason(prefetch as SDK.PreloadingModel.PrefetchAttempt);
    } else if (kind === UsedKind.PrerenderFailed || kind === UsedKind.DowngradedPrerenderToPrefetchAndUsed) {
      assertNotNullOrUndefined(prerender);
      maybeFailureReasonMessage = prerenderFailureReason(prerender as SDK.PreloadingModel.PrerenderAttempt);
    }

    let maybeFailureReason: LitHtml.LitTemplate = LitHtml.nothing;
    if (maybeFailureReasonMessage !== undefined) {
      // Disabled until https://crbug.com/1079231 is fixed.
      // clang-format off
      maybeFailureReason = LitHtml.html`
      <${ReportView.ReportView.ReportSectionHeader.litTagName}>${i18nString(UIStrings.detailsFailureReason)}</${
        ReportView.ReportView.ReportSectionHeader.litTagName}>
      <${ReportView.ReportView.ReportSection.litTagName}>
        ${maybeFailureReasonMessage}
      </${ReportView.ReportView.ReportSection.litTagName}>
      `;
      // clang-format on
    }

    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
    return LitHtml.html`
      <${ReportView.ReportView.ReportSectionHeader.litTagName}>${i18nString(UIStrings.speculativeLoadingStatusForThisPage)}</${
        ReportView.ReportView.ReportSectionHeader.litTagName}>
      <${ReportView.ReportView.ReportSection.litTagName}>
<div>
<div class="status-badge-wrapper">
${badge}
</div>
<div>
        ${basicMessage}
</div>
</div>
      </${ReportView.ReportView.ReportSection.litTagName}>

      ${maybeFailureReason}

      ${this.#maybeMismatchedSections(kind)}
    `;
    // clang-format on
  }

  #maybeMismatchedSections(kind: UsedKind): LitHtml.LitTemplate {
    if (kind !== UsedKind.NoPreloads || this.#data.previousAttempts.length === 0) {
      return LitHtml.nothing;
    }

    const rows = this.#data.previousAttempts.map(attempt => {
      return {
        url: attempt.key.url,
        action: attempt.key.action,
        status: attempt.status,
      };
    });
    const data = {
      pageURL: this.#data.pageURL,
      rows,
    };

    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
    return LitHtml.html`
      <${ReportView.ReportView.ReportSectionHeader.litTagName}>${i18nString(UIStrings.currentURL)}</${
        ReportView.ReportView.ReportSectionHeader.litTagName}>
      <${ReportView.ReportView.ReportSection.litTagName}>
${UI.XLink.XLink.create(this.#data.pageURL, undefined, 'link')}
      </${ReportView.ReportView.ReportSection.litTagName}>

      <${ReportView.ReportView.ReportSectionHeader.litTagName}>${i18nString(UIStrings.preloadedURLs)}</${
        ReportView.ReportView.ReportSectionHeader.litTagName}>
      <${ReportView.ReportView.ReportSection.litTagName}>
        <${MismatchedPreloadingGrid.MismatchedPreloadingGrid.litTagName}
          .data=${data as MismatchedPreloadingGrid.MismatchedPreloadingGridData}></${
          MismatchedPreloadingGrid.MismatchedPreloadingGrid.litTagName}>
      </${ReportView.ReportView.ReportSection.litTagName}>
    `;
    // clang-format on
  }

  #speculationsInitiatedByThisPageSummarySections(): LitHtml.LitTemplate {
    const revealRuleSetView = (): void => {
      void Common.Revealer.reveal(new PreloadingHelper.PreloadingForward.RuleSetView(null));
    };
    const revealAttemptViewWithFilter = async(): Promise<void> => {
      await Common.Revealer.reveal(new PreloadingHelper.PreloadingForward.AttemptViewWithFilter(null));
    };

    const readyCount =
        this.#data.currentAttempts.filter(attempt => attempt.status === SDK.PreloadingModel.PreloadingStatus.Ready)
            .length;
    const failureCount =
        this.#data.currentAttempts.filter(attempt => attempt.status === SDK.PreloadingModel.PreloadingStatus.Failure)
            .length;
    const otherCount = this.#data.currentAttempts.length - (readyCount + failureCount);
    console.log('HOGEHOGEHOGE', this.#data.currentAttempts.length, readyCount, failureCount, otherCount);
    const badges = [];
    if (this.#data.currentAttempts.length === 0) {
      badges.push(this.#badgeNeutral(i18nString(UIStrings.badgeNoPreloads)));
    }
    if (readyCount > 0) {
      badges.push(this.#successBadge(readyCount));
    }
    if (otherCount > 0) {
      badges.push(this.#badgeNeutral(i18nString(UIStrings.badgeNotCompletedPreloadsWithCount, {n: otherCount})));
    }
    if (failureCount > 0) {
      badges.push(this.#failureBadge(failureCount));
    }

    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
    return LitHtml.html`
      <${ReportView.ReportView.ReportSectionHeader.litTagName}>${i18nString(UIStrings.speculativeLoadsInitiatedByThisPage)}</${
        ReportView.ReportView.ReportSectionHeader.litTagName}>
      <${ReportView.ReportView.ReportSection.litTagName}>
<div>
<div class="status-badge-wrapper">
${badges}
</div>

<div>
<a class="link devtools-link" @click=${revealRuleSetView}>
            ${i18nString(UIStrings.viewAllRules)}
          </a>
・
<a class="link devtools-link" @click=${revealAttemptViewWithFilter}>
           ${i18nString(UIStrings.viewAllSpeculations)}
          </a>
      </${ReportView.ReportView.ReportSection.litTagName}>
</div>
</div>
    `;
    // clang-format on
  }

  #successBadge(count?: number): LitHtml.LitTemplate {
    let message;
    if (count === undefined) {
      message = i18nString(UIStrings.badgeSuccess);
    } else {
      message = i18nString(UIStrings.badgeSuccessWithCount, {n: count});
    }
    return LitHtml.html`
<span class="status-badge status-badge-success">
        <${IconButton.Icon.Icon.litTagName}
            .data=${{
      iconName: 'check-circle',
      color: 'var(--icon-default)',
      width: '16px',
    } as IconButton.Icon.IconWithName}
          >
          </${IconButton.Icon.Icon.litTagName}><span>${message}</span></span>
`;
  }

  #failureBadge(count?: number): LitHtml.LitTemplate {
    let message;
    if (count === undefined) {
      message = i18nString(UIStrings.badgeFailure);
    } else {
      message = i18nString(UIStrings.badgeFailureWithCount, {n: count});
    }
    return LitHtml.html`
<span class="status-badge status-badge-failure">
        <${IconButton.Icon.Icon.litTagName}
            .data=${{
      iconName: 'cross-circle',
      color: 'var(--icon-default)',
      width: '16px',
    } as IconButton.Icon.IconWithName}
          >
          </${IconButton.Icon.Icon.litTagName}><span>${message}</span></span>
`;
  }

  #neutralBadgeNoPreloads(): LitHtml.LitTemplate {
    const message = i18nString(UIStrings.badgeNoPreloads);
    return LitHtml.html`
<span class="status-badge status-badge-neutral">
        <${IconButton.Icon.Icon.litTagName}
            .data=${{
      iconName: 'clear',
      color: 'var(--icon-default)',
      width: '16px',
    } as IconButton.Icon.IconWithName}
          >
          </${IconButton.Icon.Icon.litTagName}><span>${message}</span></span>
`;
  }

  #badgeNeutral(message: string): LitHtml.LitTemplate {
    return LitHtml.html`
<span class="status-badge status-badge-neutral">
        <${IconButton.Icon.Icon.litTagName}
            .data=${{
      iconName: 'clear',
      color: 'var(--icon-default)',
      width: '16px',
    } as IconButton.Icon.IconWithName}
          >
          </${IconButton.Icon.Icon.litTagName}><span>${message}</span></span>
`;
  }
}

ComponentHelpers.CustomElements.defineComponent('devtools-resources-used-preloading-view', UsedPreloadingView);

declare global {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLElementTagNameMap {
    'devtools-resources-used-preloading-view': UsedPreloadingView;
  }
}
