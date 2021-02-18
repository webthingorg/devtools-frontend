// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Coordinator from '../../../../front_end/render_coordinator/render_coordinator.js';
import * as Resources from '../../../../front_end/resources/resources.js';
import * as SDK from '../../../../front_end/sdk/sdk.js';
import * as LitHtml from '../../../../front_end/third_party/lit-html/lit-html.js';
import * as Components from '../../../../front_end/ui/components/components.js';
import {assertShadowRoot, getElementWithinComponent, renderElementIntoDOM} from '../helpers/DOMHelpers.js';
import {MutationType, withMutations} from '../helpers/MutationHelpers.js';

const coordinator = Coordinator.RenderCoordinator.RenderCoordinator.instance();

const {assert} = chai;

const makeFrame = (): SDK.ResourceTreeModel.ResourceTreeFrame => {
  const newFrame: SDK.ResourceTreeModel.ResourceTreeFrame = {
    url: 'https://www.example.com/path/page.html',
    securityOrigin: 'https://www.example.com',
    displayName: () => 'TestTitle',
    unreachableUrl: () => '',
    adFrameType: () => Protocol.Page.AdFrameType.None,
    resourceForURL: () => null,
    isSecureContext: () => true,
    isCrossOriginIsolated: () => true,
    getSecureContextType: () => Protocol.Page.SecureContextType.SecureLocalhost,
    getGatedAPIFeatures: () =>
        [Protocol.Page.GatedAPIFeatures.SharedArrayBuffers,
         Protocol.Page.GatedAPIFeatures.SharedArrayBuffersTransferAllowed],
    getOwnerDOMNodeOrDocument: () => ({
      nodeName: () => 'iframe',
    }),
    resourceTreeModel: () => ({
      target: () => ({
        model: () => ({
          getSecurityIsolationStatus: () => ({
            coep: {
              value: Protocol.Network.CrossOriginEmbedderPolicyValue.None,
              reportOnlyValue: Protocol.Network.CrossOriginEmbedderPolicyValue.None,
            },
            coop: {
              value: Protocol.Network.CrossOriginOpenerPolicyValue.SameOrigin,
              reportOnlyValue: Protocol.Network.CrossOriginOpenerPolicyValue.SameOrigin,
            },
          }),
        }),
      }),
    }),
  } as unknown as SDK.ResourceTreeModel.ResourceTreeFrame;
  return newFrame;
};

function extractTextFromReportView(shadowRoot: ShadowRoot, selector: string) {
  const elements = Array.from(shadowRoot.querySelectorAll(selector));
  return elements.map(element => {
    return element.textContent ? element.textContent.trim().replace(/[ \n]+/g, ' ') : '';
  });
}

describe('FrameDetailsView', () => {
  it('renders with a title', async () => {
    const frame = makeFrame();
    const component = new Resources.FrameDetailsView.FrameDetailsReportView();
    renderElementIntoDOM(component);
    component.data = {
      frame: frame,
    };

    assertShadowRoot(component.shadowRoot);
    const report = getElementWithinComponent(component, 'devtools-report', Components.ReportView.Report);
    assertShadowRoot(report.shadowRoot);

    const titleElement = report.shadowRoot.querySelector('.report-title');
    assert.strictEqual(titleElement?.textContent, frame.displayName());
  });

  it('renders report keys and values', async () => {
    const frame = makeFrame();
    const component = new Resources.FrameDetailsView.FrameDetailsReportView();
    renderElementIntoDOM(component);
    component.data = {
      frame: frame,
    };

    assertShadowRoot(component.shadowRoot);
    await coordinator.done();
    await coordinator.done();  // 2nd call awaits async render

    const keys = extractTextFromReportView(component.shadowRoot, 'devtools-report-key');
    assert.deepEqual(keys, [
      'URL',
      'Origin',
      'Owner Element',
      'Secure Context',
      'Cross-Origin Isolated',
      'Cross-Origin Embedder Policy',
      'Cross-Origin Opener Policy',
      'Shared Array Buffers',
      'Measure Memory',
    ]);

    const values = extractTextFromReportView(component.shadowRoot, 'devtools-report-value');
    assert.deepEqual(values, [
      'https://www.example.com/path/page.html',
      'https://www.example.com',
      '<iframe>',
      'Yes Localhost is always a secure context',
      'Yes',
      'None',
      'SameOrigin',
      'available, transferable',
      'available Learn more',
    ]);
  });
});

describe('ExpandableList', () => {
  it('renders expandable list', async () => {
    const list = new Resources.FrameDetailsView.ExpandableList();
    LitHtml.render(
        LitHtml.html`
      <div class="row">Row 1</div>
      <div class="row">Row 2</div>
    `,
        list);
    renderElementIntoDOM(list);
    assertShadowRoot(list.shadowRoot);

    // checks that slots contain content
    const rows = list.querySelectorAll('.row');
    const slot = getElementWithinComponent(list, 'slot', HTMLSlotElement);
    assert.strictEqual(rows[0], slot.assignedElements()[0]);
    assert.strictEqual(rows[1], slot.assignedElements()[1]);

    // checkst that list is not expanded initially
    const iconSpan = list.shadowRoot.querySelector<HTMLElement>('span.arrow-icon');
    assert.isNotNull(iconSpan);
    assert.isFalse(iconSpan?.classList.contains('expanded'));

    // checks that clicking button expands list by removing style tag
    const button = list.shadowRoot.querySelector<HTMLElement>('button.arrow-icon-button');
    await withMutations([{target: 'style', type: MutationType.REMOVE, max: 1}], list.shadowRoot, () => {
      button?.click();
    });

    // checks that list is expanded
    assert.isTrue(iconSpan?.classList.contains('expanded'));
  });
});
