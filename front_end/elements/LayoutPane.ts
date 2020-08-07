// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../common/common.js';
import * as LitHtml from '../third_party/lit-html/lit-html.js';

const ls = Common.ls;

import {BooleanSetting, EnumSetting, Setting, SettingType} from './LayoutPaneUtils.js';

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
  private styleSheets: Readonly<string[]> = [];

  set data(data: {settings: Setting[], styleSheets?: string[]}) {
    this.settings = data.settings;
    this.styleSheets = data.styleSheets || [];
    this.update();
  }

  private update() {
    this.render();
  }

  private render() {
    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
    LitHtml.render(LitHtml.html`
      ${this.styleSheets.map(s => LitHtml.html`<style>${s}</style>`)}
      <style>
        .header {
          align-items: center;
          background-color: var(--toolbar-bg-color, #f3f3f3);
          border-bottom: var(--divider-border, 1px solid #d0d0d0);
          border-top: var(--divider-border, 1px solid #d0d0d0);
          display: flex;
          line-height: 1.6;
          overflow: hidden;
          padding: 0 5px;
          white-space: nowrap;
        }
        .content-section {
          padding: 16px;
        }
        .content-section-title {
          font-size: 12px;
          font-weight: 500;
          line-height: 1.1;
          margin: 0;
          padding: 0;
        }
        .checkbox-settings {
          margin-top: 8px;
          display: grid;
          grid-template-columns: 1fr;
          gap: 5px;
        }
        .checkbox-label {
          display: flex;
          flex-direction: row;
        }
        .checkbox-label input {
          margin: 0 6px 0 0;
          padding: 0;
        }
        .select-settings {
          margin-top: 16px;
          display: grid;
          grid-template-columns: repeat(auto-fill, 150px);
          gap: 16px;
        }
        .select-label {
          display: flex;
          flex-direction: column;
        }
        .select-label span {
          margin-bottom: 4px;
        }
      </style>
      <details open>
        <summary class="header">
          ${ls`Grid`}
        </summary>
        <div class="content-section">
          <h3 class="content-section-title">${ls`Overlay display settings`}</h3>
          <div class="checkbox-settings">
            ${this.getBooleanSettings().map(setting => this.renderBooleanSetting(setting))}
          </div>
          <div class="select-settings">
            ${this.getEnumSettings().map(setting => this.renderEnumSetting(setting))}
          </div>
        </div>
      </details>
    `, this.shadow, {
      eventContext: this,
    });
    // clang-format on
  }

  private getEnumSettings(): EnumSetting[] {
    return (this.settings || []).filter((setting): setting is EnumSetting => setting.type === SettingType.enum);
  }

  private getBooleanSettings(): BooleanSetting[] {
    return (this.settings || []).filter((setting): setting is BooleanSetting => setting.type === SettingType.boolean);
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
    return LitHtml.html`<label data-boolean-setting="true" class="checkbox-label" title=${setting.title}>
      <input data-input="true" type="checkbox" .checked=${setting.value} @change=${
        this.onBooleanSettingChange(setting)} />
      <span data-label="true">${setting.title}</span>
    </label>`;
  }

  private renderEnumSetting(setting: EnumSetting) {
    return LitHtml.html`<label data-enum-setting="true" class="select-label" title=${setting.title}>
      <span data-label="true">${setting.title}</span>
      <select class="chrome-select" data-input="true" @change=${this.onEnumSettingChange(setting)}>
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
