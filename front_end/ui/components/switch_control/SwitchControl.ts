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
  #disabled = false;

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

  set disabled(isDisabled: boolean) {
    this.#disabled = isDisabled;
    this.#render();
  }

  get disabled(): boolean {
    return this.#disabled;
  }

  #handleChange = (ev: Event): void => {
    this.#checked = (ev.target as HTMLInputElement).checked;
    this.dispatchEvent(new SwitchControlChangeEvent(this.#checked));
  };

  #render(): void {
    /* eslint-disable rulesdir/inject_checkbox_styles */
    // clang-format off
    LitHtml.render(LitHtml.html`
    <label role="button">
      <input type="checkbox"
        @change=${this.#handleChange}
        ?disabled=${this.#disabled}
        ?checked=${this.#checked}>
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
