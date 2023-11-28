// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Host from '../../../core/host/host.js';
import * as i18n from '../../../core/i18n/i18n.js';
import type * as Marked from '../../../third_party/marked/marked.js';
import * as IconButton from '../../../ui/components/icon_button/icon_button.js';
import * as ComponentHelpers from '../../components/helpers/helpers.js';
import * as LitHtml from '../../lit-html/lit-html.js';

import {MarkdownImage, type MarkdownImageData} from './MarkdownImage.js';
import {MarkdownLink, type MarkdownLinkData} from './MarkdownLink.js';
import markdownViewStyles from './markdownView.css.js';

const UIStrings = {
  /**
   * @description The title of the button to copy the codeblock from a Markdown view.
   */
  copy: 'Copy code',
  /**
   * @description The title of the button after it was pressed and the text was copied to clipboard.
   */
  copied: 'Copied to clipboard',
};
const str_ = i18n.i18n.registerUIStrings('ui/components/markdown_view/MarkdownView.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

const html = LitHtml.html;
const render = LitHtml.render;

export interface MarkdownViewData {
  tokens: Marked.Marked.Token[];
  renderer?: MarkdownLitRenderer;
}

export class MarkdownView extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-markdown-view`;
  readonly #shadow = this.attachShadow({mode: 'open'});

  #tokenData: readonly Marked.Marked.Token[] = [];
  #renderer = new MarkdownLitRenderer();

  connectedCallback(): void {
    this.#shadow.adoptedStyleSheets = [markdownViewStyles];
  }

  set data(data: MarkdownViewData) {
    this.#tokenData = data.tokens;
    if (data.renderer) {
      this.#renderer = data.renderer;
    }
    this.#update();
  }

  #update(): void {
    this.#render();
  }

  #render(): void {
    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
    render(html`
      <div class='message'>
        ${this.#tokenData.map(token => this.#renderer.renderToken(token))}
      </div>
    `, this.#shadow, {host: this});
    // clang-format on
  }
}

ComponentHelpers.CustomElements.defineComponent('devtools-markdown-view', MarkdownView);

declare global {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLElementTagNameMap {
    'devtools-markdown-view': MarkdownView;
  }
}

/**
 * Default renderer is used for the IssuesPanel and allows only well-known images and links to be embedded.
 */
export class MarkdownLitRenderer {
  renderChildTokens(token: Marked.Marked.Token): LitHtml.TemplateResult[] {
    if ('tokens' in token && token.tokens) {
      return token.tokens.map(token => this.renderToken(token));
    }
    throw new Error('Tokens not found');
  }

  /**
   * Unescape will get rid of the escaping done by Marked to avoid double escaping due to escaping it also with Lit-html.
   * Table taken from: front_end/third_party/marked/package/src/helpers.js
   */
  unescape(text: string): string {
    const escapeReplacements = new Map<string, string>([
      ['&amp;', '&'],
      ['&lt;', '<'],
      ['&gt;', '>'],
      ['&quot;', '"'],
      ['&#39;', '\''],
    ]);
    return text.replace(/&(amp|lt|gt|quot|#39);/g, (matchedString: string) => {
      const replacement = escapeReplacements.get(matchedString);
      return replacement ? replacement : matchedString;
    });
  }

  renderText(token: Marked.Marked.Token): LitHtml.TemplateResult {
    if ('tokens' in token && token.tokens) {
      return html`${this.renderChildTokens(token)}`;
    }
    // Due to unescaping, unescaped html entities (see escapeReplacements' keys) will be rendered
    // as their corresponding symbol while the rest will be rendered as verbatim.
    // Marked's escape function can be found in front_end/third_party/marked/package/src/helpers.js
    return html`${this.unescape('text' in token ? token.text : '')}`;
  }

  renderHeading(heading: Marked.Marked.Tokens.Heading): LitHtml.TemplateResult {
    switch (heading.depth) {
      case 1:
        return html`<h1>${this.renderText(heading)}</h1>`;
      case 2:
        return html`<h2>${this.renderText(heading)}</h2>`;
      case 3:
        return html`<h3>${this.renderText(heading)}</h3>`;
      case 4:
        return html`<h4>${this.renderText(heading)}</h4>`;
      case 5:
        return html`<h5>${this.renderText(heading)}</h5>`;
      default:
        return html`<h6>${this.renderText(heading)}</h6>`;
    }
  }

  renderCodeBlock(token: Marked.Marked.Tokens.Code): LitHtml.TemplateResult {
    let timer: ReturnType<typeof setTimeout>;
    // clang-format off
    return html`<div class="codeblock">
      <div class="toolbar">
        <div class="lang">${token.lang}</div>
        <div class="copy">
          <button class="copy-button"
            title=${i18nString(UIStrings.copy)}
            @click=${(event: Event): void => {
              Host.InspectorFrontendHost.InspectorFrontendHostInstance.copyText(token.text);
              const copyButton = (event.target as HTMLElement)?.closest('.copy-button');
              const span = copyButton?.querySelector('span');
              if (span) {
                span.innerText = i18nString(UIStrings.copied);
                copyButton?.classList.add('copied');
                clearTimeout(timer);
                timer = setTimeout(() => {
                  span.innerText = i18nString(UIStrings.copy);
                  copyButton?.classList.remove('copied');
                }, 1000);
              }
            }}>
            <${IconButton.Icon.Icon.litTagName}
              .data=${{
                iconName: 'copy',
                width: '16px',
                height: '16px',
                color: 'var(--copy-icon-color, var(--icon-default))',
              } as IconButton.Icon.IconData}
            >
            </${IconButton.Icon.Icon.litTagName}>
            <span>${i18nString(UIStrings.copy)}</span>
          </button>
        </div>
      </div>
      <code>${this.unescape(token.text)}</code>
    </div>`;
    // clang-format one
  }

  templateForToken(token: Marked.Marked.Token): LitHtml.TemplateResult|null {
    switch (token.type) {
      case 'paragraph':
        return html`<p>${this.renderChildTokens(token)}`;
      case 'list':
        return html`<ul>${token.items.map(token => {
          return this.renderToken(token);
        })}</ul>`;
      case 'list_item':
        return html`<li>${this.renderChildTokens(token)}`;
      case 'text':
        return this.renderText(token);
      case 'codespan':
        return html`<code>${this.unescape(token.text)}</code>`;
      case 'code':
        return this.renderCodeBlock(token);
      case 'space':
        return html``;
      case 'link':
        return html`<${MarkdownLink.litTagName} .data=${{key: token.href, title: token.text} as MarkdownLinkData}></${
            MarkdownLink.litTagName}>`;
      case 'image':
        return html`<${MarkdownImage.litTagName} .data=${{key: token.href, title: token.text} as MarkdownImageData}></${
            MarkdownImage.litTagName}>`;
      case 'heading':
        return this.renderHeading(token);
      case 'strong':
        return html`<strong>${this.renderText(token)}</strong>`;
      case 'em':
        return html`<em>${this.renderText(token)}</em>`;
      default:
        return null;
    }
  }

  renderToken(token: Marked.Marked.Token): LitHtml.TemplateResult {
    const template = this.templateForToken(token);
    if (template === null) {
      throw new Error(`Markdown token type '${token.type}' not supported.`);
    }
    return template;
  }
}
