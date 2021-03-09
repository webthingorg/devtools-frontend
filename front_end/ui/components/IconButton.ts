// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as LitHtml from '../../third_party/lit-html/lit-html.js';
import {IconData} from './Icon.js';

export interface IconWithTextData {
  iconName: string;
  iconColor?: string;
  iconWidth?: string;
  iconHeight?: string;
  text?: string;
}

export interface IconButtonData {
  clickHandler: () => void;
  groups: IconWithTextData[];
  omitBorder?: boolean;
  trailingText?: string;
}

export class IconButton extends HTMLElement {
  private readonly shadow = this.attachShadow({mode: 'open'});
  private clickHandler: () => void = () => {};
  private groups: IconWithTextData[] = [];
  private withBorder: boolean = true;
  private trailingText: string = '';

  set data(data: IconButtonData) {
    // Ensure we make a deep copy.
    this.groups = data.groups.map(({iconName, iconColor, iconWidth, iconHeight, text}) => {
      return {iconName, iconColor, iconWidth, iconHeight, text};
    });
    this.clickHandler = data.clickHandler;
    this.withBorder = !data.omitBorder;
    this.trailingText = data.trailingText ?? '';
    this.render();
  }

  setTexts(texts: (string|undefined)[]): void {
    if (texts.length !== this.groups.length) {
      throw new Error(`Wrong number of texts, expected ${this.groups.length} but got ${texts.length}`);
    }
    for (let i = 0; i < texts.length; ++i) {
      this.groups[i].text = texts[i];
    }
    this.render();
  }

  private onClickHandler(event: Event): void {
    event.preventDefault();
    this.clickHandler();
  }

  private render(): void {
    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
    return LitHtml.render(LitHtml.html`
      <style>
        :host {
          white-space: normal;
          display: inline-block;
        }

        .icon-button {
          cursor: pointer;
          border: none;
          margin-right: 2px;
          display: inline-flex;
          align-items: center;
          color: inherit;
          font-size: inherit;
          font-family: inherit;
        }

        .icon-button.with-border {
          background-color: var(--toolbar-bg-color);
          border: 1px solid var(--divider-color);
          border-radius: 2px;
        }

        .icon-button:hover,
        .icon-button:focus-visible {
          background-color: var(--toolbar-hover-bg-color);
        }

        .icon-button-title {
          margin-left: 0.5ex;
        }

        .status-icon {
          margin-left: 1ex;
        }

        .status-icon:first-child {
          margin-left: inherit;
        }

        @media (forced-colors: active) {
          .icon-button {
            forced-color-adjust: none;
            background-color: ButtonFace;
          }

          .icon-button:hover {
            background-color: Highlight;
            color: HighlightText;
          }
        }
      </style>
      <button class="icon-button ${this.withBorder ? 'with-border' : ''}" @click=${this.onClickHandler}>
      ${this.groups.filter(counter => counter.text !== undefined).map(counter =>
      LitHtml.html`
      <devtools-icon class="status-icon"
      .data=${{iconName: counter.iconName, color: counter.iconColor || '', width: counter.iconWidth || '1.5ex', height: counter.iconHeight || '1.5ex'} as IconData}>
      </devtools-icon>
      <span class="icon-button-title">${counter.text}</span>
      </button>`)}
      ${this.trailingText ? LitHtml.html`<span class="icon-button-title">${this.trailingText}</span>` : LitHtml.nothing}
    `, this.shadow, { eventContext: this});
    // clang-format on
  }
}

customElements.define('icon-button', IconButton);

declare global {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLElementTagNameMap {
    'icon-button': IconButton;
  }
}
