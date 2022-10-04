// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as ComponentHelpers from '../../../ui/components/helpers/helpers.js';
import * as LitHtml from '../../../ui/lit-html/lit-html.js';

import type * as SDK from '../../../core/sdk/sdk.js';
import * as i18n from '../../../core/i18n/i18n.js';
import * as NetworkForward from '../../../panels/network/forward/forward.js';
import {
  HeaderSectionRow,
  type HeaderSectionRowData,
  type HeaderEditedEvent,
} from './HeaderSectionRow.js';
import * as Persistence from '../../../models/persistence/persistence.js';
import type * as Workspace from '../../../models/workspace/workspace.js';
import * as Platform from '../../../core/platform/platform.js';
import * as Common from '../../../core/common/common.js';
import * as Buttons from '../../../ui/components/buttons/buttons.js';
import {type HeaderDescriptor, HeaderOverridesManager} from './HeaderOverridesManager.js';

import responseHeaderSectionStyles from './ResponseHeaderSection.css.js';

const {render, html} = LitHtml;

const UIStrings = {
  /**
  *@description Label for a button which allows adding an HTTP header.
  */
  addHeader: 'Add header',
  /**
  *@description Default name of the HTTP header when adding a header override. Header names are lower case and cannot contain whitespace.
  */
  defaultHeaderName: 'header-name',
  /**
  *@description Default value of the HTTP header when adding a header override.
  */
  defaultHeaderValue: 'header value',
};

const str_ = i18n.i18n.registerUIStrings('panels/network/components/ResponseHeaderSection.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

const plusIconUrl = new URL('../../../Images/plus_icon.svg', import.meta.url).toString();

export interface ResponseHeaderSectionData {
  request: SDK.NetworkRequest.NetworkRequest;
  toReveal?: {section: NetworkForward.UIRequestLocation.UIHeaderSection, header?: string};
  forceNew: boolean;
}

export class ResponseHeaderSection extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-response-header-section`;
  readonly #shadow = this.attachShadow({mode: 'open'});
  #request?: Readonly<SDK.NetworkRequest.NetworkRequest>;
  #headers: HeaderDescriptor[] = [];
  #uiSourceCode: Workspace.UISourceCode.UISourceCode|null = null;
  #overrides: Persistence.NetworkPersistenceManager.HeaderOverride[] = [];
  #successfullyParsedOverrides = false;

  connectedCallback(): void {
    this.#shadow.adoptedStyleSheets = [responseHeaderSectionStyles];
  }

  set data(data: ResponseHeaderSectionData) {
    this.#request = data.request;
    const headerOverridesManager = HeaderOverridesManager.instance();
    const editedHeaders = headerOverridesManager.getEditedHeaders(this.#request);
    if (!data.forceNew && editedHeaders) {
      this.#headers = editedHeaders;
      this.#headers.filter(header => Boolean(header.highlight)).forEach(header => {
        header.highlight = false;
      });
    } else {
      this.#headers = HeaderOverridesManager.generateHeaderDescriptors(this.#request);
    }

    if (data.toReveal?.section === NetworkForward.UIRequestLocation.UIHeaderSection.Response) {
      this.#headers.filter(header => header.name === data.toReveal?.header?.toLowerCase()).forEach(header => {
        header.highlight = true;
      });
    }

    void this.#loadOverridesInfo();
    headerOverridesManager.setEditedHeaders(this.#request, this.#headers);
    this.#render();
  }

  async #loadOverridesInfo(): Promise<void> {
    if (!this.#request) {
      return;
    }
    this.#uiSourceCode =
        Persistence.NetworkPersistenceManager.NetworkPersistenceManager.instance().getHeadersUISourceCodeFromUrl(
            this.#request.url());
    if (!this.#uiSourceCode) {
      this.#setAllNotEditable();
      return;
    }
    try {
      const deferredContent = await this.#uiSourceCode.requestContent();
      this.#overrides =
          JSON.parse(deferredContent.content || '[]') as Persistence.NetworkPersistenceManager.HeaderOverride[];
      if (!this.#overrides.every(Persistence.NetworkPersistenceManager.isHeaderOverride)) {
        throw 'Type mismatch after parsing';
      }
      this.#successfullyParsedOverrides = true;
      for (const header of this.#headers) {
        header.valueEditable = true;
      }
      this.#render();
    } catch (error) {
      this.#successfullyParsedOverrides = false;
      console.error(
          'Failed to parse', this.#uiSourceCode?.url() || 'source code file', 'for locally overriding headers.');
      this.#setAllNotEditable();
    }
  }

  #setAllNotEditable(): void {
    for (const header of this.#headers) {
      header.valueEditable = false;
      header.nameEditable = false;
    }
  }

  #onHeaderEdited(event: HeaderEditedEvent): void {
    const target = event.target as HTMLElement;
    if (target.dataset.index === undefined) {
      return;
    }
    const index = Number(target.dataset.index);
    this.#updateOverrides(event.headerName, event.headerValue, index);
  }

  #updateOverrides(headerName: Platform.StringUtilities.LowerCaseString, headerValue: string, index: number): void {
    if (!this.#request) {
      return;
    }

    const previousName = this.#headers[index].name;
    const previousValue = this.#headers[index].value;
    this.#headers[index].name = headerName;
    this.#headers[index].value = headerValue;
    this.#headers[index].isOverride = true;

    // If multiple headers have the same name 'foo', we treat them as a unit.
    // If there are overrides for 'foo', all original 'foo' headers are removed
    // and replaced with the override(s) for 'foo'.
    const headersToUpdate = this.#headers.filter(
        header => header.name === headerName && (header.value !== header.originalValue || header.isOverride));

    const rawPath = Persistence.NetworkPersistenceManager.NetworkPersistenceManager.instance().rawPathFromUrl(
        this.#request.url(), true);
    const lastIndexOfSlash = rawPath.lastIndexOf('/');
    const rawFileName = Common.ParsedURL.ParsedURL.substring(rawPath, lastIndexOfSlash + 1);

    // If the last override-block matches 'rawFileName', use this last block.
    // Otherwise just append a new block at the end. We are not using earlier
    // blocks, because they could be overruled by later blocks, which contain
    // wildcards in the filenames they apply to.
    let block: Persistence.NetworkPersistenceManager.HeaderOverride|null = null;
    const [lastOverride] = this.#overrides.slice(-1);
    if (lastOverride?.applyTo === rawFileName) {
      block = lastOverride;
    } else {
      block = {
        applyTo: rawFileName,
        headers: [],
      };
      this.#overrides.push(block);
    }

    // Keep header overrides for headers with a different name.
    block.headers = block.headers.filter(header => header.name !== headerName);

    // If a header name has been edited (only possible when adding headers),
    // remove the previous override entry.
    if (this.#headers[index].name !== previousName) {
      for (let i = 0; i < block.headers.length; ++i) {
        if (block.headers[i].name === previousName && block.headers[i].value === previousValue) {
          block.headers.splice(i, 1);
          break;
        }
      }
    }

    // Append freshly edited header overrides.
    for (const header of headersToUpdate) {
      block.headers.push({name: header.name, value: header.value || ''});
    }

    this.#uiSourceCode?.setWorkingCopy(JSON.stringify(this.#overrides, null, 2));
    this.#uiSourceCode?.commitWorkingCopy();
    Persistence.NetworkPersistenceManager.NetworkPersistenceManager.instance().updateInterceptionPatterns();
  }

  #onAddHeaderClick(): void {
    this.#headers.push({
      name: Platform.StringUtilities.toLowerCaseString(i18nString(UIStrings.defaultHeaderName)),
      value: i18nString(UIStrings.defaultHeaderValue),
      isOverride: true,
      nameEditable: true,
      valueEditable: true,
    });
    const index = this.#headers.length - 1;
    this.#updateOverrides(this.#headers[index].name, this.#headers[index].value || '', index);
    this.#render();

    const rows = this.#shadow.querySelectorAll<HeaderSectionRow>('devtools-header-section-row');
    const [lastRow] = Array.from(rows).slice(-1);
    lastRow?.focus();
  }

  #render(): void {
    if (!this.#request) {
      return;
    }

    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
    render(html`
      ${this.#headers.map((header, index) => html`
        <${HeaderSectionRow.litTagName} .data=${{
          header: header,
        } as HeaderSectionRowData} @headeredited=${this.#onHeaderEdited} data-index=${index}></${HeaderSectionRow.litTagName}>
      `)}
      ${this.#successfullyParsedOverrides ? html`
        <${Buttons.Button.Button.litTagName}
          class="add-header-button"
          .variant=${Buttons.Button.Variant.SECONDARY}
          .iconUrl=${plusIconUrl}
          @click=${this.#onAddHeaderClick}>
          ${i18nString(UIStrings.addHeader)}
        </${Buttons.Button.Button.litTagName}>
      ` : LitHtml.nothing}
    `, this.#shadow, {host: this});
    // clang-format on
  }
}

ComponentHelpers.CustomElements.defineComponent('devtools-response-header-section', ResponseHeaderSection);

declare global {
  interface HTMLElementTagNameMap {
    'devtools-response-header-section': ResponseHeaderSection;
  }
}
