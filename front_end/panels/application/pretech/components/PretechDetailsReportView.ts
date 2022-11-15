// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as i18n from '../../../../core/i18n/i18n.js';
import * as ComponentHelpers from '../../../../ui/components/helpers/helpers.js';
import * as Coordinator from '../../../../ui/components/render_coordinator/render_coordinator.js';
import * as ReportView from '../../../../ui/components/report_view/report_view.js';
import * as LitHtml from '../../../../ui/lit-html/lit-html.js';
import type * as SDK from '../../../../core/sdk/sdk.js';

import pretechDetailsReportViewStyles from './pretechDetailsReportView.css.js';

type PrerenderingAttempt = SDK.PrerenderingModel.PrerenderingAttempt;

const UIStrings = {
  /**
  *@description Text in PretechDetailsReportView of the Application panel
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
const str_ =
    i18n.i18n.registerUIStrings('panels/application/pretech/components/PretechDetailsReportView.ts', UIStrings);
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

export type PretechDetailsReportViewData = PrerenderingAttempt|null;

export class PretechDetailsReportView extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-resources-pretech-details-report-view`;

  readonly #shadow = this.attachShadow({mode: 'open'});
  #data: PretechDetailsReportViewData = null;

  connectedCallback(): void {
    this.#shadow.adoptedStyleSheets = [pretechDetailsReportViewStyles];
  }

  set data(data: PretechDetailsReportViewData) {
    this.#data = data;
    void this.#render();
  }

  async #render(): Promise<void> {
    await coordinator.write('PretechDetailsReportView render', () => {
      if (this.#data === null) {
        LitHtml.render(
            LitHtml.html`
          <div class="pretech-noselected">
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
    'devtools-resources-pretech-details-report-view', PretechDetailsReportView);

declare global {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLElementTagNameMap {
    'devtools-resources-pretech-details-report-view': PretechDetailsReportView;
  }
}
