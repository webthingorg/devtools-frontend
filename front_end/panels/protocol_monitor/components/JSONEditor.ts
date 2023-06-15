// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import '../../recorder/components/components.js';

import * as LitHtml from '../../../ui/lit-html/lit-html.js';
import * as RecorderComponents from '../../recorder/components/components.js';

import editorWidgetStyles from './JSONEditor.css.js';

const {html, Decorators, LitElement, Directives, nothing} = LitHtml;
const {customElement, property, state} = Decorators;
const {live} = Directives;
declare global {
  interface HTMLElementTagNameMap {
    'devtools-json-editor': JSONEditor;
  }
}

export interface Parameter {
  type: string;
  optional: boolean;
  value: string|undefined;
  name: string;
}

@customElement('devtools-json-editor')
export class JSONEditor extends LitElement {
  static override styles = [editorWidgetStyles];
  @property() declare protocolMethodWithParametersMap: Map<string, Parameter[]>;
  @state() declare parametersAvailablePerCommand: {[x: string]: Parameter};
  @state() command: string = '';

  constructor() {
    super();
    this.parametersAvailablePerCommand = {};
    this.addEventListener('keydown', (event: Event) => {
      if ((event as KeyboardEvent).key === 'Enter' &&
          ((event as KeyboardEvent).metaKey || (event as KeyboardEvent).ctrlKey)) {
        const commandSendEvent = new Event('command-send');
        this.dispatchEvent(commandSendEvent);
      }
    });
  }

  formatParameters(): {[x: string]: unknown} {
    const formattedParameters: {[x: string]: unknown} = {};
    for (const [key, param] of Object.entries(this.parametersAvailablePerCommand)) {
      if (param.type === 'number') {
        formattedParameters[key] = Number(param.value);
      } else if (param.type === 'boolean') {
        formattedParameters[key] = Boolean(param.value);
      } else {
        formattedParameters[key] = param.value;
      }
    }
    return formattedParameters;
  }

  fetchParametersByCommands(command: string): void {
    const parameters = this.protocolMethodWithParametersMap.get(command);
    if (parameters && parameters.length !== 0) {
      const parametersPerCommand = this.protocolMethodWithParametersMap.get(this.command);
      if (parametersPerCommand) {
        for (const parameter of parametersPerCommand) {
          this.parametersAvailablePerCommand[parameter.name] = {
            optional: parameter.optional,
            type: parameter.type,
            value: parameter.value || undefined,
            name: parameter.name,
          };
        }
        this.requestUpdate();
      }
    }
  }

  getCommand(): string {
    return this.command;
  }

  getParameters(): {[x: string]: unknown} {
    return this.formatParameters();
  }

  #sanitizeValue(value: string|undefined): string|void {
    if (value) {
      return value.replace(/['"]+/g, '');
    }
  }

  #handleTypeInputBlur = async(event: Event): Promise<void> => {
    this.parametersAvailablePerCommand = {};
    if (event.target instanceof RecorderComponents.RecorderInput.RecorderInput) {
      this.command = event.target.value;
    }
    this.fetchParametersByCommands(this.command);
    this.requestUpdate();
  };

  #handleParameterInputBlur = async(event: Event, parameterName: string): Promise<void> => {
    if (event.target instanceof RecorderComponents.RecorderInput.RecorderInput) {
      const value = event.target.value;
      this.#sanitizeValue(value);
      this.parametersAvailablePerCommand[parameterName].value = value;
    }
  };

  #renderCommandRow(): LitHtml.TemplateResult|undefined {
    // clang-format off
    return html`<div class="row attribute padded" data-attribute="type">
      <div>command<span class="separator">:</span></div>
      <devtools-recorder-input
        .disabled=${false}
        .options=${[...this.protocolMethodWithParametersMap.keys()]}
        .value=${this.command}
        .placeholder=${'Enter your command...'}
        @blur=${this.#handleTypeInputBlur}
      ></devtools-recorder-input>
    </div>`;
    // clang-format on
  }

  /**
   * Renders the line with the word "parameter" in red. As opposed to the renderParametersRow method,
   * it does not render the value of a parameter.
   */
  #renderParameterRow(): LitHtml.TemplateResult|undefined {
    // clang-format off
    return html`<div class="row attribute padded" data-attribute="type">
      <div>parameters<span class="separator">:</span></div>
    </div>`;
    // clang-format on
  }

  /**
   * Renders the parameters list corresponding to a specific CDP command.
   */
  #renderParameters(parameters: {
    [x: string]: Parameter,
  }): LitHtml.TemplateResult|undefined {
    parameters = Object.fromEntries(
        Object.entries(parameters)
            .sort(([, a]: [string, Parameter], [, b]: [string, Parameter]) => Number(a.optional) - Number(b.optional)),
    );
    // clang-format off
    return html`
      <ul>
      ${Object.keys(parameters).map(key => {
      const value = JSON.stringify(this.#sanitizeValue(parameters[key].value));
      return html`
            <div class="row attribute padded double" data-attribute="type">
              <div class=${parameters[key].optional && 'color-blue'}>${key}<span class="separator">:</span></div>
              <devtools-recorder-input
                .disabled=${false}
                .value=${value === undefined ? live('') : live(this.#sanitizeValue(value))}
                .placeholder=${'Enter your parameter...'}
                @blur=${async (event: Event) : Promise<void> => {
                  await this.#handleParameterInputBlur(event, key);}
                }
              ></devtools-recorder-input>
            </div>
            `;
        })}
      </ul>`;
    // clang-format on
  }

  override render(): LitHtml.TemplateResult {
    // clang-format off
    return html`
    <div class="wrapper">
      ${this.#renderCommandRow()}
      ${this.parametersAvailablePerCommand && Object.keys((this.parametersAvailablePerCommand)).length !== 0 ? html`
          ${this.#renderParameterRow()}
          ${this.#renderParameters(this.parametersAvailablePerCommand)}
        ` : nothing}
    </div>`;
    // clang-format on
  }
}
