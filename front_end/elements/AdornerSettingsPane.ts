// Copyright (c) 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as i18n from '../i18n/i18n.js';
import * as LitHtml from '../third_party/lit-html/lit-html.js';

import {AdornerSettingsMap, DefaultAdornerSettings} from './AdornerManager.js';

const UIStrings = {
  /**
    * @description Title of a list of settings to toggle adorners.
    */
  settingsTitle: 'Show adorners',
  /**
   * @description Title of the button to save adorner settings
   */
  saveButton: 'Save',
};
const str_ = i18n.i18n.registerUIStrings('elements/AdornerSettingsPane.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

const {render, html} = LitHtml;

export class AdornerSettingsUpdatedEvent extends Event {
  data: {settings: AdornerSettingsMap};

  constructor(settings: AdornerSettingsMap) {
    super('adorner-settings-updated', {});
    this.data = {settings};
  }
}

export interface AdornerSettingsPaneData {
  settings: Readonly<AdornerSettingsMap>;
}

export class AdornerSettingsPane extends HTMLElement {
  private readonly shadow = this.attachShadow({mode: 'open'});
  private settings: AdornerSettingsMap = new Map();

  set data(data: AdornerSettingsPaneData) {
    this.settings = new Map(data.settings.entries());
    this.render();
  }

  show(): void {
    this.classList.remove('hidden');
  }

  hide(): void {
    this.classList.add('hidden');
  }

  private onChange(ev: Event): void {
    const inputEl = ev.target as HTMLInputElement;
    const adorner = inputEl.dataset.adorner;
    if (adorner === undefined) {
      return;
    }
    const isEnabledNow = inputEl.checked;
    this.settings.set(adorner, isEnabledNow);
    this.render();
  }

  private setDefaultSettings(): void {
    for (const {adorner, isEnabled} of DefaultAdornerSettings) {
      this.settings.set(adorner, isEnabled);
    }
    this.render();
  }

  private saveCurrentSettings(): void {
    this.dispatchEvent(new AdornerSettingsUpdatedEvent(this.settings));
    this.hide();
  }

  private render(): void {
    const settingTemplates = [];
    for (const [adorner, isEnabled] of this.settings) {
      // Disabled until https://crbug.com/1079231 is fixed.
      // clang-format off
      settingTemplates.push(html`
        <label class="setting" title=${adorner}>
          <input
            type="checkbox" name=${adorner}
            .checked=${isEnabled}
            data-adorner=${adorner}>
          <span>${adorner}</span>
        </label>
      `);
      // clang-format on
    }

    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
    render(html`
      <style>
        .adorner-settings-pane {
          display: flex;
          padding: 12px 18px;
          color: var(--color-text-primary);
          font-size: 12px;
          justify-content: center;
          align-items: center;
        }

        .settings-title,
        .setting-list,
        .button {
          margin: 0 15px;
        }

        .settings-title {
          font-weight: 500;
        }

        .button {
          height: 2em;
          border-radius: 4px;
          border: 1px solid var(--color-details-hairline);
          background-color: var(--color-background);
          color: var(--color-primary);
          font-weight: bold;
        }

        .button:focus {
          border: none;
          background-color: var(--color-primary);
          color: var(--color-background);
        }
      </style>

      <div class="adorner-settings-pane">
        <div class="settings-title">${i18nString(UIStrings.settingsTitle)}</div>
        <div class="setting-list" @change=${this.onChange}>
          ${settingTemplates}
        </div>
        <button
          class="button save"
          @click=${this.saveCurrentSettings}>
          ${i18nString(UIStrings.saveButton)}
        </button>
      </div>
    `, this.shadow, {
      eventContext: this,
    });
    // clang-format on
  }
}

if (!customElements.get('devtools-adorner-settings-pane')) {
  customElements.define('devtools-adorner-settings-pane', AdornerSettingsPane);
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLElementTagNameMap {
    'devtools-adorner-settings-pane': AdornerSettingsPane;
  }
}
