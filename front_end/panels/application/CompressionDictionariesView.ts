// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as i18n from '../../core/i18n/i18n.js';
import {assertNotNullOrUndefined} from '../../core/platform/platform.js';
import type * as Protocol from '../../generated/protocol.js';
import * as DataGrid from '../../ui/components/data_grid/data_grid.js';
import * as LegacyWrapper from '../../ui/components/legacy_wrapper/legacy_wrapper.js';
import * as Coordinator from '../../ui/components/render_coordinator/render_coordinator.js';
import * as ReportView from '../../ui/components/report_view/report_view.js';
import type * as UI from '../../ui/legacy/legacy.js';
import * as LitHtml from '../../ui/lit-html/lit-html.js';

import {type CompressionDictionariesModel} from './CompressionDictionariesModel.js';
import compressionDictionariesViewStyles from './compressionDictionariesView.css.js';

const UIStrings = {
  /**
   *@description Text for Compression Dictionaries View
   */
  compressionDictionaries: 'Compression dictionaries',
};
const str_ = i18n.i18n.registerUIStrings('panels/application/CompressionDictionariesView.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);
const coordinator = Coordinator.RenderCoordinator.RenderCoordinator.instance();

export class CompressionDictionariesView extends LegacyWrapper.LegacyWrapper.WrappableComponent {
  readonly #shadow = this.attachShadow({mode: 'open'});
  #key: string|null = null;
  #model: CompressionDictionariesModel|null = null;
  #topFrameSite: string|null = null;
  #frameOrigin: string|null = null;

  connectedCallback(): void {
    this.#shadow.adoptedStyleSheets = [compressionDictionariesViewStyles];
    void this.render();
  }

  setKey(key: string): void {
    this.#key = key;
    void this.render();
  }

  setModel(model: CompressionDictionariesModel|null): void {
    this.#model = model;
  }

  override render(): Promise<void> {
    return coordinator.write('CompressionDictionariesView render', async () => {
      this.#renderImpl();
    });
  }

  #renderImpl(): void {
    const data = this.#key ? this.#model?.storages.get(this.#key) : null;
    if (!data) {
      this.#topFrameSite = null;
      this.#frameOrigin = null;
      LitHtml.render(
          LitHtml.html`
        <div>Loading...</div>`,
          this.#shadow, {host: this});
      return;
    }
    this.#topFrameSite = data.topFrameSite;
    this.#frameOrigin = data.frameOrigin;
    const dictionariesGridData: DataGrid.DataGridController.DataGridControllerData = {
      columns: [
        {
          id: 'match',
          title: 'match',
          widthWeighting: 1,
          hideable: true,
          visible: true,
          sortable: true,
        },
        {
          id: 'match-dest',
          title: 'matchDest',
          widthWeighting: 1,
          hideable: true,
          visible: true,
          sortable: true,
        },
        {
          id: 'id',
          title: 'id',
          widthWeighting: 1,
          hideable: true,
          visible: true,
          sortable: true,
        },
        {
          id: 'dictionary-url',
          title: 'dictionaryUrl',
          widthWeighting: 1,
          hideable: true,
          visible: true,
          sortable: true,
        },
        {
          id: 'last-fetch-time',
          title: 'lastFetchTime',
          widthWeighting: 2,
          hideable: true,
          visible: true,
          sortable: true,
        },
        {
          id: 'response-time',
          title: 'responseTime',
          widthWeighting: 2,
          hideable: true,
          visible: true,
          sortable: true,
        },
        {
          id: 'expiration',
          title: 'expiration',
          widthWeighting: 2,
          hideable: true,
          visible: true,
          sortable: true,
        },
        {
          id: 'last-used-time',
          title: 'lastUsedTime',
          widthWeighting: 2,
          hideable: true,
          visible: true,
          sortable: true,
        },
        {
          id: 'size',
          title: 'size',
          widthWeighting: 1,
          hideable: true,
          visible: true,
          sortable: true,
        },
        {
          id: 'hash',
          title: 'hash',
          widthWeighting: 1,
          hideable: true,
          visible: true,
          sortable: true,
        },
      ],
      rows: this.#buildDictionaryRows(data.dictionaries),
      contextMenus: {bodyRow: this.#bodyRowContextMenues.bind(this)},

    };
    LitHtml.render(
        LitHtml.html`
      <${ReportView.ReportView.Report.litTagName}
      .data=${{reportTitle: i18nString(UIStrings.compressionDictionaries)} as ReportView.ReportView.ReportData}>
      <${ReportView.ReportView.ReportKey.litTagName}>Top Frame Site</${ReportView.ReportView.ReportKey.litTagName}>
      <${ReportView.ReportView.ReportValue.litTagName}>${data.topFrameSite}</${
            ReportView.ReportView.ReportValue.litTagName}>
      <${ReportView.ReportView.ReportKey.litTagName}>Frame Origin</${ReportView.ReportView.ReportKey.litTagName}>
      <${ReportView.ReportView.ReportValue.litTagName}>${data.frameOrigin}</${
            ReportView.ReportView.ReportValue.litTagName}>
      </${ReportView.ReportView.Report.litTagName}>
      <${DataGrid.DataGridController.DataGridController.litTagName} .data=${
            dictionariesGridData as DataGrid.DataGridController.DataGridControllerData}>
      </${DataGrid.DataGridController.DataGridController.litTagName}>
    `,
        this.#shadow, {host: this});
  }

  #bodyRowContextMenues(
      menu: UI.ContextMenu.ContextMenu, _columns: readonly DataGrid.DataGridUtils.Column[],
      row: Readonly<DataGrid.DataGridUtils.Row>, _rows: readonly DataGrid.DataGridUtils.Row[]): void {
    menu.overrideSection().appendItem('Delete selected', () => {
      assertNotNullOrUndefined(this.#topFrameSite);
      assertNotNullOrUndefined(this.#frameOrigin);
      function getCellValueString(row: Readonly<DataGrid.DataGridUtils.Row>, columnId: string): string {
        let value: string|null = '';
        row.cells.filter(cell => cell.columnId === columnId).forEach(cell => {
          value = cell.value as string;
        });
        assertNotNullOrUndefined(value);
        return value;
      }
      const matchDest = getCellValueString(row, 'match-dest');
      this.#model?.deleteDictionary(
          this.#topFrameSite, this.#frameOrigin, getCellValueString(row, 'dictionary-url'),
          getCellValueString(row, 'match'), matchDest === '' ? [] : matchDest.split(' ').map(i => i.slice(1, -1)));
    });
    menu.overrideSection().appendItem('Delete all', () => {
      if (this.#topFrameSite === null || this.#frameOrigin === null) {
        return;
      }
      void this.#model?.deleteAllDictionaries(this.#topFrameSite, this.#frameOrigin);
    });
  }
  //
  #buildDictionaryRows(dictionaries: Protocol.Network.CompressionDictionaryInfo[]): DataGrid.DataGridUtils.Row[] {
    return dictionaries.map(dict => {
      return {
        cells: [
          {columnId: 'match', value: dict.match},
          {columnId: 'match-dest', value: dict.matchDest.map(dest => `"${dest}"`).join(' ')},
          {columnId: 'id', value: dict.id},
          {
            columnId: 'dictionary-url',
            value: dict.dictionaryUrl,
          },
          {columnId: 'last-fetch-time', value: new Date(1000 * dict.lastFetchTime).toLocaleString()},
          {columnId: 'response-time', value: new Date(1000 * dict.responseTime).toLocaleString()},
          {columnId: 'expiration', value: new Date(1000 * dict.expiration).toLocaleString()},
          {columnId: 'last-used-time', value: new Date(1000 * dict.lastUsedTime).toLocaleString()},
          {columnId: 'size', value: dict.size},
          {columnId: 'hash', value: dict.hash},
        ],
      };
    });
  }
}

customElements.define('devtools-resources-compression-dictionaries-view', CompressionDictionariesView);

declare global {
  interface HTMLElementTagNameMap {
    'devtools-resources-compression-dictionaries-view': CompressionDictionariesView;
  }
}
