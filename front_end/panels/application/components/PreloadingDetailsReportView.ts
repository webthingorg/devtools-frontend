// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as i18n from '../../../core/i18n/i18n.js';
import type * as Protocol from '../../../generated/protocol.js';
import * as ComponentHelpers from '../../../ui/components/helpers/helpers.js';
import * as Coordinator from '../../../ui/components/render_coordinator/render_coordinator.js';
import * as ReportView from '../../../ui/components/report_view/report_view.js';
import * as UI from '../../../ui/legacy/legacy.js';
import * as LitHtml from '../../../ui/lit-html/lit-html.js';

import preloadingViewStyles from './preloadingDetailsReportView.css.js';

// FIXME: How to correctly refer it?
// import {type PrerenderingAttempt} from '../PreloadingModel.js';
type PrerenderingAttemptId = string;

export interface PrerenderingAttempt {
  kind: 'PrerenderingAttempt';
  prerenderingAttemptId: PrerenderingAttemptId;
  startedAt: number;
  trigger: PrerenderingTrigger;
  url: string;
  status: PrerenderingStatus;
  discardedReason?: Protocol.Page.PrerenderFinalStatus|null|'Unknown';
}

type PrerenderingTrigger =
    PrerenderingTriggerSpecRules|PrerenderingTriggerDUI|PrerenderingTriggerDSE|PrerenderingTriggerOpaque;

interface PrerenderingTriggerSpecRules {
  kind: 'PrerenderingTriggerSpecRules';
  content: object;
}

interface PrerenderingTriggerDUI {
  kind: 'PrerenderingTriggerDUI';
}

interface PrerenderingTriggerDSE {
  kind: 'PrerenderingTriggerDSE';
}

interface PrerenderingTriggerOpaque {
  kind: 'PrerenderingTriggerOpaque';
}

type PrerenderingStatus = 'prerendering'|'activated'|'cancelled'|'discarded';

// type PrerenderingAttemptEvent = PrerenderingAttemptEventAdd|PrerenderingAttemptEventUpdate;

// interface PrerenderingAttemptEventAdd {
//   kind: 'PrerenderingAttemptEventAdd';
//   attempt: PrerenderingAttempt;
// }

// interface PrerenderingAttemptEventUpdate {
//   kind: 'PrerenderingAttemptEventUpdate';
//   update: PrerenderingAttempt;
// }

const UIStrings = {
  /**
  *@description Text in PreloadingDetailsReportView of the Application panel
  */
  selectAnElementForMoreDetails: 'Select an element for more details',
  /**
  *@description Text in grid and details
  */
  statusPrerendering: 'Prerendering',
  /**
  *@description Text in grid and details
  */
  statusActivated: 'Activated',
  /**
  *@description Text in grid and details
  */
  statusCancelled: 'Cancelled',
  /**
  *@description Text in grid and details
  */
  statusDiscarded: 'Discarded',
};
const str_ = i18n.i18n.registerUIStrings('panels/application/components/PreloadingDetailsReportView.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

class PrerenderingUIUtils {
  static trigger(x: PrerenderingAttempt): string {
    switch (x.trigger.kind) {
      case 'PrerenderingTriggerSpecRules':
        return i18n.i18n.lockedString('Speculation Rules');
      case 'PrerenderingTriggerDUI':
        return i18n.i18n.lockedString('Direct User Input');
      case 'PrerenderingTriggerDSE':
        return i18n.i18n.lockedString('Default Search Engine');
      case 'PrerenderingTriggerOpaque':
        return i18n.i18n.lockedString('Opaque');
    }
  }

  static status(x: PrerenderingAttempt): string {
    switch (x.status) {
      case 'prerendering':
        return i18nString(UIStrings.statusPrerendering);
      case 'activated':
        return i18nString(UIStrings.statusActivated);
      case 'cancelled':
        return i18nString(UIStrings.statusCancelled);
      case 'discarded':
        return i18nString(UIStrings.statusDiscarded);
    }
  }
}

const coordinator = Coordinator.RenderCoordinator.RenderCoordinator.instance();

export type PreloadingDetailsReportViewData = PrerenderingAttempt|null;

export class PreloadingDetailsReportView extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-resources-preloading-details-report-view`;

  readonly #shadow = this.attachShadow({mode: 'open'});
  #data: PreloadingDetailsReportViewData = null;

  connectedCallback(): void {
    this.#shadow.adoptedStyleSheets = [preloadingViewStyles];
  }

  set data(data: PreloadingDetailsReportViewData) {
    this.#data = data;
    void this.#render();
  }

  async #render(): Promise<void> {
    await coordinator.write('PreloadingDetailsReportView render', () => {
      if (this.#data === null) {
        LitHtml.render(
            LitHtml.html`
          <div class="preloading-preview">
            <div>
              <p>
                ${i18nString(UIStrings.selectAnElementForMoreDetails)}
              </p>
            </div>
          </div>
        `,
            this.#shadow, {host: this});
        return;
      }

      const startedAt = new Date(this.#data.startedAt).toLocaleString();
      const trigger = PrerenderingUIUtils.trigger(this.#data);
      const status = PrerenderingUIUtils.status(this.#data);

      // Disabled until https://crbug.com/1079231 is fixed.
      // clang-format off
      LitHtml.render(LitHtml.html`
        <${ReportView.ReportView.Report.litTagName} .data=${{reportTitle: 'Prerendering Attempt'} as ReportView.ReportView.ReportData}>
          <${ReportView.ReportView.ReportSectionHeader.litTagName}>${i18n.i18n.lockedString('Basic information')}</${
            ReportView.ReportView.ReportSectionHeader.litTagName}>

          <${ReportView.ReportView.ReportKey.litTagName}>${i18n.i18n.lockedString('URL')}</${
            ReportView.ReportView.ReportKey.litTagName}>
          <${ReportView.ReportView.ReportValue.litTagName}>
            <div class="text-ellipsis" title=${this.#data.url}>${this.#data.url}</div>
          </${ReportView.ReportView.ReportValue.litTagName}>

          <${ReportView.ReportView.ReportKey.litTagName}>${i18n.i18n.lockedString('Started at')}</${ReportView.ReportView.ReportKey.litTagName}>
          <${ReportView.ReportView.ReportValue.litTagName}>
            <div class="text-ellipsis" title="">
              ${startedAt}
            </div>
          </${ReportView.ReportView.ReportValue.litTagName}>

          <${ReportView.ReportView.ReportKey.litTagName}>${i18n.i18n.lockedString('Trigger')}</${ReportView.ReportView.ReportKey.litTagName}>
          <${ReportView.ReportView.ReportValue.litTagName}>
            <div class="text-ellipsis" title="">
              ${trigger}
            </div>
          </${ReportView.ReportView.ReportValue.litTagName}>

          <${ReportView.ReportView.ReportKey.litTagName}>${i18n.i18n.lockedString('Status')}</${ReportView.ReportView.ReportKey.litTagName}>
          <${ReportView.ReportView.ReportValue.litTagName}>
            ${status}
          </${ReportView.ReportView.ReportValue.litTagName}>

          ${this.#maybeDiscardedReason()}
        </${ReportView.ReportView.Report.litTagName}>
      `, this.#shadow, {host: this});
      // clang-format on
    });
  }

  #maybeDiscardedReason(): LitHtml.LitTemplate {
    if (!this.#data) {
      return LitHtml.nothing;
    }

    if (this.#data.discardedReason === null || this.#data.discardedReason === undefined) {
      return LitHtml.nothing;
    }

    return LitHtml.html`
          <${ReportView.ReportView.ReportKey.litTagName}>${i18n.i18n.lockedString('Discarded reason')}</${
        ReportView.ReportView.ReportKey.litTagName}>
          <${ReportView.ReportView.ReportValue.litTagName}>
            ${this.#data.discardedReason}
          </${ReportView.ReportView.ReportValue.litTagName}>
    `;
  }
}

ComponentHelpers.CustomElements.defineComponent(
    'devtools-resources-preloading-details-report-view', PreloadingDetailsReportView);

declare global {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLElementTagNameMap {
    'devtools-resources-preloading-details-report-view': PreloadingDetailsReportView;
  }
}
