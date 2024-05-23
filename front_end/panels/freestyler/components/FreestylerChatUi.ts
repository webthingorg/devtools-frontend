// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as i18n from '../../../core/i18n/i18n.js';
import * as Buttons from '../../../ui/components/buttons/buttons.js';
import * as LitHtml from '../../../ui/lit-html/lit-html.js';
import * as VisualLogging from '../../../ui/visual_logging/visual_logging.js';

import freestylerChatUiStyles from './freestylerChatUi.css.js';

const UIStrings = {
  /**
   *@description Placeholder text for the chat UI input.
   */
  inputPlaceholder: 'Ask Freestyler or type / for commands',
  /**
   *@description Disclaimer text right after the chat input.
   */
  inputDisclaimer: 'Freestyler may display inaccurate information and may not get it right',
  /**
   *@description Title for the send icon button.
   */
  sendButtonTitle: 'Send',
  /**
   *@description Title of the button for accepting the privacy notice.
   */
  acceptButtonTitle: 'Accept',
};
const str_ = i18n.i18n.registerUIStrings('panels/freestyler/components/FreestylerChatUi.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

enum ChatMessageEntity {
  MODEL = 'model',
  USER = 'user',
}

const EXAMPLE_MESSAGES = [
  {
    entity: ChatMessageEntity.USER,
    text: 'This is an example message',
  },
  {
    entity: ChatMessageEntity.MODEL,
    text: 'This is an example message',
  },
];

export const enum State {
  CONSENT_VIEW = 'consent',
  CHAT_VIEW = 'chat',
}

export type Props = {
  onTextSubmit: (text: string) => void,
  onAcceptPrivacyNotice: () => void,
  state: State,
};

export class FreestylerChatUi extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-freestyler-chat-ui`;
  readonly #shadow = this.attachShadow({mode: 'open'});
  #props: Props;

  constructor(props: Props) {
    super();
    this.#props = props;
  }

  set props(props: Props) {
    this.#props = props;
    this.#render();
  }

  connectedCallback(): void {
    this.#shadow.adoptedStyleSheets = [freestylerChatUiStyles];
    this.#render();
  }

  #handleSubmit = (ev: SubmitEvent): void => {
    ev.preventDefault();
    const input = this.#shadow.querySelector('.chat-input') as HTMLInputElement;
    if (!input) {
      return;
    }

    this.#props.onTextSubmit(input.value);
  };

  #renderConsentOnboarding = (): LitHtml.TemplateResult => {
    // clang-format off
    return LitHtml.html`
      <h2 tabindex="-1" class="consent-onboarding-heading">
        Privacy Notice
      </h2>
      <main>
        TODO: content

        <div class="consent-buttons-container">
          <${Buttons.Button.Button.litTagName}
            class="next-button"
            @click=${this.#props.onAcceptPrivacyNotice}
            .data=${{
      variant: Buttons.Button.Variant.PRIMARY,
      jslogContext: 'accept',
    } as Buttons.Button.ButtonData}
          >
            ${i18nString(UIStrings.acceptButtonTitle)}
          </${Buttons.Button.Button.litTagName}>
        </div>
      </main>
    `;
    // clang-format on
  };

  #renderChatMessage = (content: string, entity: ChatMessageEntity): LitHtml.TemplateResult => {
    const classes = LitHtml.Directives.classMap({
      'chat-message': true,
      'query': entity === ChatMessageEntity.USER,
      'answer': entity === ChatMessageEntity.MODEL,
    });
    return LitHtml.html`
      <div class=${classes}>
        ${content}
      </div>
    `;
  };

  #renderChatUi = (): LitHtml.TemplateResult => {
    // clang-format off
    return LitHtml.html`
      <div class="chat-ui">
        <div class="messages-container">
          ${EXAMPLE_MESSAGES.map(message => this.#renderChatMessage(message.text, message.entity))}
        </div>
        <form class="input-form" @submit=${this.#handleSubmit}>
          <div class="chat-input-container">
            <input type="text" class="chat-input" autofocus
              placeholder=${i18nString(UIStrings.inputPlaceholder)}>
            <${Buttons.Button.Button.litTagName}
              class="step-actions"
              type="submit"
              title=${i18nString(UIStrings.sendButtonTitle)}
              aria-label=${i18nString(UIStrings.sendButtonTitle)}
              jslog=${VisualLogging.action('send').track({click: true})}
              .data=${{
              variant: Buttons.Button.Variant.ICON,
              size: Buttons.Button.Size.SMALL,
              iconName: 'send',
              title: i18nString(UIStrings.sendButtonTitle),
            } as Buttons.Button.ButtonData}
            ></${Buttons.Button.Button.litTagName}>
          </div>
          <span class="chat-input-disclaimer">${i18nString(UIStrings.inputDisclaimer)}</span>
        </form>
      </div>
    `;
    // clang-format on
  };

  #render(): void {
    switch (this.#props.state) {
      case State.CONSENT_VIEW:
        LitHtml.render(this.#renderConsentOnboarding(), this.#shadow, {host: this});
        break;
      case State.CHAT_VIEW:
        LitHtml.render(this.#renderChatUi(), this.#shadow, {host: this});
        break;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'devtools-freestyler-chat-ui': FreestylerChatUi;
  }
}

customElements.define('devtools-freestyler-chat-ui', FreestylerChatUi);
