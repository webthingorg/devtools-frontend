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

    // Top Toolbar
    const topToolbar = new UI.Toolbar.Toolbar('csp-violations-toolbar', this.contentElement);
    this._textFilterUI = new UI.Toolbar.ToolbarInput(ls`Filter`, '', 1, .2, '');
    this._textFilterUI.addEventListener(UI.Toolbar.ToolbarInput.Event.TextChanged, () => {
      this._listView._updateFilter(this._textFilterUI.value());
    });
    topToolbar.appendToolbarItem(this._textFilterUI);

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
