// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as i18n from '../../../../core/i18n/i18n.js';
import * as TraceEngine from '../../../../models/trace/trace.js';
import * as ComponentHelpers from '../../../../ui/components/helpers/helpers.js';
import * as LitHtml from '../../../../ui/lit-html/lit-html.js';
import {type TimelineOverlay} from '../../Overlays.js';
import sidebarStyles from '../sidebar.css.js';
import {type ActiveInsight} from '../Sidebar.js';

import sidebarInsightStyles from './sidebarInsight.css.js';
import * as SidebarInsight from './SidebarInsight.js';

export const InsightName = 'lcp-phases';

const UIStrings = {
  /**
   *@description Time to first byte title for the Largest Contentful Paint's phases timespan breakdown.
   */
  timeToFirstByte: 'Time to first byte',
  /**
   *@description Resource load delay title for the Largest Contentful Paint phases timespan breakdown.
   */
  resourceLoadDelay: 'Resource load delay',
  /**
   *@description Resource load time title for the Largest Contentful Paint phases timespan breakdown.
   */
  resourceLoadTime: 'Resource load time',
  /**
   *@description Element render delay title for the Largest Contentful Paint phases timespan breakdown.
   */
  elementRenderDelay: 'Element render delay',
};
const str_ = i18n.i18n.registerUIStrings('panels/timeline/components/insights/LCPPhases.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

export class LCPPhases extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-performance-lcp-by-phases`;
  readonly #shadow = this.attachShadow({mode: 'open'});
  readonly #boundRender = this.#render.bind(this);
  #insightTitle: string = 'LCP by Phase';
  #insights: TraceEngine.Insights.Types.TraceInsightData|null = null;
  #navigationId: string|null = null;
  #phaseData: Array<{phase: string, timing: number|TraceEngine.Types.Timing.MilliSeconds, percent: string}>|null = null;
  #currentlyToggled: string = '';
  #activeInsight: ActiveInsight|null = null;

  set insights(insights: TraceEngine.Insights.Types.TraceInsightData|null) {
    if (insights && insights !== this.#insights) {
      // new insights, we should untoggle.
      this.#currentlyToggled = '';
    }
    this.#insights = insights;
    this.#phaseData = this.getPhaseData(this.#insights, this.#navigationId);
    void ComponentHelpers.ScheduledRender.scheduleRender(this, this.#boundRender);
  }

  set navigationId(navigationId: string|null) {
    if (navigationId && navigationId !== this.#navigationId) {
      // new navigationId, we should untoggle.
      this.#currentlyToggled = '';
    }
    this.#navigationId = navigationId;
    void ComponentHelpers.ScheduledRender.scheduleRender(this, this.#boundRender);
  }

  set activeInsight(activeInsight: ActiveInsight) {
    this.#activeInsight = activeInsight;
    void ComponentHelpers.ScheduledRender.scheduleRender(this, this.#boundRender);
  }

  getPhaseData(insights: TraceEngine.Insights.Types.TraceInsightData|null, navigationId: string|null):
      Array<{phase: string, timing: number|TraceEngine.Types.Timing.MilliSeconds, percent: string}> {
    if (!insights || !navigationId) {
      return [];
    }
    const insightsByNavigation = insights.get(navigationId);
    if (!insightsByNavigation) {
      return [];
    }
    const lcpInsight = insightsByNavigation.LargestContentfulPaint;
    if (lcpInsight instanceof Error) {
      return [];
    }

    const timing = lcpInsight.lcpMs;
    const phases = lcpInsight.phases;

    if (!timing || !phases) {
      return [];
    }

    const {ttfb, loadDelay, loadTime, renderDelay} = phases;

    if (loadDelay && loadTime) {
      const phaseData = [
        {phase: 'Time to first byte', timing: ttfb, percent: `${(100 * ttfb / timing).toFixed(0)}%`},
        {phase: 'Resource load delay', timing: loadDelay, percent: `${(100 * loadDelay / timing).toFixed(0)}%`},
        {phase: 'Resource load duration', timing: loadTime, percent: `${(100 * loadTime / timing).toFixed(0)}%`},
        {phase: 'Resource render delay', timing: renderDelay, percent: `${(100 * renderDelay / timing).toFixed(0)}%`},
      ];
      return phaseData;
    }

    // If the lcp is text, we only have ttfb and render delay.
    const phaseData = [
      {phase: 'Time to first byte', timing: ttfb, percent: `${(100 * ttfb / timing).toFixed(0)}%`},
      {phase: 'Resource render delay', timing: renderDelay, percent: `${(100 * renderDelay / timing).toFixed(0)}%`},
    ];
    return phaseData;
  }

  #createLCPPhasesOverlay(): Array<TimelineOverlay> {
    if (!this.#insights || !this.#navigationId) {
      return [];
    }

    const insightsByNavigation = this.#insights.get(this.#navigationId);
    if (!insightsByNavigation) {
      return [];
    }

    const lcpInsight: Error|TraceEngine.Insights.Types.LCPInsightResult = insightsByNavigation.LargestContentfulPaint;
    if (lcpInsight instanceof Error) {
      return [];
    }

    const phases = lcpInsight.phases;
    const lcpTs = lcpInsight.lcpTs;
    if (!phases || !lcpTs) {
      return [];
    }
    const lcpMicroseconds =
        TraceEngine.Types.Timing.MicroSeconds(TraceEngine.Helpers.Timing.millisecondsToMicroseconds(lcpTs));

    const sections = [];
    // For text LCP, we should only have ttfb and renderDelay sections.
    if (!phases?.loadDelay && !phases?.loadTime) {
      const renderBegin: TraceEngine.Types.Timing.MicroSeconds = TraceEngine.Types.Timing.MicroSeconds(
          lcpMicroseconds - TraceEngine.Helpers.Timing.millisecondsToMicroseconds(phases.renderDelay));
      const renderDelay = TraceEngine.Helpers.Timing.traceWindowFromMicroSeconds(
          renderBegin,
          lcpMicroseconds,
      );

      const mainReqStart = TraceEngine.Types.Timing.MicroSeconds(
          renderBegin - TraceEngine.Helpers.Timing.millisecondsToMicroseconds(phases.ttfb));
      const ttfb = TraceEngine.Helpers.Timing.traceWindowFromMicroSeconds(
          mainReqStart,
          renderBegin,
      );
      sections.push(
          {bounds: ttfb, label: i18nString(UIStrings.timeToFirstByte)},
          {bounds: renderDelay, label: i18nString(UIStrings.elementRenderDelay)});
    } else if (phases?.loadDelay && phases?.loadTime) {
      const renderBegin: TraceEngine.Types.Timing.MicroSeconds = TraceEngine.Types.Timing.MicroSeconds(
          lcpMicroseconds - TraceEngine.Helpers.Timing.millisecondsToMicroseconds(phases.renderDelay));
      const renderDelay = TraceEngine.Helpers.Timing.traceWindowFromMicroSeconds(
          renderBegin,
          lcpMicroseconds,
      );

      const loadBegin = TraceEngine.Types.Timing.MicroSeconds(
          renderBegin - TraceEngine.Helpers.Timing.millisecondsToMicroseconds(phases.loadTime));
      const loadTime = TraceEngine.Helpers.Timing.traceWindowFromMicroSeconds(
          loadBegin,
          renderBegin,
      );

      const loadDelayStart = TraceEngine.Types.Timing.MicroSeconds(
          loadBegin - TraceEngine.Helpers.Timing.millisecondsToMicroseconds(phases.loadDelay));
      const loadDelay = TraceEngine.Helpers.Timing.traceWindowFromMicroSeconds(
          loadDelayStart,
          loadBegin,
      );

      const mainReqStart = TraceEngine.Types.Timing.MicroSeconds(
          loadDelayStart - TraceEngine.Helpers.Timing.millisecondsToMicroseconds(phases.ttfb));
      const ttfb = TraceEngine.Helpers.Timing.traceWindowFromMicroSeconds(
          mainReqStart,
          loadDelayStart,
      );

      sections.push(
          {bounds: ttfb, label: i18nString(UIStrings.timeToFirstByte)},
          {bounds: loadDelay, label: i18nString(UIStrings.resourceLoadDelay)},
          {bounds: loadTime, label: i18nString(UIStrings.resourceLoadTime)},
          {bounds: renderDelay, label: i18nString(UIStrings.elementRenderDelay)},
      );
    }
    return [{
      type: 'TIMESPAN_BREAKDOWN',
      sections,
    }];
  }

  #sidebarClicked(): void {
    // deactivate current insight if already selected.
    this.#currentlyToggled = (this.#currentlyToggled === InsightName) ? '' : InsightName;

    this.#activeInsight = {
      name: this.#currentlyToggled,
      navigationId: this.#currentlyToggled === '' ? '' : this.#navigationId ?? '',
      createOverlayFn: this.#currentlyToggled === '' ? () => [] : this.#createLCPPhasesOverlay.bind(this),
    };

    this.dispatchEvent(new SidebarInsight.IndividialSidebarInsights(
        this.#currentlyToggled,
        this.#currentlyToggled === '' ? '' : this.#navigationId ?? '',
        this.#currentlyToggled === '' ? () => [] : this.#createLCPPhasesOverlay.bind(this),
        ));
  }

  renderLCPPhases(): LitHtml.LitTemplate {
    const showLCPPhases = this.#phaseData ? this.#phaseData.length > 0 : false;
    const toggled = this.#currentlyToggled === InsightName;

    if (this.#activeInsight?.name !== this.#currentlyToggled) {
      // TODO: use activeInsight here.
    }

    // clang-format off
    if (toggled) {
      return LitHtml.html`${showLCPPhases ? LitHtml.html`
        <div class="insights" @click=${()=>this.#sidebarClicked()}>
          <${SidebarInsight.SidebarInsight.litTagName} .data=${{
                title: this.#insightTitle,
                expanded: toggled,
            } as SidebarInsight.InsightDetails}>
            <div slot="insight-description" class="insight-description">
              Each
              <x-link class="link" href="https://web.dev/articles/optimize-lcp#lcp-breakdown">phase has specific recommendations to improve.</x-link>
              In an ideal load, the two delay phases should be quite short.
            </div>
            <div slot="insight-content" class="table-container">
              <dl>
                <dt class="dl-title">Phase</dt>
                <dd class="dl-title">% of LCP</dd>
                ${this.#phaseData?.map(phase => LitHtml.html`
                  <dt>${phase.phase}</dt>
                  <dd class="dl-value">${phase.percent}</dd>
                `)}
              </dl>
            </div>
          </${SidebarInsight}>
        </div>` : LitHtml.nothing}`;
    }

    return LitHtml.html`
    <div class="insights" @click=${()=>this.#sidebarClicked()}>
      <${SidebarInsight.SidebarInsight.litTagName} .data=${{
            title: this.#insightTitle,
            expanded: toggled,
        } as SidebarInsight.InsightDetails}>
      </${SidebarInsight}>
    </div>`;
    // clang-format on
  }

  connectedCallback(): void {
    this.#shadow.adoptedStyleSheets = [sidebarInsightStyles, sidebarStyles];
  }

  #render(): void {
    const output = this.renderLCPPhases();
    LitHtml.render(output, this.#shadow, {host: this});
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'devtools-performance-lcp-by-phases': LCPPhases;
  }
}

customElements.define('devtools-performance-lcp-by-phases', LCPPhases);
