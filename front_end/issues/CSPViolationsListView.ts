// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Components from '../components/components.js';
import * as SDK from '../sdk/sdk.js';  // eslint-disable-line no-unused-vars
import * as LitHtml from '../third_party/lit-html/lit-html.js';
import * as UIComponents from '../ui/components/components.js';  // eslint-disable-line rulesdir/es_modules_import
import * as UI from '../ui/ui.js';

export class CSPViolationsListView extends UI.Widget.VBox {
  private table = new UIComponents.DataGridController.DataGridController();
  private categoryFilter = new Set<string>();
  private issueRows =
      new Map<SDK.ContentSecurityPolicyIssue.ContentSecurityPolicyIssue, UIComponents.DataGridUtils.Row>();

  constructor() {
    super(true);
    this.registerRequiredCSS('issues/cspViolationsListView.css', {enableLegacyPatching: true});

    this.table.data = {
      columns: [
        {id: 'sourceCode', title: 'Source Code', sortable: false, widthWeighting: 1, visible: true, hideable: false},
        {
          id: 'violatedDirective',
          title: 'Violated Directive',
          sortable: false,
          widthWeighting: 1,
          visible: true,
          hideable: false,
        },
        {id: 'category', title: 'Category', sortable: false, widthWeighting: 1, visible: true, hideable: false},
        {id: 'status', title: 'Status', sortable: false, widthWeighting: 1, visible: true, hideable: false},
      ],
      rows: [],
      filterText: undefined,
    };
    this.contentElement.appendChild(this.table);
  }

  updateTextFilter(filter: string) {
    this.table.data = {...this.table.data, filterText: filter};
  }

  updateCategoryFilter(categories: Set<string>) {
    this.categoryFilter = categories;
    const rows = [];
    for (const [issue, row] of this.issueRows.entries()) {
      if (this.isIssueInFilterCategories(issue)) {
        rows.push(row);
      }
    }
    this.table.data = {...this.table.data, rows: rows};
  }

  private isIssueInFilterCategories(issue: SDK.ContentSecurityPolicyIssue.ContentSecurityPolicyIssue): boolean {
    return (this.categoryFilter.has(issue.code()) || this.categoryFilter.size === 0);
  }

  addIssue(issue: SDK.ContentSecurityPolicyIssue.ContentSecurityPolicyIssue) {
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
          columnId: 'sourceCode',
          value: sourceAnchor.innerText,
          renderer: () => LitHtml.html`${sourceAnchor}`,
        },
        {columnId: 'violatedDirective', value: issue.details().violatedDirective},
        {columnId: 'category', value: issue.code(), title: category, renderer: () => category},
        {columnId: 'status', value: status},
      ],
    };
    this.issueRows.set(issue, newIssue);

    if (this.isIssueInFilterCategories(issue)) {
      this.table.data.rows.push(newIssue);
      this.table.data = {...this.table.data};
    }
  }

  clearIssues() {
    this.issueRows.clear();
    this.table.data = {...this.table.data, rows: []};
  }

  private issueViolationCodeToCategoryName(code: string): string {
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
