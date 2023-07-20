// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import '../../recorder/components/components.js';

import * as Host from '../../../core/host/host.js';
import * as SDK from '../../../core/sdk/sdk.js';
import * as Buttons from '../../../ui/components/buttons/buttons.js';
import * as Dialogs from '../../../ui/components/dialogs/dialogs.js';
import * as Menus from '../../../ui/components/menus/menus.js';
import * as UI from '../../../ui/legacy/legacy.js';
import * as LitHtml from '../../../ui/lit-html/lit-html.js';
import * as ElementsComponents from '../../elements/components/components.js';
import * as RecorderComponents from '../../recorder/components/components.js';

import editorWidgetStyles from './JSONEditor.css.js';

const {html, Decorators, LitElement, Directives, nothing} = LitHtml;
const {customElement, property, state} = Decorators;
const {live, classMap, repeat} = Directives;
declare global {
  interface HTMLElementTagNameMap {
    'devtools-json-editor': JSONEditor;
  }
}

const enum ParameterType {
  String = 'string',
  Number = 'number',
  Boolean = 'boolean',
  Array = 'array',
  Object = 'object',
}

interface BaseParameter {
  optional: boolean;
  name: string;
  typeRef?: string;
  description: string;
}

interface ArrayParameter extends BaseParameter {
  type: ParameterType.Array;
  value: Parameter[];
}

interface NumberParameter extends BaseParameter {
  type: ParameterType.Number;
  value?: number;
}

interface StringParameter extends BaseParameter {
  type: ParameterType.String;
  value?: string;
}

interface BooleanParameter extends BaseParameter {
  type: ParameterType.Boolean;
  value?: boolean;
}

interface ObjectParameter extends BaseParameter {
  type: ParameterType.Object;
  value: Parameter[];
}

export type Parameter = ArrayParameter|NumberParameter|StringParameter|BooleanParameter|ObjectParameter;

export interface Command {
  command: string;
  parameters: {[x: string]: unknown};
  targetId?: string;
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

const splitDescription = (description: string): [string, string] => {
  // If the description is too long we make the UI a bit better by highlighting the first sentence
  // which contains the most informations.
  // The number 150 has been chosen arbitrarily
  if (description.length > 150) {
    const [firstSentence, restOfDescription] = description.split('.');
    // To make the UI nicer, we add a dot at the end of the first sentence.
    firstSentence + '.';
    return [firstSentence, restOfDescription];
  }
  return [description, ''];
};

const removeUndefinedNestedObjects = (obj: {[key: string]: unknown}): void => {
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      const nestedObj = obj[key] as {[key: string]: unknown};
      let hasValue = false;
      for (const nestedKey in nestedObj) {
        if (Object.prototype.hasOwnProperty.call(nestedObj, nestedKey) && nestedObj[nestedKey] !== undefined) {
          hasValue = true;
          break;
        }
      }
      if (!hasValue) {
        delete obj[key];
      } else {
        removeUndefinedNestedObjects(nestedObj);
      }
    }
  }
};

@customElement('devtools-json-editor')
export class JSONEditor extends LitElement {
  static override styles = [editorWidgetStyles];
  @property()
  declare metadataByCommand: Map<string, {parameters: Parameter[], description: string, replyArgs: string[]}>;
  @property() declare typesByName: Map<string, Parameter[]>;
  @property() declare targetManager;
  @state() declare parameters: Parameter[];
  @state() command: string = '';
  @state() targetId?: string;

  #hintPopoverHelper?: UI.PopoverHelper.PopoverHelper;
  constructor() {
    super();
    this.parameters = [];
    this.targetManager = SDK.TargetManager.TargetManager.instance();
    this.targetId = this.targetManager.targets().length !== 0 ? this.targetManager.targets()[0].id() : undefined;
    this.addEventListener('keydown', (event: Event) => {
      if ((event as KeyboardEvent).key === 'Enter' &&
          ((event as KeyboardEvent).metaKey || (event as KeyboardEvent).ctrlKey)) {
        this.dispatchEvent(new SubmitEditorEvent({
          command: this.command,
          parameters: this.getParameters(),
          targetId: this.targetId,
        }));
      }
    });
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.#hintPopoverHelper = new UI.PopoverHelper.PopoverHelper(this, event => this.#handlePopoverDescriptions(event));
    this.#hintPopoverHelper.setDisableOnClick(true);
    this.#hintPopoverHelper.setTimeout(300);
    this.#hintPopoverHelper.setHasPadding(true);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#hintPopoverHelper?.hidePopover();
    this.#hintPopoverHelper?.dispose();
  }

  #convertObjectToParameterSchema(key: string, value: unknown, schema?: Parameter, initialSchema?: Parameter[]):
      Parameter {
    const type = schema?.type || typeof value;
    const description = schema?.description ?? '';
    const optional = schema?.optional ?? true;

    switch (type) {
      case 'string':
      case 'boolean':
      case 'number':

        return {
          type,
          name: key,
          optional,
          typeRef: schema?.typeRef,
          value,
          description,
        } as Parameter;
      case 'object': {
        if (typeof value !== 'object' || value === null) {
          throw Error('Wrong value');
        }
        const typeRef = schema?.typeRef;
        if (!typeRef) {
          break;
        }

        let nestedType;
        if (typeRef === 'dummy') {
          nestedType = initialSchema;
        } else {
          nestedType = this.typesByName.get(typeRef);
        }

        if (!nestedType) {
          break;
        }
        const objectValues = [];
        for (const objectKey of Object.keys(value as object)) {
          const objectType = nestedType.find(param => param.name === objectKey);
          objectValues.push(this.#convertObjectToParameterSchema(
              objectKey, (value as Record<string, unknown>)[objectKey], objectType as Parameter));
        }
        return {
          type: ParameterType.Object,
          name: key,
          optional: schema.optional,
          typeRef: schema.typeRef,
          value: objectValues,
          description,
        };
      }
      case 'array': {
        const typeRef = schema?.typeRef;
        if (!typeRef) {
          throw Error('No type ref');
        }

        if (!Array.isArray(value)) {
          throw Error('Wrong value');
        }
        const nestedType = this.#isTypePrimitive(typeRef) ? undefined : {
          optional: true,
          type: ParameterType.Object,
          value: [],
          typeRef,
          description: '',
          name: '',
        } as Parameter;

        const objectValues = [];

        for (let i = 0; i < value.length; i++) {
          const temp = this.#convertObjectToParameterSchema(`${i}`, value[i], nestedType);
          objectValues.push(temp);
        }
        return {
          type: ParameterType.Array,
          name: key,
          optional: optional,
          typeRef: schema?.typeRef,
          value: objectValues,
          description,
        };
      }
    }
    return {
      type,
      name: key,
      optional,
      typeRef: schema?.typeRef,
      value,
      description,
    } as Parameter;
  }

  displayCommand(command: string, parameters: {
    [paramName: string]: unknown,
  }): void {
    this.command = command;
    const schema = this.metadataByCommand.get(this.command);
    if (!schema?.parameters) {
      return;
    }
    this.parameters = this.#convertObjectToParameterSchema(
                              '', parameters, {
                                'typeRef': 'dummy',
                                'type': ParameterType.Object,
                                'name': '',
                                'description': '',
                                'optional': true,
                                'value': [],
                              },
                              schema.parameters)
                          .value as Parameter[];
    this.requestUpdate();
  }

  #handlePopoverDescriptions(event: MouseEvent):
      {box: AnchorBox, show: (popover: UI.GlassPane.GlassPane) => Promise<boolean>}|null {
    const hintElement = event.composedPath()[0] as HTMLElement;
    const elementData = this.#getDescriptionAndTypeForElement(hintElement);
    if (!elementData?.description) {
      return null;
    }
    const [head, tail] = splitDescription(elementData.description);
    const type = elementData.type;
    const replyArgs = elementData.replyArgs;
    let popupContent = '';
    // replyArgs and type cannot get into conflict because replyArgs is attached to a command and type to a parameter
    if (replyArgs) {
      popupContent = tail + `Returns: ${replyArgs}<br>`;
    } else if (type) {
      popupContent = tail + `<br>Type: ${type}<br>`;
    } else {
      popupContent = tail;
    }

    return {
      box: hintElement.boxInWindow(),
      show: async(popover: UI.GlassPane.GlassPane): Promise<boolean> => {
        const popupElement = new ElementsComponents.CSSHintDetailsView.CSSHintDetailsView({
          'getMessage': (): string => `<code><span>${head}</span></code>`,
          'getPossibleFixMessage': (): string => popupContent,
          'getLearnMoreLink': (): string =>
              `https://chromedevtools.github.io/devtools-protocol/tot/${this.command.split('.')[0]}/`,
        });
        popover.contentElement.appendChild(popupElement);
        return true;
      },
    };
  }

  #getDescriptionAndTypeForElement(hintElement: HTMLElement):
      {description: string, type?: ParameterType, replyArgs?: string[]}|undefined {
    if (hintElement.matches('.command')) {
      const metadata = this.metadataByCommand.get(this.command);
      if (metadata) {
        return {description: metadata.description, replyArgs: metadata.replyArgs};
      }
    }
    if (hintElement.matches('.parameter')) {
      const id = hintElement.dataset.paramid;
      if (!id) {
        return;
      }
      const realParamId = id.split('.');
      const {parameter} = this.#getChildByPath(realParamId);
      if (!parameter.description) {
        return;
      }
      return {description: parameter.description, type: parameter.type};
    }
    return;
  }

  #copyToClipboard(): void {
    const commandJson = JSON.stringify({command: this.command, parameters: this.getParameters()});
    Host.InspectorFrontendHost.InspectorFrontendHostInstance.copyText(commandJson);
  }

  #handleCommandSend(): void {
    this.dispatchEvent(new SubmitEditorEvent({
      command: this.command,
      parameters: this.getParameters(),
      targetId: this.targetId,
    }));
  }

  getParameters(): {[key: string]: unknown} {
    const formatParameterValue = (parameter: Parameter): unknown => {
      if (!parameter.value) {
        return;
      }
      switch (parameter.type) {
        case 'number': {
          return Number(parameter.value);
        }
        case 'boolean': {
          return Boolean(parameter.value);
        }
        case 'object': {
          const nestedParameters: {[key: string]: unknown} = {};
          for (const subParameter of parameter.value) {
            nestedParameters[subParameter.name] = formatParameterValue(subParameter);
          }
          return nestedParameters;
        }
        case 'array': {
          const nestedArrayParameters = [];
          for (const subParameter of parameter.value) {
            nestedArrayParameters.push(formatParameterValue(subParameter));
          }
          return nestedArrayParameters;
        }
        default: {
          return parameter.value;
        }
      }
    };

    const formattedParameters: {[key: string]: unknown} = {};
    for (const parameter of this.parameters) {
      formattedParameters[parameter.name] = formatParameterValue(parameter);
    }
    removeUndefinedNestedObjects(formattedParameters);
    return formattedParameters;
  }

  populateParametersForCommand(): void {
    const commandParameters = this.metadataByCommand.get(this.command)?.parameters;
    if (!commandParameters) {
      return;
    }
    this.parameters = commandParameters.map((parameter: Parameter) => {
      if (parameter.type === 'object') {
        const typeInfos = this.typesByName.get(parameter.typeRef as string) ?? [];
        return {
          optional: parameter.optional,
          type: parameter.type,
          description: parameter.description,
          typeRef: parameter.typeRef,
          value: typeInfos.map(type => {
            const param: Parameter = {
              optional: type.optional,
              type: this.#isParameterSupported(parameter) ? type.type : 'string',
              name: type.name,
              description: type.description,
              value: undefined,
            } as Parameter;
            return param;
          }),
          name: parameter.name,
        };
      }
      if (parameter.type === 'array') {
        return {
          optional: parameter.optional,
          type: parameter.type,
          description: parameter.description,
          typeRef: parameter.typeRef,
          value: [],
          name: parameter.name,
        };
      }
      return {
        optional: parameter.optional,
        type: parameter.type,
        typeRef: this.#isParameterSupported(parameter) ? parameter.typeRef : 'string',
        value: parameter.value || undefined,
        name: parameter.name,
        description: parameter.description,
      } as Parameter;
    });
  }

  #getChildByPath(pathArray: string[]): {parameter: Parameter, parentParameter: Parameter} {
    let parameters = this.parameters;
    let parentParameter;
    for (let i = 0; i < pathArray.length; i++) {
      const name = pathArray[i];
      const parameter = parameters.find(param => param.name === name);
      if (i === pathArray.length - 1) {
        return {parameter, parentParameter} as {parameter: Parameter, parentParameter: Parameter};
      }
      if (parameter?.type === 'array' || parameter?.type === 'object') {
        if (parameter.value) {
          parameters = parameter.value;
        }
      } else {
        throw new Error('Parameter on the path in not an object or an array');
      }
      parentParameter = parameter;
    }
    throw new Error('Not found');
  }

  #handleParameterInputBlur = (event: Event): void => {
    if (event.target instanceof RecorderComponents.RecorderInput.RecorderInput) {
      const value = event.target.value;
      const paramId = event.target.getAttribute('data-paramid');
      if (paramId) {
        const realParamId = paramId.split('.');
        const object = this.#getChildByPath(realParamId).parameter;
        object.value = value;
      }
    }
  };

  #handleCommandInputBlur = async(event: Event): Promise<void> => {
    if (event.target instanceof RecorderComponents.RecorderInput.RecorderInput) {
      this.command = event.target.value;
    }
    this.populateParametersForCommand();
  };

  #computeTargetLabel(target: SDK.Target.Target): string {
    return `${target.name()} (${target.inspectedURL()})`;
  }

  #isParameterSupported(parameter: Parameter): boolean {
    if (parameter.type === 'array' || parameter.type === 'object' || parameter.type === 'string' ||
        parameter.type === 'boolean' || parameter.type === 'number') {
      return true;
    }
    throw new Error('Parameter is not of correct type');
  }

  #isTypePrimitive(type: string): boolean {
    if (type === 'string' || type === 'boolean' || type === 'number') {
      return true;
    }
    return false;
  }

  #handleAddArrayParameter(parameterId: string): void {
    const realParamId = parameterId.split('.');
    const parameter = this.#getChildByPath(realParamId).parameter;
    if (!parameter) {
      return;
    }
    if (parameter.type !== 'array' || !parameter.typeRef) {
      return;
    }
    const typeInfos = this.typesByName.get(parameter.typeRef as string) ?? [];

    parameter.value.push({
      optional: true,
      type: this.#isTypePrimitive(parameter.typeRef) ? parameter.typeRef : 'object',
      name: String(parameter.value.length),
      value: typeInfos.length !== 0 ?
          typeInfos.map(type => ({
                          optional: type.optional,
                          type: this.#isParameterSupported(parameter) ? type.type : 'string',
                          name: type.name,
                          value: undefined,
                        })) :
          undefined,
    } as Parameter);
    this.requestUpdate();
  }

  #handleDeleteArrayParameter(parameterId: string): void {
    const realParamId = parameterId.split('.');
    const {parameter, parentParameter} = this.#getChildByPath(realParamId);
    if (!parameter) {
      return;
    }
    if (!Array.isArray(parentParameter.value)) {
      return;
    }
    parentParameter.value.splice(parentParameter.value.findIndex(p => p === parameter), 1);
    for (let i = 0; i < parentParameter.value.length; i++) {
      parentParameter.value[i].name = String(i);
    }
    this.requestUpdate();
  }

  #renderTargetSelectorRow(): LitHtml.TemplateResult|undefined {
    const target = this.targetManager.targets().find(el => el.id() === this.targetId);
    const targetLabel = target ? this.#computeTargetLabel(target) : '';
    // clang-format off
    return html`
    <div class="row attribute padded">
      <div>target<span class="separator">:</span></div>
      <${Menus.SelectMenu.SelectMenu.litTagName}
            class="target-select-menu"
            @selectmenuselected=${this.#onTargetSelected}
            .showDivider=${true}
            .showArrow=${true}
            .sideButton=${false}
            .showSelectedItem=${true}
            .showConnector=${false}
            .position=${Dialogs.Dialog.DialogVerticalPosition.BOTTOM}
            .buttonTitle=${targetLabel}
          >
          ${repeat(this.targetManager.targets(), target => {
          return LitHtml.html`
                <${Menus.Menu.MenuItem.litTagName}
                  .value=${target.id()}>
                    ${this.#computeTargetLabel(target)}
                </${Menus.Menu.MenuItem.litTagName}>
              `;
        },
    )}
          </${Menus.SelectMenu.SelectMenu.litTagName}>
    </div>
  `;
    // clang-format on
  }

  #onTargetSelected(event: Menus.SelectMenu.SelectMenuItemSelectedEvent): void {
    this.targetId = event.itemValue as string;
    this.requestUpdate();
  }

  #renderInlineButton(opts: {
    title: string,
    iconName: string,
    classMap: {[name: string]: string|boolean|number},
    onClick: (event: MouseEvent) => void,
  }): LitHtml.TemplateResult|undefined {
    return html`
          <devtools-button
            title=${opts.title}
            .size=${Buttons.Button.Size.MEDIUM}
            .iconName=${opts.iconName}
            .variant=${Buttons.Button.Variant.ROUND}
            class=${classMap(opts.classMap)}
            @click=${opts.onClick}
          ></devtools-button>
        `;
  }

  /**
   * Renders the parameters list corresponding to a specific CDP command.
   */
  #renderParameters(parameters: Parameter[], id?: string, parentParameter?: Parameter, parentParameterId?: string):
      LitHtml.TemplateResult|undefined {
    parameters.sort((a, b) => Number(a.optional) - Number(b.optional));

    // clang-format off
    return html`
      <ul>
        ${repeat(parameters, parameter => {
          const parameterId = parentParameter ? `${parentParameterId}` + '.' + `${parameter.name}` : parameter.name;
          const subparameters: Parameter[] = parameter.type === 'array' || parameter.type === 'object' ? (parameter.value ?? []) : [];
          const handleInputOnBlur = (event: Event): void => {
            this.#handleParameterInputBlur(event);
          };
          const classes = {colorBlue: parameter.optional, parameter: true};
          return html`
                <li class="row">
                  <div class="row">
                    <div class=${classMap(classes)} data-paramId=${parameterId}>${parameter.name}<span class="separator">:</span></div>
                    ${parameter.type === 'array' ? html`
                    ${this.#renderInlineButton({
                        title: 'Add parameter',
                        iconName: 'plus',
                        onClick: () => this.#handleAddArrayParameter(parameterId),
                        classMap: { deleteButton: true },
                      })}
                  `: nothing}
                    ${parameter.type !== 'array' && parameter.type !== 'object' ? html`
                    <devtools-recorder-input
                      data-paramId=${parameterId}
                      .value=${live(parameter.value ?? '')}
                      .placeholder=${'Enter your parameter...'}
                      @blur=${handleInputOnBlur}
                    ></devtools-recorder-input>` : nothing}

                    ${parameter.optional ? html`
                      ${this.#renderInlineButton({
                          title: 'Delete',
                          iconName: 'minus',
                          onClick: () => this.#handleDeleteArrayParameter(parameterId),
                          classMap: { deleteButton: true },
                        })}` : nothing}
                  </div>
                </li>
                ${this.#renderParameters(subparameters, id, parameter, parameterId)}
              `;
          })}
      </ul>
    `;
    // clang-format on
  }

  override render(): LitHtml.TemplateResult {
    // clang-format off
    return html`
    <div class="wrapper">
      ${this.#renderTargetSelectorRow()}
      <div class="row attribute padded">
        <div class="command">command<span class="separator">:</span></div>
        <devtools-recorder-input
          .options=${[...this.metadataByCommand.keys()]}
          .value=${this.command}
          .placeholder=${'Enter your command...'}
          @blur=${this.#handleCommandInputBlur}
        ></devtools-recorder-input>
      </div>
      ${this.parameters.length ? html`
      <div class="row attribute padded">
        <div>parameters<span class="separator">:</span></div>
      </div>
        ${this.#renderParameters(this.parameters)}
      ` : nothing}
    </div>
    <devtools-pm-toolbar @copycommand=${this.#copyToClipboard} @commandsent=${this.#handleCommandSend}></devtools-pm-toolbar>`;
    // clang-format on
  }
}
