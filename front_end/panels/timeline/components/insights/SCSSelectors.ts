// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../../../core/common/common.js';
import type * as TraceEngine from '../../../../models/trace/trace.js';
import * as ComponentHelpers from '../../../../ui/components/helpers/helpers.js';
import * as LitHtml from '../../../../ui/lit-html/lit-html.js';
import type * as Components from '../../overlays/components/components.js';
import type * as Overlays from '../../overlays/overlays.js';

import sidebarInsightStyles from './sidebarInsight.css.js';
import * as SidebarInsight from './SidebarInsight.js';
import {type ActiveInsight, InsightsCategories} from './types.js';

export const InsightName = 'scs-selectors';

export class SCSSelectors extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-performance-scs-selectors`;
  readonly #shadow = this.attachShadow({mode: 'open'});
  readonly #boundRender = this.#render.bind(this);
  #insightTitle: string = 'Slow CSS Selectors';
  #insights: TraceEngine.Insights.Types.TraceInsightData|null = null;
  #navigationId: string|null = null;
  #activeInsight: ActiveInsight|null = null;
  #activeCategory: InsightsCategories = InsightsCategories.ALL;
  #slowCSSSelector: TraceEngine.Insights.Types.SCSInsightResult|null = null;

  set insights(insights: TraceEngine.Insights.Types.TraceInsightData|null) {
    this.#insights = insights;
    this.#slowCSSSelector = this.getSCSData(this.#insights, this.#navigationId);
    void ComponentHelpers.ScheduledRender.scheduleRender(this, this.#boundRender);
  }

  set navigationId(navigationId: string|null) {
    this.#navigationId = navigationId;
    void ComponentHelpers.ScheduledRender.scheduleRender(this, this.#boundRender);
  }

  set activeInsight(activeInsight: ActiveInsight) {
    this.#activeInsight = activeInsight;
    void ComponentHelpers.ScheduledRender.scheduleRender(this, this.#boundRender);
  }

  set activeCategory(activeCategory: InsightsCategories) {
    this.#activeCategory = activeCategory;
    void ComponentHelpers.ScheduledRender.scheduleRender(this, this.#boundRender);
  }

  getSCSData(insights: TraceEngine.Insights.Types.TraceInsightData|null, navigationId: string|null):
      TraceEngine.Insights.Types.SCSInsightResult|null {
    if (!insights || !navigationId) {
      return null;
    }

    const insightsByNavigation = insights.get(navigationId);
    if (!insightsByNavigation) {
      return null;
    }

    const slowCSSSelector = insightsByNavigation.SlowCSSSelector;
    if (slowCSSSelector instanceof Error) {
      return null;
    }

    return slowCSSSelector;
  }

  #createSCSSelectorsOverlay(): Array<Overlays.Overlays.TimelineOverlay> {
    if (!this.#insights || !this.#navigationId) {
      return [];
    }

    const insightsByNavigation = this.#insights.get(this.#navigationId);
    if (!insightsByNavigation) {
      return [];
    }

    const scsInsight: Error|TraceEngine.Insights.Types.SCSInsightResult = insightsByNavigation.SlowCSSSelector;
    if (scsInsight instanceof Error) {
      return [];
    }

    const sections: Array<Components.TimespanBreakdownOverlay.EntryBreakdown> = [];

    return [{
      type: 'TIMESPAN_BREAKDOWN',
      sections,
    }];
  }

  #sidebarClicked(): void {
    // deactivate current insight if already selected.
    if (this.#isActive()) {
      this.dispatchEvent(new SidebarInsight.InsightDeactivated());
      return;
    }
    if (!this.#navigationId) {
      // Shouldn't happen, but needed to satisfy TS.
      return;
    }

    this.dispatchEvent(new SidebarInsight.InsightActivated(
        InsightName,
        this.#navigationId,
        this.#createSCSSelectorsOverlay.bind(this),
        ));
  }

  renderSCSSelectors(): LitHtml.LitTemplate {
    // clang-format off
    return LitHtml.html`${this.#slowCSSSelector ? LitHtml.html`
      <div class="insights">
        <${SidebarInsight.SidebarInsight.litTagName} .data=${{
            title: this.#insightTitle,
            expanded: this.#isActive(),
        } as SidebarInsight.InsightDetails}
        @insighttoggleclick=${this.#sidebarClicked}>
        <div slot="insight-description" class="insight-description">
          Slow CSS selectors.
        </div>
        <div slot="insight-content" class="table-container">
          <dl>
            <dt class="dl-title">Total</dt>
            <dd class="dl-title">Stats</dd>
            <dt>Elapsed in ms</dt><dd>${this.#slowCSSSelector.totalElapsedMs}</dd>
            <dt>Match Attempts</dt><dd>${this.#slowCSSSelector.totalMatchAttempts}</dd>
            <dt>Match Count</dt><dd>${this.#slowCSSSelector.totalMatchCount}</dd>
          </dl>
          <dl>
          <dt class="dl-title">Top Selectors</dt>
          <dd class="dl-title">Elapsed Time (ms)</dd>
          ${this.#slowCSSSelector.topElapsedMs.map(selector => {
              return LitHtml.html`
                  <dt>${selector.selector}</dt>
                  <dd>${selector['elapsed (us)']/1000.0}</dd>
              `;
          })}
          </dl>
          <dl>
          <dt class="dl-title">Top Selectors</dt>
          <dd class="dl-title">Match Attempts</dd>
          ${this.#slowCSSSelector.topMatchAttempts.map(selector => {
              return LitHtml.html`
                  <dt>${selector.selector}</dt>
                  <dd>${selector['match_attempts']}</dd>
              `;
          })}
          </dl>
        </div>
        </${SidebarInsight}>
      </div>` : LitHtml.nothing}`;
    // clang-format on
  }

  connectedCallback(): void {
    this.#shadow.adoptedStyleSheets = [sidebarInsightStyles];
  }

  #shouldRenderForCateogory(): boolean {
    if (this.#activeCategory === InsightsCategories.ALL) {
      return true;
    }
    return this.#activeCategory === InsightsCategories.SCS;
  }

  #isActive(): boolean {
    const isActive = this.#activeInsight && this.#activeInsight.name === InsightName &&
        this.#activeInsight.navigationId === this.#navigationId;
    return Boolean(isActive);
  }

  #hasDataToRender(): boolean {
    const selectorStatsFeatureEnabled =
        Common.Settings.Settings.instance().createSetting('timeline-capture-selector-stats', false);
    return selectorStatsFeatureEnabled.get() && this.#slowCSSSelector !== null;
  }

  #render(): void {
    const shouldRender = this.#shouldRenderForCateogory() && this.#hasDataToRender();
    const output = shouldRender ? this.renderSCSSelectors() : LitHtml.nothing;
    LitHtml.render(output, this.#shadow, {host: this});
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'devtools-performance-scs-selectors': SCSSelectors;
  }
}

customElements.define('devtools-performance-scs-selectors', SCSSelectors);
