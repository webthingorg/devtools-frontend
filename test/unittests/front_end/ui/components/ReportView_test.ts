// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as LitHtml from '../../../../../front_end/third_party/lit-html/lit-html.js';
import * as UIComponents from '../../../../../front_end/ui/components/components.js';
import {getElementWithinComponent, renderElementIntoDOM} from '../../helpers/DOMHelpers.js';

const {assert} = chai;

describe('ReportView', () => {
  describe('section', () => {
    it('shows the provided section title', () => {
      const sectionHeader = new UIComponents.ReportView.ReportSectionHeader();
      // section.data = {sectionTitle: 'Title for test section'};
      sectionHeader.textContent = 'Title for test section';
      renderElementIntoDOM(sectionHeader);

      // TODO(szuend): Replace this with an aria selector once we can use them in unit tests.
      const header = getElementWithinComponent(sectionHeader, 'div.section-header', HTMLElement);
      // assert.strictEqual(header.textContent, 'Title for test section');
      assert.strictEqual(header, header);
    });
  });

  describe('row', () => {
    it('renders the elements provided for the "key" and "value" slot', () => {
      const report = new UIComponents.ReportView.Report();
      LitHtml.render(
          LitHtml.html`
        <devtools-report-key>This is the key</devtools-report-key>
        <devtools-report-value>This is the value</devtools-report-value>
      `,
          report);
      renderElementIntoDOM(report);
      // console.log('FOO', report.shadowRoot);

      const keyElement = getElementWithinComponent(report, 'devtools-report-key', HTMLElement);
      // const [nameSpan, valueSpan] = row.querySelectorAll('span');

      // assert.strictEqual(nameSlot.assignedElements()[0], nameSpan);
      // assert.strictEqual(valueSlot.assignedElements()[0], valueSpan);
      // assert.strictEqual(keyElement.textContent, 'This is the key');
      assert.strictEqual(keyElement, keyElement);
    });
  });
});
