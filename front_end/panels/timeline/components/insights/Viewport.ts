// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as TraceEngine from '../../../../models/trace/trace.js';
import * as LitHtml from '../../../../ui/lit-html/lit-html.js';
import type * as Overlays from '../../overlays/overlays.js';

import {BaseInsight, shouldRenderForCategory} from './Helpers.js';
import * as SidebarInsight from './SidebarInsight.js';
import {InsightsCategories} from './types.js';

// TODO: 'TraceEngine.Insights.Types.*' needs to expose the result of every insight, w/o `|Error`.
export function getViewportInsight(
    insights: TraceEngine.Insights.Types.TraceInsightData|null,
    navigationId: string|null): Exclude<TraceEngine.Insights.Types.NavigationInsightData['Viewport'], Error>|null {
  if (!insights || !navigationId) {
    return null;
  }

  const insightsByNavigation = insights.get(navigationId);
  if (!insightsByNavigation) {
    return null;
  }

  const viewportInsight = insightsByNavigation.Viewport;
  if (viewportInsight instanceof Error) {
    return null;
  }
  return viewportInsight;
}

export class Viewport extends BaseInsight {
  static readonly litTagName = LitHtml.literal`devtools-performance-viewport`;
  override insightCategory: InsightsCategories = InsightsCategories.INP;
  override internalName: string = 'viewport';
  override userVisibleTitle: string = 'Mobile-Optimized Viewport';

  override createOverlays(): Overlays.Overlays.TimelineOverlay[] {
    // TODO(b/351757418): create overlay for synthetic input delay events
    return [];
  }

  #render(): LitHtml.TemplateResult {
    // clang-format off
    // TODO: ideally can just author markdown use some markdown Lit component.
    // A `<meta name="viewport">` not only optimizes your app for mobile screen sizes, ' +
    //   'but also prevents [a 300 millisecond delay to user input](https://developer.chrome.com/blog/300ms-tap-delay-gone-away/). ' +
    //   '[Learn more about using the viewport meta tag](https://developer.chrome.com/docs/lighthouse/pwa/viewport/).
    // TODO(b/351757418): waiting on https://chromium-review.googlesource.com/c/chromium/src/+/5774408 to say more.
    return LitHtml.html`
        <div class="insights">
            <${SidebarInsight.SidebarInsight.litTagName} .data=${{
            title: this.userVisibleTitle,
            expanded: this.isActive(),
            } as SidebarInsight.InsightDetails}
            @insighttoggleclick=${this.onSidebarClick}>
                <div slot="insight-description" class="insight-description">
                    <p>A viewport meta element not only optimizes your app for mobile screen sizes,
                    but also prevents a 300 millisecond delay to user input.
                    </p>
                </div>
            </${SidebarInsight.SidebarInsight}>
        </div>`;
    // clang-format on
  }

  override render(): void {
    const viewportInsight = getViewportInsight(this.data.insights, this.data.navigationId);
    const shouldShow = viewportInsight && !viewportInsight.mobileOptimized;

    const matchesCategory = shouldRenderForCategory({
      activeCategory: this.data.activeCategory,
      insightCategory: this.insightCategory,
    });
    const output = shouldShow && matchesCategory ? this.#render() : LitHtml.nothing;
    LitHtml.render(output, this.shadow, {host: this});
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'devtools-performance-viewport': Viewport;
  }
}

customElements.define('devtools-performance-viewport', Viewport);
