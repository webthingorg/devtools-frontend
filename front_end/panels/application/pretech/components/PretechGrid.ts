// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as i18n from '../../../../core/i18n/i18n.js';
import * as DataGrid from '../../../../ui/components/data_grid/data_grid.js';
import * as ComponentHelpers from '../../../../ui/components/helpers/helpers.js';
import * as LitHtml from '../../../../ui/lit-html/lit-html.js';

import pretechGridStyles from './pretechGrid.css.js';

const UIStrings = {
  /**
  *@description Column header for a table displaying prerendering attempt.
  */
  startedAt: 'Started at',
  /**
  *@description Column header for a table displaying prerendering attempt.
  */
  type: 'Type',
  /**
  *@description Column header for a table displaying prerendering attempt.
  */
  trigger: 'Trigger',
  /**
  *@description Column header for a table displaying prerendering attempt.
  */
  status: 'Status',
};
const str_ = i18n.i18n.registerUIStrings('panels/application/components/PretechGrid.ts', UIStrings);
export const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

const {render, html} = LitHtml;

export interface PretechGridRow {
  id: string;
  startedAt: string;
  type: string;
  trigger: string;
  url: string;
  status: string;
}

// Grid component to show prerendering attempts.
export class PretechGrid extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-resources-pretech-grid`;

  readonly #shadow = this.attachShadow({mode: 'open'});
  #rows: PretechGridRow[] = [];

  connectedCallback(): void {
    this.#shadow.adoptedStyleSheets = [pretechGridStyles];
    this.#render();
  }

  update(rows: PretechGridRow[]): void {
    this.#rows = rows;
    this.#render();
  }

  #render(): void {
    const reportsGridData: DataGrid.DataGridController.DataGridControllerData = {
      columns: [
        {
          id: 'startedAt',
          title: i18nString(UIStrings.startedAt),
          widthWeighting: 20,
          hideable: false,
          visible: true,
        },
        {
          id: 'type',
          title: i18nString(UIStrings.type),
          widthWeighting: 10,
          hideable: false,
          visible: true,
        },
        {
          id: 'trigger',
          title: i18nString(UIStrings.trigger),
          widthWeighting: 10,
          hideable: false,
          visible: true,
        },
        {
          id: 'url',
          title: i18n.i18n.lockedString('URL'),
          widthWeighting: 40,
          hideable: false,
          visible: true,
        },
        {
          id: 'status',
          title: i18nString(UIStrings.status),
          widthWeighting: 20,
          hideable: false,
          visible: true,
        },
      ],
      rows: this.#buildReportRows(),
    };

    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
    render(html`
      <div class="pretech-container">
        <${DataGrid.DataGridController.DataGridController.litTagName} .data=${
            reportsGridData as DataGrid.DataGridController.DataGridControllerData}>
        </${DataGrid.DataGridController.DataGridController.litTagName}>
      </div>
    `, this.#shadow, {host: this});
    // clang-format on
  }

  #buildReportRows(): DataGrid.DataGridUtils.Row[] {
    return this.#rows.map(row => ({
                            cells: [
                              {columnId: 'id', value: row.id},
                              {columnId: 'type', value: row.type},
                              {columnId: 'startedAt', value: row.startedAt},
                              {columnId: 'trigger', value: row.trigger},
                              {columnId: 'url', value: row.url},
                              {columnId: 'status', value: row.status},
                            ],
                          }));
  }
}

ComponentHelpers.CustomElements.defineComponent('devtools-resources-pretech-grid', PretechGrid);

declare global {
  interface HTMLElementTagNameMap {
    'devtools-resources-pretech-grid': PretechGrid;
  }
}
