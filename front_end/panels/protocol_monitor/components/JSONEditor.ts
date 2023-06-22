// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import '../../recorder/components/components.js';
import '../../../ui/components/menus/menus.js';

import * as Host from '../../../core/host/host.js';
import * as SDK from '../../../core/sdk/sdk.js';
import * as LitHtml from '../../../ui/lit-html/lit-html.js';
import * as RecorderComponents from '../../recorder/components/components.js';

import editorWidgetStyles from './JSONEditor.css.js';

const {html, Decorators, LitElement, Directives, nothing} = LitHtml;
const {customElement, property, state} = Decorators;
const {live, classMap} = Directives;

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

interface Command {
  command: string;
  parameters: object;
}

/**
 * Parents should listen for this event and register the listeners provided by
 * this event"
 */
export class SubmitEditorEvent extends Event {
  static readonly eventName = 'submiteditor';
  readonly data: Command;

  constructor(data: Command) {
    super(SubmitEditorEvent.eventName);
    this.data = data;
  }
}
export class TargetChoseEvent extends Event {
  static readonly eventName = 'targetchose';
  readonly data: string;

  constructor(data: string) {
    super(TargetChoseEvent.eventName);
    this.data = data;
  }
}

@customElement('devtools-json-editor')
export class JSONEditor extends LitElement {
  static override styles = [editorWidgetStyles];
  @property() declare protocolMethodWithParametersMap: Map<string, Parameter[]>;
  @state() declare parameters: Record<string, Parameter>;
  @state() command: string = '';
  @state() target: string = '';
  constructor() {
    super();
    this.parameters = {};
    this.addEventListener('keydown', (event: Event) => {
      if ((event as KeyboardEvent).key === 'Enter' &&
          ((event as KeyboardEvent).metaKey || (event as KeyboardEvent).ctrlKey)) {
        this.dispatchEvent(new SubmitEditorEvent({
          command: this.command,
          parameters: this.getParameters(),
        }));
      }
    });
  }

  #copyToClipboard(): void {
    const commandJson = JSON.stringify({command: this.command, parameters: this.getParameters()});
    Host.InspectorFrontendHost.InspectorFrontendHostInstance.copyText(commandJson);
  }

  #handleCommandSend(): void {
    this.dispatchEvent(new SubmitEditorEvent({
      command: this.command,
      parameters: this.getParameters(),
    }));
  }

  getParameters(): {[x: string]: unknown} {
    const formattedParameters: {[x: string]: unknown} = {};
    for (const [key, param] of Object.entries(this.parameters)) {
      if (param.value !== undefined) {
        if (param.type === 'number') {
          formattedParameters[key] = Number(param.value);
        } else if (param.type === 'boolean') {
          formattedParameters[key] = Boolean(param.value);
        } else {
          formattedParameters[key] = param.value;
        }
      }
    }
    return formattedParameters;
  }

  #populateParametersForCommand(command: string): void {
    const parameters = this.protocolMethodWithParametersMap.get(command);
    const newParameters: Record<string, Parameter> = {};
    if (parameters && parameters.length !== 0) {
      const parametersPerCommand = this.protocolMethodWithParametersMap.get(this.command);
      if (parametersPerCommand) {
        for (const parameter of parametersPerCommand) {
          newParameters[parameter.name] = {
            optional: parameter.optional,
            type: parameter.type,
            value: parameter.value || undefined,
            name: parameter.name,
          };
        }
        this.parameters = newParameters;
      }
    }
  }

  #handleParameterInputBlur = (event: Event, parameterName: string): void => {
    if (event.target instanceof RecorderComponents.RecorderInput.RecorderInput) {
      const value = event.target.value;
      this.parameters[parameterName].value = value;
    }
  };

  #handleCommandInputBlur = async(event: Event): Promise<void> => {
    this.parameters = {};
    if (event.target instanceof RecorderComponents.RecorderInput.RecorderInput) {
      this.command = event.target.value;
    }
    this.#populateParametersForCommand(this.command);
  };

  #onItemSelected(): void {
    const shadowRoot = this.shadowRoot;
    const selectElement = shadowRoot?.getElementById('target-select') as HTMLSelectElement;
    this.target = selectElement.value;
    this.dispatchEvent(new TargetChoseEvent(this.target));
  }

  #renderTargetSelectorRow(): LitHtml.TemplateResult|undefined {
    const targetManager = SDK.TargetManager.TargetManager.instance();
    // clang-format off
    return html`
    <div class="row attribute padded" data-attribute="type">
      <div>target<span class="separator">:</span></div>
      <div>
        <select
          id="target-select"
          @change=${this.#onItemSelected}
        >
            ${LitHtml.Directives.repeat(
              targetManager.targets(),
              target => {
                return html`<option value=${target.id()}>${`${target.name()} (${target.inspectedURL()})`}</option>`;
              },
            )}
        </select>
      </div>
    </div>
  `;
    // clang-format on
  }

  #renderCommandRow(): LitHtml.TemplateResult|undefined {
    // clang-format off
    return html`<div class="row attribute padded" data-attribute="type">
      <div>command<span class="separator">:</span></div>
      <devtools-recorder-input
        .disabled=${false}
        .options=${[...this.protocolMethodWithParametersMap.keys()]}
        .value=${this.command}
        .placeholder=${'Enter your command...'}
        @blur=${this.#handleCommandInputBlur}
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
      const value = JSON.stringify(parameters[key].value);
      const classes = { colorBlue: parameters[key].optional};
      return html`
            <div class="row attribute padded double" data-attribute="type">
              <div class=${classMap(classes)}>${key}<span class="separator">:</span></div>
              <devtools-recorder-input
                .disabled=${false}
                .value=${live(value ?? '')}
                .placeholder=${'Enter your parameter...'}
                @blur=${(event: Event) : void => {
                  this.#handleParameterInputBlur(event, key);}
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
      ${this.#renderTargetSelectorRow()}
      ${this.#renderCommandRow()}
      ${this.parameters && Object.keys((this.parameters)).length !== 0 ? html`

          ${this.#renderParameterRow()}
          ${this.#renderParameters(this.parameters)}
        ` : nothing}
      <devtools-pm-toolbar @copycommand=${this.#copyToClipboard} @commandsent=${this.#handleCommandSend}></devtools-pm-toolbar>
    </div>`;
    // clang-format on
  }
}
