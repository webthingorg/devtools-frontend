// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as i18n from '../../core/i18n/i18n.js';
import {assertNotNullOrUndefined} from '../../core/platform/platform.js';
import type * as Protocol from '../../generated/protocol.js';
import * as DataGrid from '../../ui/components/data_grid/data_grid.js';
import * as LegacyWrapper from '../../ui/components/legacy_wrapper/legacy_wrapper.js';
import * as Coordinator from '../../ui/components/render_coordinator/render_coordinator.js';
import * as UI from '../../ui/legacy/legacy.js';
import * as LitHtml from '../../ui/lit-html/lit-html.js';

import {CompressionDictionariesModel} from './CompressionDictionariesModel.js';
import compressionDictionariesViewStyles from './compressionDictionariesView.css.js';


const UIStrings = {
  /**
   *@description Text for Compression Dictionaries View
   */
  compressionDictionaries: 'Compression dictionaries',
};
const str_ = i18n.i18n.registerUIStrings('panels/application/CompressionDictionariesView.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

export class CompressionDictionariesView extends LegacyWrapper.LegacyWrapper.WrappableComponent {
  static readonly litTagName = LitHtml.literal`devtools-resources-compression-dictionaries-view`;
  readonly #shadow = this.attachShadow({mode: 'open'});
  #model: CompressionDictionariesModel|null = null;
  #data: Protocol.Network.CompressionDictionaryStorageInfo|null = null;

  connectedCallback(): void {
    this.#shadow.adoptedStyleSheets = [compressionDictionariesViewStyles];
    this.#render();
  }

  set data(data: Protocol.Network.CompressionDictionaryStorageInfo) {
    this.#data = data;
    this.#render();
  }

  setModel(model: CompressionDictionariesModel): void {
    this.#model = model;
  }

  #render(): void {
    if (this.#data === null) {
      return;
    }
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
        }
      ],
      rows: this.#buildDictionaryRows(),
      contextMenus: {
        bodyRow:
            (menu: UI.ContextMenu.ContextMenu, columns: readonly DataGrid.DataGridUtils.Column[],
             row: Readonly<DataGrid.DataGridUtils.Row>, rows: readonly DataGrid.DataGridUtils.Row[]): void => {
              assertNotNullOrUndefined(this.#model);
              menu.overrideSection().appendItem('Delete selected', () => {
                assertNotNullOrUndefined(this.#model);
                assertNotNullOrUndefined(this.#data);
                console.log(row.cells)
                let match = '';
                let matchDest = '';
                row.cells.filter(cell => cell.columnId === 'match').forEach(cell => {
                  match = cell.value as string;
                })
                row.cells.filter(cell => cell.columnId === 'match-dest').forEach(cell => {
                  matchDest = cell.value as string;
                })
                console.log(`Delete dictionary: ${match} ${matchDest}`);
                this.#model.deleteDictionary(this.#data.topFrameSite, this.#data.frameOrigin, match, matchDest);
              });
              menu.overrideSection().appendItem('Delete all', () => {
                console.log(`Delete all`);
                assertNotNullOrUndefined(this.#model);
                assertNotNullOrUndefined(this.#data);
                this.#model.deleteAllDictionaries(this.#data.topFrameSite, this.#data.frameOrigin);
              });
            },
      },

    };
    LitHtml.render(
        LitHtml.html`
      <div>
        <${DataGrid.DataGridController.DataGridController.litTagName} .data=${
            dictionariesGridData as DataGrid.DataGridController.DataGridControllerData}>
        </${DataGrid.DataGridController.DataGridController.litTagName}>
      </div>
    `,
        this.#shadow, {host: this});
  }
  //
  #buildDictionaryRows(): DataGrid.DataGridUtils.Row[] {
    assertNotNullOrUndefined(this.#data);
    return this.#data?.dictionaries.map(dict => {
      assertNotNullOrUndefined(this.#data);
      return {
      cells:
        [{columnId: 'match', value: dict.match},
         {columnId: 'match-dest', value: dict.matchDest.join(', ')},
         {columnId: 'id', value: dict.id},
         {
           columnId: 'dictionary-url',
           value: dict.dictionaryUrl.startsWith(this.#data.frameOrigin) ?
               dict.dictionaryUrl.substring(this.#data.frameOrigin.length) :
               dict.dictionaryUrl
         },
         {columnId: 'last-fetch-time', value: new Date(1000 * dict.lastFetchTime).toUTCString()},
         {columnId: 'response-time', value: new Date(1000 * dict.responseTime).toUTCString()},
         {columnId: 'expiration', value: new Date(1000 * dict.expiration).toUTCString()},
         {columnId: 'last-used-time', value: new Date(1000 * dict.lastUsedTime).toUTCString()},
         {columnId: 'size', value: dict.size},
         {columnId: 'hash', value: dict.hash},
        ]
      }
    });
  }
}


customElements.define('devtools-resources-compression-dictionaries-view', CompressionDictionariesView);

declare global {
  interface HTMLElementTagNameMap {
    'devtools-resources-compression-dictionaries-view': CompressionDictionariesView;
  }
}
