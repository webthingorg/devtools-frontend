// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as LitHtml from '../../lit-html/lit-html.js';

import switchControlStyles from './switchControl.css.js';

export class SwitchControlChangeEvent extends Event {
  static readonly eventName = 'switchcontrolchange';

  constructor(readonly checked: boolean) {
    super(SwitchControlChangeEvent.eventName);
  }
}

export class SwitchControl extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-switch-control`;
  readonly #shadow = this.attachShadow({mode: 'open'});
  #checked = false;

  connectedCallback(): void {
    this.#shadow.adoptedStyleSheets = [switchControlStyles];
    this.#render();
  }

  set checked(isChecked: boolean) {
    this.#checked = isChecked;
    this.#render();
  }

  get checked(): boolean {
    return this.#checked;
  }

  #handleChange = (ev: Event): void => {
    this.#checked = (ev.target as HTMLInputElement).checked;
    this.dispatchEvent(new SwitchControlChangeEvent(this.#checked));
  };

  #render(): void {
    /* eslint-disable rulesdir/inject_checkbox_styles */
    // clang-format off
    LitHtml.render(LitHtml.html`
    <label>
      <input type="checkbox"
        @change=${this.#handleChange}
        checked=${this.#checked ? this.#checked : LitHtml.nothing}>
      <span class="slider"></span>
    </label>
    `, this.#shadow, {host: this});
    // clang-format on
    /* eslint-enable rulesdir/inject_checkbox_styles */
  }
}

customElements.define('devtools-switch-control', SwitchControl);

declare global {
  interface HTMLElementTagNameMap {
    'devtools-switch-control': SwitchControl;
  }
}

declare global {
  interface HTMLElementEventMap {
    [SwitchControlChangeEvent.eventName]: SwitchControlChangeEvent;
  }
}
