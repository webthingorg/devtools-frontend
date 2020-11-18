// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as BrowserSDK from '../browser_sdk/browser_sdk.js';
import * as Common from '../common/common.js';  // eslint-disable-line no-unused-vars
import * as SDK from '../sdk/sdk.js';
import * as UI from '../ui/ui.js';

import {CSPViolationsListView} from './CSPViolationsListView.js';

export class CSPViolationsView extends UI.Widget.VBox {
  constructor() {
    super(true);
    this.registerRequiredCSS('issues/CSPViolationsView.css', {enableLegacyPatching: true});
    this.contentElement.classList.add('csp-violations-pane');
    this._listView = new CSPViolationsListView();

    const topToolbar = new UI.Toolbar.Toolbar('csp-violations-toolbar', this.contentElement);
    this._textFilterUI = new UI.Toolbar.ToolbarInput(ls`Filter`, '', 1, .2, '');
    this._textFilterUI.addEventListener(UI.Toolbar.ToolbarInput.Event.TextChanged, () => {
      this._listView._updateTextFilter(this._textFilterUI.value());
    });
    topToolbar.appendToolbarItem(this._textFilterUI);

    this._levelMenuButton = new ComboBoxOfCheckBoxes('Categories');
    this._levelMenuButton.setText('Categories');
    this._levelMenuButton.addOption(
        'Trusted Type Policy', SDK.ContentSecurityPolicyIssue.trustedTypesPolicyViolationCode, true);
    this._levelMenuButton.addOption(
        'Trusted Type Sink', SDK.ContentSecurityPolicyIssue.trustedTypesSinkViolationCode, true);
    this._levelMenuButton.addOption('CSP Inline', SDK.ContentSecurityPolicyIssue.inlineViolationCode, true);
    this._levelMenuButton.addOption('CSP Eval', SDK.ContentSecurityPolicyIssue.evalViolationCode, true);
    this._levelMenuButton.addOption('CSP URL', SDK.ContentSecurityPolicyIssue.urlViolationCode, true);
    this._levelMenuButton.addHeader('Reset', () => {
      this._levelMenuButton.getOptions().forEach((x, i) => this._levelMenuButton.setOptionEnabled(i, x.default));
    });
    this._levelMenuButton.setOnOptionClicked(() => {
      const categories = new Set(this._levelMenuButton.getOptions().filter(x => x.enabled).map(x => x.value));
      this._listView._updateCategoryFilter(categories);
    });
    topToolbar.appendToolbarItem(this._levelMenuButton);
    this._listView.show(this.contentElement);

    /** @type {!BrowserSDK.IssuesManager.IssuesManager} */
    this._issuesManager = BrowserSDK.IssuesManager.IssuesManager.instance();
    this._issuesManager.addEventListener(BrowserSDK.IssuesManager.Events.IssueAdded, this._onIssueAdded, this);

    for (const issue of this._issuesManager.issues()) {
      if (issue instanceof SDK.ContentSecurityPolicyIssue.ContentSecurityPolicyIssue) {
        this._listView._addIssue(issue);
      }
    }
  }

  /**
     * @param {!Common.EventTarget.EventTargetEvent} event
     */
  _onIssueAdded(event) {
    if (event.data instanceof SDK.ContentSecurityPolicyIssue.ContentSecurityPolicyIssue) {
      this._listView._addIssue(event.data);
    }
  }
}


class ComboBoxOfCheckBoxes extends UI.Toolbar.ToolbarButton {
  /**
   * @param {string} title
   */
  constructor(title) {
    super(title);
    this.turnIntoSelect();
    this.addEventListener(UI.Toolbar.ToolbarButton.Events.Click, this._showLevelContextMenu.bind(this));
    UI.ARIAUtils.markAsMenuButton(this.element);

    /** @type {!Array<!{title: string, value: string, default: boolean, enabled: boolean}>} */
    this.options = [];
    /** @type {!Array<!{title: string, callback: () => void}>} */
    this.headers = [];
    /** @type {() => void} */
    this.onOptionClicked = () => {};
  }

  /**
   *
   * @param {string} option
   * @param {string} value
   * @param {boolean} defaultEnabled
   */
  addOption(option, value, defaultEnabled) {
    this.options.push({'title': option, 'value': value, default: defaultEnabled, 'enabled': defaultEnabled});
  }

  /**
   *
   * @param {number} index
   * @param {boolean} enabled
   */
  setOptionEnabled(index, enabled) {
    const option = this.options[index];
    if (!option) {
      return;
    }
    option.enabled = enabled;
    this.onOptionClicked();
  }

  /**
   *
   * @param {string} headerName
   * @param {() => void} callback
   */
  addHeader(headerName, callback) {
    this.headers.push({title: headerName, callback: callback});
  }

  /**
   *
   * @param {() => void} onOptionClicked
   */
  setOnOptionClicked(onOptionClicked) {
    this.onOptionClicked = onOptionClicked;
  }

  /**
   * @return {!Array<{title: string, value:string, default:boolean, enabled: boolean}>}
   */
  getOptions() {
    return this.options;
  }

  /**
   * @param {!Common.EventTarget.EventTargetEvent} event
   */
  _showLevelContextMenu(event) {
    const mouseEvent = /** @type {!Event} */ (event.data);
    this._contextMenu = new UI.ContextMenu.ContextMenu(
        mouseEvent, true, this.element.totalOffsetLeft(),
        this.element.totalOffsetTop() +
            /** @type {!HTMLElement} */ (this.element).offsetHeight);

    for (const {title, callback} of this.headers) {
      this._contextMenu.headerSection().appendCheckboxItem(title, () => callback());
    }
    for (const [index, {title, enabled}] of this.options.entries()) {
      this._contextMenu.defaultSection().appendCheckboxItem(title, () => {
        this.setOptionEnabled(index, !enabled);
      }, enabled);
    }
    this._contextMenu.show();
  }
}
