// Copyright (c) 2015 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../common/common.js';
import * as Platform from '../platform/platform.js';
import * as SDK from '../sdk/sdk.js';
import * as UI from '../ui/ui.js';

import {ElementsPanel} from './ElementsPanel.js';

export class ClassesPaneWidget extends UI.Widget.Widget {
  _input: HTMLElement;
  _classesContainer: HTMLElement;
  _prompt: ClassNamePrompt;
  _mutatingNodes: Set<SDK.DOMModel.DOMNode>;
  _pendingNodeClasses: Map<SDK.DOMModel.DOMNode, string>;
  _updateNodeThrottler: Common.Throttler.Throttler;
  _previousTarget: SDK.DOMModel.DOMNode|null;
  constructor() {
    super(true);
    this.registerRequiredCSS('elements/classesPaneWidget.css', {enableLegacyPatching: true});
    this.contentElement.className = 'styles-element-classes-pane';
    const container = this.contentElement.createChild('div', 'title-container');
    this._input = container.createChild('div', 'new-class-input monospace');
    this.setDefaultFocusedElement(this._input);
    this._classesContainer = this.contentElement.createChild('div', 'source-code');
    this._classesContainer.classList.add('styles-element-classes-container');
    this._prompt = new ClassNamePrompt(this._nodeClasses.bind(this));
    this._prompt.setAutocompletionTimeout(0);
    this._prompt.renderAsBlock();

    const proxyElement = this._prompt.attach(this._input);
    this._prompt.setPlaceholder(Common.UIString.UIString('Add new class'));
    this._prompt.addEventListener(UI.TextPrompt.Events.TextChanged, this._onTextChanged, this);
    proxyElement.addEventListener('keydown', this._onKeyDown.bind(this), false);

    SDK.SDKModel.TargetManager.instance().addModelListener(
        SDK.DOMModel.DOMModel, SDK.DOMModel.Events.DOMMutated, this._onDOMMutated, this);
    this._mutatingNodes = new Set();
    this._pendingNodeClasses = new Map();
    this._updateNodeThrottler = new Common.Throttler.Throttler(0);
    this._previousTarget = null;
    UI.Context.Context.instance().addFlavorChangeListener(SDK.DOMModel.DOMNode, this._onSelectedNodeChanged, this);
  }

  _splitTextIntoClasses(text: string): string[] {
    return text.split(/[,\s]/)
        .map((className: string) => className.trim())
        .filter((className: string) => className.length);
  }

  _onKeyDown(event: Event) {
    if (!isEnterKey(event) && !isEscKey(event)) {
      return;
    }

    if (isEnterKey(event)) {
      event.consume();
      if (this._prompt.acceptAutoComplete()) {
        return;
      }
    }

    const eventTarget = (event.target as HTMLElement);
    let text: string = (eventTarget.textContent as string);
    if (isEscKey(event)) {
      if (!Platform.StringUtilities.isWhitespace(text)) {
        event.consume(true);
      }
      text = '';
    }

    this._prompt.clearAutocomplete();
    eventTarget.textContent = '';

    const node = UI.Context.Context.instance().flavor(SDK.DOMModel.DOMNode);
    if (!node) {
      return;
    }

    const classNames = this._splitTextIntoClasses(text);
    if (!classNames.length) {
      this._installNodeClasses(node);
      return;
    }

    for (const className of classNames) {
      this._toggleClass(node, className, true);
    }

    // annoucementString is used for screen reader to announce that the class(es) has been added successfully.
    const joinClassString = classNames.join(' ');
    const announcementString =
        classNames.length > 1 ? ls`Classes ${joinClassString} added.` : ls`Class ${joinClassString} added.`;
    UI.ARIAUtils.alert(announcementString, this.contentElement);

    this._installNodeClasses(node);
    this._update();
  }

  _onTextChanged() {
    const node = UI.Context.Context.instance().flavor(SDK.DOMModel.DOMNode);
    if (!node) {
      return;
    }
    this._installNodeClasses(node);
  }

  _onDOMMutated(event: Common.EventTarget.EventTargetEvent) {
    const node = (event.data as SDK.DOMModel.DOMNode);
    if (this._mutatingNodes.has(node)) {
      return;
    }
    cachedClassesMap.delete(node);
    this._update();
  }

  _onSelectedNodeChanged(event: Common.EventTarget.EventTargetEvent) {
    if (this._previousTarget && this._prompt.text()) {
      this._input.textContent = '';
      this._installNodeClasses(this._previousTarget);
    }
    this._previousTarget = (event.data as SDK.DOMModel.DOMNode | null);
    this._update();
  }

  wasShown() {
    this._update();
  }

  _update() {
    if (!this.isShowing()) {
      return;
    }

    let node: (SDK.DOMModel.DOMNode|null) = UI.Context.Context.instance().flavor(SDK.DOMModel.DOMNode);
    if (node) {
      node = node.enclosingElementOrSelf();
    }

    this._classesContainer.removeChildren();
    // @ts-ignore this._input is a div, not an input element. So this line makes no sense at all
    this._input.disabled = !node;

    if (!node) {
      return;
    }

    const classes = this._nodeClasses(node);
    const keys = [...classes.keys()];
    keys.sort(Platform.StringUtilities.caseInsensetiveComparator);
    for (const className of keys) {
      const label = UI.UIUtils.CheckboxLabel.create(className, classes.get(className));
      label.classList.add('monospace');
      label.checkboxElement.addEventListener('click', this._onClick.bind(this, className), false);
      this._classesContainer.appendChild(label);
    }
  }

  _onClick(className: string, event: Event) {
    const node = UI.Context.Context.instance().flavor(SDK.DOMModel.DOMNode);
    if (!node) {
      return;
    }
    const enabled = (event.target as HTMLInputElement).checked;
    this._toggleClass(node, className, enabled);
    this._installNodeClasses(node);
  }

  _nodeClasses(node: SDK.DOMModel.DOMNode): Map<string, boolean> {
    let result: (Map<string, boolean>|undefined) = cachedClassesMap.get(node);
    if (!result) {
      const classAttribute = node.getAttribute('class') || '';
      const classes = classAttribute.split(/\s/);
      result = new Map();
      for (let i = 0; i < classes.length; ++i) {
        const className = classes[i].trim();
        if (!className.length) {
          continue;
        }
        result.set(className, true);
      }
      cachedClassesMap.set(node, result);
    }
    return result;
  }

  _toggleClass(node: SDK.DOMModel.DOMNode, className: string, enabled: boolean) {
    const classes = this._nodeClasses(node);
    classes.set(className, enabled);
  }

  _installNodeClasses(node: SDK.DOMModel.DOMNode) {
    const classes = this._nodeClasses(node);
    const activeClasses = new Set<string>();
    for (const className of classes.keys()) {
      if (classes.get(className)) {
        activeClasses.add(className);
      }
    }

    const additionalClasses = this._splitTextIntoClasses(this._prompt.textWithCurrentSuggestion());
    for (const className of additionalClasses) {
      activeClasses.add(className);
    }

    const newClasses = [...activeClasses.values()].sort();

    this._pendingNodeClasses.set(node, newClasses.join(' '));
    this._updateNodeThrottler.schedule(this._flushPendingClasses.bind(this));
  }

  async _flushPendingClasses(): Promise<void> {
    const promises = [];
    for (const node of this._pendingNodeClasses.keys()) {
      this._mutatingNodes.add(node);
      const promise = node.setAttributeValuePromise('class', (this._pendingNodeClasses.get(node) as string))
                          .then(onClassValueUpdated.bind(this, node));
      promises.push(promise);
    }
    this._pendingNodeClasses.clear();
    await Promise.all(promises);

    function onClassValueUpdated(this: ClassesPaneWidget, node: SDK.DOMModel.DOMNode) {
      this._mutatingNodes.delete(node);
    }
  }
}

/** @type {!WeakMap<!SDK.DOMModel.DOMNode, !Map<string, boolean>>} */
const cachedClassesMap = new WeakMap();

export class ButtonProvider implements UI.Toolbar.Provider {
  _button: UI.Toolbar.ToolbarToggle;
  _view: ClassesPaneWidget;
  constructor() {
    this._button = new UI.Toolbar.ToolbarToggle(Common.UIString.UIString('Element Classes'), '');
    this._button.setText('.cls');
    this._button.element.classList.add('monospace');
    this._button.addEventListener(UI.Toolbar.ToolbarButton.Events.Click, this._clicked, this);
    this._view = new ClassesPaneWidget();
  }

  _clicked() {
    ElementsPanel.instance().showToolbarPane(!this._view.isShowing() ? this._view : null, this._button);
  }

  item(): UI.Toolbar.ToolbarItem {
    return this._button;
  }
}

export class ClassNamePrompt extends UI.TextPrompt.TextPrompt {
  _nodeClasses: (arg0: SDK.DOMModel.DOMNode) => Map<string, boolean>;
  _selectedFrameId: string|null;
  _classNamesPromise: Promise<string[]>|null;
  constructor(nodeClasses: (arg0: SDK.DOMModel.DOMNode) => Map<string, boolean>) {
    super();
    this._nodeClasses = nodeClasses;
    this.initialize(this._buildClassNameCompletions.bind(this), ' ');
    this.disableDefaultSuggestionForEmptyInput();
    this._selectedFrameId = '';
    this._classNamesPromise = null;
  }

  async _getClassNames(selectedNode: SDK.DOMModel.DOMNode): Promise<string[]> {
    const promises = [];
    const completions = new Set<string>();
    this._selectedFrameId = selectedNode.frameId();

    const cssModel = selectedNode.domModel().cssModel();
    const allStyleSheets = cssModel.allStyleSheets();
    for (const stylesheet of allStyleSheets) {
      if (stylesheet.frameId !== this._selectedFrameId) {
        continue;
      }
      const cssPromise = cssModel.classNamesPromise(stylesheet.id).then((classes: string[]) => {
        for (const className of classes) {
          completions.add(className);
        }
      });
      promises.push(cssPromise);
    }

    const ownerDocumentId: number = ((selectedNode.ownerDocument as SDK.DOMModel.DOMDocument).id);

    const domPromise = selectedNode.domModel().classNamesPromise(ownerDocumentId).then((classes: string[]) => {
      for (const className of classes) {
        completions.add(className);
      }
    });
    promises.push(domPromise);
    await Promise.all(promises);
    return [...completions];
  }

  _buildClassNameCompletions(expression: string, prefix: string, force?: boolean|undefined):
      Promise<UI.SuggestBox.Suggestions> {
    if (!prefix || force) {
      this._classNamesPromise = null;
    }

    const selectedNode = UI.Context.Context.instance().flavor(SDK.DOMModel.DOMNode);
    if (!selectedNode || (!prefix && !force && !expression.trim())) {
      return Promise.resolve([]);
    }

    if (!this._classNamesPromise || this._selectedFrameId !== selectedNode.frameId()) {
      this._classNamesPromise = this._getClassNames(selectedNode);
    }

    return this._classNamesPromise.then((completions: string[]) => {
      const classesMap = this._nodeClasses((selectedNode as SDK.DOMModel.DOMNode));
      completions = completions.filter((value: string) => !classesMap.get(value));

      if (prefix[0] === '.') {
        completions = completions.map((value: string) => '.' + value);
      }
      return completions.filter((value: string) => value.startsWith(prefix)).sort().map((completion: string) => ({
                                                                                          text: completion,
                                                                                          title: undefined,
                                                                                          subtitle: undefined,
                                                                                          iconType: undefined,
                                                                                          priority: undefined,
                                                                                          isSecondary: undefined,
                                                                                          subtitleRenderer: undefined,
                                                                                          selectionRange: undefined,
                                                                                          hideGhostText: undefined,
                                                                                          iconElement: undefined,
                                                                                        }));
    });
  }
}
