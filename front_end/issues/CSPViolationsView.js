// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as BrowserSDK from '../browser_sdk/browser_sdk.js';
import * as Common from '../common/common.js';  // eslint-disable-line no-unused-vars
import * as SDK from '../sdk/sdk.js';
import * as UI from '../ui/ui.js';
import {ComboBoxOfCheckBoxes} from './ComboBoxOfCheckBoxes.js';

import {CSPViolationsListView} from './CSPViolationsListView.js';

export class CSPViolationsView extends UI.Widget.VBox {
  constructor() {
    super(true);
    this.registerRequiredCSS('issues/cspViolationsView.css', {enableLegacyPatching: true});
    this.contentElement.classList.add('csp-violations-pane');
    this._listView = new CSPViolationsListView();

    const topToolbar = new UI.Toolbar.Toolbar('csp-violations-toolbar', this.contentElement);
    this._textFilterUI = new UI.Toolbar.ToolbarInput(ls`Filter`, '', 1, .2, '');
    this._textFilterUI.addEventListener(UI.Toolbar.ToolbarInput.Event.TextChanged, () => {
      this._listView.updateTextFilter(this._textFilterUI.value());
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
      this._listView.updateCategoryFilter(categories);
    });
    topToolbar.appendToolbarItem(this._levelMenuButton);
    this._listView.show(this.contentElement);

    /** @type {!BrowserSDK.IssuesManager.IssuesManager} */
    this._issuesManager = BrowserSDK.IssuesManager.IssuesManager.instance();
    this._issuesManager.addEventListener(BrowserSDK.IssuesManager.Events.IssueAdded, this._onIssueAdded, this);
    this._issuesManager.addEventListener(
        BrowserSDK.IssuesManager.Events.FullUpdateRequired, this._onFullUpdateRequired, this);

    this._addAllIssues();
  }

  /**
     * @param {!Common.EventTarget.EventTargetEvent} event
     */
  _onIssueAdded(event) {
    const {issue} =
        /** @type {!{issuesModel: !SDK.IssuesModel.IssuesModel, issue: !SDK.Issue.Issue}} */ (event.data);
    if (issue instanceof SDK.ContentSecurityPolicyIssue.ContentSecurityPolicyIssue) {
      this._listView.addIssue(issue);
    }
  }

  _onFullUpdateRequired() {
    this._listView.clearIssues();
    this._addAllIssues();
  }

  _addAllIssues() {
    for (const issue of this._issuesManager.issues()) {
      if (issue instanceof SDK.ContentSecurityPolicyIssue.ContentSecurityPolicyIssue) {
        this._listView.addIssue(issue);
      }
    }
  }
}
