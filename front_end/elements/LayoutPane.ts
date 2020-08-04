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
  private collapsed = false;

  set data(data: {selectedNode: DOMNode|null, settings: Setting[]}) {
    this.selectedDOMNode = data.selectedNode;
    this.settings = data.settings;
    this.update();
  }

  private update() {
    this.render();
  }

  private toggleGridSection() {
    return () => {
      this.collapsed = !this.collapsed;
      this.update();
    };
  }

  private render() {
    const toggleClass = this.collapsed ? 'collapsed' : 'expanded';
    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
    LitHtml.render(LitHtml.html`
      <style>
        .header {
          align-items: center;
          background-color: var(--toolbar-bg-color, #f3f3f3);
          display: flex;
          overflow: hidden;
          padding: 0 5px;
          white-space: nowrap;
          border-bottom: 1px solid #ddd;
          border-top: var(--divider-border, 1px solid #d0d0d0);
          line-height: 1.6;
        }
        .content {
          padding: 16px;
        }
        .content-title {
          font-weight: 500;
          line-height: 1.1;
          color: #202124;
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
        .select-label {
          display: flex;
          flex-direction: column;
        }
        .select-label span {
          margin-bottom: 4px;
        }
        .select-settings {
          margin-top: 16px;
          display: grid;
          grid-template-columns: repeat(auto-fill, 150px);
          gap: 16px;
        }
        select {
          appearance: none;
          background-color: hsl(0deg 0% 98%);
          background-image: -webkit-image-set(url(Images/chromeSelect.png) 1x, url(Images/chromeSelect_2x.png) 2x);
          background-position: right center;
          background-repeat: no-repeat;
          background-size: 15px;
          border-radius: 2px;
          border: 1px solid rgb(0 0 0 / 20%);
          color: #333;
          font: inherit;
          margin: 0;
          min-height: 24px;
          min-width: 80px;
          outline: none;
          padding-left: 6px;
          padding-right: 20px;
          user-select: none;
        }
        select:enabled:active, select:enabled:hover {
          background-color: hsl(0deg 0% 96%);
          box-shadow: 0 1px 2px rgb(0 0 0 / 10%);
        }
        select:enabled:focus {
          border-color: transparent;
          box-shadow: 0 1px 2px rgb(0 0 0 / 10%), 0 0 0 2px rgb(66 133 244 / 40%);
        }
        .toggle {
          -webkit-mask-image: url(Images/smallIcons.svg);
          -webkit-mask-position: var(--spritesheet-position);
          background-color: rgb(110 110 110);
          height: 10px;
          width: 10px;
        }
        .toggle.expanded {
          --spritesheet-position: -80px 30px;
        }
        .toggle.collapsed {
          --spritesheet-position: 0px 10px;
        }
      </style>
      <div class="section">
        <div class="header" @click=${this.toggleGridSection()}>
          <span class="toggle ${toggleClass}"></span><span>Grid</span>
        </div>
        ${this.collapsed ? '' : LitHtml.html`<div class="content">
          <div class="content-title">Overlay display settings</div>
          <div class="checkbox-settings">
            ${(this.settings || []).filter((setting): setting is BooleanSetting => setting.type === 'boolean').map(setting => this.renderBooleanSetting(setting))}
          </div>
          <div class="select-settings">
            ${(this.settings || []).filter((setting): setting is EnumSetting => setting.type === 'enum').map(setting => this.renderEnumSetting(setting))}
          </div>
        </div>`}
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
    return LitHtml.html`<label class="checkbox-label" title=${setting.title}>
      <input type="checkbox" .checked=${setting.value} @change=${this.onBooleanSettingChange(setting)} />
      <span>${setting.title}</span>
    </label>`;
  }

  private renderEnumSetting(setting: EnumSetting) {
    return LitHtml.html`<label class="select-label" title=${setting.title}>
      <span>${setting.title}</span>
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
