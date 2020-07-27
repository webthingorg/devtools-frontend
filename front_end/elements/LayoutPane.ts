// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as LitHtml from '../third_party/lit-html/lit-html.js';

import {BooleanSetting, DOMNode, EnumSetting, Setting} from './LayoutPaneUtils.js';

export class SettingChangedEvent extends Event {
  data: {setting: string, value: string|boolean};

  constructor(setting: string, value: string|boolean) {
    super('setting-changed', {});
    this.data = {setting, value};
  }
}

export class LayoutPane extends HTMLElement {
  private readonly shadow = this.attachShadow({mode: 'open'});
  private settings: Readonly<Setting[]>|null = null;
  private selectedDOMNode: Readonly<DOMNode>|null = null;

  set data(data: {selectedNode: DOMNode|null, settings: Setting[]}) {
    this.selectedDOMNode = data.selectedNode;
    this.settings = data.settings;
    this.update();
  }

  private update() {
    this.render();
  }

  private render() {
    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
    LitHtml.render(LitHtml.html`
      <style>
        .settings {
          display: flex;
          flex-direction: column;
        }
      </style>
      <h2>CSS Grid</h2>
      <div class="settings">
        ${(this.settings || []).map(setting => setting.type === 'boolean' ?
          this.renderBooleanSetting(setting) : this.renderEnumSetting(setting))}
      </div>
    `, this.shadow, {
      eventContext: this,
    });
    // clang-format on
  }

  private onBooleanSettingChange(setting: BooleanSetting) {
    return (event: Event&{target: HTMLInputElement}) => {
      event.preventDefault();
      this.dispatchEvent(new SettingChangedEvent(setting.name, event.target.checked));
    };
  }

  private onEnumSettingChange(setting: EnumSetting) {
    return (event: Event&{target: HTMLInputElement}) => {
      event.preventDefault();
      this.dispatchEvent(new SettingChangedEvent(setting.name, event.target.value));
    };
  }

  private renderBooleanSetting(setting: BooleanSetting) {
    return LitHtml.html`<label>
      <input type="checkbox" .checked=${setting.value} @change=${this.onBooleanSettingChange(setting)} />
      ${setting.title}
    </label>`;
  }

  private renderEnumSetting(setting: EnumSetting) {
    return LitHtml.html`<label>
      ${setting.title}
      <select @change=${this.onEnumSettingChange(setting)}>
        ${
        setting.options.map(
            opt => LitHtml.html`<option value=${opt.value} .selected=${setting.value === opt.value}>${
                opt.title}</option>`)}
      </select>
    </label>`;
  }
}

customElements.define('devtools-layout-pane', LayoutPane);

declare global {
  interface HTMLElementTagNameMap {
    'devtools-layout-pane': LayoutPane;
  }
}
