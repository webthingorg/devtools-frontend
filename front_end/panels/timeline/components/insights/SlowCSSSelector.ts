// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../../../core/common/common.js';
import * as Trace from '../../../../models/trace/trace.js';
import * as LitHtml from '../../../../ui/lit-html/lit-html.js';
import type * as Components from '../../overlays/components/components.js';
import type * as Overlays from '../../overlays/overlays.js';

import {BaseInsight, shouldRenderForCategory} from './Helpers.js';
import * as SidebarInsight from './SidebarInsight.js';
import {Table, type TableData} from './Table.js';
import {InsightsCategories} from './types.js';

export class SlowCSSSelector extends BaseInsight {
  static readonly litTagName = LitHtml.literal`devtools-performance-slow-css-selector`;
  override insightCategory: InsightsCategories = InsightsCategories.OTHER;
  override internalName: string = 'slow-css-selector';
  override userVisibleTitle: string = 'Slow CSS Selectors';
  #slowCSSSelector: Trace.Insights.InsightRunners.SlowCSSSelector.SlowCSSSelectorInsightResult|null = null;

  override createOverlays(): Overlays.Overlays.TimelineOverlay[] {
    if (!this.data.insights || !this.data.insightSetKey) {
      return [];
    }
    const {insightSetKey: navigationId, insights} = this.data;

    const insightsByNavigation = insights.get(navigationId);
    if (!insightsByNavigation) {
      return [];
    }

    const scsInsight: Error|Trace.Insights.InsightRunners.SlowCSSSelector.SlowCSSSelectorInsightResult =
        insightsByNavigation.data.SlowCSSSelector;
    if (scsInsight instanceof Error) {
      return [];
    }

    const sections: Array<Components.TimespanBreakdownOverlay.EntryBreakdown> = [];

    return [{
      type: 'TIMESPAN_BREAKDOWN',
      sections,
    }];
  }

  renderSlowCSSSelector(): LitHtml.LitTemplate {
    // clang-format off
    return this.#slowCSSSelector ? LitHtml.html`
      <div class="insights">
        <${SidebarInsight.SidebarInsight.litTagName} .data=${{
              title: this.userVisibleTitle,
              internalName: this.internalName,
              expanded: this.isActive(),
          } as SidebarInsight.InsightDetails}
          @insighttoggleclick=${this.onSidebarClick}
        >
          <div slot="insight-content">
            ${LitHtml.html`<${Table.litTagName}
              .data=${{
                headers: ['Total', 'Stats'],
                rows: [
                  ['Elapsed in ms', this.#slowCSSSelector.totalElapsedMs],
                  ['Match Attempts', this.#slowCSSSelector.totalMatchAttempts],
                  ['Match Count', this.#slowCSSSelector.totalMatchCount],
                ],
              } as TableData}>
            </${Table.litTagName}>`}
            ${LitHtml.html`<${Table.litTagName}
              .data=${{
                headers: ['Top Selectors', 'Elapsed Time (ms)'],
                rows: this.#slowCSSSelector.topElapsedMs.map(selector => {
                  return [selector.selector, selector['elapsed (us)'] / 1000.0];
                }),
              } as TableData}>
            </${Table.litTagName}>`}
            ${LitHtml.html`<${Table.litTagName}
              .data=${{
                headers: ['Top Selectors', 'Match Attempts'],
                rows: this.#slowCSSSelector.topMatchAttempts.map(selector => {
                  return [selector.selector, selector['match_attempts']];
                }),
              } as TableData}>
            </${Table.litTagName}>`}
          </div>
        </${SidebarInsight}>
      </div>` : LitHtml.nothing;
    // clang-format on
  }

  #hasDataToRender(): boolean {
    this.#slowCSSSelector =
        Trace.Insights.Common.getInsight('SlowCSSSelector', this.data.insights, this.data.insightSetKey);
    return this.#slowCSSSelector !== null && this.#slowCSSSelector.topElapsedMs.length !== 0 &&
        this.#slowCSSSelector.topMatchAttempts.length !== 0;
  }

  override render(): void {
    const matchesCategory = shouldRenderForCategory({
      activeCategory: this.data.activeCategory,
      insightCategory: this.insightCategory,
    });
    const shouldRender = matchesCategory && this.#hasDataToRender();
    const output = shouldRender ? this.renderSlowCSSSelector() : LitHtml.nothing;
    LitHtml.render(output, this.shadow, {host: this});
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'devtools-performance-slow-css-selector': SlowCSSSelector;
  }
}

customElements.define('devtools-performance-slow-css-selector', SlowCSSSelector);
