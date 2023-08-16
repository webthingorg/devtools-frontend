// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as i18n from '../../../core/i18n/i18n.js';
import type * as SDK from '../../../core/sdk/sdk.js';
import * as ComponentHelpers from '../../../ui/components/helpers/helpers.js';
import * as LitHtml from '../../../ui/lit-html/lit-html.js';

import cssVariableValueViewStyles from './cssVariableValueView.css.js';

const UIStrings = {
  /**
   *@description Title text for the section describing the registration for a custom property
   */
  registeredPropertyTitle: 'Registered property',
  /**
   * @description Error message for a property value that failed to parse because it had an incorrect type
   * @example {<color>} type
   */
  invalidPropertyValue: 'Invalid property value, expected type {type}',
  /**
   *@description Text for a link from custom property to its defining registration
   */
  goToDefinition: 'Go to definition',
};
const str_ = i18n.i18n.registerUIStrings('panels/elements/components/CSSVariableValueView.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

const {render, html} = LitHtml;

export interface RegisteredPropertyDetails {
  registration: SDK.CSSMatchedStyles.CSSRegisteredProperty;
  goToDefinition: () => void;
}

function getLinkSection(details: RegisteredPropertyDetails): LitHtml.TemplateResult {
  return html`<div class="registered-property-links">
            <span role="button" @click=${details?.goToDefinition} class="clickable underlined unbreakable-text"}>
              ${i18nString(UIStrings.goToDefinition)}
            </span>
          </div>`;
}

export class CSSVariableParserError extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-css-variable-parser-error`;
  readonly #shadow = this.attachShadow({mode: 'open'});

  constructor(details: RegisteredPropertyDetails) {
    super();
    this.#shadow.adoptedStyleSheets = [cssVariableValueViewStyles];
    this.#render(details);
  }

  #render(details: RegisteredPropertyDetails): void {
    render(
        html`
      <div class="variable-value-popup-wrapper">
        ${i18nString(UIStrings.invalidPropertyValue, {
          type: '',
        })}
        <span class="monospace css-property">${details.registration.syntax()}</span>
        ${getLinkSection(details)}
      </div>`,
        this.#shadow, {
          host: this,
        });
  }
}

export class CSSVariableValueView extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-css-variable-value-view`;
  readonly #shadow = this.attachShadow({mode: 'open'});
  readonly value: string|undefined;
  readonly details: RegisteredPropertyDetails|undefined;

  constructor(value: string|undefined, details?: RegisteredPropertyDetails) {
    super();
    this.#shadow.adoptedStyleSheets = [cssVariableValueViewStyles];
    this.#render(value, details);
    this.value = value;
    this.details = details;
  }

  #render(value: string|undefined, details?: RegisteredPropertyDetails): void {
    const initialValue = details?.registration.initialValue();
    const registrationView = details ? html`<div class="registered-property-popup-wrapper">
         <span class="title">${i18nString(UIStrings.registeredPropertyTitle)}</span>
          <div class="monospace">
            <div><span class="css-property">syntax:</span> ${details.registration.syntax()}</div>
            <div><span class="css-property">inherits:</span> ${details.registration.inherits()}</div>
            ${initialValue ? html`<div><span class="css-property">initial-value:</span> ${initialValue}</div>` : ''}
          </div>
          ${getLinkSection(details)}
        </div>` :
                                       '';

    render(html`<div class="variable-value-popup-wrapper">${value}${registrationView}</div>`, this.#shadow, {
      host: this,
    });
  }
}

ComponentHelpers.CustomElements.defineComponent('devtools-css-variable-value-view', CSSVariableValueView);
ComponentHelpers.CustomElements.defineComponent('devtools-css-variable-parser-error', CSSVariableParserError);

declare global {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLElementTagNameMap {
    'devtools-css-variable-value-view': CSSVariableValueView;
    'devtools-css-variable-parser-error': CSSVariableParserError;
  }
}
