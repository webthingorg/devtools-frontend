// Copyright (c) 2015 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as SDK from '../sdk/sdk.js';
import * as UI from '../ui/ui.js';

/**
 * @abstract
 */
export class CategorizedBreakpointsSidebarPane extends UI.Widget.VBox {
  /**
   * @param {string[]} categories
   * @param {!Array<!SDK.DOMDebuggerModel.CategorizedBreakpoint>} breakpoints
   * @param {string} viewId
   * @param {!SDK.DebuggerModel.BreakReason} detailsPausedReason
   */
  constructor(categories, breakpoints, viewId, detailsPausedReason) {
    super(true);
    this._categoriesTreeOutline = new UI.TreeOutline.TreeOutlineInShadow();
    this._categoriesTreeOutline.registerRequiredCSS(
        'browser_debugger/categorizedBreakpointsSidebarPane.css', {enableLegacyPatching: true});
    this._categoriesTreeOutline.setShowSelectionOnKeyboardFocus(/* show */ true);
    this.contentElement.appendChild(this._categoriesTreeOutline.element);
    this._viewId = viewId;
    this._detailsPausedReason = detailsPausedReason;

    /** @type {!Map<string, !Item>} */
    this._categories = new Map();
    for (const category of categories) {
      if (!this._categories.has(category)) {
        this._createCategory(category);
      }
    }
    if (categories.length > 0) {
      const firstCategory = this._categories.get(categories[0]);
      if (firstCategory) {
        firstCategory.element.select();
      }
    }

    /** @type {!Map<!SDK.DOMDebuggerModel.CategorizedBreakpoint, !Item>} */
    this._breakpoints = new Map();
    for (const breakpoint of breakpoints) {
      this._createBreakpoint(breakpoint);
    }

    SDK.SDKModel.TargetManager.instance().addModelListener(
        SDK.DebuggerModel.DebuggerModel, SDK.DebuggerModel.Events.DebuggerPaused, this._update, this);
    SDK.SDKModel.TargetManager.instance().addModelListener(
        SDK.DebuggerModel.DebuggerModel, SDK.DebuggerModel.Events.DebuggerResumed, this._update, this);
    UI.Context.Context.instance().addFlavorChangeListener(SDK.SDKModel.Target, this._update, this);
  }

  /**
   * @override
   */
  focus() {
    this._categoriesTreeOutline.forceSelect();
  }

  /**
   * @param {string} name
   */
  _createCategory(name) {
    const labelNode = UI.UIUtils.CheckboxLabel.create(name);
    labelNode.checkboxElement.addEventListener('click', this._categoryCheckboxClicked.bind(this, name), true);
    labelNode.checkboxElement.tabIndex = -1;

    const treeElement = new UI.TreeOutline.TreeElement(labelNode);
    treeElement.listItemElement.addEventListener('keydown', event => {
      if (event.key === ' ') {
        const category = this._categories.get(name);
        if (category) {
          category.checkbox.click();
        }
        event.consume(true);
      }
    });
    labelNode.checkboxElement.addEventListener('focus', () => treeElement.listItemElement.focus());
    UI.ARIAUtils.setChecked(treeElement.listItemElement, false);
    this._categoriesTreeOutline.appendChild(treeElement);

    this._categories.set(name, {element: treeElement, checkbox: labelNode.checkboxElement});
  }

  /**
   * @param {!SDK.DOMDebuggerModel.CategorizedBreakpoint} breakpoint
   */
  _createBreakpoint(breakpoint) {
    const labelNode = UI.UIUtils.CheckboxLabel.create(breakpoint.title());
    labelNode.classList.add('source-code');
    labelNode.checkboxElement.addEventListener('click', this._breakpointCheckboxClicked.bind(this, breakpoint), true);
    labelNode.checkboxElement.tabIndex = -1;

    const treeElement = new UI.TreeOutline.TreeElement(labelNode);
    treeElement.listItemElement.addEventListener('keydown', event => {
      if (event.key === ' ') {
        const breakpointToClick = this._breakpoints.get(breakpoint);
        if (breakpointToClick) {
          breakpointToClick.checkbox.click();
        }
        event.consume(true);
      }
    });
    labelNode.checkboxElement.addEventListener('focus', () => treeElement.listItemElement.focus());
    UI.ARIAUtils.setChecked(treeElement.listItemElement, false);
    treeElement.listItemElement.createChild('div', 'breakpoint-hit-marker');
    const category = this._categories.get(breakpoint.category());
    if (category) {
      category.element.appendChild(treeElement);
    }
    // Better to return that to produce a side-effect
    this._breakpoints.set(breakpoint, {element: treeElement, checkbox: labelNode.checkboxElement});
  }

  /**
   * @param {!SDK.DebuggerModel.DebuggerPausedDetails} details
   * @returns {?SDK.DOMDebuggerModel.CategorizedBreakpoint}
   */
  _getBreakpointFromPausedDetails(details) {
    return null;
  }

  _update() {
    const target = UI.Context.Context.instance().flavor(SDK.SDKModel.Target);
    const debuggerModel = target ? target.model(SDK.DebuggerModel.DebuggerModel) : null;
    const details = debuggerModel ? debuggerModel.debuggerPausedDetails() : null;

    if (!details || details.reason !== this._detailsPausedReason || !details.auxData) {
      if (this._highlightedElement) {
        UI.ARIAUtils.setDescription(this._highlightedElement, '');
        this._highlightedElement.classList.remove('breakpoint-hit');
        delete this._highlightedElement;
      }
      return;
    }
    const breakpoint = this._getBreakpointFromPausedDetails(details);
    if (!breakpoint) {
      return;
    }

    UI.ViewManager.ViewManager.instance().showView(this._viewId);
    const category = this._categories.get(breakpoint.category());
    if (category) {
      category.element.expand();
    }
    const matchingBreakpoint = this._breakpoints.get(breakpoint);
    if (matchingBreakpoint) {
      this._highlightedElement = matchingBreakpoint.element.listItemElement;
      UI.ARIAUtils.setDescription(this._highlightedElement, ls`breakpoint hit`);
      this._highlightedElement.classList.add('breakpoint-hit');
    }
  }

  // Probably can be kept although eventListener does not call this._breakpointCheckboxClicke
  /**
   * @param {string} category
   */
  _categoryCheckboxClicked(category) {
    const item = this._categories.get(category);
    if (!item) {
      return;
    }

    const enabled = item.checkbox.checked;
    UI.ARIAUtils.setChecked(item.element.listItemElement, enabled);

    for (const breakpoint of this._breakpoints.keys()) {
      if (breakpoint.category() === category) {
        const matchingBreakpoint = this._breakpoints.get(breakpoint);
        if (matchingBreakpoint) {
          matchingBreakpoint.checkbox.checked = enabled;
          this._toggleBreakpoint(breakpoint, enabled);
        }
      }
    }
  }

  /**
   * @param {!SDK.DOMDebuggerModel.CategorizedBreakpoint} breakpoint
   * @param {boolean} enabled
   */
  _toggleBreakpoint(breakpoint, enabled) {
    breakpoint.setEnabled(enabled);
  }

  /**
   * @param {!SDK.DOMDebuggerModel.CategorizedBreakpoint} breakpoint
   */
  _breakpointCheckboxClicked(breakpoint) {
    const item = this._breakpoints.get(breakpoint);
    if (!item) {
      return;
    }

    this._toggleBreakpoint(breakpoint, item.checkbox.checked);
    UI.ARIAUtils.setChecked(item.element.listItemElement, item.checkbox.checked);

    // Put the rest in a separate function
    let hasEnabled = false;
    let hasDisabled = false;
    for (const other of this._breakpoints.keys()) {
      if (other.category() === breakpoint.category()) {
        if (other.enabled()) {
          hasEnabled = true;
        } else {
          hasDisabled = true;
        }
      }
    }

    const category = this._categories.get(breakpoint.category());
    if (!category) {
      return;
    }
    category.checkbox.checked = hasEnabled;
    category.checkbox.indeterminate = hasEnabled && hasDisabled;
    if (category.checkbox.indeterminate) {
      UI.ARIAUtils.setCheckboxAsIndeterminate(category.element.listItemElement);
    } else {
      UI.ARIAUtils.setChecked(category.element.listItemElement, hasEnabled);
    }
  }
}

/** @typedef {!{element: !UI.TreeOutline.TreeElement, checkbox: !HTMLInputElement}} */
// @ts-ignore typedef
export let Item;
