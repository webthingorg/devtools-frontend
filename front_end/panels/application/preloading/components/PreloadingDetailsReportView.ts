// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as i18n from '../../../../core/i18n/i18n.js';
import {assertNotNullOrUndefined} from '../../../../core/platform/platform.js';
import * as SDK from '../../../../core/sdk/sdk.js';
import * as Protocol from '../../../../generated/protocol.js';
import * as ComponentHelpers from '../../../../ui/components/helpers/helpers.js';
import * as Coordinator from '../../../../ui/components/render_coordinator/render_coordinator.js';
import * as ReportView from '../../../../ui/components/report_view/report_view.js';
import * as LitHtml from '../../../../ui/lit-html/lit-html.js';

import preloadingDetailsReportViewStyles from './preloadingDetailsReportView.css.js';

const UIStrings = {
  /**
   *@description Text in PreloadingDetailsReportView of the Application panel
   */
  selectAnElementForMoreDetails: 'Select an element for more details',
  /**
   *@description Text in details
   */
  detailsDetailedInformation: 'Detailed information',
  /**
   *@description Text in details
   */
  detailsAction: 'Action',
  /**
   *@description Text in details
   */
  detailsStatus: 'Status',
  /**
   *@description Text in details
   */
  detailsFailureReason: 'Failure reason',
  /**
   *@description Header of rule set
   */
  detailsRuleSet: 'Rule set',
  /**
   *@description Description: status
   */
  detailedStatusNotTriggered: 'Preloading attempt is not yet triggered.',
  /**
   *@description Description: status
   */
  detailedStatusPending: 'Preloading attempt is eligible but pending.',
  /**
   *@description Description: status
   */
  detailedStatusRunning: 'Preloading is running.',
  /**
   *@description Description: status
   */
  detailedStatusReady: 'Preloading finished and the result is ready for the next navigation.',
  /**
   *@description Description: status
   */
  detailedStatusSuccess: 'Preloading finished and used for a navigation.',
  /**
   *@description Description: status
   */
  detailedStatusFailure: 'Preloading failed.',
  // TODO(https://crbug.com/1410709): Improve these messages.
  /**
   *  Description text for PrerenderFinalStatus::kLowEndDevice.
   */
  prerenderFinalStatusLowEndDevice: 'Prerendering is disabled on low-end devices',
  /**
   *  Description text for PrerenderFinalStatus::kInvalidSchemeRedirect.
   */
  prerenderFinalStatusInvalidSchemeRedirect: 'Invalid redirect occured in prerendering navigation.',
  /**
   *  Description text for PrerenderFinalStatus::kInvalidSchemeNavigation.
   */
  prerenderFinalStatusInvalidSchemeNavigation: 'Invalid scheme occured in prerenedering navigation',
  /**
   *  Description text for PrerenderFinalStatus::kNavigationRequestBlockedByCsp.
   */
  prerenderFinalStatusNavigationRequestBlockedByCsp: 'The navigation request was blocked by a Content Security Policy',
  /**
   *  Description text for PrerenderFinalStatus::kMainFrameNavigation.
   */
  prerenderFinalStatusMainFrameNavigation:
      'Main frame navigation occured during prerendering. Currently, this is not allowed.',
  /**
   *  Description text for PrerenderFinalStatus::kMojoBinderPolicy.
   */
  prerenderFinalStatusMojoBinderPolicy: 'A forbidden JavaScript API was used in prerenedering.',
  /**
   *  Description text for PrerenderFinalStatus::kRendererProcessCrashed.
   */
  prerenderFinalStatusRendererProcessCrashed: 'Renderer process crashed during prerendering.',
  /**
   *  Description text for PrerenderFinalStatus::kRendererProcessKilled.
   */
  prerenderFinalStatusRendererProcessKilled: 'Renderer process killed during prerendering.',
  /**
   *  Description text for PrerenderFinalStatus::kDownload.
   */
  prerenderFinalStatusDownload: 'Downloading contents occured in prerendering navigation.',
  /**
   *  Description text for PrerenderFinalStatus::kNavigationBadHttpStatus.
   */
  prerenderFinalStatusNavigationBadHttpStatus: 'Bad HTTP status code received in prerendering navigation.',
  /**
   *  Description text for PrerenderFinalStatus::kClientCertRequested.
   */
  prerenderFinalStatusClientCertRequested:
      'A navigation during prerendering required selection of client certification.',
  /**
   *  Description text for PrerenderFinalStatus::kNavigationRequestNetworkError.
   */
  prerenderFinalStatusNavigationRequestNetworkError: 'A navigation during prerendering failed with network error.',
  /**
   *  Description text for PrerenderFinalStatus::kMaxNumOfRunningPrerendersExceeded.
   */
  prerenderFinalStatusMaxNumOfRunningPrerendersExceeded: 'Max number of prerendering exceeded.',
  /**
   *  Description text for PrerenderFinalStatus::kSslCertificateError.
   */
  prerenderFinalStatusSslCertificateError: 'SSL certification failed during prerendering navigation.',
  /**
   *  Description text for PrerenderFinalStatus::kLoginAuthRequested.
   */
  prerenderFinalStatusLoginAuthRequested: 'Prerendering was cancelled because login authentication requested.',
  /**
   *  Description text for PrerenderFinalStatus::kUaChangeRequiresReload.
   */
  prerenderFinalStatusUaChangeRequiresReload: 'Changing User Agent occured in prerendering navigation.',
  /**
   *  Description text for PrerenderFinalStatus::kBlockedByClient.
   */
  prerenderFinalStatusBlockedByClient: 'Some resource load was blocked.',
  /**
   *  Description text for PrerenderFinalStatus::kAudioOutputDeviceRequested.
   */
  prerenderFinalStatusAudioOutputDeviceRequested: 'Audito device was requested.',
  /**
   *  Description text for PrerenderFinalStatus::kMixedContent.
   */
  prerenderFinalStatusMixedContent: 'Mixed content is forbidden.',
  /**
   *  Description text for PrerenderFinalStatus::kTriggerBackgrounded.
   */
  prerenderFinalStatusTriggerBackgrounded: 'Prerendering was cancelled beacuse the page is in background.',
  /**
   *  Description text for PrerenderFinalStatus::kMemoryLimitExceeded.
   */
  prerenderFinalStatusMemoryLimitExceeded: 'Memory limit exceeded.',
  /**
   *  Description text for PrerenderFinalStatus::kFailToGetMemoryUsage.
   */
  prerenderFinalStatusFailToGetMemoryUsage: 'Failed to get memory usage.',
  /**
   *  Description text for PrerenderFinalStatus::kDataSaverEnabled.
   */
  prerenderFinalStatusDataSaverEnabled: 'Data Saver is enabled.',
  /**
   *  Description text for PrerenderFinalStatus::kHasEffectiveUrl.
   */
  prerenderFinalStatusHasEffectiveUrl:
      'Prerendering is forbidden for effective URLs like hosted apps and new tab page.',
  /**
   *  Description text for PrerenderFinalStatus::kTimeoutBackgrounded.
   */
  prerenderFinalStatusTimeoutBackgrounded: 'The page initiated prerendering was in background for a long time.',
  /**
   *  Description text for PrerenderFinalStatus::kCrossSiteRedirectInInitialNavigation.
   */
  prerenderFinalStatusCrossSiteRedirectInInitialNavigation: 'Cross-site redirect is forbidden.',
  /**
   *  Description text for PrerenderFinalStatus::kCrossSiteNavigationInInitialNavigation.
   */
  prerenderFinalStatusCrossSiteNavigationInInitialNavigation: 'Cross-site navigation is forbidden.',
  /**
   *  Description text for PrerenderFinalStatus::kSameSiteCrossOriginRedirectNotOptInInInitialNavigation.
   */
  prerenderFinalStatusSameSiteCrossOriginRedirectNotOptInInInitialNavigation:
      'Same-site cross-origin redirect requires additional hearder to opt-in.',
  /**
   *  Description text for PrerenderFinalStatus::kSameSiteCrossOriginNavigationNotOptInInInitialNavigation.
   */
  prerenderFinalStatusSameSiteCrossOriginNavigationNotOptInInInitialNavigation:
      'Same-site cross-origin navigation requires additional hearder to opt-in.',
  /**
   *  Description text for PrerenderFinalStatus::kActivationNavigationParameterMismatch.
   */
  prerenderFinalStatusActivationNavigationParameterMismatch:
      'Header parameters of initial navigation and activation navigation mismatched.',
  /**
   *  Description text for PrerenderFinalStatus::kPrimaryMainFrameRendererProcessCrashed.
   */
  prerenderFinalStatusPrimaryMainFrameRendererProcessCrashed: 'Renderer of initiating frame crashed.',
  /**
   *  Description text for PrerenderFinalStatus::kPrimaryMainFrameRendererProcessKilled.
   */
  prerenderFinalStatusPrimaryMainFrameRendererProcessKilled: 'Renderer of initiating frame killed.',
  /**
   *  Description text for PrerenderFinalStatus::kActivationFramePolicyNotCompatible.
   */
  prerenderFinalStatusActivationFramePolicyNotCompatible:
      'Activation frame policies of initiating page and prerendered page are not compatible.',
  /**
   *  Description text for PrerenderFinalStatus::kPreloadingDisabled.
   */
  prerenderFinalStatusPreloadingDisabled: 'Preloading is disabled by user settings.',
  /**
   *  Description text for PrerenderFinalStatus::kBatterySaverEnabled.
   */
  prerenderFinalStatusBatterySaverEnabled: 'Prerendering is disabled by Battery Saver.',
  /**
   *  Description text for PrerenderFinalStatus::kActivatedDuringMainFrameNavigation.
   */
  prerenderFinalStatusActivatedDuringMainFrameNavigation:
      'Prerendered page activated during initiating page\'s main frame navigation.',
  /**
   *  Description text for PrerenderFinalStatus::kCrossSiteRedirectInMainFrameNavigation.
   */
  prerenderFinalStatusCrossSiteRedirectInMainFrameNavigation:
      'Cross-site redirect after initial navigation is forbidden.',
  /**
   *  Description text for PrerenderFinalStatus::kCrossSiteNavigationInMainFrameNavigation.
   */
  prerenderFinalStatusCrossSiteNavigationInMainFrameNavigation:
      'Cross-site navigation after initial navigation is forbidden.',
  /**
   *  Description text for PrerenderFinalStatus::kSameSiteCrossOriginRedirectNotOptInInMainFrameNavigation.
   */
  prerenderFinalStatusSameSiteCrossOriginRedirectNotOptInInMainFrameNavigation:
      'Same-site cross-origin redirect requires additional header.',
  /**
   *  Description text for PrerenderFinalStatus::kSameSiteCrossOriginNavigationNotOptInInMainFrameNavigation.
   */
  prerenderFinalStatusSameSiteCrossOriginNavigationNotOptInInMainFrameNavigation:
      'Same-site cross-origin navigation requires additional header.',
  /**
   *  Description text for PrerenderFinalStatus::kMemoryPressureOnTrigger.
   */
  prerenderFinalStatusMemoryPressureOnTrigger:
      'Prerendering was cancelled on triggering due to critical memory pressure.',
  /**
   *  Description text for PrerenderFinalStatus::kMemoryPressureAfterTriggered.
   */
  prerenderFinalStatusMemoryPressureAfterTriggered:
      'Triggered prerendering was cancelled due to critical memory pressure.',
};
const str_ =
    i18n.i18n.registerUIStrings('panels/application/preloading/components/PreloadingDetailsReportView.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

class PreloadingUIUtils {
  static action({key}: SDK.PreloadingModel.PreloadingAttempt): string {
    // Use "prefetch"/"prerender" as is in SpeculationRules.
    switch (key.action) {
      case Protocol.Preload.SpeculationAction.Prefetch:
        return i18n.i18n.lockedString('prefetch');
      case Protocol.Preload.SpeculationAction.Prerender:
        return i18n.i18n.lockedString('prerender');
    }
  }

  static detailedStatus({status}: SDK.PreloadingModel.PreloadingAttempt): string {
    // See content/public/browser/preloading.h PreloadingAttemptOutcome.
    switch (status) {
      case SDK.PreloadingModel.PreloadingStatus.NotTriggered:
        return i18nString(UIStrings.detailedStatusNotTriggered);
      case SDK.PreloadingModel.PreloadingStatus.Pending:
        return i18nString(UIStrings.detailedStatusPending);
      case SDK.PreloadingModel.PreloadingStatus.Running:
        return i18nString(UIStrings.detailedStatusRunning);
      case SDK.PreloadingModel.PreloadingStatus.Ready:
        return i18nString(UIStrings.detailedStatusReady);
      case SDK.PreloadingModel.PreloadingStatus.Success:
        return i18nString(UIStrings.detailedStatusSuccess);
      case SDK.PreloadingModel.PreloadingStatus.Failure:
        return i18nString(UIStrings.detailedStatusFailure);
      // NotSupported is used to handle unreachable case. For example,
      // there is no code path for
      // PreloadingTriggeringOutcome::kTriggeredButPending in prefetch,
      // which is mapped to NotSupported. So, we regard it as an
      // internal error.
      case SDK.PreloadingModel.PreloadingStatus.NotSupported:
        return i18n.i18n.lockedString('Internal error');
    }
  }

  // Detailed failure reason for PrerenderFinalStatus.
  static failureReason({prerenderStatus}: SDK.PreloadingModel.PrerenderAttempt): string|null {
    switch (prerenderStatus) {
      case null:
      case Protocol.Preload.PrerenderFinalStatus.Activated:
        return null;
      case Protocol.Preload.PrerenderFinalStatus.Destroyed:
        // TODO(https://crbug.com/1410709): Fill it.
        return i18n.i18n.lockedString('Unknown');
      case Protocol.Preload.PrerenderFinalStatus.LowEndDevice:
        return i18nString(UIStrings.prerenderFinalStatusLowEndDevice);
      case Protocol.Preload.PrerenderFinalStatus.InvalidSchemeRedirect:
        return i18nString(UIStrings.prerenderFinalStatusInvalidSchemeRedirect);
      case Protocol.Preload.PrerenderFinalStatus.InvalidSchemeNavigation:
        return i18nString(UIStrings.prerenderFinalStatusInvalidSchemeNavigation);
      case Protocol.Preload.PrerenderFinalStatus.InProgressNavigation:
        // Not used.
        return i18n.i18n.lockedString('Internal error');
      case Protocol.Preload.PrerenderFinalStatus.NavigationRequestBlockedByCsp:
        return i18nString(UIStrings.prerenderFinalStatusNavigationRequestBlockedByCsp);
      case Protocol.Preload.PrerenderFinalStatus.MainFrameNavigation:
        return i18nString(UIStrings.prerenderFinalStatusMainFrameNavigation);
      case Protocol.Preload.PrerenderFinalStatus.MojoBinderPolicy:
        // TODO(https://crbug.com/1410709): Improve these messages with disallowedApiMethod.
        return i18nString(UIStrings.prerenderFinalStatusMojoBinderPolicy);
      case Protocol.Preload.PrerenderFinalStatus.RendererProcessCrashed:
        return i18nString(UIStrings.prerenderFinalStatusRendererProcessCrashed);
      case Protocol.Preload.PrerenderFinalStatus.RendererProcessKilled:
        return i18nString(UIStrings.prerenderFinalStatusRendererProcessKilled);
      case Protocol.Preload.PrerenderFinalStatus.Download:
        return i18nString(UIStrings.prerenderFinalStatusDownload);
      case Protocol.Preload.PrerenderFinalStatus.TriggerDestroyed:
        // After https://chromium-review.googlesource.com/c/chromium/src/+/4515841,
        // this won't occur if DevTools is opened.
        return i18n.i18n.lockedString('Internal error');
      case Protocol.Preload.PrerenderFinalStatus.NavigationNotCommitted:
        // This looks internal error.
        //
        // TODO(https://crbug.com/1410709): Fill it.
        return i18n.i18n.lockedString('Internal error');
      case Protocol.Preload.PrerenderFinalStatus.NavigationBadHttpStatus:
        return i18nString(UIStrings.prerenderFinalStatusNavigationBadHttpStatus);
      case Protocol.Preload.PrerenderFinalStatus.ClientCertRequested:
        return i18nString(UIStrings.prerenderFinalStatusClientCertRequested);
      case Protocol.Preload.PrerenderFinalStatus.NavigationRequestNetworkError:
        return i18nString(UIStrings.prerenderFinalStatusNavigationRequestNetworkError);
      case Protocol.Preload.PrerenderFinalStatus.MaxNumOfRunningPrerendersExceeded:
        return i18nString(UIStrings.prerenderFinalStatusMaxNumOfRunningPrerendersExceeded);
      case Protocol.Preload.PrerenderFinalStatus.CancelAllHostsForTesting:
        // Used only in tests.
        throw new Error('unreachable');
      case Protocol.Preload.PrerenderFinalStatus.DidFailLoad:
        // TODO(https://crbug.com/1410709): Fill it.
        return i18n.i18n.lockedString('Unknown');
      case Protocol.Preload.PrerenderFinalStatus.Stop:
        // TODO(https://crbug.com/1410709): Fill it.
        return i18n.i18n.lockedString('Unknown');
      case Protocol.Preload.PrerenderFinalStatus.SslCertificateError:
        return i18nString(UIStrings.prerenderFinalStatusSslCertificateError);
      case Protocol.Preload.PrerenderFinalStatus.LoginAuthRequested:
        return i18nString(UIStrings.prerenderFinalStatusLoginAuthRequested);
      case Protocol.Preload.PrerenderFinalStatus.UaChangeRequiresReload:
        return i18nString(UIStrings.prerenderFinalStatusUaChangeRequiresReload);
      case Protocol.Preload.PrerenderFinalStatus.BlockedByClient:
        return i18nString(UIStrings.prerenderFinalStatusBlockedByClient);
      case Protocol.Preload.PrerenderFinalStatus.AudioOutputDeviceRequested:
        return i18nString(UIStrings.prerenderFinalStatusAudioOutputDeviceRequested);
      case Protocol.Preload.PrerenderFinalStatus.MixedContent:
        return i18nString(UIStrings.prerenderFinalStatusMixedContent);
      case Protocol.Preload.PrerenderFinalStatus.TriggerBackgrounded:
        return i18nString(UIStrings.prerenderFinalStatusTriggerBackgrounded);
      case Protocol.Preload.PrerenderFinalStatus.EmbedderTriggeredAndCrossOriginRedirected:
        // Not used.
        return i18n.i18n.lockedString('Internal error');
      case Protocol.Preload.PrerenderFinalStatus.MemoryLimitExceeded:
        return i18nString(UIStrings.prerenderFinalStatusMemoryLimitExceeded);
      case Protocol.Preload.PrerenderFinalStatus.FailToGetMemoryUsage:
        return i18nString(UIStrings.prerenderFinalStatusFailToGetMemoryUsage);
      case Protocol.Preload.PrerenderFinalStatus.DataSaverEnabled:
        return i18nString(UIStrings.prerenderFinalStatusDataSaverEnabled);
      case Protocol.Preload.PrerenderFinalStatus.HasEffectiveUrl:
        return i18nString(UIStrings.prerenderFinalStatusHasEffectiveUrl);
      case Protocol.Preload.PrerenderFinalStatus.ActivatedBeforeStarted:
        // Status for debugging.
        return i18n.i18n.lockedString('Internal error');
      case Protocol.Preload.PrerenderFinalStatus.InactivePageRestriction:
        // This looks internal error.
        //
        // TODO(https://crbug.com/1410709): Fill it.
        return i18n.i18n.lockedString('Internal error');
      case Protocol.Preload.PrerenderFinalStatus.StartFailed:
        // This looks internal error.
        //
        // TODO(https://crbug.com/1410709): Fill it.
        return i18n.i18n.lockedString('Internal error');
      case Protocol.Preload.PrerenderFinalStatus.TimeoutBackgrounded:
        return i18nString(UIStrings.prerenderFinalStatusTimeoutBackgrounded);
      case Protocol.Preload.PrerenderFinalStatus.CrossSiteRedirectInInitialNavigation:
        return i18nString(UIStrings.prerenderFinalStatusCrossSiteRedirectInInitialNavigation);
      case Protocol.Preload.PrerenderFinalStatus.CrossSiteNavigationInInitialNavigation:
        return i18nString(UIStrings.prerenderFinalStatusCrossSiteNavigationInInitialNavigation);
      case Protocol.Preload.PrerenderFinalStatus.SameSiteCrossOriginRedirectNotOptInInInitialNavigation:
        return i18nString(UIStrings.prerenderFinalStatusSameSiteCrossOriginRedirectNotOptInInInitialNavigation);
      case Protocol.Preload.PrerenderFinalStatus.SameSiteCrossOriginNavigationNotOptInInInitialNavigation:
        return i18nString(UIStrings.prerenderFinalStatusSameSiteCrossOriginNavigationNotOptInInInitialNavigation);
      case Protocol.Preload.PrerenderFinalStatus.ActivationNavigationParameterMismatch:
        return i18nString(UIStrings.prerenderFinalStatusActivationNavigationParameterMismatch);
      case Protocol.Preload.PrerenderFinalStatus.ActivatedInBackground:
        // Status for debugging.
        return i18n.i18n.lockedString('Internal error');
      case Protocol.Preload.PrerenderFinalStatus.EmbedderHostDisallowed:
        // Chrome as embedder doesn't use this.
        throw new Error('unreachable');
      case Protocol.Preload.PrerenderFinalStatus.ActivationNavigationDestroyedBeforeSuccess:
        // Should not occur in DevTools beacuse tab is alive?
        return i18n.i18n.lockedString('Internal error');
      case Protocol.Preload.PrerenderFinalStatus.TabClosedByUserGesture:
        // Should not occur in DevTools beacuse tab is alive.
        throw new Error('unreachable');
      case Protocol.Preload.PrerenderFinalStatus.TabClosedWithoutUserGesture:
        // Should not occur in DevTools beacuse tab is alive.
        throw new Error('unreachable');
      case Protocol.Preload.PrerenderFinalStatus.PrimaryMainFrameRendererProcessCrashed:
        return i18nString(UIStrings.prerenderFinalStatusPrimaryMainFrameRendererProcessCrashed);
      case Protocol.Preload.PrerenderFinalStatus.PrimaryMainFrameRendererProcessKilled:
        return i18nString(UIStrings.prerenderFinalStatusPrimaryMainFrameRendererProcessKilled);
      case Protocol.Preload.PrerenderFinalStatus.ActivationFramePolicyNotCompatible:
        return i18nString(UIStrings.prerenderFinalStatusActivationFramePolicyNotCompatible);
      case Protocol.Preload.PrerenderFinalStatus.PreloadingDisabled:
        return i18nString(UIStrings.prerenderFinalStatusPreloadingDisabled);
      case Protocol.Preload.PrerenderFinalStatus.BatterySaverEnabled:
        return i18nString(UIStrings.prerenderFinalStatusBatterySaverEnabled);
      case Protocol.Preload.PrerenderFinalStatus.ActivatedDuringMainFrameNavigation:
        return i18nString(UIStrings.prerenderFinalStatusActivatedDuringMainFrameNavigation);
      case Protocol.Preload.PrerenderFinalStatus.PreloadingUnsupportedByWebContents:
        // Chrome as embedder doesn't use this.
        throw new Error('unreachable');
      case Protocol.Preload.PrerenderFinalStatus.CrossSiteRedirectInMainFrameNavigation:
        return i18nString(UIStrings.prerenderFinalStatusCrossSiteRedirectInMainFrameNavigation);
      case Protocol.Preload.PrerenderFinalStatus.CrossSiteNavigationInMainFrameNavigation:
        return i18nString(UIStrings.prerenderFinalStatusCrossSiteNavigationInMainFrameNavigation);
      case Protocol.Preload.PrerenderFinalStatus.SameSiteCrossOriginRedirectNotOptInInMainFrameNavigation:
        return i18nString(UIStrings.prerenderFinalStatusSameSiteCrossOriginRedirectNotOptInInMainFrameNavigation);
      case Protocol.Preload.PrerenderFinalStatus.SameSiteCrossOriginNavigationNotOptInInMainFrameNavigation:
        return i18nString(UIStrings.prerenderFinalStatusSameSiteCrossOriginNavigationNotOptInInMainFrameNavigation);
      case Protocol.Preload.PrerenderFinalStatus.MemoryPressureOnTrigger:
        return i18nString(UIStrings.prerenderFinalStatusMemoryPressureOnTrigger);
      case Protocol.Preload.PrerenderFinalStatus.MemoryPressureAfterTriggered:
        return i18nString(UIStrings.prerenderFinalStatusMemoryPressureAfterTriggered);
    }

    throw new Error('unreachable');
  }
}

const coordinator = Coordinator.RenderCoordinator.RenderCoordinator.instance();

export type PreloadingDetailsReportViewData = PreloadingDetailsReportViewDataInternal|null;
interface PreloadingDetailsReportViewDataInternal {
  preloadingAttempt: SDK.PreloadingModel.PreloadingAttempt;
  ruleSets: Protocol.Preload.RuleSet[];
}

export class PreloadingDetailsReportView extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-resources-preloading-details-report-view`;

  readonly #shadow = this.attachShadow({mode: 'open'});
  #data: PreloadingDetailsReportViewData = null;

  connectedCallback(): void {
    this.#shadow.adoptedStyleSheets = [preloadingDetailsReportViewStyles];
  }

  set data(data: PreloadingDetailsReportViewData) {
    this.#data = data;
    void this.#render();
  }

  async #render(): Promise<void> {
    await coordinator.write('PreloadingDetailsReportView render', () => {
      if (this.#data === null) {
        // Disabled until https://crbug.com/1079231 is fixed.
        // clang-format off
        LitHtml.render(LitHtml.html`
          <div class="preloading-noselected">
            <div>
              <p>${i18nString(UIStrings.selectAnElementForMoreDetails)}</p>
            </div>
          </div>
        `, this.#shadow, {host: this});
        // clang-format on
        return;
      }

      const action = PreloadingUIUtils.action(this.#data.preloadingAttempt);
      const detailedStatus = PreloadingUIUtils.detailedStatus(this.#data.preloadingAttempt);

      // Disabled until https://crbug.com/1079231 is fixed.
      // clang-format off
      LitHtml.render(LitHtml.html`
        <${ReportView.ReportView.Report.litTagName} .data=${{reportTitle: 'Preloading Attempt'} as ReportView.ReportView.ReportData}>
          <${ReportView.ReportView.ReportSectionHeader.litTagName}>${i18nString(UIStrings.detailsDetailedInformation)}</${
            ReportView.ReportView.ReportSectionHeader.litTagName}>

          <${ReportView.ReportView.ReportKey.litTagName}>${i18n.i18n.lockedString('URL')}</${
            ReportView.ReportView.ReportKey.litTagName}>
          <${ReportView.ReportView.ReportValue.litTagName}>
            <div class="text-ellipsis" title=${this.#data.preloadingAttempt.key.url}>${this.#data.preloadingAttempt.key.url}</div>
          </${ReportView.ReportView.ReportValue.litTagName}>

          <${ReportView.ReportView.ReportKey.litTagName}>${i18nString(UIStrings.detailsAction)}</${
            ReportView.ReportView.ReportKey.litTagName}>
          <${ReportView.ReportView.ReportValue.litTagName}>
            <div class="text-ellipsis" title="">
              ${action}
            </div>
          </${ReportView.ReportView.ReportValue.litTagName}>

          <${ReportView.ReportView.ReportKey.litTagName}>${i18nString(UIStrings.detailsStatus)}</${
            ReportView.ReportView.ReportKey.litTagName}>
          <${ReportView.ReportView.ReportValue.litTagName}>
            ${detailedStatus}
          </${ReportView.ReportView.ReportValue.litTagName}>

          ${this.#maybePrerenderFailureReason()}

          ${this.#data.ruleSets.map(ruleSet => this.#renderRuleSet(ruleSet))}
        </${ReportView.ReportView.Report.litTagName}>
      `, this.#shadow, {host: this});
      // clang-format on
    });
  }

  #maybePrerenderFailureReason(): LitHtml.LitTemplate {
    assertNotNullOrUndefined(this.#data);
    const attempt = this.#data.preloadingAttempt;

    if (attempt.action !== Protocol.Preload.SpeculationAction.Prerender) {
      return LitHtml.nothing;
    }

    const failureReason = PreloadingUIUtils.failureReason(attempt);
    if (failureReason === null) {
      return LitHtml.nothing;
    }

    return LitHtml.html`
        <${ReportView.ReportView.ReportKey.litTagName}>${i18nString(UIStrings.detailsFailureReason)}</${
        ReportView.ReportView.ReportKey.litTagName}>
        <${ReportView.ReportView.ReportValue.litTagName}>
          ${failureReason}
        </${ReportView.ReportView.ReportValue.litTagName}>
    `;
  }

  #renderRuleSet(ruleSet: Protocol.Preload.RuleSet): LitHtml.LitTemplate {
    // We can assume `sourceText` is a valid JSON because this triggered the preloading attempt.
    const json = JSON.stringify(JSON.parse(ruleSet.sourceText));

    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
    return LitHtml.html`
          <${ReportView.ReportView.ReportKey.litTagName}>${i18nString(UIStrings.detailsRuleSet)}</${
            ReportView.ReportView.ReportKey.litTagName}>
          <${ReportView.ReportView.ReportValue.litTagName}>
            <div class="text-ellipsis" title="">
              ${json}
            </div>
          </${ReportView.ReportView.ReportValue.litTagName}>
    `;
    // clang-format on
  }
}

ComponentHelpers.CustomElements.defineComponent(
    'devtools-resources-preloading-details-report-view', PreloadingDetailsReportView);

declare global {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLElementTagNameMap {
    'devtools-resources-preloading-details-report-view': PreloadingDetailsReportView;
  }
}
