// Copyright (c) 2015 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as Common from '../../core/common/common.js';
import * as Host from '../../core/host/host.js';
import * as i18n from '../../core/i18n/i18n.js';
import * as SDK from '../../core/sdk/sdk.js';
import * as IconButton from '../../ui/components/icon_button/icon_button.js';
import * as UI from '../../ui/legacy/legacy.js';
import * as VisualLogging from '../../ui/visual_logging/visual_logging.js';

import {ElementsPanel} from './ElementsPanel.js';
import elementStatePaneWidgetStyles from './elementStatePaneWidget.css.js';

const UIStrings = {
  /**
   * @description Title of a section in the Element State Pane Widget of the Elements panel. The
   * controls in this section allow users to force a particular state on the selected element, e.g. a
   * focused state via :focus or a hover state via :hover.
   */
  forceElementState: 'Force element state',
  /**
   * @description Tooltip text in Element State Pane Widget of the Elements panel. For a button that
   * opens a tool that toggles the various states of the selected element on/off.
   */
  toggleElementState: 'Toggle Element State',
  /**
   * @description The name of a checkbox setting in the Element & Page State Pane Widget of the Elements panel.. This setting
   * emulates/pretends that the webpage is focused.
   */
  emulateFocusedPage: 'Emulate a focused page',
  /**
   * @description Explanation text for the 'Emulate a focused page' setting in the Rendering tool.
   */
  emulatesAFocusedPage: 'Keep page focused. Commonly used for debugging disappearing elements.',
  /**
   * @description Similar with forceElementState but allows users to force specific state of the selected element.
   */
  elementSpecificStates: 'Force specific element state',
};
const str_ = i18n.i18n.registerUIStrings('panels/elements/ElementStatePaneWidget.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);
const SpecificPseudoStates: {[key: string]: number} = {
  'enabled': 0,
  'disabled': 1,
  'valid': 2,
  'invalid': 3,
  'user-valid': 4,
  'user-invalid': 5,
  'required': 6,
  'optional': 7,
  'read-only': 8,
  'read-write': 9,
  'in-range': 10,
  'out-of-range': 11,
  'visited': 12,
  'link': 13,
  'checked': 14,
  'indeterminate': 15,
  'placeholder-shown': 16,
  'autofill': 17,
};

export class ElementStatePaneWidget extends UI.Widget.Widget {
  private readonly inputs: HTMLInputElement[];
  private readonly inputStates: WeakMap<HTMLInputElement, string>;
  private cssModel?: SDK.CSSModel.CSSModel|null;
  private specificPseudoStateDivs: HTMLDivElement[];
  readonly throttler: Common.Throttler.Throttler;

  constructor() {
    super(true);
    this.contentElement.className = 'styles-element-state-pane';
    this.contentElement.setAttribute('jslog', `${VisualLogging.pane('element-states')}`);
    const inputs: HTMLInputElement[] = [];
    this.inputs = inputs;
    this.inputStates = new WeakMap();
    const createSectionHeader = (title: string): HTMLDivElement => {
      const sectionHeaderContainer = document.createElement('div');
      sectionHeaderContainer.classList.add('section-header');
      UI.UIUtils.createTextChild(sectionHeaderContainer.createChild('span'), title);

      return sectionHeaderContainer;
    };
    const clickListener = (event: MouseEvent): void => {
      const node = UI.Context.Context.instance().flavor(SDK.DOMModel.DOMNode);
      if (!node || !(event.target instanceof HTMLInputElement)) {
        return;
      }
      const state = this.inputStates.get(event.target);
      if (!state) {
        return;
      }
      node.domModel().cssModel().forcePseudoState(node, state, event.target.checked);
    };
    const createElementStateCheckbox = (state: string): Element => {
      const td = document.createElement('td');
      const label = UI.UIUtils.CheckboxLabel.create(':' + state, undefined, undefined, undefined, true);
      const input = label.checkboxElement;
      this.inputStates.set(input, state);
      input.addEventListener('click', (clickListener as EventListener), false);
      input.setAttribute('jslog', `${VisualLogging.toggle().track({click: true}).context(state)}`);
      inputs.push(input);
      td.appendChild(label);
      return td;
    };
    const createElementStateCheckboxDiv = (state: string): HTMLDivElement => {
      const div = document.createElement('div');
      div.id = state;
      const label = UI.UIUtils.CheckboxLabel.create(':' + state, undefined, undefined, undefined, true);
      const input = label.checkboxElement;
      this.inputStates.set(input, state);
      input.addEventListener('click', (clickListener as EventListener), false);
      input.setAttribute('jslog', `${VisualLogging.toggle().track({click: true}).context(state)}`);
      inputs.push(input);
      div.appendChild(label);
      return div;
    };

    const createEmulateFocusedPageCheckbox = (): Element => {
      const div = document.createElement('div');
      div.classList.add('page-state-checkbox');
      const label = UI.UIUtils.CheckboxLabel.create(
          i18nString(UIStrings.emulateFocusedPage), undefined, undefined, undefined, true);
      UI.SettingsUI.bindCheckbox(
          label.checkboxElement, Common.Settings.Settings.instance().moduleSetting('emulate-page-focus'), {
            enable: Host.UserMetrics.Action.ToggleEmulateFocusedPageFromStylesPaneOn,
            disable: Host.UserMetrics.Action.ToggleEmulateFocusedPageFromStylesPaneOff,
          });
      UI.Tooltip.Tooltip.install(label.textElement, i18nString(UIStrings.emulatesAFocusedPage));

      const link = UI.XLink.XLink.create(
          'https://goo.gle/devtools-emulate-focused-page', undefined, undefined, undefined, 'learn-more');
      link.textContent = '';
      link.style.setProperty('display', 'inline-flex');

      const icon = new IconButton.Icon.Icon();
      icon.data = {iconName: 'help', color: 'var(--icon-default)', width: '16px', height: '16px'};
      link.prepend(icon);

      div.appendChild(label);
      div.appendChild(link);
      return div;
    };

    this.contentElement.className = 'styles-element-state-pane';

    // Populate page states
    const keepPageFocusedCheckbox = createEmulateFocusedPageCheckbox();

    this.contentElement.appendChild(keepPageFocusedCheckbox);

    // Populate element states
    this.contentElement.appendChild(createSectionHeader(i18nString(UIStrings.forceElementState)));

    const table = document.createElement('table');
    table.classList.add('source-code');
    UI.ARIAUtils.markAsPresentation(table);

    let tr = table.createChild('tr');
    tr.appendChild(createElementStateCheckbox('active'));
    tr.appendChild(createElementStateCheckbox('hover'));
    tr = table.createChild('tr');
    tr.appendChild(createElementStateCheckbox('focus'));
    tr.appendChild(createElementStateCheckbox('focus-within'));
    tr = table.createChild('tr');
    tr.appendChild(createElementStateCheckbox('focus-visible'));
    tr.appendChild(createElementStateCheckbox('target'));
    this.contentElement.appendChild(table);

    const specificHeader = createSectionHeader(i18nString(UIStrings.elementSpecificStates));
    specificHeader.addEventListener('click', () => {
      for (const div of this.specificPseudoStateDivs) {
        div.classList.toggle('hidden');
      }
    });
    specificHeader.title = 'Force specific element state';
    this.contentElement.appendChild(specificHeader);

    const elementSpecificStates = document.createElement('div');
    elementSpecificStates.classList.add('source-code');
    elementSpecificStates.classList.add('pseudo-states-container');
    elementSpecificStates.classList.add('specific-pseudo-states');
    UI.ARIAUtils.markAsPresentation(elementSpecificStates);

    this.specificPseudoStateDivs = [];

    const specificPseudoStates: string[] = Object.keys(SpecificPseudoStates);
    for (const specificPseudoState of specificPseudoStates) {
      const checkbox = createElementStateCheckboxDiv(specificPseudoState);
      checkbox.classList.toggle('hidden');
      elementSpecificStates.appendChild(checkbox);
      this.specificPseudoStateDivs.push(checkbox);
    }
    this.contentElement.appendChild(elementSpecificStates);

    this.throttler = new Common.Throttler.Throttler(1);
    UI.Context.Context.instance().addFlavorChangeListener(SDK.DOMModel.DOMNode, this.update, this);
  }
  private updateModel(cssModel: SDK.CSSModel.CSSModel|null): void {
    if (this.cssModel === cssModel) {
      return;
    }
    if (this.cssModel) {
      this.cssModel.removeEventListener(SDK.CSSModel.Events.PseudoStateForced, this.update, this);
    }
    this.cssModel = cssModel;
    if (this.cssModel) {
      this.cssModel.addEventListener(SDK.CSSModel.Events.PseudoStateForced, this.update, this);
    }
  }
  override wasShown(): void {
    super.wasShown();
    this.registerCSSFiles([elementStatePaneWidgetStyles]);
    this.update();
  }
  private update(): void {
    let node = UI.Context.Context.instance().flavor(SDK.DOMModel.DOMNode);
    if (node) {
      node = node.enclosingElementOrSelf();
    }
    this.updateModel(node ? node.domModel().cssModel() : null);
    if (node) {
      const nodePseudoState = node.domModel().cssModel().pseudoState(node);
      for (const input of this.inputs) {
        input.disabled = Boolean(node.pseudoType());
        const state = this.inputStates.get(input);
        input.checked = nodePseudoState && state !== undefined ? nodePseudoState.indexOf(state) >= 0 : false;
      }
    } else {
      for (const input of this.inputs) {
        input.disabled = true;
        input.checked = false;
      }
    }
    // void this.throttler.schedule(this.updateElementSpecificStatesTable.bind(this, node));
    void this.updateElementSpecificStatesTable(node);
    ButtonProvider.instance().item().setToggled(this.inputs.some(input => input.checked));
  }

  private async updateElementSpecificStatesTable(node: SDK.DOMModel.DOMNode|null = null): Promise<void> {
    if (!node || node.nodeType() !== Node.ELEMENT_NODE) {
      return;
    }
    const isElementOfTypes = (node: SDK.DOMModel.DOMNode, types: string[]): boolean => {
      return types.includes(node.nodeName()?.toLowerCase());
    };
    const isInputWithTypeRadioOrCheckbox = (node: SDK.DOMModel.DOMNode): boolean => {
      return isElementOfTypes(node, ['input']) &&
          (node.getAttribute('type') === 'checkbox' || node.getAttribute('type') === 'radio');
    };
    // An autonomous custom element is called a form-associated custom element if the element is associated with a custom element definition whose form-associated field is set to true.
    // https://html.spec.whatwg.org/multipage/custom-elements.html#form-associated-custom-element
    const isFormAssociatedCustomElement = async(node: SDK.DOMModel.DOMNode): Promise<boolean> => {
      function getFormAssociatedField(this: HTMLElement): boolean {
        return ('formAssociated' in this.constructor && this.constructor.formAssociated === true);
      }
      const response = await node.callFunction(getFormAssociatedField);
      return response ? response.value : false;
    };

    const isFormAssociated = await isFormAssociatedCustomElement(node);

    if (isElementOfTypes(node, ['button', 'input', 'select', 'textarea', 'optgroup', 'option', 'fieldset']) ||
        isFormAssociated) {
      this.specificPseudoStateDivs[SpecificPseudoStates['enabled']].hidden = false;
      this.specificPseudoStateDivs[SpecificPseudoStates['disabled']].hidden = false;
    } else {
      this.specificPseudoStateDivs[SpecificPseudoStates['enabled']].hidden = true;
      this.specificPseudoStateDivs[SpecificPseudoStates['disabled']].hidden = true;
    }

    if (isElementOfTypes(node, ['button', 'fieldset', 'input', 'object', 'output', 'select', 'textarea', 'img']) ||
        isFormAssociated) {
      this.specificPseudoStateDivs[SpecificPseudoStates['valid']].hidden = false;
      this.specificPseudoStateDivs[SpecificPseudoStates['invalid']].hidden = false;
    } else {
      this.specificPseudoStateDivs[SpecificPseudoStates['valid']].hidden = true;
      this.specificPseudoStateDivs[SpecificPseudoStates['invalid']].hidden = true;
    }

    if (isElementOfTypes(node, ['input', 'select', 'textarea'])) {
      this.specificPseudoStateDivs[SpecificPseudoStates['user-valid']].hidden = false;
      this.specificPseudoStateDivs[SpecificPseudoStates['user-invalid']].hidden = false;
      this.specificPseudoStateDivs[SpecificPseudoStates['required']].hidden = false;
      this.specificPseudoStateDivs[SpecificPseudoStates['optional']].hidden = false;
    } else {
      this.specificPseudoStateDivs[SpecificPseudoStates['user-valid']].hidden = true;
      this.specificPseudoStateDivs[SpecificPseudoStates['user-invalid']].hidden = true;
      this.specificPseudoStateDivs[SpecificPseudoStates['required']].hidden = true;
      this.specificPseudoStateDivs[SpecificPseudoStates['optional']].hidden = true;
    }

    if (isElementOfTypes(node, ['input', 'textarea'])) {
      this.specificPseudoStateDivs[SpecificPseudoStates['read-only']].hidden = true;
      this.specificPseudoStateDivs[SpecificPseudoStates['read-write']].hidden = false;
    } else {
      this.specificPseudoStateDivs[SpecificPseudoStates['read-only']].hidden = false;
      this.specificPseudoStateDivs[SpecificPseudoStates['read-write']].hidden = true;
    }

    if (isElementOfTypes(node, ['input']) &&
        (node.getAttribute('min') !== undefined || node.getAttribute('max') !== undefined)) {
      this.specificPseudoStateDivs[SpecificPseudoStates['in-range']].hidden = false;
      this.specificPseudoStateDivs[SpecificPseudoStates['out-of-range']].hidden = false;
    } else {
      this.specificPseudoStateDivs[SpecificPseudoStates['in-range']].hidden = true;
      this.specificPseudoStateDivs[SpecificPseudoStates['out-of-range']].hidden = true;
    }

    if (isElementOfTypes(node, ['a', 'area']) && node.getAttribute('href') !== undefined) {
      this.specificPseudoStateDivs[SpecificPseudoStates['visited']].hidden = false;
      this.specificPseudoStateDivs[SpecificPseudoStates['link']].hidden = false;
    } else {
      this.specificPseudoStateDivs[SpecificPseudoStates['visited']].hidden = true;
      this.specificPseudoStateDivs[SpecificPseudoStates['link']].hidden = true;
    }

    if (isInputWithTypeRadioOrCheckbox(node) || isElementOfTypes(node, ['option'])) {
      this.specificPseudoStateDivs[SpecificPseudoStates['checked']].hidden = false;
    } else {
      this.specificPseudoStateDivs[SpecificPseudoStates['checked']].hidden = true;
    }

    if (isInputWithTypeRadioOrCheckbox(node) || isElementOfTypes(node, ['progress'])) {
      this.specificPseudoStateDivs[SpecificPseudoStates['indeterminate']].hidden = false;
    } else {
      this.specificPseudoStateDivs[SpecificPseudoStates['indeterminate']].hidden = true;
    }

    if (isElementOfTypes(node, ['input', 'textarea'])) {
      this.specificPseudoStateDivs[SpecificPseudoStates['placeholder-shown']].hidden = false;
    } else {
      this.specificPseudoStateDivs[SpecificPseudoStates['placeholder-shown']].hidden = true;
    }

    if (isElementOfTypes(node, ['input'])) {
      this.specificPseudoStateDivs[SpecificPseudoStates['autofill']].hidden = false;
    } else {
      this.specificPseudoStateDivs[SpecificPseudoStates['autofill']].hidden = true;
    }
  }
}

let buttonProviderInstance: ButtonProvider;
export class ButtonProvider implements UI.Toolbar.Provider {
  private readonly button: UI.Toolbar.ToolbarToggle;
  private view: ElementStatePaneWidget;
  private constructor() {
    this.button = new UI.Toolbar.ToolbarToggle(i18nString(UIStrings.toggleElementState), 'hover');
    this.button.addEventListener(UI.Toolbar.ToolbarButton.Events.Click, this.clicked, this);
    this.button.element.classList.add('element-state');
    this.button.element.setAttribute('jslog', `${VisualLogging.toggleSubpane('element-states').track({click: true})}`);
    this.button.element.style.setProperty('--dot-toggle-top', '12px');
    this.button.element.style.setProperty('--dot-toggle-left', '18px');
    this.view = new ElementStatePaneWidget();
  }
  static instance(opts: {
    forceNew: boolean|null,
  } = {forceNew: null}): ButtonProvider {
    const {forceNew} = opts;
    if (!buttonProviderInstance || forceNew) {
      buttonProviderInstance = new ButtonProvider();
    }
    return buttonProviderInstance;
  }
  private clicked(): void {
    ElementsPanel.instance().showToolbarPane(!this.view.isShowing() ? this.view : null, this.button);
  }
  item(): UI.Toolbar.ToolbarToggle {
    return this.button;
  }
}
