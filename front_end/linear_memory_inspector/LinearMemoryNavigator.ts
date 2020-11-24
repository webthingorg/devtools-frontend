// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as ComponentHelpers from '../component_helpers/component_helpers.js';
import * as Elements from '../elements/elements.js';
import * as LitHtml from '../third_party/lit-html/lit-html.js';

import {toHexString} from './LinearMemoryInspectorUtils.js';

const {render, html} = LitHtml;
const getStyleSheets = ComponentHelpers.GetStylesheet.getStyleSheets;

export const enum Navigation {
  Backward = 'Backward',
  Forward = 'Forward'
}

export class PageNavigationEvent extends Event {
  data: Navigation

  constructor(navigation: Navigation) {
    super('page-navigation', {});
    this.data = navigation;
  }
}

export class HistoryNavigationEvent extends Event {
  data: Navigation

  constructor(navigation: Navigation) {
    super('history-navigation', {});
    this.data = navigation;
  }
}

export class RefreshEvent extends Event {
  constructor() {
    super('refresh', {});
  }
}

export interface LinearMemoryNavigatorData {
  address: number;
}

export class LinearMemoryNavigator extends HTMLElement {
  private readonly shadow = this.attachShadow({mode: 'open'});
  private address: number = 0;

  constructor() {
    super();
    this.shadow.adoptedStyleSheets = [
      ...getStyleSheets('ui/toolbar.css', {patchThemeSupport: true}),
    ];
  }


  set data(data: LinearMemoryNavigatorData) {
    if (data.address < 0) {
      throw new Error('Address should be greater or equal to zero.');
    }
    this.address = data.address;
    this.render();
  }

  private render() {
    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
    render(html`
      <style>
        .navigator {
          height: 24px;
          display: flex;
          flex-wrap: nowrap;
          justify-content: space-between;
          overflow: hidden;
          align-items: center;
          --navigator-border-color: #9aa0a6
        }

        .navigator-item {
          white-space: nowrap;
          overflow: hidden;
          display: flex;
          align-items: center;
        }

        .navigator-input {
          text-align: center;
          height: 22px;
          padding: 0px;
          margin: 0px 5px;
          border: solid 1px;
          border-color: var(--navigator-border-color);
        }

        .navigator-button {
          padding: 0;
          background: none;
          outline: none;
          border: none;
          width: 16px;
          height: 16px;
        }

        .navigator-button:focus,
        .navigator-button:hover {
          background-color: white;
          border-color:white;
        }

        .navigator-button-page {
          border: solid 1px;
          border-color: var(--navigator-border-color);
          width: 24px;
          height: 24px;
        }

        .navigator-button + .navigator-button {
          margin-left: 5px;
        }

      </style>
      <div class="navigator">
        <div class="navigator-item">
          ${this.createButton('ic_undo_16x16_icon', new HistoryNavigationEvent(Navigation.Backward))}
          ${this.createButton('ic_redo_16x16_icon', new HistoryNavigationEvent(Navigation.Forward))}
        </div>
        <div class="navigator-item">
          ${this.createButton('ic_page_prev_16x16_icon', new PageNavigationEvent(Navigation.Backward), 'navigator-button-page')}
          <input class="navigator-input" data-input="true" contenteditable="true" value="0x${toHexString(this.address, 8)}"/>
          ${this.createButton('ic_page_next_16x16_icon', new PageNavigationEvent(Navigation.Forward), 'navigator-button-page')}
        </div>
        ${this.createButton('refresh_12x12_icon', new RefreshEvent())}
      </div>
      `, this.shadow, {eventContext: this});
    // clang-format on
  }

  private createButton(name: string, event: Event, buttonClass?: string) {
    return html`
      <button class="${buttonClass} navigator-button" data-button=${event.type} @click=${
        this.dispatchEvent.bind(this, event)}>
      <devtools-icon .data=${
        {iconName: name, color: 'rgb(110 110 110)', width: '16px', height: '16px'} as Elements.Icon.IconWithName}>
      </devtools-icon>
      </button>`;
  }
}

customElements.define('devtools-linear-memory-inspector-navigator', LinearMemoryNavigator);

declare global {
  interface HTMLElementTagNameMap {
    'devtools-linear-memory-inspector-navigator': LinearMemoryNavigator;
  }
}
