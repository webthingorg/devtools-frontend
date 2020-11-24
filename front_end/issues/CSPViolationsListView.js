// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Components from '../components/components.js';
import * as SDK from '../sdk/sdk.js';  // eslint-disable-line no-unused-vars
import * as LitHtml from '../third_party/lit-html/lit-html.js';
import * as UIComponents from '../ui/components/components.js';  // eslint-disable-line rulesdir/es_modules_import
import * as UI from '../ui/ui.js';

export class CSPViolationsListView extends UI.Widget.VBox {
  constructor() {
    super(true);
    this.registerRequiredCSS('issues/cspViolationsListView.css', {enableLegacyPatching: true});

    this._table = new UIComponents.DataGridController.DataGridController();
    this._table.data = {
      columns: [
        {id: 'sourceCode', title: 'Source Code', sortable: false, widthWeighting: 1, visible: true, hideable: false}, {
          id: 'violatedDirective',
          title: 'Violated Directive',
          sortable: false,
          widthWeighting: 1,
          visible: true,
          hideable: false
        },
        {id: 'category', title: 'Category', sortable: false, widthWeighting: 1, visible: true, hideable: false},
        {id: 'status', title: 'Status', sortable: false, widthWeighting: 1, visible: true, hideable: false}
      ],
      rows: [],
      filterText: undefined,
    };
    this.contentElement.appendChild(this._table);

    this._categoryFilter = new Set();
    /** @type {!Array<!UIComponents.DataGridUtils.Row>} */
    this._issues = [];
  }

  /**
     * @param {string} filter
     */
  updateTextFilter(filter) {
    this._table.data = {...this._table.data, filterText: filter};
  }

  /**
     * @param {!Set<string>} categories
     */
  updateCategoryFilter(categories) {
    this._categoryFilter = categories;
    this._table.data = {...this._table.data, rows: this._issues.filter(x => this._isIssueInFilterCategories(x))};
  }

  /**
   *
   * @param {!UIComponents.DataGridUtils.Row} issue
   * @return {boolean}
   */
  _isIssueInFilterCategories(issue) {
    return this._categoryFilter.has(issue.cells[2].value) || this._categoryFilter.size === 0;
  }

  /**
     *
     * @param {!SDK.ContentSecurityPolicyIssue.ContentSecurityPolicyIssue} issue
     */
  addIssue(issue) {
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
    const category = this._issueViolationCodeToCategoryName(issue.code());
    const newIssue = {
      cells: [
        {
          columnId: 'sourceCode',
          value: sourceAnchor.innerText,
          renderer: () => LitHtml.html`${sourceAnchor}`,
        },
        {columnId: 'violatedDirective', value: issue.details().violatedDirective},
        {columnId: 'category', value: issue.code(), title: category, renderer: () => category},
        {columnId: 'status', value: status}
      ]
    };
    this._issues.push(newIssue);
    if (this._isIssueInFilterCategories(newIssue)) {
      this._table.data.rows.push(newIssue);
      this._table.data = {...this._table.data};
    }
  }

  clearIssues() {
    this._issues = [];
    this._table.data = {...this._table.data, rows: []};
  }

  /**
 * @param {string} code
 * @return {string}
 */
  _issueViolationCodeToCategoryName(code) {
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
