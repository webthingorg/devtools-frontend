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

export interface CommandParameter {
  name: string;
  type: string;
  optional: boolean;
  value: string;
}

interface Parameter {
  type: string;
  optional: boolean;
  value: string;
  touched: boolean;
}

@customElement('devtools-json-editor')
export class JSONEditor extends LitElement {
  static override styles = [editorWidgetStyles];
  @property() declare jsonPromptEditors: RecorderComponents.RecorderInput.RecorderInput[];
  @property() declare parameters: {[x: string]: unknown};
  @property() declare protocolMethods: string[];
  @property() declare protocolMethodsWithoutParameters: Set<string>;
  @property() declare protocolMethodWithParametersMap: Map<string, CommandParameter[]>;
  /**
   * Two types of parameters Map are needed.
   * The first one, parametersSentByEditor contains only key value pair which are then processed by the Protocol Monitor.
   * The second one, parametersAvailablePerCommand is responsible for showing the corresponding parameters per command.
   * It contains all the property of the parameters such as their type, value and if they are optional are not.
   */
  @state() declare parametersSentByEditor: {[x: string]: unknown};
  @state() declare parametersAvailablePerCommand: {[x: string]: Parameter};
  @state() command: string = '';

  constructor() {
    super();
    this.parametersSentByEditor = {};
    this.parametersAvailablePerCommand = {};
  }

  formatParameters(): void {
    const formattedParameters: {[x: string]: unknown} = {};
    for (const [key, param] of Object.entries(this.parametersAvailablePerCommand)) {
      if (param.touched) {
        if (param.type === 'number') {
          formattedParameters[key] = Number(param.value);
        } else if (param.type === 'boolean') {
          formattedParameters[key] = Boolean(param.value);
        } else {
          formattedParameters[key] = param.value;
        }
      }
    }
    this.parametersSentByEditor = formattedParameters;
  }

  fetchParametersByCommands(command: string): void {
    if (!(command in this.protocolMethodsWithoutParameters)) {
      const parameters = this.protocolMethodWithParametersMap.get(this.command);
      if (parameters) {
        for (const parameter of parameters) {
          this.parametersAvailablePerCommand[parameter.name] = {
            optional: parameter.optional,
            type: parameter.type,
            value: parameter.value || '',
            touched: false,
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
    this.formatParameters();
    return this.parametersSentByEditor;
  }

  sanitizeValue(value: string): string {
    return value.replace(/['"]+/g, '');
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
      this.sanitizeValue(value);
      this.parametersAvailablePerCommand[parameterName].value = value;
      this.parametersAvailablePerCommand[parameterName].touched = true;
    }
  };

  #renderCommandRow(): LitHtml.TemplateResult|undefined {
    // clang-format off
    return html`<div class="row attribute padded" data-attribute="type">
      <div>command<span class="separator">:</span></div>
      <devtools-recorder-input
        .disabled=${false}
        .options=${this.protocolMethods}
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
      const value = JSON.stringify(this.sanitizeValue(parameters[key].value));
      return html`
            <div class="row attribute padded double" data-attribute="type">
              <div class=${parameters[key].optional && 'color-blue'}>${key}<span class="separator">:</span></div>
              <devtools-recorder-input
                .disabled=${false}
                .value=${live(this.sanitizeValue(value))}
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

  /**
   * Renders the parameters list corresponding to a specific CDP command if typed in the CDP input bar.
   * At the moment there is two functions because the editor is not complete. In future CLs, this function will be removed.
   * If you input a command inside the input bar it will be displayed inside the editor,
   * but you should not then try to type another command inside the editor.
   *
   * This function is needed because the parameters accepted here are the same as in #renderParameters.
   */
  #renderParametersFromInputBar(parameters: {
    [x: string]: unknown,
  }): LitHtml.TemplateResult|undefined {
    // clang-format off
      return html`
        <ul>
          ${Object.keys(parameters).map(key => {
          const value = JSON.stringify(parameters[key]);
          return html`
                <div class="row attribute padded double" data-attribute="type">
                  <div>${key}<span class="separator">:</span></div>
                  <devtools-recorder-input
                    .disabled=${false}
                    .value=${value}
                    .placeholder=${'Enter your parameter...'}
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
      ${this.parameters && Object.keys((this.parameters)).length !== 0 ? html`
          ${this.#renderParameterRow()}
          ${this.#renderParametersFromInputBar(this.parameters)}
        ` : nothing}
      ${this.parametersAvailablePerCommand && Object.keys((this.parametersAvailablePerCommand)).length !== 0 ? html`
          ${this.#renderParameterRow()}
          ${this.#renderParameters(this.parametersAvailablePerCommand)}
        ` : nothing}
    </div>`;
    // clang-format on
  }
}
