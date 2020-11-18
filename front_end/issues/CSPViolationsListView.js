// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Components from '../components/components.js';
import * as SDK from '../sdk/sdk.js';  // eslint-disable-line no-unused-vars
import * as LitHtml from '../third_party/lit-html/lit-html.js';
import * as UIComponents from '../ui/components/components.js';  // eslint-disable-line rulesdir/es_modules_import
import * as DataGridUtils from '../ui/components/DataGridUtils.js';  // eslint-disable-line no-unused-vars, rulesdir/es_modules_import
import * as UI from '../ui/ui.js';

export class CSPViolationsListView extends UI.Widget.VBox {
  constructor() {
    super(true);
    this.registerRequiredCSS('issues/CSPViolationsListView.css', {enableLegacyPatching: true});

    this.table = new UIComponents.DataGridController.DataGridController();
    this.table.data = {
      columns: [
        {id: 'f1', title: 'Source Code', sortable: false, widthWeighting: 1, hidden: false},
        {id: 'f2', title: 'Violated Directive', sortable: false, widthWeighting: 1, hidden: false},
        {id: 'f3', title: 'Category', sortable: false, widthWeighting: 1, hidden: false},
        {id: 'f4', title: 'Status', sortable: false, widthWeighting: 1, hidden: false}
      ],
      rows: [],
      filterText: undefined,
    };
    this.contentElement.appendChild(this.table);

    this.categoryFilter = new Set();
    /** @type {!Array<!DataGridUtils.Row>} */
    this.issues = [];
  }

  /**
     * @param {string} filter
     */
  _updateTextFilter(filter) {
    this.table.data = {...this.table.data, filterText: filter};
  }

  /**
     * @param {!Set<string>} categories
     */
  _updateCategoryFilter(categories) {
    this.categoryFilter = categories;
    this.table.data = {...this.table.data, rows: this.issues.filter(x => this._isIssueInFilterCategories(x))};
  }

  /**
   *
   * @param {DataGridUtils.Row} issue
   * @return {boolean}
   */
  _isIssueInFilterCategories(issue) {
    return this.categoryFilter.has(issue.cells[2].value) || this.categoryFilter.size === 0;
  }

  /**
     *
     * @param {!SDK.ContentSecurityPolicyIssue.ContentSecurityPolicyIssue} issue
     */
  _addIssue(issue) {
    const sourceCode = issue.details().sourceCodeLocation;
    if (!sourceCode) {
      return;
    }
    const maxLengthForDisplayedURLs = 40;  // Same as console messages.
    const linkifier = new Components.Linkifier.Linkifier(maxLengthForDisplayedURLs);
    const sourceAnchor = linkifier.linkifyScriptLocation(null, null, sourceCode.url, sourceCode.lineNumber);

    // This is a patch until Linkifier becomes a web component
    sourceAnchor.setAttribute('style', `
      color:rgb(17 85 204);
      text-decoration: underline;
      cursor: pointer;`);

    const status = issue.details().isReportOnly ? 'report-only' : 'blocked';
    const category = this.issueViolationCodeToCategoryName(issue.code());
    const newIssue = {
      cells: [
        {
          columnId: 'f1',
          value: sourceAnchor,
          title: sourceAnchor.innerText,
          renderer: (/** @type {unknown} */ value) => LitHtml.html`${value}`,
        },
        {columnId: 'f2', value: issue.details().violatedDirective, title: issue.details().violatedDirective},
        {columnId: 'f3', value: issue.code(), title: category, renderer: () => category},
        {columnId: 'f4', value: status, title: status}
      ]
    };
    this.issues.push(newIssue);
    if (this._isIssueInFilterCategories(newIssue)) {
      this.table.data.rows.push(newIssue);
      this.table.data = {...this.table.data};
    }
  }

  /**
 * @param {string} code
 * @return {string}
 */
  issueViolationCodeToCategoryName(code) {
    if (code === SDK.ContentSecurityPolicyIssue.inlineViolationCode) {
      return 'Inline Violation';
    }
    if (code === SDK.ContentSecurityPolicyIssue.urlViolationCode) {
      return 'URL Violation';
    }
    if (code === SDK.ContentSecurityPolicyIssue.evalViolationCode) {
      return 'Eval Violation';
    }
    if (code === SDK.ContentSecurityPolicyIssue.trustedTypesSinkViolationCode) {
      return 'Sink Violation';
    }
    if (code === SDK.ContentSecurityPolicyIssue.trustedTypesPolicyViolationCode) {
      return 'Policy Violation';
    }
    return 'unknown';
  }
}
