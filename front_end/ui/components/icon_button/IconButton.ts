// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as ComponentHelpers from '../../components/helpers/helpers.js';
import * as LitHtml from '../../lit-html/lit-html.js';

import iconButtonStyles from './iconButton.css.js';
import {NewIcon} from './NewIcon.js';

export interface IconWithTextData {
  iconName: string;
  iconColor?: string;
  iconWidth?: string;
  iconHeight?: string;
  text?: string;
}

export interface IconButtonData {
  clickHandler?: () => void;
  groups: IconWithTextData[];
  leadingText?: string;
  trailingText?: string;
  accessibleName?: string;
  compact?: boolean;
}

export class IconButton extends HTMLElement {
  static readonly litTagName = LitHtml.literal`icon-button`;
  readonly #shadow = this.attachShadow({mode: 'open'});
  #clickHandler: undefined|(() => void) = undefined;
  #groups: IconWithTextData[] = [];
  #compact: boolean = false;
  #leadingText: string = '';
  #trailingText: string = '';
  #accessibleName: string|undefined;

  set data(data: IconButtonData) {
    this.#groups = data.groups.map(group => ({...group}));  // Ensure we make a deep copy.
    this.#clickHandler = data.clickHandler;
    this.#trailingText = data.trailingText ?? '';
    this.#leadingText = data.leadingText ?? '';
    this.#accessibleName = data.accessibleName;
    this.#compact = Boolean(data.compact);
    this.#render();
  }

  get data(): IconButtonData {
    return {
      groups: this.#groups.map(group => ({...group})),  // Ensure we make a deep copy.
      accessibleName: this.#accessibleName,
      clickHandler: this.#clickHandler,
      leadingText: this.#leadingText,
      trailingText: this.#trailingText,
      compact: this.#compact,
    };
  }

  connectedCallback(): void {
    this.#shadow.adoptedStyleSheets = [iconButtonStyles];
  }

  #onClickHandler(event: Event): void {
    if (this.#clickHandler) {
      event.preventDefault();
      this.#clickHandler();
    }
  }

  #render(): void {
    const buttonClasses = LitHtml.Directives.classMap({
      'with-click-handler': Boolean(this.#clickHandler),
      'compact': this.#compact,
    });
    const groups = this.#groups.filter(counter => counter.text !== undefined)
                       .filter((_, index) => this.#compact ? index === 0 : true);
    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
    LitHtml.render(LitHtml.html`
      <button class=${buttonClasses} @click=${this.#onClickHandler} aria-label=${LitHtml.Directives.ifDefined(this.#accessibleName)}>
        ${(!this.#compact && this.#leadingText) ? LitHtml.html`<span>${this.#leadingText}</span>` : LitHtml.nothing}
        ${groups.map(group =>
          LitHtml.html`
            <${NewIcon.litTagName}
              name=${group.iconName}
              style=${LitHtml.Directives.styleMap({color: group.iconColor, width: group.iconWidth || '1.5ex', height: group.iconHeight || '1.5ex'})}>
        </${NewIcon.litTagName}>
        ${this.#compact ? LitHtml.html`<!-- Force line-height for this element -->&#8203;` : LitHtml.nothing}
        <span>${group.text}</span>
      </button>`)}
      ${(!this.#compact && this.#trailingText) ? LitHtml.html`<span>${this.#trailingText}</span>` : LitHtml.nothing}
`, this.#shadow, { host: this});
    // clang-format on
  }
}

ComponentHelpers.CustomElements.defineComponent('icon-button', IconButton);

declare global {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLElementTagNameMap {
    'icon-button': IconButton;
  }
}
