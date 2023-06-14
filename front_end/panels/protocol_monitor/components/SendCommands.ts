// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import '../../recorder/components/components.js';

import * as LitHtml from '../../../ui/lit-html/lit-html.js';

import editorWidgetStyles from './JSONEditor.css.js';
import sendCommandsWidgetStyles from './sendCommands.css.js';

import type * as ProtocolMonitor from '../protocol_monitor.js';
import * as Buttons from '../../../ui/components/buttons/buttons.js';

const {html, Decorators, LitElement} = LitHtml;
const {customElement, property} = Decorators;
declare global {
  interface HTMLElementTagNameMap {
    'devtools-send-commands': SendCommands;
  }
}

const copyIconUrl = new URL('../../../Images/copy.svg', import.meta.url).toString();
const sendIconUrl = new URL('../../../Images/send.svg', import.meta.url).toString();

@customElement('devtools-send-commands')
export class SendCommands extends LitElement {
  @property() declare protocolMonitor: ProtocolMonitor.ProtocolMonitor.ProtocolMonitorImpl;
  static override styles = [sendCommandsWidgetStyles, editorWidgetStyles];

  #handleCopy = (): void => {
    this.dispatchEvent(new CustomEvent('copycommand', {bubbles: true}));
  };

  #handleSend = (): void => {
    this.dispatchEvent(new CustomEvent('commandsent', {bubbles: true}));
  };

  override render(): LitHtml.TemplateResult {
    // clang-format off
    return html`
        <div class="icon-container">
          <${Buttons.Button.Button.litTagName}
          .size=${Buttons.Button.Size.SMALL}
          .iconUrl=${copyIconUrl}
          .variant=${Buttons.Button.Variant.ROUND}
          .iconWidth=${'20px'}
          .iconHeight=${'20px'}
          @click=${this.#handleCopy}
        ></${Buttons.Button.Button.litTagName}>
        <${Buttons.Button.Button.litTagName}
          .size=${Buttons.Button.Size.SMALL}
          .iconUrl=${sendIconUrl}
          .variant=${Buttons.Button.Variant.PRIMARY_TOOLBAR}
          .iconWidth=${'17px'}
          .iconHeight=${'17px'}
          @click=${this.#handleSend}
        ></${Buttons.Button.Button.litTagName}>
      </div>
    `;
    // clang-format on
  }
}
