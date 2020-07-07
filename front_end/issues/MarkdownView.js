// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Marked from '../marked/marked.js';
import * as LitHtmlJs from '../lit_html_js/lit_html_js.js';

const html = LitHtmlJs.html;
const render = LitHtmlJs.render;

export class MarkdownView extends HTMLElement {
  constructor() {
    super();

    this._shadowRoot = this.attachShadow({mode: 'open'});
    /** @type {!Array<*>} */
    this._tokens = [];
  }

  /**
   * @override
   */
  connectedCallback() {}

  /**
   * @param {string} rawText 
   */
  setMarkdown(rawText) {
    this._tokens = Marked.Marked.lexer(rawText);
    console.log(this._tokens);
    this.render();
  }

  render() {
    // render(html``, this._shadowRoot);
    render(html`<div>${this._tokens.map(renderToken)}</div>`, this._shadowRoot);
  }
}

self.customElements.define('devtools-markdown-view', MarkdownView);

/**
 * @param {*} token
 * @return {*}
 */
const renderToken = token => {
  if (token.type === 'heading') {
    return html`${renderHeading(token)}`;
  }
  console.error(`Unsupported token type ${token.type}`);
  return html``;
}

/**
 * @param {*} token
 * @return {*}
 */
const renderHeading = token => {
  return html`<h1>${token.text}</h1>`;
}
