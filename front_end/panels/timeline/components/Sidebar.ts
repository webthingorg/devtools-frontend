// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as LitHtml from '../../../ui/lit-html/lit-html.js';

import sidebarStyles from './sidebar.css.js';

const {html, Decorators, LitElement} = LitHtml;
const {customElement} = Decorators;

declare global {
  interface HTMLElementTagNameMap {
    'devtools-sidebar': Sidebar;
  }
}

@customElement('custom-greeting')
export class Sidebar extends LitElement {
  static override styles = [sidebarStyles];

  override render(): LitHtml.TemplateResult {
    return html`<div class="sidebar">Sidebar</p>`;
  }
}
