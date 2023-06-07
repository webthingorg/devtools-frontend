// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import './JSONPromptEditor.js';

import * as LitHtml from '../../../ui/lit-html/lit-html.js';

import {type CommandAutocompleteSuggestionProvider} from '../ProtocolMonitor.js';
import {type JSONPromptEditor} from './components.js';
import editorWidgetStyles from './editorWidget.css.js';
const {html, Decorators, LitElement} = LitHtml;
const {customElement, property, state} = Decorators;

declare global {
  interface HTMLElementTagNameMap {
    'devtools-editor-element': EditorElement;
  }
}

export const enum Events {
  CommandSent = 'CommandSent',
}

export type EventTypes = {
  [Events.CommandSent]: Command,
};

export interface Command {
  command: string;
  parameters: object;
}

@customElement('devtools-editor-element')
export class EditorElement extends LitElement {
  static override styles = [editorWidgetStyles];
  @property() declare jsonPromptEditors: JSONPromptEditor.JSONPromptEditor[];
  @property() declare parameters: {[x: string]: unknown};
  @property() declare commandAutocompleteSuggestionProvider: CommandAutocompleteSuggestionProvider;
  @state() command: string;

  constructor() {
    super();
    this.command = '';
  }

  getCommand(): string {
    return this.command;
  }

  getParameters(): {[x: string]: unknown} {
    return this.parameters;
  }

  #handleTypeInputBlur = async(event: Event): Promise<void> => {
    if (event.target) {
      this.command = event.target.value;
    }
  };

  #renderCommandRow(): LitHtml.TemplateResult|undefined {
    // clang-format off
    return html`<div class="row attribute padded" data-attribute="type">
      <div>command<span class="separator">:</span></div>
      <devtools-json-prompt-editor
        .disabled=${false}
        .options=${this.commandAutocompleteSuggestionProvider.buildNewTextPromptCompletions()}
        .value=${this.command}
        .placeholder=${'Enter your command...'}
        @blur=${this.#handleTypeInputBlur}
      ></devtools-json-prompt-editor>
    </div>`;
    // clang-format on
  }

  #renderParameterRow(): LitHtml.TemplateResult|undefined {
    // clang-format off
    return html`<div class="row attribute padded" data-attribute="type">
      <div>parameters<span class="separator">:</span></div>
    </div>`;
    // clang-format on
  }

  #renderParametersRow(parameters: {
    [x: string]: unknown,
  }): LitHtml.TemplateResult|undefined {
    const jsonPromptEditors = [];
    for (const key of Object.keys(parameters)) {
      const value = JSON.stringify(parameters[key]);
      jsonPromptEditors.push(html`<div class="row attribute padded double" data-attribute="type">
      <div>${key}<span class="separator">:</span></div>
      <devtools-json-prompt-editor
        .disabled=${false}
        .options=${this.commandAutocompleteSuggestionProvider.buildNewTextPromptCompletions()}
        .value=${value}
        .placeholder=${'Enter your paremeter...'}
      ></devtools-json-prompt-editor>
    </div>`);
    }

    return html`
    <ul>
      ${jsonPromptEditors}
    </ul>
  `;
    // clang-format on
  }

  override render(): LitHtml.TemplateResult {
    let result;
    if (this.parameters) {
      // clang-format off
result = html`
<div class="wrapper">
${this.#renderCommandRow()}
${this.#renderParameterRow()}
${this.#renderParametersRow(this.parameters)}
</div>
`;
    } else {
      result = html`
<div class="wrapper">
${this.#renderCommandRow()}

</div>
`;
    }

    return result;
  }
}
