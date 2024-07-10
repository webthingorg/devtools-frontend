// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Host from '../../../core/host/host.js';
import * as i18n from '../../../core/i18n/i18n.js';
import * as Buttons from '../../../ui/components/buttons/buttons.js';
import * as Input from '../../../ui/components/input/input.js';
import * as LitHtml from '../../../ui/lit-html/lit-html.js';
import * as VisualLogging from '../../../ui/visual_logging/visual_logging.js';

import aiRatingsStyles from './AiRatings.css.js';

/*
  * TODO(nvitkov): b/346933425
  * Temporary string that should not be translated
  * as they may change often during development.
  */
const TempUIStrings = {

  /**
   * @description The title of the button that allows submitting positive
   * feedback about the response for freestyler.
   */
  thumbsUp: 'Thumbs up',
  /**
   * @description The title of the button that allows submitting negative
   * feedback about the response for freestyler.
   */
  thumbsDown: 'Thumbs down',
  /**
   * @description The placeholder text for the feedback input.
   */
  provideFeedbackPlaceholder: 'Provide additional feedback',
  /**
   * @description The disclaimer text that tells the user what will be shared
   * and what will be stored.
   */
  disclaimer: 'Feedback submitted will also include your conversation.',
  /**
   * @description The button text for the action of submitting feedback.
   */
  submit: 'Submit',
  /**
   * @description The header of the feedback form asking.
   */
  whyThisRating: 'Why did you choose this rating? (optional)',
  /**
   * @description The button text for the action that hides the feedback form.
   */
  close: 'Close',
};
// const str_ = i18n.i18n.registerUIStrings('panels/freestyler/components/AiRatings.ts', UIStrings);
// const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);
/* eslint-disable  rulesdir/l10n_i18nString_call_only_with_uistrings */
const i18nString = i18n.i18n.lockedString;

export interface RatingProps {
  onRateClick: (rate: Host.AidaClient.Rating) => void;
  onFeedbackSubmit: (feedback: string) => void;
}

export class AiRatings extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-ai-ratings`;
  readonly #shadow = this.attachShadow({mode: 'open'});
  #props: RatingProps;
  #showFeedbackForm = false;
  #currentRating?: Host.AidaClient.Rating;

  constructor(props: RatingProps) {
    super();
    this.#props = props;
  }

  set props(props: RatingProps) {
    this.#props = props;
    this.#render();
  }

  connectedCallback(): void {
    this.#shadow.adoptedStyleSheets = [aiRatingsStyles, Input.textInputStyles];
    this.#render();
  }

  #handleRateClick(rating: Host.AidaClient.Rating): void {
    if (this.#currentRating) {
      return;
    }

    this.#currentRating = rating;
    this.#showFeedbackForm = true;
    this.#props.onRateClick(this.#currentRating);
    this.#render();
  }

  #handleClose = (): void => {
    this.#showFeedbackForm = false;
    this.#render();
  };

  #handleSubmit = (ev: SubmitEvent): void => {
    ev.preventDefault();
    const input = this.#shadow.querySelector('.feedback-input') as HTMLInputElement;
    if (!this.#currentRating || !input || !input.value) {
      return;
    }
    this.#props.onFeedbackSubmit(input.value);
    this.#showFeedbackForm = false;
    this.#render();
  };

  #renderButtons(): LitHtml.TemplateResult {
    // clang-format off
    return LitHtml.html`
      <${Buttons.Button.Button.litTagName}
        .data=${{
          variant: Buttons.Button.Variant.ICON,
          size: Buttons.Button.Size.SMALL,
          iconName: 'thumb-up',
          active: this.#currentRating === Host.AidaClient.Rating.POSITIVE,
          title: i18nString(TempUIStrings.thumbsUp),
          jslogContext: 'thumbs-up',
        } as Buttons.Button.ButtonData}
        @click=${() => this.#handleRateClick(Host.AidaClient.Rating.POSITIVE)}
      ></${Buttons.Button.Button.litTagName}>
      <${Buttons.Button.Button.litTagName}
        .data=${{
          variant: Buttons.Button.Variant.ICON,
          size: Buttons.Button.Size.SMALL,
          iconName: 'thumb-down',
          active: this.#currentRating === Host.AidaClient.Rating.NEGATIVE,
          title: i18nString(TempUIStrings.thumbsDown),
          jslogContext: 'thumbs-down',
        } as Buttons.Button.ButtonData}
        @click=${() => this.#handleRateClick(Host.AidaClient.Rating.NEGATIVE)}
      ></${Buttons.Button.Button.litTagName}>
    `;
    // clang-format on
  }

  #renderFeedbackForm(): LitHtml.LitTemplate {
    if (!this.#showFeedbackForm) {
      return LitHtml.nothing;
    }

    // clang-format off
    return LitHtml.html`
      <form class="feedback" @submit=${this.#handleSubmit}>
        <div class="feedback-header">
          <h3 class="feedback-title">${i18nString(
              TempUIStrings.whyThisRating,
          )}</h3>
          <${Buttons.Button.Button.litTagName}
            class="step-actions"
            type="button"
            title=${i18nString(TempUIStrings.submit)}
            aria-label=${i18nString(TempUIStrings.submit)}
            jslog=${VisualLogging.action('close').track({ click: true })}
            @click=${this.#handleClose}
            .data=${
              {
                variant: Buttons.Button.Variant.ICON,
                iconName: 'cross',
                size: Buttons.Button.Size.SMALL,
                title: i18nString(TempUIStrings.submit),
              } as Buttons.Button.ButtonData
            }
          ></${Buttons.Button.Button.litTagName}>
        </div>
        <input
          type="text"
          class="devtools-text-input feedback-input"
          placeholder=${i18nString(
           TempUIStrings.provideFeedbackPlaceholder,
          )}
        >
        <span class="feedback-disclaimer">${i18nString(
            TempUIStrings.disclaimer,
        )}</span>
        <${Buttons.Button.Button.litTagName}
          class="step-actions"
          type="submit"
          title=${i18nString(TempUIStrings.submit)}
          aria-label=${i18nString(TempUIStrings.submit)}
          jslog=${VisualLogging.action('send').track({ click: true })}
          @click=${this.#handleSubmit}
          .data=${
            {
              variant: Buttons.Button.Variant.OUTLINED,
              size: Buttons.Button.Size.SMALL,
              title: i18nString(TempUIStrings.submit),
            } as Buttons.Button.ButtonData
          }
        >${i18nString(TempUIStrings.submit)}</${Buttons.Button.Button.litTagName}>
      </div>
    `;
    // clang-format on
  }

  #render(): void {
    // clang-format off
    LitHtml.render(
      LitHtml.html`
        <div class="rate-buttons">
          ${this.#renderButtons()}
          ${this.#renderFeedbackForm()}
        </div>`,
      this.#shadow,
      {host: this},
    );
    // clang-format on
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'devtools-ai-ratings': AiRatings;
  }
}

customElements.define('devtools-ai-ratings', AiRatings);
