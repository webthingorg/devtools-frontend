// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../common/common.js';
import * as Elements from '../elements/elements.js';
import * as LitHtml from '../third_party/lit-html/lit-html.js';

const {render, html} = LitHtml;
const ls = Common.ls;

const ENTER_ADDRESS_TITLE = ls`Enter address`;

export const enum Navigation {
  Backward = 'Backward',
  Forward = 'Forward'
}

export class AddressChangedEvent extends Event {
  data: {address: string, mode: Mode};

  constructor(address: string, mode: Mode) {
    super('address-changed');
    this.data = {address, mode};
  }
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
  address: string;
  mode: Mode;
  valid: boolean;
  error: string|undefined;
}

export const enum Mode {
  Edit = 'Edit',
  Submitted = 'Submitted'
}

export class LinearMemoryNavigator extends HTMLElement {
  private readonly shadow = this.attachShadow({mode: 'open'});
  private address = '0';
  private error: string|undefined = undefined;
  private valid = true;

  set data(data: LinearMemoryNavigatorData) {
    this.address = data.address;
    this.error = data.error;
    this.valid = data.valid;
    this.render();
  }

  private render() {
    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
    const result = html`
      <style>
        .navigator {
          min-height: 24px;
          display: flex;
          flex-wrap: nowrap;
          justify-content: space-between;
          overflow: hidden;
          align-items: center;
          background-color: var(--color-background);
          color: var(--color-text-primary);
        }

        .navigator-item {
          white-space: nowrap;
          overflow: hidden;
        }

        .address-input {
          text-align: center;
          outline: none;
          color: var(--color-text-primary);
        }

        .address-input.invalid {
          color: var(--color-accent-red);
        }

        .navigator-button {
          background: transparent;
          overflow: hidden;
          vertical-align: middle;
          border: none;
          padding: 0px;
        }
      </style>
      <div class="navigator">
        <div class="navigator-item">
          ${this.createButton('ic_undo_16x16_icon', new HistoryNavigationEvent(Navigation.Backward))}
          ${this.createButton('ic_redo_16x16_icon', new HistoryNavigationEvent(Navigation.Forward))}
        </div>
        <div class="navigator-item">
          ${this.createButton('ic_page_prev_16x16_icon', new PageNavigationEvent(Navigation.Backward))}
          ${this.createAddressInput()}
          ${this.createButton('ic_page_next_16x16_icon', new PageNavigationEvent(Navigation.Forward))}
        </div>
        ${this.createButton('refresh_12x12_icon', new RefreshEvent())}
      </div>
      `;
      render(result, this.shadow, {eventContext: this});
    // clang-format on
  }

  private createAddressInput() {
    const classMap = {
      'address-input': true,
      invalid: !this.valid,
    };
    return html`
          <input class="${LitHtml.Directives.classMap(classMap)}" data-input="true" .value=${this.address}
            title="${this.valid ? ENTER_ADDRESS_TITLE : this.error}"
            @keyup=${this.onKeyUp}/>`;
  }

  private onKeyUp(event: Event) {
    let mode;
    if (isEnterKey(event)) {
      mode = Mode.Submitted;
      const input = event.target as HTMLInputElement;
      input.blur();
    } else {
      mode = Mode.Edit;
    }
    this.onAddressChange(mode, event);
  }

  private onAddressChange(mode: Mode, event: Event) {
    const addressInput = event.target as HTMLInputElement;
    this.dispatchEvent(new AddressChangedEvent(addressInput.value, mode));
  }

  private createButton(name: string, event: Event) {
    return html`
      <button class="navigator-button" data-button=${event.type} @click=${this.dispatchEvent.bind(this, event)}>
        <devtools-icon .data=${
        {iconName: name, color: 'rgb(110 110 110)', width: '16px'} as Elements.Icon.IconWithName}>
        </devtools-icon>
      </button>`;
  }
}

customElements.define('devtools-linear-memory-inspector-navigator', LinearMemoryNavigator);

declare global {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLElementTagNameMap {
    'devtools-linear-memory-inspector-navigator': LinearMemoryNavigator;
  }
}
