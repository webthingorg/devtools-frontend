// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../../../core/common/common.js';
import * as Platform from '../../../../core/platform/platform.js';
import {type LCPInsightResult} from '../../../../models/trace/insights/types.js';
import type * as TraceEngine from '../../../../models/trace/trace.js';
import * as ComponentHelpers from '../../../../ui/components/helpers/helpers.js';
import * as IconButton from '../../../../ui/components/icon_button/icon_button.js';
import * as LitHtml from '../../../../ui/lit-html/lit-html.js';
import {type ActiveInsight, InsightsCategories} from '../Sidebar.js';

import sidebarInsightStyles from './sidebarInsight.css.js';
import * as SidebarInsight from './SidebarInsight.js';

export const InsightName = 'lcp-discovery';

type ImageData = {
  shouldIncreasePriorityHint: boolean,
  shouldPreloadImage: boolean,
  shouldRemoveLazyLoading: boolean,
  resource: TraceEngine.Types.TraceEvents.SyntheticNetworkRequest,
};

export function getLCPInsightData(insights: TraceEngine.Insights.Types.TraceInsightData|null): LCPInsightResult|null {
  if (!insights) {
    return null;
  }
  // For now use the first navigation of the trace.
  const firstNav = insights.values().next().value;
  if (!firstNav) {
    return null;
  }
  const lcpInsight: LCPInsightResult = firstNav.LargestContentfulPaint;
  if (lcpInsight instanceof Error) {
    return null;
  }
  return lcpInsight;
}

function getImageData(insights: TraceEngine.Insights.Types.TraceInsightData|null): ImageData|null {
  const lcpInsight = getLCPInsightData(insights);
  if (!lcpInsight) {
    return null;
  }

  if (lcpInsight.lcpResource === undefined) {
    return null;
  }

  const shouldIncreasePriorityHint = lcpInsight.shouldIncreasePriorityHint;
  const shouldPreloadImage = lcpInsight.shouldPreloadImage;
  const shouldRemoveLazyLoading = lcpInsight.shouldRemoveLazyLoading;

  const imageLCP = shouldIncreasePriorityHint !== undefined && shouldPreloadImage !== undefined &&
      shouldRemoveLazyLoading !== undefined;

  // Shouldn't render anything if lcp insight is null or lcp is text.
  if (!imageLCP) {
    return null;
  }

  return {
    shouldIncreasePriorityHint,
    shouldPreloadImage,
    shouldRemoveLazyLoading,
    resource: lcpInsight.lcpResource,
  };
}

export class LCPDiscovery extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-performance-lcp-discovery`;
  readonly #shadow = this.attachShadow({mode: 'open'});
  readonly #boundRender = this.#render.bind(this);
  #insightTitle: string = 'LCP request discovery';
  #insights: TraceEngine.Insights.Types.TraceInsightData|null = null;
  #navigationId: string|null = null;
  #activeInsight: ActiveInsight|null = null;
  #activeCategory: InsightsCategories = InsightsCategories.ALL;

  set insights(insights: TraceEngine.Insights.Types.TraceInsightData|null) {
    this.#insights = insights;
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
        // TODO: create the overlay for this insight.
        () => [],
        ));
  }

  #adviceIcon(advice: boolean): LitHtml.TemplateResult {
    const icon = advice ? 'check-circle' : 'clear';

    return LitHtml.html`
      <${IconButton.Icon.Icon.litTagName}
      name=${icon}
      class=${advice ? 'metric-value-good' : 'metric-value-bad'}
      ></${IconButton.Icon.Icon.litTagName}>
    `;
  }

  #renderDiscovery(imageData: ImageData): LitHtml.TemplateResult {
    return LitHtml.html`
        <div class="insights"  @click=${() => this.#sidebarClicked()}>
            <${SidebarInsight.SidebarInsight.litTagName} .data=${{
      title: this.#insightTitle,
      expanded: this.#isActive(),
    } as SidebarInsight.InsightDetails}>
            <div slot="insight-description" class="insight-description">
                The LCP image should be requested as early as possible.
                <div class="insight-results">
                  <div class="insight-entry">
                      ${this.#adviceIcon(imageData.shouldIncreasePriorityHint)}
                      fetchpriority=high applied
                  </div>
                  <div class="insight-entry">
                      ${this.#adviceIcon(imageData.shouldPreloadImage)}
                      Request is discoverable in initial document
                  </div>
                  <div class="insight-entry">
                      ${this.#adviceIcon(imageData.shouldRemoveLazyLoading)}
                      lazyload not applied
                  </div>
                </div>
            </div>
            <div slot="insight-content" class="insight-content">
                <img class="element-img" data-src=${imageData.resource.args.data.url} src=${
        imageData.resource.args.data.url}>
                <div class="element-img-details">
                    ${Common.ParsedURL.ParsedURL.extractName(imageData.resource.args.data.url ?? '')}
                    <div class="element-img-details-size">${
        Platform.NumberUtilities.bytesToString(imageData.resource.args.data.decodedBodyLength ?? 0)}</div>
                </div>
            </div>
            </${SidebarInsight.SidebarInsight}>
        </div>`;
  }

  connectedCallback(): void {
    this.#shadow.adoptedStyleSheets = [sidebarInsightStyles];
  }

  #shouldRenderForCateogory(): boolean {
    if (this.#activeCategory === InsightsCategories.ALL) {
      return true;
    }
    return this.#activeCategory === InsightsCategories.LCP;
  }

  #isActive(): boolean {
    const isActive = this.#activeInsight && this.#activeInsight.name === InsightName &&
        this.#activeInsight.navigationId === this.#navigationId;
    return Boolean(isActive);
  }

  #render(): void {
    const imageResults = getImageData(this.#insights);
    const output =
        imageResults && this.#shouldRenderForCateogory() ? this.#renderDiscovery(imageResults) : LitHtml.nothing;
    LitHtml.render(output, this.#shadow, {host: this});
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'devtools-performance-lcp-discovery': LCPDiscovery;
  }
}

customElements.define('devtools-performance-lcp-discovery', LCPDiscovery);
