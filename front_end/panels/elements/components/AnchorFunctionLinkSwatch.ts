// Copyright (c) 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as i18n from '../../../core/i18n/i18n.js';
import type * as SDK from '../../../core/sdk/sdk.js';
import * as IconButton from '../../../ui/components/icon_button/icon_button.js';
import * as InlineEditor from '../../../ui/legacy/components/inline_editor/inline_editor.js';
import * as LitHtml from '../../../ui/lit-html/lit-html.js';
import * as VisualLogging from '../../../ui/visual_logging/visual_logging.js';

import anchorFunctionLinkSwatchStyles from './anchorFunctionLinkSwatch.css.js';

const UIStrings = {
  /**
   *@description Title in the styles tab for the icon button for jumping to the anchor node.
   */
  jumpToAnchorNode: 'Jump to anchor node',
};
const str_ = i18n.i18n.registerUIStrings('panels/elements/components/AnchorFunctionLinkSwatch.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);
const {render, html} = LitHtml;

export type AnchorFunctionLinkSwatchData = {
  // The dashed identifier for the anchor function.
  // It is undefined when we're rendering for implicit or default anchor cases.
  identifier?: string,
  // The anchor node, it is undefined when it is not resolved correctly.
  anchorNode?: SDK.DOMModel.DOMNode, onLinkActivate: () => void, onMouseEnter: () => void, onMouseLeave: () => void,
};

export class AnchorFunctionLinkSwatch extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-anchor-function-link-swatch`;
  readonly #shadow = this.attachShadow({mode: 'open'});
  #data: AnchorFunctionLinkSwatchData;

  constructor(data: AnchorFunctionLinkSwatchData) {
    super();
    this.#data = data;
  }

  dataForTest(): AnchorFunctionLinkSwatchData {
    return this.#data;
  }

  connectedCallback(): void {
    this.#shadow.adoptedStyleSheets = [anchorFunctionLinkSwatchStyles];
    this.render();
  }

  set data(data: AnchorFunctionLinkSwatchData) {
    this.#data = data;
    this.render();
  }

  #handleIconClick(ev: MouseEvent): void {
    ev.stopPropagation();
    this.#data.onLinkActivate();
  }

  #renderIdentifierLink(): LitHtml.LitTemplate {
    // clang-format off
    return html`<${InlineEditor.LinkSwatch.LinkSwatch.litTagName}
      @mouseenter=${this.#data.onMouseEnter}
      @mouseleave=${this.#data.onMouseLeave}
      .data=${{
        text: this.#data.identifier,
        isDefined: Boolean(this.#data.anchorNode),
        jslogContext: 'anchor-link',
        onLinkActivate: this.#data.onLinkActivate,
      } as InlineEditor.LinkSwatch.LinkSwatchRenderData}></${InlineEditor.LinkSwatch.LinkSwatch.litTagName}>`;
    // clang-format on
  }

  #renderIconLink(): LitHtml.LitTemplate {
    // clang-format off
    return html`<${IconButton.Icon.Icon.litTagName}
      role=${'button'}
      title=${i18nString(UIStrings.jumpToAnchorNode)}
      class=${'icon-link'}
      @mouseenter=${this.#data.onMouseEnter}
      @mouseleave=${this.#data.onMouseLeave}
      @mousedown=${(ev: MouseEvent) => ev.stopPropagation()}
      @click=${this.#handleIconClick}
      name='open-externally'
      jslog=${VisualLogging.action('jump-to-anchor-node').track({click: true})}
    ></${IconButton.Icon.Icon.litTagName}>`;
    // clang-format on
  }

  protected render(): void {
    if (!this.#data.identifier && !this.#data.anchorNode) {
      return;
    }

    if (this.#data.identifier) {
      // clang-format off
      render(html`${this.#renderIdentifierLink()} `, this.#shadow, {host: this});
      // clang-format on
    } else {
      // clang-format off
      render(html`${this.#renderIconLink()} `, this.#shadow, {host: this});
      // clang-format on
    }
  }
}

customElements.define('devtools-anchor-function-link-swatch', AnchorFunctionLinkSwatch);

declare global {
  interface HTMLElementTagNameMap {
    'devtools-anchor-function-link-swatch': AnchorFunctionLinkSwatch;
  }
}
