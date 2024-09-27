// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as i18n from '../../../../core/i18n/i18n.js';
import * as Platform from '../../../../core/platform/platform.js';
import * as Trace from '../../../../models/trace/trace.js';
import * as LegacyComponents from '../../../../ui/legacy/components/utils/utils.js';
import * as UI from '../../../../ui/legacy/legacy.js';
import * as LitHtml from '../../../../ui/lit-html/lit-html.js';
import type * as Overlays from '../../overlays/overlays.js';

import {BaseInsight, md, shouldRenderForCategory} from './Helpers.js';
import * as SidebarInsight from './SidebarInsight.js';
import {Category} from './types.js';

const UIStrings = {
  /**
   *@description Title of an insight that provides details about Forced Reflow.
   */
  title: 'Forced Reflow',
  /**
   * @description Text to describe the forced reflow.
   */
  description:
      'Learn more about [Forced Reflow](https://developers.google.com/web/fundamentals/performance/rendering/avoid-large-complex-layouts-and-layout-thrashing#avoid-forced-synchronous-layouts).',
  /**
   *@description Title of a list to provide recalculation forced data
   */
  recalculationForced: 'Recalculation forced',
  /**
   *@description Title of a list to provide bottom-up data
   */
  bottomup: 'Bottom-up',
  /**
   *@description Text to describe the top time-consuming function call
   */
  topTimeConsumingFunctionCall: 'Top time-consuming function call',
};

const str_ = i18n.i18n.registerUIStrings('panels/timeline/components/insights/ForcedReflow.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

export class ForcedReflow extends BaseInsight {
  static readonly litTagName = LitHtml.literal`devtools-performance-forced-reflow`;
  override insightCategory: Category = Category.ALL;
  override internalName: string = 'forced-reflow';
  override userVisibleTitle: string = i18nString(UIStrings.title);
  #forcedReflowEvents: Trace.Insights.InsightRunners.ForcedReflow.ForcedReflowInsightResult|null = null;


  #linkifyUrl(scriptId: number|string, lineNumber: number, columnNumber: number, url: string, functionName: string):
      HTMLElement {
    const linkElement = document.createElement('span');
    linkElement.classList.add('fr-url');
    if (functionName.length > 0) {
      UI.UIUtils.createTextChild(linkElement, functionName);
    }
    if (lineNumber >= 0) {
      const options = {
        tabStop: true,
        scriptId: scriptId,
        url: url,
        lineNumber: lineNumber,
        columnNumber: columnNumber,
      };
      const linkifiedURL =
          LegacyComponents.Linkifier.Linkifier.linkifyURL(url as Platform.DevToolsPath.UrlString, options);
      if (functionName.length > 0) {
        UI.UIUtils.createTextChild(linkElement, ' @ ');
      }
      linkElement.appendChild(linkifiedURL);
    }

    return linkElement;
  }


  #renderForcedReflow(): LitHtml.LitTemplate {
    const MAX_BottomUpData = 3;
    const topLevelFunctionCallData = this.#forcedReflowEvents?.topLevelFunctionCallData;
    const bottomUpCallStackData = this.#forcedReflowEvents?.aggregatedBottomUpData.slice(0, MAX_BottomUpData);
    // clang-format off
    return LitHtml.html`
    <div class="insights">
      <${SidebarInsight.SidebarInsight.litTagName} .data=${{
        title: this.userVisibleTitle,
        internalName: this.internalName,
        expanded: this.isActive(),
      } as SidebarInsight.InsightDetails}
      @insighttoggleclick=${this.onSidebarClick}
      >
      <div slot="insight-description" class="insight-description">
      ${md(i18nString(UIStrings.description))}
      </div>
      <div slot="insight-content" class="table-container">
        <span class="insight-sub-title fr-title">${i18nString(UIStrings.topTimeConsumingFunctionCall)}:
         ${topLevelFunctionCallData? LitHtml.html`${this.#linkifyUrl(topLevelFunctionCallData.scriptId, topLevelFunctionCallData.lineNumber, topLevelFunctionCallData.columnNumber, topLevelFunctionCallData.url, topLevelFunctionCallData.functionName)}<br>`
        :''}
        </span>
        ${
          bottomUpCallStackData?
          bottomUpCallStackData.map(data =>{
            return LitHtml.html`
            ${data.recalcDataSet.size > 0 ? LitHtml.html`
            <span class="insight-sub-title" >${i18nString(UIStrings.recalculationForced)}:</span>
            <ul class="url-list fr-list">
              ${data.recalcData.map(rc =>{
              return LitHtml.html`<li>${this.#linkifyUrl(rc.scriptId, rc.lineNumber, rc.columnNumber, rc.url, rc.functionName)}</li>`;})}
            </ul>
            `:''}
            <span class="insight-sub-title">${i18nString(UIStrings.bottomup)}:</span>
            <ul class="url-list fr-list fr-list-last">
              ${data.bottomUpData.map(bu =>{
              return LitHtml.html`<li>${this.#linkifyUrl(bu.scriptId, bu.lineNumber, bu.columnNumber, bu.url, bu.functionName)}</li>`;})}
            </ul>
            `;
          }):''
        }
      </div>
    </div>`
  }

  override createOverlays(): Overlays.Overlays.TimelineOverlay[] {
    if (!this.data.insights || !this.data.insightSetKey) {
        return [];
    }
    const {insightSetKey: navigationId, insights} = this.data;

    const insightsByNavigation = insights.get(navigationId);
    if (!insightsByNavigation) {
        return [];
    }

    const frInsight: Error|Trace.Insights.InsightRunners.ForcedReflow.ForcedReflowInsightResult=
        insightsByNavigation.data.ForcedReflow;
    if (frInsight instanceof Error) {
      return [];
    }

    // TODO(crbug.com/369766156) add overlay for forced reflow
    return [];
  }

  #hasDataToRender(): boolean {
    this.#forcedReflowEvents = Trace.Insights.Common.getInsight('ForcedReflow', this.data.insights, this.data.insightSetKey)
    return this.#forcedReflowEvents !== null && this.#forcedReflowEvents.topLevelFunctionCallData !== undefined && this.#forcedReflowEvents.aggregatedBottomUpData.length > 0;
  }

  override render(): void {
    const matchesCategory = shouldRenderForCategory({
      activeCategory: this.data.activeCategory,
      insightCategory: this.insightCategory,
    });
    const shouldRender = matchesCategory && this.#hasDataToRender();
    const output = shouldRender ? this.#renderForcedReflow() : LitHtml.nothing;
    LitHtml.render(output, this.shadow, {host: this});
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'devtools-performance-forced-reflow': ForcedReflow;
  }
}

customElements.define('devtools-performance-forced-reflow', ForcedReflow);
