// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as i18n from '../../../../core/i18n/i18n.js';
import * as Platform from '../../../../core/platform/platform.js';
import * as Trace from '../../../../models/trace/trace.js';
import * as LitHtml from '../../../../ui/lit-html/lit-html.js';
import type * as Overlays from '../../overlays/overlays.js';

import {BaseInsight, md, shouldRenderForCategory} from './Helpers.js';
import * as SidebarInsight from './SidebarInsight.js';
import {Table, type TableData, type TableState} from './Table.js';
import {Category} from './types.js';

type ThirdPartiesEntires = Array<[
  Trace.Insights.InsightRunners.ThirdPartyWeb.Entity,
  Trace.Insights.InsightRunners.ThirdPartyWeb.Summary,
]>;

const UIStrings = {
  /** Title of an insight that provides details about the code on a web page that the user doesn't control (referred to as "third-party code"). */
  title: 'Third parties',
  /**
   * @description Description of a DevTools insight that identifies the code on the page that the user doesn't control.
   * This is displayed after a user expands the section to see more. No character length limits.
   */
  description: 'Third party code can significantly impact load performance. ' +
      'Assess and reduce the ' +
      '[amount of third party code](https://developers.google.com/web/fundamentals/performance/optimizing-content-efficiency/loading-third-party-javascript/) on the page, and try to load what you can after the page has finished loading the main content.',
  /** Label for a table column that displays the name of a third-party provider. */
  columnThirdParty: 'Third party',
  /** Label for a column in a data table; entries will be the download size of a web resource in kilobytes. */
  columnTransferSize: 'Transfer size',
  /** Label for a table column that displays how much time each row spent blocking other work on the main thread, entries will be the number of milliseconds spent. */
  columnBlockingTime: 'Blocking time',
};

const str_ = i18n.i18n.registerUIStrings('panels/timeline/components/insights/ThirdParties.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

export class ThirdParties extends BaseInsight {
  static readonly litTagName = LitHtml.literal`devtools-performance-third-parties`;
  override insightCategory: Category = Category.ALL;
  override internalName: string = 'third-parties';
  override userVisibleTitle: string = i18nString(UIStrings.title);

  #overlaysForEntity =
      new Map<Trace.Insights.InsightRunners.ThirdPartyWeb.Entity, Overlays.Overlays.TimelineOverlay[]>();
  #tableState: TableState = {
    selectedRowEl: null,
    selectionIsSticky: false,
  };

  override createOverlays(): Overlays.Overlays.TimelineOverlay[] {
    this.#overlaysForEntity.clear();

    const insight = Trace.Insights.Common.getInsight('ThirdPartyWeb', this.data.insights, this.data.insightSetKey);
    if (!insight) {
      return [];
    }

    const overlays: Overlays.Overlays.TimelineOverlay[] = [];
    for (const [entity, requests] of insight.requestsByEntity) {
      if (entity === insight.firstPartyEntity) {
        continue;
      }

      const overlaysForThisEntity = [];
      for (const request of requests) {
        const overlay: Overlays.Overlays.TimelineOverlay = {
          type: 'ENTRY_OUTLINE',
          entry: request,
          outlineReason: 'INFO',
        };
        overlaysForThisEntity.push(overlay);
        overlays.push(overlay);
      }

      this.#overlaysForEntity.set(entity, overlaysForThisEntity);
    }

    return overlays;
  }

  #render(entries: ThirdPartiesEntires): LitHtml.TemplateResult {
    const topTransferSizeEntries = entries.sort((a, b) => b[1].transferSize - a[1].transferSize).slice(0, 6);
    const topMainThreadTimeEntries = entries.sort((a, b) => b[1].mainThreadTime - a[1].mainThreadTime).slice(0, 6);

    // clang-format off
    return LitHtml.html`
        <div class="insights">
            <${SidebarInsight.SidebarInsight.litTagName} .data=${{
              title: this.userVisibleTitle,
              internalName: this.internalName,
              expanded: this.isActive(),
            } as SidebarInsight.InsightDetails}
            @insighttoggleclick=${this.onSidebarClick}>
                <div slot="insight-description" class="insight-description">
                  ${md(i18nString(UIStrings.description))}
                </div>
                <div slot="insight-content">
                  ${LitHtml.html`<${Table.litTagName}
                    .data=${{
                      state: this.#tableState,
                      headers: [i18nString(UIStrings.columnThirdParty), i18nString(UIStrings.columnTransferSize)],
                      rows: topTransferSizeEntries.map(([entity, summary]) => ({
                        values: [
                          entity.name,
                          Platform.NumberUtilities.bytesToString(summary.transferSize),
                        ],
                        overlays: this.#overlaysForEntity.get(entity),
                      })),
                    } as TableData}>
                  </${Table.litTagName}>`}
                  ${LitHtml.html`<${Table.litTagName}
                    .data=${{
                      state: this.#tableState,
                      headers: [i18nString(UIStrings.columnThirdParty), i18nString(UIStrings.columnBlockingTime)],
                      rows: topMainThreadTimeEntries.map(([entity, summary]) => ({
                        values: [
                          entity.name,
                          i18n.TimeUtilities.millisToString(Platform.Timing.microSecondsToMilliSeconds(summary.mainThreadTime)),
                        ],
                        overlays: this.#overlaysForEntity.get(entity),
                      })),
                    } as TableData}>
                  </${Table.litTagName}>`}
                </div>
            </${SidebarInsight.SidebarInsight}>
        </div>`;
    // clang-format on
  }

  override render(): void {
    const insight = Trace.Insights.Common.getInsight('ThirdPartyWeb', this.data.insights, this.data.insightSetKey);
    const entries = insight && [...insight.summaryByEntity.entries()].filter(kv => kv[0] !== insight.firstPartyEntity);
    const shouldShow = entries?.length;

    const matchesCategory = shouldRenderForCategory({
      activeCategory: this.data.activeCategory,
      insightCategory: this.insightCategory,
    });
    const output = shouldShow && matchesCategory ? this.#render(entries) : LitHtml.nothing;
    LitHtml.render(output, this.shadow, {host: this});
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'devtools-performance-third-parties': ThirdParties;
  }
}

customElements.define('devtools-performance-third-parties', ThirdParties);
