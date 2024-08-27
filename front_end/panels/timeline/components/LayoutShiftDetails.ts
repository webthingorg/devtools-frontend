// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as TraceEngine from '../../../models/trace/trace.js';
import * as LitHtml from '../../../ui/lit-html/lit-html.js';
import * as i18n from '../../../core/i18n/i18n.js';
import {NodeLink, type NodeLinkData} from './insights/NodeLink.js';
import * as LegacyComponents from '../../../ui/legacy/components/utils/utils.js';
import type * as SDK from '../../../core/sdk/sdk.js';
import * as Platform from '../../../core/platform/platform.js';

import layoutShiftDetailsStyles from './layoutShiftDetails.css.js';

const MAX_URL_LENGTH = 80;

export class LayoutShiftDetails extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-performance-layout-shift-entry-summary`;
  readonly #shadow = this.attachShadow({mode: 'open'});

  #layoutShift?: TraceEngine.Types.TraceEvents.SyntheticLayoutShift|null;
  #traceInsightsData: TraceEngine.Insights.Types.TraceInsightData|null = null;
  #linkifier: LegacyComponents.Linkifier.Linkifier;
  #maybeTarget: SDK.Target.Target|null = null;
  constructor(linkifier: LegacyComponents.Linkifier.Linkifier) {
    // constructor() {
    super();
    this.#linkifier = linkifier;
  }

  connectedCallback(): void {
    this.#shadow.adoptedStyleSheets = [layoutShiftDetailsStyles];
    this.#render();
  }

  setData(
    layoutShift: TraceEngine.Types.TraceEvents.SyntheticLayoutShift, traceInsightsData: TraceEngine.Insights.Types.TraceInsightData|null, maybeTarget: SDK.Target.Target|null): void {
    if (this.#layoutShift === layoutShift) {
      return;
    }
    this.#layoutShift = layoutShift;
    this.#traceInsightsData = traceInsightsData;
    this.#maybeTarget = maybeTarget;
    console.log("🤡 ~ LayoutShiftDetails ~ traceInsightsData:", traceInsightsData);
    console.log("🤡 ~ LayoutShiftDetails ~ this.#traceInsightsData:", this.#traceInsightsData);
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

  #renderDetailsChip() {
    // const style = {
    //   backgroundColor: `${colorForNetworkRequest(this.#networkRequest)}`,
    // }; <!-- ${i18nString(UIStrings.networkRequest)} -->
    return LitHtml.html`
      <div class="layout-shift-details-title">
        <div class="layout-shift-event-chip"></div>
        Layout Shift
      </div>
    `;

    // return LitHtml.html`
    // <div class="timeline-details-chip-title"></div> Layout Shift
    // `;
  }

  #renderShiftedElements(elementsShifted: TraceEngine.Types.TraceEvents.TraceImpactedNode[] | undefined): LitHtml.LitTemplate {
    return LitHtml.html`
    ${elementsShifted?.map(el => LitHtml.html`
        ${el.node_id !== undefined ? LitHtml.html`
          <${NodeLink.litTagName}
        .data=${{
          backendNodeId: el.node_id,
          // options: "",
        } as NodeLinkData}>
      </${NodeLink.litTagName}>` : LitHtml.nothing}
      `)}
      `;
  }

  #renderRootCauseValues(rootCauses:TraceEngine.Insights.InsightRunners.CumulativeLayoutShift.LayoutShiftRootCausesData | undefined) {
    const renderFontRequests = (font: TraceEngine.Types.TraceEvents.SyntheticNetworkRequest) => {
      const options = {
          tabStop: false,
          showColumnNumber: false,
          inlineFrameIndex: 0,
          maxLength: MAX_URL_LENGTH,
      };

      const linkifiedURL = LegacyComponents.Linkifier.Linkifier.linkifyURL(
          font.args.data.url as Platform.DevToolsPath.UrlString, options);

      return LitHtml.html`<tr><td>${linkifiedURL}</td></tr>`;
  }

  const renderIframes = (iframe: TraceEngine.Types.TraceEvents.TraceEventRenderFrameImplCreateChildFrame) => {
      const topFrame = TraceEngine.Helpers.Trace.getZeroIndexedStackTraceForEvent(iframe)?.at(0) ?? null;
      if (topFrame) {
          const link = this.#linkifier.maybeLinkifyConsoleCallFrame(
              this.#maybeTarget, topFrame, {tabStop: true, inlineFrameIndex: 0, showColumnNumber: true});

          if (link) {
              return LitHtml.html`<tr><td>${link}</td></tr>`;
          }
      }

      return null;
  }

  return LitHtml.html`
      ${rootCauses?.fontRequests.map(renderFontRequests)}
      ${rootCauses?.iframes.map(renderIframes)}
  `;
  }

  #renderDetailsTable(layoutShift: TraceEngine.Types.TraceEvents.SyntheticLayoutShift, traceInsightsData: TraceEngine.Insights.Types.TraceInsightData) {
    console.log("layout shift: ", layoutShift);
    const score = layoutShift.args.data?.score;
    if (!score) {
      return;
    }

    const ts = layoutShift.ts;
    console.log("layoutShift.args.data?.navigationId: ", layoutShift.args.data?.navigationId);
    // console.log("layoutShift.rawSourceEvent.args.data?.navigationId: ", layoutShift.rawSourceEvent.args.data?.navigationId);
    const clsInsight = traceInsightsData.get(layoutShift.args.data?.navigationId ?? "")?.CumulativeLayoutShift;
    if (clsInsight instanceof Error) {
      return;
    }

    const rootCauses = clsInsight?.shifts?.get(layoutShift);

    const fin = layoutShift.args.data?.impacted_nodes ?? [];
    const nid = fin[0]?.node_id;


    // const nodeSpan = LegacyComponents.Linkifier.Linkifier.untruncatedNodeText(nid);

    /*
    ${ComponentHelpers.Directives.nodeRenderedCallback(node => {
                    this.#interactionsListEl = node as HTMLElement;
                  })}

                  <${NodeLink.litTagName}
                .data=${{
                  backendNodeId: el.node_id,
                  // options: "",
                } as NodeLinkData}>
              </${NodeLink.litTagName}>
    */
    console.log("🤡  rootCauses:", rootCauses);

    const fakeRoot = [1, 2, 3];
    const fakeElem = [1, 2, 3];
    const fakeTypes = ['iframes', 'fonts', 'unsized media'];
    
    console.log("🤡 clsInsight:", clsInsight);
    console.log("rootCauses?.fontRequests: ", rootCauses?.fontRequests);
    console.log("rootCauses?.iframes: ", rootCauses?.iframes);
    const elementsShifted = layoutShift.args.data?.impacted_nodes;
    console.log("🤡 ~ #renderDetailsTable ~ elementsShifted:", elementsShifted);

    return LitHtml.html`
      <table class="layout-shift-details-table">
        <thead>
          <tr class="table-title">
            <th>Start time</th>
            <th>Shift score</th>
            <th>Elements shifted</th> 
            <th>Culprit type</th> 
            <th>Culprit</th> 
          </tr>
        </thead>
        <tbody>
          <tr>
            <td rowspan="${fakeTypes?.length}">${i18n.TimeUtilities.formatMicroSecondsAsSeconds(ts)}</td>
            <td rowspan="${fakeTypes?.length}">${(score.toPrecision(4))}</td>
            <td>
              <div class="elements-shifted">
                ${this.#renderShiftedElements(elementsShifted)}
              </div>
            </td>
            <td>
              ${rootCauses?.fontRequests.map(font => LitHtml.html`
                  <tr><td>Font request</td></tr>
                    `)}
              ${rootCauses?.iframes.map(font => LitHtml.html`
                <tr><td>Injected iframe</td></tr>
                  `)}
            </td>
            <td>
              ${this.#renderRootCauseValues(rootCauses)}
            </td>
          </tr>
        </tbody>
      </table>
      <div>
      <${NodeLink.litTagName}
          .data=${{
            backendNodeId: nid,
            // options: "",
          } as NodeLinkData}>
        </${NodeLink.litTagName}>
      </div>
    `;
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
