// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Components from '../components/components.js';
import * as SDK from '../sdk/sdk.js';  // eslint-disable-line no-unused-vars
import * as LitHtml from '../third_party/lit-html/lit-html.js';
import * as UIComponents from '../ui/components/components.js';  // eslint-disable-line rulesdir/es_modules_import
import * as DataGridRenderers from '../ui/components/DataGridRenderers.js';  // eslint-disable-line rulesdir/es_modules_import
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
        {id: 'f3', title: 'Category', sortable: false, widthWeighting: 1, hidden: false}
      ],
      rows: [],
      filterText: undefined,
    };
    this.contentElement.appendChild(this.table);
  }

  /**
     * @param {string} filter
     */
  _updateFilter(filter) {
    this.table.data = {...this.table.data, filterText: filter};
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

    // This is a path until Linkifier becomes a web component
    sourceAnchor.setAttribute('style', `
      color:rgb(17 85 204);
      text-decoration: underline;
      cursor: pointer;`);

    const category = issue.code().split('::')[1];
    this.table.data.rows.push({
      cells: [
        {
          columnId: 'f1',
          value: sourceAnchor,
          title: sourceAnchor.innerText,
          renderer: value => {
            if (value instanceof HTMLElement) {
              return LitHtml.html`${value}`;
            }
            return DataGridRenderers.stringRenderer('');
          },
        },
        {columnId: 'f2', value: issue.details().violatedDirective, title: issue.details().violatedDirective},
        {columnId: 'f3', value: category, title: category}
      ]
    });

    this.table.data = {...this.table.data};
  }
}
