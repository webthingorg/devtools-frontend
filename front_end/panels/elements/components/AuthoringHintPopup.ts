// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as ComponentHelpers from '../../../ui/components/helpers/helpers.js';
import * as LitHtml from '../../../ui/lit-html/lit-html.js';
import * as i18n from '../../../core/i18n/i18n.js';
import type {CSSRuleValidator} from '../elements.js';

import authoringHintPopupStyles from './authoringHintPopup.css.js';

const UIStrings = {
  /**
    *@description Hint prefix for deprecated properties.
    */
    learnMore: 'Learn More',
};
const str_ = i18n.i18n.registerUIStrings('panels/elements/components/AuthoringHintPopup.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

const {render, html, Directives} = LitHtml;

export class AuthoringHintPopup extends HTMLElement {
    static readonly litTagName = LitHtml.literal`devtools-authoring-hints-popup`;
    readonly #shadow = this.attachShadow({mode: 'open'});
    readonly #authoringHint: CSSRuleValidator.AuthoringHint;

    constructor(authoringHint: CSSRuleValidator.AuthoringHint) {
        super();
        this.#authoringHint = authoringHint;
        this.#shadow.adoptedStyleSheets = [authoringHintPopupStyles];
        this.#render();
    }

    #render(): void {
        render(html`
            <div class="hint-popup-wrapper">
                <div class="hint-popup-reason">
                    <strong>${this.#authoringHint.getHintPrefix()}:</strong> ${Directives.unsafeHTML(this.#authoringHint.getHintMessage())}
                </div>
                ${this.#authoringHint.getPossibleFixMessage() ? html`
                    <div class="hint-popup-possible-fix">
                        ${Directives.unsafeHTML(this.#authoringHint.getPossibleFixMessage())}
                        ${this.#authoringHint.getLearnMoreLink() ? html`
                            <x-link href='${this.#authoringHint.getLearnMoreLink()}' class='clickable underlined unbreakable-text'}>
                                ${i18nString(UIStrings.learnMore)}
                            </x-link>
                        `: ''}
                    </div>
                ` : ''}
            </div>
        `, this.#shadow, {
            host: this,
          });
    }
}

ComponentHelpers.CustomElements.defineComponent('devtools-authoring-hints-popup', AuthoringHintPopup);

declare global {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface HTMLElementTagNameMap {
      'devtools-authoring-hints-popup': AuthoringHintPopup;
    }
}
