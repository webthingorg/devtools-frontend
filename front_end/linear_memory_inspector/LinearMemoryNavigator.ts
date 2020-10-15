// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as ComponentHelpers from '../component_helpers/component_helpers.js';
import * as LitHtml from '../third_party/lit-html/lit-html.js';

import {HistoryNavigationEvent, Navigation, PageNavigationEvent, RefreshEvent, toHexString} from './LinearMemoryInspectorUtils.js';

const {render, html} = LitHtml;
const getStyleSheets = ComponentHelpers.GetStylesheet.getStyleSheets;


export interface LinearMemoryNavigatorData {
  address: number
}

export class LinearMemoryNavigator extends HTMLElement {
  private readonly shadow = this.attachShadow({mode: 'open'});
  private address: number = 0;

  constructor() {
    super();
    this.shadow.adoptedStyleSheets = [
      // ...getStyleSheets('ui/inspectorCommon.css', {patchThemeSupport: true}),
      ...getStyleSheets('ui/toolbar.css', {patchThemeSupport: true}),
      // ...getStyleSheets('ui/inspectorSyntaxHighlight.css', {patchThemeSupport: true}),
    ];
    //
  }


  set data(data: LinearMemoryNavigatorData) {
    this.address = data.address;
    this.render();
  }

  private render() {
    console.log('navigation');
    render(
        html`
    <style>
      .navigation {
        min-height: 24px;
        margin: 9px 0px 7px 0px;
        display: flex;
        flex-wrap: nowrap;
        width: 100%;
        justify-content: space-between;
        overflow: hide;
      }

      .navigation-button {
        -webkit-mask-image: url(Images/largeIcons.svg);
        background-color: rgb(110 110 110);
      }

      .navigation-undo {
        background-image: url(Images/ic_undo_16x16.svg);
        width: 16px;
        height: 16px;
      }

      .navigation-redo {
        background-image: url(Images/ic_redo_16x16.svg);
        width: 16px;
        height: 16px;
      }

      .navigation-page-prev {
        background-image: url(Images/ic_page_prev_16x16.svg);
        width: 16px;
        height: 16px;
      }

      .navigation-page-next {
        background-image: url(Images/ic_page_next_16x16.svg);
        width: 16px;
        height: 16px;
      }

      .navigation-address {
        margin: 6px 8px 6px 8px;
      }

      .navigation-refresh {
        display: inline-block;
        -webkit-mask-image: url(Images/largeIcons.svg);
        -webkit-mask-position:-140px 96px;
        background-color: rgb(110 110 110);
      }

      .test {
        display: inline-block;
        width: 16px;
        height: 16px;
        -webkit-mask-position:-90px 45px;
        -webkit-mask-image: url(Images/largeIcons.svg);
      }

    </style>
    <div class="navigation">
      <div class="toolbar-item">
        ${this.createButton('navigation-undo', new HistoryNavigationEvent(Navigation.Backward))}
        ${this.createButton('navigation-redo', new HistoryNavigationEvent(Navigation.Forward))}
      </div>
      <div class="toolbar-item">
        ${this.createButton('navigation-page-prev', new PageNavigationEvent(Navigation.Backward))}
        <div class="toolbar-input toolbar-item">
              <div class="toolbar-input-prompt text-prompt navigation-address" contenteditable="true">
              0x${toHexString(this.address, 8)}
              </div>
        </div>
        ${this.createButton('navigation-page-next', new PageNavigationEvent(Navigation.Forward))}
      </div>
      <div class="toolbar-item">
        ${this.createButton('toolbar-glyph test', new RefreshEvent())}
      </div>
    </div>`,
        this.shadow, {eventContext: this});
  }

  private createButton(css: string, event: Event) {
    return html`
    <button class="toolbar-button toolbar-item" @click=${this.dispatchEvent.bind(this, event)}>
      <span class="${css}"></span>
    </button>`;
  }
}

customElements.define('linear-memory-navigator', LinearMemoryNavigator);

declare global {
  interface HTMLElementTagNameMap {
    'linear-memory-navigator': LinearMemoryNavigator;
  }
}
