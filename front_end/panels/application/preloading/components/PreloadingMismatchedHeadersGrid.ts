// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as i18n from '../../../../core/i18n/i18n.js';
import {assertNotNullOrUndefined} from '../../../../core/platform/platform.js';
import type * as SDK from '../../../../core/sdk/sdk.js';
import * as DataGrid from '../../../../ui/components/data_grid/data_grid.js';
import * as ComponentHelpers from '../../../../ui/components/helpers/helpers.js';
import * as LegacyWrapper from '../../../../ui/components/legacy_wrapper/legacy_wrapper.js';
import type * as UI from '../../../../ui/legacy/legacy.js';
import * as LitHtml from '../../../../ui/lit-html/lit-html.js';

import preloadingGridStyles from './preloadingGrid.css.js';

const {render, html} = LitHtml;

export interface PreloadingMismatchedHeadersGridData {
  rows: PreloadingMismatchedHeadersGridRow[];
}

export interface PreloadingMismatchedHeadersGridRow {
  id: string;
  attempt: SDK.PreloadingModel.PrerenderAttempt;
}

export class PreloadingMismatchedHeadersGrid extends LegacyWrapper.LegacyWrapper.WrappableComponent<UI.Widget.VBox> {
  static readonly litTagName = LitHtml.literal`devtools-resources-preloading-mismatched-headers-grid`;

  readonly #shadow = this.attachShadow({mode: 'open'});
  // #data: PreloadingGridData|null = null;
  #data: SDK.PreloadingModel.PrerenderAttempt|null = null;
  connectedCallback(): void {
    this.#shadow.adoptedStyleSheets = [preloadingGridStyles];
    this.#render();
  }

  set data(data: SDK.PreloadingModel.PrerenderAttempt) {
    if (data === null) {
      return;
    }
    this.#data = data;
    this.#render();
  }

  #render(): void {
    if (this.#data === null) {
      return;
    }

    const reportsGridData: DataGrid.DataGridController.DataGridControllerData = {
      columns: [
        {
          id: 'headerName',
          title: i18n.i18n.lockedString('headerName'),
          widthWeighting: 40,
          hideable: false,
          visible: true,
          sortable: true,
        },
        {
          id: 'initialValue',
          title: 'initialValue',
          widthWeighting: 15,
          hideable: false,
          visible: true,
          sortable: true,
        },
        {
          id: 'activationValue',
          title: 'activationValue',
          widthWeighting: 20,
          hideable: false,
          visible: true,
          sortable: true,
        },
      ],
      rows: this.#buildReportRows(),
      striped: true,
    };

    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
      render(html`
        <div class="preloading-container">
          <${DataGrid.DataGridController.DataGridController.litTagName} .data=${
              reportsGridData as DataGrid.DataGridController.DataGridControllerData}>
          </${DataGrid.DataGridController.DataGridController.litTagName}>
        </div>
      `, this.#shadow, {host: this});
    // clang-format on
  }

  #buildReportRows(): DataGrid.DataGridUtils.Row[] {
    assertNotNullOrUndefined(this.#data);
    assertNotNullOrUndefined(this.#data.mismatchedHeaders);

    return this.#data.mismatchedHeaders.map(mismatchedHeaders => ({
                                              cells: [
                                                {
                                                  columnId: 'headerName',
                                                  value: mismatchedHeaders.headerName,
                                                },
                                                {
                                                  columnId: 'initialValue',
                                                  value: mismatchedHeaders.initialValue,
                                                },
                                                {
                                                  columnId: 'activationValue',
                                                  value: mismatchedHeaders.activationValue,
                                                },
                                              ],
                                            }));
  }
}

ComponentHelpers.CustomElements.defineComponent(
    'devtools-resources-preloading-mismatched-headers-grid', PreloadingMismatchedHeadersGrid);

declare global {
  interface HTMLElementTagNameMap {
    'devtools-resources-preloading-mismatched-headers-grid': PreloadingMismatchedHeadersGrid;
  }
}
