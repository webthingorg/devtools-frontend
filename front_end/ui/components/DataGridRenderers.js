// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as LitHtml from '../../third_party/lit-html/lit-html.js';

/**
 * @param {*} value
 * @returns {!LitHtml.TemplateResult}
 */
export const stringRenderer = value => {
  const stringified = String(value);
  return LitHtml.html`${stringified}`;
};

/**
 * @param {*} value
 * @returns {!LitHtml.TemplateResult}
 */
export const codeBlockRenderer = value => {
  return LitHtml.html`<code>${value}</code>`;
};
