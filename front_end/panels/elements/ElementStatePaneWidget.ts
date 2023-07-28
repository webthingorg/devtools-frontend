// Copyright (c) 2015 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../core/common/common.js';
import * as Host from '../../core/host/host.js';
import * as i18n from '../../core/i18n/i18n.js';
import * as SDK from '../../core/sdk/sdk.js';
import * as UI from '../../ui/legacy/legacy.js';

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
   * @description Tooltip text in the Element & Page State Pane Widget of the Elements panel. For a button that
   * opens a tool that toggles the various states of the selected element on/off, as well as toggle various page states on/off.
   */
  toggleElementPageState: 'Toggle element & page state',
  /**
   * @description The name of a checkbox setting in the Element & Page State Pane Widget of the Elements panel.. This setting
   * emulates/pretends that the webpage is focused.
   */
  keepPageFocused: 'Keep page focused',
};
const str_ = i18n.i18n.registerUIStrings('panels/elements/ElementStatePaneWidget.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);
export class ElementStatePaneWidget extends UI.Widget.Widget {
  private readonly inputs: HTMLInputElement[];
  private readonly inputStates: WeakMap<HTMLInputElement, string>;
  private cssModel?: SDK.CSSModel.CSSModel|null;
  constructor() {
    super(true);

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
      const label = UI.UIUtils.CheckboxLabel.create(':' + state);
      const input = label.checkboxElement;
      this.inputStates.set(input, state);
      input.addEventListener('click', (clickListener as EventListener), false);
      inputs.push(input);
      td.appendChild(label);
      return td;
    };

    const createkeepPageFocusedCheckboxCheckbox =
        (state: string, setting: Common.Settings.Setting<boolean>, metric: Host.UserMetrics.Action): Element => {
          const div = document.createElement('div');
          div.classList.add('page-state-checkbox');
          const label = UI.UIUtils.CheckboxLabel.create(state);
          UI.SettingsUI.bindCheckbox(label.checkboxElement, setting, metric);
          div.appendChild(label);
          return div;
        };

    this.contentElement.className = 'styles-element-state-pane';

    // Populate page states
    const keepPageFocusedCheckbox = createkeepPageFocusedCheckboxCheckbox(
        i18nString(UIStrings.keepPageFocused), Common.Settings.Settings.instance().moduleSetting('emulatePageFocus'),
        Host.UserMetrics.Action.ToggleKeepPageFocusedFromStylesPane);

    this.contentElement.appendChild(keepPageFocusedCheckbox);

    // Populate element states
    this.contentElement.appendChild(createSectionHeader(i18nString(UIStrings.forceElementState)));

    const tableElementState = document.createElement('table');
    tableElementState.classList.add('source-code');
    UI.ARIAUtils.markAsPresentation(tableElementState);

    let tr = tableElementState.createChild('tr');
    tr.appendChild(createElementStateCheckbox('active'));
    tr.appendChild(createElementStateCheckbox('hover'));

    tr = tableElementState.createChild('tr');
    tr.appendChild(createElementStateCheckbox('focus'));
    tr.appendChild(createElementStateCheckbox('visited'));

    tr = tableElementState.createChild('tr');
    tr.appendChild(createElementStateCheckbox('focus-within'));
    tr.appendChild(createElementStateCheckbox('focus-visible'));

    tr = tableElementState.createChild('tr');
    tr.appendChild(createElementStateCheckbox('target'));

    this.contentElement.appendChild(tableElementState);

    // Continue
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
    ButtonProvider.instance().item().setToggled(this.inputs.some(input => input.checked));
  }
}

let buttonProviderInstance: ButtonProvider;

export class ButtonProvider implements UI.Toolbar.Provider {
  private readonly button: UI.Toolbar.ToolbarToggle;
  private view: ElementStatePaneWidget;
  private constructor() {
    this.button = new UI.Toolbar.ToolbarToggle(i18nString(UIStrings.toggleElementPageState), '');
    this.button.setText(i18n.i18n.lockedString(':hov'));
    this.button.setToggleWithDot(true);
    this.button.addEventListener(UI.Toolbar.ToolbarButton.Events.Click, this.clicked, this);
    this.button.element.classList.add('monospace');
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
    ElementsPanel.instance().showToolbarPane(!this.view.isShowing() ? this.view : null, null);
  }

  item(): UI.Toolbar.ToolbarToggle {
    return this.button;
  }
}
