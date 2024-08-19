// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../../../core/common/common.js';
import * as i18n from '../../../../core/i18n/i18n.js';
import * as SDK from '../../../../core/sdk/sdk.js';
import type * as Protocol from '../../../../generated/protocol.js';
import type * as TraceEngine from '../../../../models/trace/trace.js';
import * as ComponentHelpers from '../../../../ui/components/helpers/helpers.js';
import * as LitHtml from '../../../../ui/lit-html/lit-html.js';
import type * as Overlays from '../../overlays/overlays.js';

import {BaseInsight, shouldRenderForCategory} from './Helpers.js';
import * as SidebarInsight from './SidebarInsight.js';
import {InsightsCategories} from './types.js';

const UIStrings = {
  /**
   * @description Text to tell the user how a viewport meta element can improve performance.
   */
  description: 'A viewport meta element not only optimizes your app for mobile screen sizes, ' +
      'but also prevents a 300 millisecond delay to user input.',
};

const str_ = i18n.i18n.registerUIStrings('panels/timeline/components/insights/Viewport.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

export function getViewportInsight(
    insights: TraceEngine.Insights.Types.TraceInsightData|null,
    navigationId: string|null): TraceEngine.Insights.Types.InsightResults['Viewport']|null {
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

interface NodeLinkData {
  backendNodeId: Protocol.DOM.BackendNodeId;
  options?: Common.Linkifier.Options;
}

// TODO: extract, use in other insights :)
class NodeLink extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-performance-node-link`;

  readonly #shadow = this.attachShadow({mode: 'open'});
  readonly #boundRender = this.#render.bind(this);
  #backendNodeId?: Protocol.DOM.BackendNodeId;
  #options?: Common.Linkifier.Options;

  set data(data: NodeLinkData) {
    this.#backendNodeId = data.backendNodeId;
    this.#options = data.options;
    void ComponentHelpers.ScheduledRender.scheduleRender(this, this.#boundRender);
  }

  async #linkify(): Promise<Node|undefined> {
    // TODO: consider using `TraceEngine.Extras.FetchNodes.extractRelatedDOMNodesFromEvent`, which
    // requires traceParsedData.

    if (this.#backendNodeId === undefined) {
      return;
    }

    const mainTarget = SDK.TargetManager.TargetManager.instance().primaryPageTarget();
    if (!mainTarget) {
      return;
    }

    const domModel = mainTarget.model(SDK.DOMModel.DOMModel);
    if (!domModel) {
      return;
    }

    const backendNodeIds = new Set([this.#backendNodeId]);
    const domNodesMap = await domModel.pushNodesByBackendIdsToFrontend(backendNodeIds);
    if (!domNodesMap) {
      return;
    }

    const node = domNodesMap.get(this.#backendNodeId);
    if (!node) {
      return;
    }

    // TODO: it'd be nice if we could specify what attributes to render,
    // ex for the Viewport insight: <meta content="..."> (instead of just <meta>)
    return Common.Linkifier.Linkifier.linkify(node, this.#options);
  }

  async #render(): Promise<void> {
    const relatedNodeEl = await this.#linkify();
    LitHtml.render(
        LitHtml.html`<div class='node-link'>
        ${relatedNodeEl}
      </div>`,
        this.#shadow, {host: this});
  }
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

  // TODO: remove once used.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  #render(data: TraceEngine.Insights.Types.InsightResults['Viewport']): LitHtml.TemplateResult {
    const backendNodeId = data.viewportEvent?.args.data.node_id;

    // clang-format off
    return LitHtml.html`
        <div class="insights">
            <${SidebarInsight.SidebarInsight.litTagName} .data=${{
            title: this.userVisibleTitle,
            expanded: this.isActive(),
            } as SidebarInsight.InsightDetails}
            @insighttoggleclick=${this.onSidebarClick}>
                <div slot="insight-description" class="insight-description">
                    <span>${i18nString(UIStrings.description)}</span>
                </div>
                <div slot="insight-content" class="insight-content">
                  ${backendNodeId !== undefined ? LitHtml.html`<${NodeLink.litTagName}
                    .data=${{
                      backendNodeId,
                      options: {tooltip: data.viewportEvent?.args.data.content},
                    } as NodeLinkData}>
                  </${NodeLink.litTagName}>` : LitHtml.nothing}
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
    const output = shouldShow && matchesCategory ? this.#render(viewportInsight) : LitHtml.nothing;
    LitHtml.render(output, this.shadow, {host: this});
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'devtools-performance-viewport': Viewport;
    'devtools-performance-node-link': NodeLink;
  }
}

customElements.define('devtools-performance-viewport', Viewport);
customElements.define('devtools-performance-node-link', NodeLink);
