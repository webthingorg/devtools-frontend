// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../../../core/common/common.js';
import * as i18n from '../../../../core/i18n/i18n.js';
import type * as Platform from '../../../../core/platform/platform.js';
import {assertNotNullOrUndefined} from '../../../../core/platform/platform.js';
import {type NetworkRequest} from '../../../../core/sdk/NetworkRequest.js';
import * as SDK from '../../../../core/sdk/sdk.js';
import * as Protocol from '../../../../generated/protocol.js';
import * as Logs from '../../../../models/logs/logs.js';
import * as DataGrid from '../../../../ui/components/data_grid/data_grid.js';
import * as ComponentHelpers from '../../../../ui/components/helpers/helpers.js';
import * as IconButton from '../../../../ui/components/icon_button/icon_button.js';
import * as LegacyWrapper from '../../../../ui/components/legacy_wrapper/legacy_wrapper.js';
import * as Coordinator from '../../../../ui/components/render_coordinator/render_coordinator.js';
import type * as UI from '../../../../ui/legacy/legacy.js';
import * as LitHtml from '../../../../ui/lit-html/lit-html.js';
import {NetworkRequestId} from '../../../network/forward/NetworkRequestId.js';

import preloadingGridStyles from './preloadingGrid.css.js';
import * as PreloadingString from './PreloadingString.js';

const UIStrings = {
  /**
   *@description Column header: Action of preloading (prefetch/prerender)
   */
  action: 'Action',
  /**
   *@description Column header: A rule set of preloading
   */
  ruleSet: 'Rule set',
  /**
   *@description Column header: Status of preloading attempt
   */
  status: 'Status',
};
const str_ = i18n.i18n.registerUIStrings('panels/application/preloading/components/PreloadingGrid.ts', UIStrings);
export const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

const {render, html} = LitHtml;

const coordinator = Coordinator.RenderCoordinator.RenderCoordinator.instance();

export interface PreloadingGridData {
  rows: PreloadingGridRow[];
  pageURL: Platform.DevToolsPath.UrlString;
  requestResolver?: Logs.RequestResolver.RequestResolver;
}

export interface PreloadingGridRow {
  id: string;
  attempt: SDK.PreloadingModel.PreloadingAttempt;
  ruleSets: Protocol.Preload.RuleSet[];
}

// Grid component to show prerendering attempts.
export class PreloadingGrid extends LegacyWrapper.LegacyWrapper.WrappableComponent<UI.Widget.VBox> {
  static readonly litTagName = LitHtml.literal`devtools-resources-preloading-grid`;

  readonly #shadow = this.attachShadow({mode: 'open'});
  #data: PreloadingGridData|null = null;

  connectedCallback(): void {
    this.#shadow.adoptedStyleSheets = [preloadingGridStyles];
    void this.#render();
  }

  update(data: PreloadingGridData): void {
    this.#data = data;
    void this.#render();
  }

  async #render(): Promise<void> {
    return coordinator.write('RuleSetDetailsView render', async () => {
      if (this.#data === null) {
        return;
      }

      const requestResolver = this.#data.requestResolver || new Logs.RequestResolver.RequestResolver();
      const requests = new Map<Protocol.Network.RequestId, NetworkRequest>();
      for (const requestId of this.#data.rows.map(row => {
             if (row.attempt.action == Protocol.Preload.SpeculationAction.Prefetch) {
               return row.attempt.requestId;
             }
             return null;
           })) {
        if (requestId) {
          requests.set(requestId, await requestResolver.waitFor(requestId));
        }
      }

      const reportsGridData: DataGrid.DataGridController.DataGridControllerData = {
        columns: [
          {
            id: 'url',
            title: i18n.i18n.lockedString('URL'),
            widthWeighting: 40,
            hideable: false,
            visible: true,
            sortable: true,
          },
          {
            id: 'action',
            title: i18nString(UIStrings.action),
            widthWeighting: 15,
            hideable: false,
            visible: true,
            sortable: true,
          },
          {
            id: 'ruleSet',
            title: i18nString(UIStrings.ruleSet),
            widthWeighting: 20,
            hideable: false,
            visible: true,
            sortable: true,
          },
          {
            id: 'status',
            title: i18nString(UIStrings.status),
            widthWeighting: 40,
            hideable: false,
            visible: true,
            sortable: true,
          },
        ],
        rows: this.#buildReportRows(requests),
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
    });
  }

  #buildReportRows(requests: Map<Protocol.Network.RequestId, NetworkRequest>): DataGrid.DataGridUtils.Row[] {
    function statusRenderer(statusString: string, status: SDK.PreloadingModel.PreloadingStatus): LitHtml.LitTemplate {
      if (status !== SDK.PreloadingModel.PreloadingStatus.Failure) {
        return LitHtml.html`<div>${statusString}</div>`;
      }

      // Disabled until https://crbug.com/1079231 is fixed.
      // clang-format off
      return LitHtml.html`
        <div
          style=${LitHtml.Directives.styleMap({
            color: 'var(--color-error)',
          })}
        >
          <${IconButton.Icon.Icon.litTagName}
            .data=${{
              iconName: 'cross-circle-filled',
              color: 'var(--color-error)',
              width: '16px',
              height: '16px',
            } as IconButton.Icon.IconData}
            style=${LitHtml.Directives.styleMap({
              'vertical-align': 'sub',
            })}
          >
          </${IconButton.Icon.Icon.litTagName}>
          ${statusString}
        </div>
      `;
      // clang-format on
    }

    assertNotNullOrUndefined(this.#data);

    const pageURL = this.#data.pageURL;
    const requestResolver = this.#data.requestResolver;
    const securityOrigin = pageURL === '' ? null : (new Common.ParsedURL.ParsedURL(pageURL)).securityOrigin();
    return this.#data.rows.map(
        row => ({
          cells: [
            {columnId: 'id', value: row.id},
            {
              columnId: 'url',
              value: this.#urlShort(row, securityOrigin),
              title: row.attempt.key.url,
            },
            {columnId: 'action', value: PreloadingString.action(row.attempt)},
            {
              columnId: 'ruleSet',
              value: row.ruleSets.length === 0 ? '' : PreloadingString.ruleSetLocationShort(row.ruleSets[0], pageURL),
            },
            {
              columnId: 'status',
              value: showHttpStatus(row.attempt, requestResolver),
              renderer: status => statusRenderer(status as string, row.attempt.status),
            },
          ],
        }));
  }

  // Shorten URL if a preloading attempt is same-origin.
  #urlShort(row: PreloadingGridRow, securityOrigin: string|null): string {
    const url = row.attempt.key.url;
    return securityOrigin && url.startsWith(securityOrigin) ? url.slice(securityOrigin.length) : url;
  }
}

ComponentHelpers.CustomElements.defineComponent('devtools-resources-preloading-grid', PreloadingGrid);

declare global {
  interface HTMLElementTagNameMap {
    'devtools-resources-preloading-grid': PreloadingGrid;
  }
}

async function showHttpStatus(
    attempt: SDK.PreloadingModel.PreloadingAttempt,
    requestResolver?: Logs.RequestResolver.RequestResolver): Promise<string> {
  // const requestResolver = new Logs.RequestResolver.RequestResolver();
  if (attempt.action == Protocol.Preload.SpeculationAction.Prefetch && attempt.requestId != null) {
    const requestId = attempt.requestId;
    const request = await (requestResolver || new Logs.RequestResolver.RequestResolver()).waitFor(requestId);
    if (request == null) {
      return PreloadingString.composedStatus(attempt, null);
    }
    const StatusCode = request.statusCode;
    const composedStatus = PreloadingString.composedStatus(attempt, StatusCode);
    return composedStatus;
  }
  return PreloadingString.composedStatus(attempt, null);
}
