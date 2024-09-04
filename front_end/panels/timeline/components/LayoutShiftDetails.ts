// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as i18n from '../../../core/i18n/i18n.js';
import type * as Platform from '../../../core/platform/platform.js';
import * as SDK from '../../../core/sdk/sdk.js';
import type * as Protocol from '../../../generated/protocol.js';
import * as Helpers from '../../../models/trace/helpers/helpers.js';
import type * as TraceEngine from '../../../models/trace/trace.js';
import * as LegacyComponents from '../../../ui/legacy/components/utils/utils.js';
import * as LitHtml from '../../../ui/lit-html/lit-html.js';

import {NodeLink, type NodeLinkData} from './insights/NodeLink.js';
import layoutShiftDetailsStyles from './layoutShiftDetails.css.js';

const MAX_URL_LENGTH = 80;

const UIStrings = {
  /**
   * @description Text for a Layout Shift event indictating that it is an insight.
   */
  insight: 'Insight',
  /**
   * @description Title for a Layout Shift event insight.
   */
  layoutShiftCulprits: 'Layout Shift culprits',
  /**
   * @description Text indicating a Layout Shift.
   */
  layoutShift: 'Layout Shift',
  /**
   * @description Text for a table header referring to the start time of a Layout Shift event.
   */
  startTime: 'Start time',
  /**
   * @description Text for a table header referring to the score of a Layout Shift event.
   */
  shiftScore: 'Shift score',
  /**
   * @description Text for a table header referring to the elements shifted for a Layout Shift event.
   */
  elementsShifted: 'Elements shifted',
  /**
   * @description Text for a table header referring to the culprit type of a Layout Shift event culprit.
   */
  culpritType: 'Culprit type',
  /**
   * @description Text for a table header referring to the culprit of a Layout Shift event.
   */
  culprit: 'Culprit',
  /**
   * @description Text for a culprit type of Injected iframe.
   */
  injectedIframe: 'Injected iframe',
  /**
   * @description Text for a culprit type of Font request.
   */
  fontRequest: 'Font request',
};

const str_ = i18n.i18n.registerUIStrings('panels/timeline/components/LayoutShiftDetails.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

export class LayoutShiftDetails extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-performance-layout-shift-details`;
  readonly #shadow = this.attachShadow({mode: 'open'});

  #layoutShift?: TraceEngine.Types.TraceEvents.SyntheticLayoutShift|null;
  #traceInsightsData: TraceEngine.Insights.Types.TraceInsightData|null = null;
  #isFreshRecording: Boolean = false;

  connectedCallback(): void {
    this.#shadow.adoptedStyleSheets = [layoutShiftDetailsStyles];
    this.#render();
  }

  setData(
      layoutShift: TraceEngine.Types.TraceEvents.SyntheticLayoutShift,
      traceInsightsData: TraceEngine.Insights.Types.TraceInsightData|null, isFreshRecording: Boolean): void {
    if (this.#layoutShift === layoutShift) {
      return;
    }
    this.#layoutShift = layoutShift;
    this.#traceInsightsData = traceInsightsData;
    this.#isFreshRecording = isFreshRecording;
    this.#render();
  }

  #renderInsightTitleCard(): LitHtml.TemplateResult|null {
    if (!this.#layoutShift) {
      return null;
    }

    return LitHtml.html`
      <div class="timeline-details-chip-decorative-title">
        <div class="insight-keyword">${UIStrings.insight}</div>${UIStrings.layoutShiftCulprits}</div>
    `;
  }

  #renderDetailsChip(): LitHtml.TemplateResult {
    return LitHtml.html`
      <div class="layout-shift-details-title">
        <div class="layout-shift-event-chip"></div>
        ${UIStrings.layoutShift}
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
      if (!domLoadingFrame) {
        return null;
      }
      const el = LegacyComponents.Linkifier.Linkifier.linkifyRevealable(domLoadingFrame, domLoadingFrame.displayName());
      return LitHtml.html`<tr><td>${el}</td></tr>`;
    };

    return LitHtml.html`
      ${rootCauses?.fontRequests.map(renderFontRequests)}
      ${rootCauses?.iframes.map(renderIframes)}
  `;
  }

  #renderDetailsTable(
      layoutShift: TraceEngine.Types.TraceEvents.SyntheticLayoutShift,
      traceInsightsData: TraceEngine.Insights.Types.TraceInsightData, isFreshRecording: Boolean): LitHtml.TemplateResult
      |null {
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
            <th>${i18nString(UIStrings.startTime)}</th>
            <th>${i18nString(UIStrings.shiftScore)}</th>
            ${hasShiftedElements && isFreshRecording ? LitHtml.html`
              <th>${i18nString(UIStrings.elementsShifted)}</th>` : LitHtml.nothing}
            ${hasCulprits ? LitHtml.html`
              <th>${i18nString(UIStrings.culpritType)}</th> ` : LitHtml.nothing}
            ${hasCulprits && isFreshRecording ? LitHtml.html`
              <th>${i18nString(UIStrings.culprit)}</th> ` : LitHtml.nothing}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td rowspan=${rootCauseCount ?? 1}>${i18n.TimeUtilities.preciseMillisToString(Helpers.Timing.microSecondsToMilliseconds(ts))}</td>
            <td rowspan=${rootCauseCount ?? 1}>${(score.toPrecision(4))}</td>
            ${isFreshRecording ? LitHtml.html`
              <td>
                <div class="elements-shifted">
                  ${this.#renderShiftedElements(elementsShifted)}
                </div>
              </td>` : LitHtml.nothing
            }
            <td>
              ${rootCauses?.fontRequests.map(() => LitHtml.html`
                  <tr><td>${i18nString(UIStrings.fontRequest)}</td></tr>
                    `)}
              ${rootCauses?.iframes.map(() => LitHtml.html`
                <tr><td>${i18nString(UIStrings.injectedIframe)}</td></tr>
                  `)}
            </td>
            ${isFreshRecording ? LitHtml.html`
              <td>
                ${this.#renderRootCauseValues(rootCauses)}
              </td>`: LitHtml.nothing}
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
        ${this.#renderDetailsTable(layoutShift, this.#traceInsightsData, this.#isFreshRecording)}
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
