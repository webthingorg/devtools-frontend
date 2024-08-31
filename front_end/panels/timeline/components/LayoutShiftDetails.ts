// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as i18n from '../../../core/i18n/i18n.js';
import type * as Platform from '../../../core/platform/platform.js';
import * as SDK from '../../../core/sdk/sdk.js';
import type * as Protocol from '../../../generated/protocol.js';
import type * as TraceEngine from '../../../models/trace/trace.js';
import * as LegacyComponents from '../../../ui/legacy/components/utils/utils.js';
import * as LitHtml from '../../../ui/lit-html/lit-html.js';

import {NodeLink, type NodeLinkData} from './insights/NodeLink.js';
import layoutShiftDetailsStyles from './layoutShiftDetails.css.js';

const MAX_URL_LENGTH = 80;

export class LayoutShiftDetails extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-performance-layout-shift-details`;
  readonly #shadow = this.attachShadow({mode: 'open'});

  #layoutShift?: TraceEngine.Types.TraceEvents.SyntheticLayoutShift|null;
  #traceInsightsData: TraceEngine.Insights.Types.TraceInsightData|null = null;

  connectedCallback(): void {
    this.#shadow.adoptedStyleSheets = [layoutShiftDetailsStyles];
    this.#render();
  }

  setData(
      layoutShift: TraceEngine.Types.TraceEvents.SyntheticLayoutShift,
      traceInsightsData: TraceEngine.Insights.Types.TraceInsightData|null): void {
    if (this.#layoutShift === layoutShift) {
      return;
    }
    this.#layoutShift = layoutShift;
    this.#traceInsightsData = traceInsightsData;
    this.#render();
  }

  #renderInsightTitleCard(): LitHtml.TemplateResult|null {
    if (!this.#layoutShift) {
      return null;
    }

    return LitHtml.html`
      <div class="timeline-details-chip-decorative-title">
        <span class="insight-keyword">Insight</span> Layout Shift culprits</div>
    `;
  }

  #renderDetailsChip(): LitHtml.TemplateResult {
    return LitHtml.html`
      <div class="layout-shift-details-title">
        <div class="layout-shift-event-chip"></div>
        Layout Shift
      </div>
    `;
  }

  #renderShiftedElements(elementsShifted: TraceEngine.Types.TraceEvents.TraceImpactedNode[]|
                         undefined): LitHtml.LitTemplate {
    // clang-format off
    return LitHtml.html`
      ${elementsShifted?.map(el => {
        if (el.node_id !== undefined) {
          return LitHtml.html`
            <${NodeLink.litTagName}
              .data=${{
                backendNodeId: el.node_id,
              } as NodeLinkData}>
            </${NodeLink.litTagName}>
          `;
        }
          return LitHtml.nothing;

      })}
    `;
    // clang-format on
  }

  #renderRootCauseValues(rootCauses:
                             TraceEngine.Insights.InsightRunners.CumulativeLayoutShift.LayoutShiftRootCausesData|
                         undefined): LitHtml.TemplateResult|null {
    const renderFontRequests =
        (font: TraceEngine.Types.TraceEvents.SyntheticNetworkRequest): LitHtml.TemplateResult|null => {
          const options = {
            tabStop: false,
            showColumnNumber: false,
            inlineFrameIndex: 0,
            maxLength: MAX_URL_LENGTH,
          };

          const linkifiedURL = LegacyComponents.Linkifier.Linkifier.linkifyURL(
              font.args.data.url as Platform.DevToolsPath.UrlString, options);

          return LitHtml.html`<tr><td>${linkifiedURL}</td></tr>`;
        };

    const renderIframes = (iframe: TraceEngine.Types.TraceEvents.TraceEventRenderFrameImplCreateChildFrame):
                              LitHtml.TemplateResult|null => {
      const domLoadingId = iframe.args.domLoadingFrameId as Protocol.Page.FrameId;
      if (!domLoadingId) {
        return null;
      }

      const domLoadingFrame = SDK.FrameManager.FrameManager.instance().getFrame(domLoadingId);
      if (domLoadingFrame) {
        const el =
            LegacyComponents.Linkifier.Linkifier.linkifyRevealable(domLoadingFrame, domLoadingFrame.displayName());
        return LitHtml.html`<tr><td>${el}</td></tr>`;
      }

      return LitHtml.html`<tr><td>Frame ID: ${domLoadingId}</td></tr>`;
    };

    return LitHtml.html`
      ${rootCauses?.fontRequests.map(renderFontRequests)}
      ${rootCauses?.iframes.map(renderIframes)}
  `;
  }

  #renderDetailsTable(
      layoutShift: TraceEngine.Types.TraceEvents.SyntheticLayoutShift,
      traceInsightsData: TraceEngine.Insights.Types.TraceInsightData): LitHtml.TemplateResult|null {
    const score = layoutShift.args.data?.score;
    if (!score) {
      return null;
    }

    const ts = layoutShift.ts;
    const clsInsight = traceInsightsData.get(layoutShift.args.data?.navigationId ?? '')?.CumulativeLayoutShift;
    if (clsInsight instanceof Error) {
      return null;
    }

    const rootCauses = clsInsight?.shifts?.get(layoutShift);

    const elementsShifted = layoutShift.args.data?.impacted_nodes;

    const hasCulprits = rootCauses && (rootCauses.fontRequests.length > 0 || rootCauses.iframes.length > 0);
    const hasShiftedElements = elementsShifted && elementsShifted.length > 0;
    // For rowspan.
    const rootCauseCount = (rootCauses?.fontRequests?.length ?? 0) + (rootCauses?.iframes?.length ?? 0);

    // clang-format off
    return LitHtml.html`
      <table class="layout-shift-details-table">
        <thead>
          <tr class="table-title">
            <th>Start time</th>
            <th>Shift score</th>
            ${hasShiftedElements? LitHtml.html`
              <th>Elements shifted</th>` : LitHtml.nothing}
            ${hasCulprits ? LitHtml.html`
              <th>Culprit type</th> ` : LitHtml.nothing}
            ${hasCulprits ? LitHtml.html`
              <th>Culprit</th> ` : LitHtml.nothing}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td rowspan=${rootCauseCount ?? 1}>${i18n.TimeUtilities.formatMicroSecondsAsSeconds(ts)}</td>
            <td rowspan=${rootCauseCount ?? 1}>${(score.toPrecision(4))}</td>
            <td>
              <div class="elements-shifted">
                ${this.#renderShiftedElements(elementsShifted)}
              </div>
            </td>
            <td>
              ${rootCauses?.fontRequests.map(() => LitHtml.html`
                  <tr><td>Font request</td></tr>
                    `)}
              ${rootCauses?.iframes.map(() => LitHtml.html`
                <tr><td>Injected iframe</td></tr>
                  `)}
            </td>
            <td>
              ${this.#renderRootCauseValues(rootCauses)}
            </td>
          </tr>
        </tbody>
      </table>
    `;
    // clang-format on
  }

  #render(): void {
    if (!this.#layoutShift || !this.#traceInsightsData) {
      return;
    }
    const layoutShift = this.#layoutShift;
    // clang-format off
    const output = LitHtml.html`
      <div class="layout-shift-summary-details">
        ${this.#renderInsightTitleCard()}
        ${this.#renderDetailsChip()}
        ${this.#renderDetailsTable(layoutShift, this.#traceInsightsData)}
      </div>
    `;
    // clang-format on
    LitHtml.render(output, this.#shadow, {host: this});
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'devtools-performance-layout-shift-details': LayoutShiftDetails;
  }
}

customElements.define('devtools-performance-layout-shift-details', LayoutShiftDetails);
