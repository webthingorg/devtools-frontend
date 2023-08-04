// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Protocol from '../../../../../../../front_end/generated/protocol.js';
import * as PreloadingComponents from '../../../../../../../front_end/panels/application/preloading/components/components.js';
import * as Coordinator from '../../../../../../../front_end/ui/components/render_coordinator/render_coordinator.js';
import {
  assertShadowRoot,
  renderElementIntoDOM,
} from '../../../../helpers/DOMHelpers.js';
import {describeWithEnvironment} from '../../../../helpers/EnvironmentHelpers.js';

const {assert} = chai;

const coordinator = Coordinator.RenderCoordinator.RenderCoordinator.instance();

async function renderRuleSetDetailsReportView(
    data: PreloadingComponents.RuleSetDetailsReportView.RuleSetDetailsReportViewData,
    prerenderedUrl: String|null): Promise<HTMLElement> {
  const component = new PreloadingComponents.RuleSetDetailsReportView.RuleSetDetailsReportView();
  component.data = data;
  component.prerenderedUrl = prerenderedUrl;
  renderElementIntoDOM(component);
  assertShadowRoot(component.shadowRoot);
  await coordinator.done();

  return component;
}

describeWithEnvironment('RuleSetDetailsReportView', async () => {
  it('renders nothing if not selected', async () => {
    const data = null;
    const prerenderedUrl = null;

    const component = await renderRuleSetDetailsReportView(data, prerenderedUrl);
    assertShadowRoot(component.shadowRoot);

    assert.strictEqual(component.shadowRoot.textContent, '');
  });

  it('renders rule set', async () => {
    const data: Protocol.Preload.RuleSet = {
      id: 'ruleSetId:1' as Protocol.Preload.RuleSetId,
      loaderId: 'loaderId:1' as Protocol.Network.LoaderId,
      sourceText: `
{
  "prefetch": [
    {
      "source": "list",
      "urls": ["/subresource.js"]
    }
  ]
}
`,
      backendNodeId: 1 as Protocol.DOM.BackendNodeId,
    };
    const prerenderedUrl = '/subresource.js';

    const component = await renderRuleSetDetailsReportView(data, prerenderedUrl);
    assert.deepEqual(component.shadowRoot?.getElementById('prerendered-url')?.textContent, '/subresource.js');
    assert.deepEqual(component.shadowRoot?.getElementById('error-message')?.textContent, '');
  });

  it('renders rule set from Speculation-Rules HTTP header', async () => {
    const data: Protocol.Preload.RuleSet = {
      id: 'ruleSetId:1' as Protocol.Preload.RuleSetId,
      loaderId: 'loaderId:1' as Protocol.Network.LoaderId,
      sourceText: `
{
  "prefetch": [
    {
      "source": "list",
      "urls": ["/subresource.js"]
    }
  ]
}
`,
      url: 'https://example.com/speculationrules.json',
      requestId: 'reqeustId' as Protocol.Network.RequestId,
    };
    const prerenderedUrl = 'https://example.com/speculationrules.json';

    const component = await renderRuleSetDetailsReportView(data, prerenderedUrl);
    assert.deepEqual(
        component.shadowRoot?.getElementById('prerendered-url')?.textContent,
        'https://example.com/speculationrules.json');
    assert.deepEqual(component.shadowRoot?.getElementById('error-message')?.textContent, '');
  });

  it('renders invalid rule set', async () => {
    const data: Protocol.Preload.RuleSet = {
      id: 'ruleSetId:1' as Protocol.Preload.RuleSetId,
      loaderId: 'loaderId:1' as Protocol.Network.LoaderId,
      sourceText: `
{
  "prefetch": [
    {
      "source": "list",
`,
      backendNodeId: 1 as Protocol.DOM.BackendNodeId,
      errorType: Protocol.Preload.RuleSetErrorType.SourceIsNotJsonObject,
      errorMessage: 'Line: 6, column: 1, Syntax error.',
    };
    const prerenderedUrl = null;

    const component = await renderRuleSetDetailsReportView(data, prerenderedUrl);
    assert.deepEqual(component.shadowRoot?.getElementById('prerendered-url')?.textContent, '');
    assert.deepEqual(
        component.shadowRoot?.getElementById('error-message')?.textContent, 'Line: 6, column: 1, Syntax error.');
  });

  it('renders invalid rule set', async () => {
    const data: Protocol.Preload.RuleSet = {
      id: 'ruleSetId:1' as Protocol.Preload.RuleSetId,
      loaderId: 'loaderId:1' as Protocol.Network.LoaderId,
      sourceText: `
{
  "prefetch": [
    {
      "source": "list"
    }
  ]
}
`,
      backendNodeId: 1 as Protocol.DOM.BackendNodeId,
      errorType: Protocol.Preload.RuleSetErrorType.InvalidRulesSkipped,
      errorMessage: 'A list rule must have a "urls" array.',
    };
    const prerenderedUrl = null;

    const component = await renderRuleSetDetailsReportView(data, prerenderedUrl);
    assert.deepEqual(component.shadowRoot?.getElementById('prerendered-url')?.textContent, '');
    assert.deepEqual(
        component.shadowRoot?.getElementById('error-message')?.textContent, 'A list rule must have a "urls" array.');
  });
});
