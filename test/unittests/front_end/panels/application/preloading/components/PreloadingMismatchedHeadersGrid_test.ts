// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as Platform from '../../../../../../../front_end/core/platform/platform.js';
import {assertNotNullOrUndefined} from '../../../../../../../front_end/core/platform/platform.js';
import * as SDK from '../../../../../../../front_end/core/sdk/sdk.js';
import * as Protocol from '../../../../../../../front_end/generated/protocol.js';
import * as PreloadingComponents from '../../../../../../../front_end/panels/application/preloading/components/components.js';
import * as DataGrid from '../../../../../../../front_end/ui/components/data_grid/data_grid.js';
import * as Coordinator from '../../../../../../../front_end/ui/components/render_coordinator/render_coordinator.js';
import * as ReportView from '../../../../../../../front_end/ui/components/report_view/report_view.js';
import {
  assertShadowRoot,
  getElementsWithinComponent,
  getElementWithinComponent,
  renderElementIntoDOM,
} from '../../../../helpers/DOMHelpers.js';
import {describeWithEnvironment} from '../../../../helpers/EnvironmentHelpers.js';
import {
  getHeaderCells,
  getValuesOfAllBodyRows,
} from '../../../../ui/components/DataGridHelpers.js';

const coordinator = Coordinator.RenderCoordinator.RenderCoordinator.instance();

async function renderUsedPreloadingView(data: PreloadingComponents.UsedPreloadingView.UsedPreloadingViewData):
    Promise<HTMLElement> {
  const component = new PreloadingComponents.UsedPreloadingView.UsedPreloadingView();
  component.data = data;
  renderElementIntoDOM(component);
  assertShadowRoot(component.shadowRoot);
  await coordinator.done();

  return component;
}

function assertGridContents(gridComponent: HTMLElement, headerExpected: string[], rowsExpected: string[][]) {
  const controller = getElementWithinComponent(
      gridComponent, 'devtools-data-grid-controller', DataGrid.DataGridController.DataGridController);
  const grid = getElementWithinComponent(controller, 'devtools-data-grid', DataGrid.DataGrid.DataGrid);
  assertShadowRoot(grid.shadowRoot);

  const headerGot = Array.from(getHeaderCells(grid.shadowRoot), cell => {
    assertNotNullOrUndefined(cell.textContent);
    return cell.textContent.trim();
  });
  const rowsGot = getValuesOfAllBodyRows(grid.shadowRoot);

  assert.deepEqual([headerGot, rowsGot], [headerExpected, rowsExpected]);
}

describeWithEnvironment('PreloadingMismatchedHeadersGrid', async () => {
  it('one mismatched header without null', async () => {
    const data: PreloadingComponents.UsedPreloadingView.UsedPreloadingViewData = {
      pageURL: 'https://example.com/prerendered.html' as Platform.DevToolsPath.UrlString,
      attempts: [
        {
          action: Protocol.Preload.SpeculationAction.Prefetch,
          key: {
            loaderId: 'loaderId:1' as Protocol.Network.LoaderId,
            action: Protocol.Preload.SpeculationAction.Prefetch,
            url: 'https://example.com/prefetched.html' as Platform.DevToolsPath.UrlString,
          },
          status: SDK.PreloadingModel.PreloadingStatus.Ready,
          prefetchStatus: null,
          requestId: 'requestId:1' as Protocol.Network.RequestId,
          ruleSetIds: ['ruleSetId:1'] as Protocol.Preload.RuleSetId[],
          nodeIds: [1] as Protocol.DOM.BackendNodeId[],
        },
        {
          action: Protocol.Preload.SpeculationAction.Prerender,
          key: {
            loaderId: 'loaderId:1' as Protocol.Network.LoaderId,
            action: Protocol.Preload.SpeculationAction.Prerender,
            url: 'https://example.com/prerendered.html' as Platform.DevToolsPath.UrlString,
          },
          status: SDK.PreloadingModel.PreloadingStatus.Failure,
          prerenderStatus: Protocol.Preload.PrerenderFinalStatus.ActivationNavigationParameterMismatch,
          disallowedMojoInterface: null,
          mismatchedHeaders: [
            {
              headerName: 'sec-ch-ua-platform' as string,
              initialValue: 'Linux' as string,
              activationValue: 'Android' as string,
            },
          ] as Protocol.Preload.PrerenderMismatchedHeaders[],
          ruleSetIds: ['ruleSetId:1'] as Protocol.Preload.RuleSetId[],
          nodeIds: [1] as Protocol.DOM.BackendNodeId[],
        },
      ],
    };

    const component = await renderUsedPreloadingView(data);
    assertShadowRoot(component.shadowRoot);
    const headers = getElementsWithinComponent(
        component, 'devtools-report devtools-report-section-header', ReportView.ReportView.ReportSectionHeader);
    const sections = getElementsWithinComponent(
        component, 'devtools-report devtools-report-section', ReportView.ReportView.ReportSection);
    const grid = getElementWithinComponent(
        component, 'devtools-resources-preloading-mismatched-headers-grid',
        PreloadingComponents.PreloadingMismatchedHeadersGrid.PreloadingMismatchedHeadersGrid);

    assert.strictEqual(headers.length, 3);
    assert.strictEqual(sections.length, 4);

    assert.include(headers[0]?.textContent, 'Speculative loading status');
    assert.include(
        sections[0]?.textContent,
        'The initiating page attempted to prerender this page\'s URL, but the prerender failed, so a full navigation was performed instead.');

    assert.include(headers[1]?.textContent, 'Failure reason');
    assert.include(
        sections[1]?.textContent,
        'The prerender was not used because during activation time, different navigation parameters (e.g., HTTP headers) were calculated than during the original prerendering navigation request.');

    assert.include(headers[2]?.textContent, 'Mismatched HTTP request headers');
    assertGridContents(
        grid,
        ['Header name', 'Value in initial navigation', 'Value in activation navigation'],
        [
          ['sec-ch-ua-platform', 'Linux', 'Android'],
        ],
    );
  });

  it('one mismatched header with an initial value of null', async () => {
    const data: PreloadingComponents.UsedPreloadingView.UsedPreloadingViewData = {
      pageURL: 'https://example.com/prerendered.html' as Platform.DevToolsPath.UrlString,
      attempts: [
        {
          action: Protocol.Preload.SpeculationAction.Prefetch,
          key: {
            loaderId: 'loaderId:1' as Protocol.Network.LoaderId,
            action: Protocol.Preload.SpeculationAction.Prefetch,
            url: 'https://example.com/prefetched.html' as Platform.DevToolsPath.UrlString,
          },
          status: SDK.PreloadingModel.PreloadingStatus.Ready,
          prefetchStatus: null,
          requestId: 'requestId:1' as Protocol.Network.RequestId,
          ruleSetIds: ['ruleSetId:1'] as Protocol.Preload.RuleSetId[],
          nodeIds: [1] as Protocol.DOM.BackendNodeId[],
        },
        {
          action: Protocol.Preload.SpeculationAction.Prerender,
          key: {
            loaderId: 'loaderId:1' as Protocol.Network.LoaderId,
            action: Protocol.Preload.SpeculationAction.Prerender,
            url: 'https://example.com/prerendered.html' as Platform.DevToolsPath.UrlString,
          },
          status: SDK.PreloadingModel.PreloadingStatus.Failure,
          prerenderStatus: Protocol.Preload.PrerenderFinalStatus.ActivationNavigationParameterMismatch,
          disallowedMojoInterface: null,
          mismatchedHeaders: [
            {
              headerName: 'sec-ch-ua-platform' as string,
              initialValue: undefined,
              activationValue: 'Android' as string,
            },
          ] as Protocol.Preload.PrerenderMismatchedHeaders[],
          ruleSetIds: ['ruleSetId:1'] as Protocol.Preload.RuleSetId[],
          nodeIds: [1] as Protocol.DOM.BackendNodeId[],
        },
      ],
    };

    const component = await renderUsedPreloadingView(data);
    assertShadowRoot(component.shadowRoot);
    const headers = getElementsWithinComponent(
        component, 'devtools-report devtools-report-section-header', ReportView.ReportView.ReportSectionHeader);
    const sections = getElementsWithinComponent(
        component, 'devtools-report devtools-report-section', ReportView.ReportView.ReportSection);
    const grid = getElementWithinComponent(
        component, 'devtools-resources-preloading-mismatched-headers-grid',
        PreloadingComponents.PreloadingMismatchedHeadersGrid.PreloadingMismatchedHeadersGrid);

    assert.strictEqual(headers.length, 3);
    assert.strictEqual(sections.length, 4);

    assert.include(headers[0]?.textContent, 'Speculative loading status');
    assert.include(
        sections[0]?.textContent,
        'The initiating page attempted to prerender this page\'s URL, but the prerender failed, so a full navigation was performed instead.');

    assert.include(headers[1]?.textContent, 'Failure reason');
    assert.include(
        sections[1]?.textContent,
        'The prerender was not used because during activation time, different navigation parameters (e.g., HTTP headers) were calculated than during the original prerendering navigation request.');

    assert.include(headers[2]?.textContent, 'Mismatched HTTP request headers');
    assertGridContents(
        grid,
        ['Header name', 'Value in initial navigation', 'Value in activation navigation'],
        [
          ['sec-ch-ua-platform', '<missing>', 'Android'],
        ],
    );
  });

  it('one mismatched header with an activation value of null', async () => {
    const data: PreloadingComponents.UsedPreloadingView.UsedPreloadingViewData = {
      pageURL: 'https://example.com/prerendered.html' as Platform.DevToolsPath.UrlString,
      attempts: [
        {
          action: Protocol.Preload.SpeculationAction.Prefetch,
          key: {
            loaderId: 'loaderId:1' as Protocol.Network.LoaderId,
            action: Protocol.Preload.SpeculationAction.Prefetch,
            url: 'https://example.com/prefetched.html' as Platform.DevToolsPath.UrlString,
          },
          status: SDK.PreloadingModel.PreloadingStatus.Ready,
          prefetchStatus: null,
          requestId: 'requestId:1' as Protocol.Network.RequestId,
          ruleSetIds: ['ruleSetId:1'] as Protocol.Preload.RuleSetId[],
          nodeIds: [1] as Protocol.DOM.BackendNodeId[],
        },
        {
          action: Protocol.Preload.SpeculationAction.Prerender,
          key: {
            loaderId: 'loaderId:1' as Protocol.Network.LoaderId,
            action: Protocol.Preload.SpeculationAction.Prerender,
            url: 'https://example.com/prerendered.html' as Platform.DevToolsPath.UrlString,
          },
          status: SDK.PreloadingModel.PreloadingStatus.Failure,
          prerenderStatus: Protocol.Preload.PrerenderFinalStatus.ActivationNavigationParameterMismatch,
          disallowedMojoInterface: null,
          mismatchedHeaders: [
            {
              headerName: 'sec-ch-ua' as string,
              initialValue: '"Not_A Brand";v="8", "Chromium";v="120"' as string,
              activationValue: undefined,
            },
          ] as Protocol.Preload.PrerenderMismatchedHeaders[],
          ruleSetIds: ['ruleSetId:1'] as Protocol.Preload.RuleSetId[],
          nodeIds: [1] as Protocol.DOM.BackendNodeId[],
        },
      ],
    };

    const component = await renderUsedPreloadingView(data);
    assertShadowRoot(component.shadowRoot);
    const headers = getElementsWithinComponent(
        component, 'devtools-report devtools-report-section-header', ReportView.ReportView.ReportSectionHeader);
    const sections = getElementsWithinComponent(
        component, 'devtools-report devtools-report-section', ReportView.ReportView.ReportSection);
    const grid = getElementWithinComponent(
        component, 'devtools-resources-preloading-mismatched-headers-grid',
        PreloadingComponents.PreloadingMismatchedHeadersGrid.PreloadingMismatchedHeadersGrid);

    assert.strictEqual(headers.length, 3);
    assert.strictEqual(sections.length, 4);

    assert.include(headers[0]?.textContent, 'Speculative loading status');
    assert.include(
        sections[0]?.textContent,
        'The initiating page attempted to prerender this page\'s URL, but the prerender failed, so a full navigation was performed instead.');

    assert.include(headers[1]?.textContent, 'Failure reason');
    assert.include(
        sections[1]?.textContent,
        'The prerender was not used because during activation time, different navigation parameters (e.g., HTTP headers) were calculated than during the original prerendering navigation request.');

    assert.include(headers[2]?.textContent, 'Mismatched HTTP request headers');
    assertGridContents(
        grid,
        ['Header name', 'Value in initial navigation', 'Value in activation navigation'],
        [
          ['sec-ch-ua', '"Not_A Brand";v="8", "Chromium";v="120"', '<missing>'],
        ],
    );
  });

  it('multiple mismatched header with one of the value of null', async () => {
    const data: PreloadingComponents.UsedPreloadingView.UsedPreloadingViewData = {
      pageURL: 'https://example.com/prerendered.html' as Platform.DevToolsPath.UrlString,
      attempts: [
        {
          action: Protocol.Preload.SpeculationAction.Prefetch,
          key: {
            loaderId: 'loaderId:1' as Protocol.Network.LoaderId,
            action: Protocol.Preload.SpeculationAction.Prefetch,
            url: 'https://example.com/prefetched.html' as Platform.DevToolsPath.UrlString,
          },
          status: SDK.PreloadingModel.PreloadingStatus.Ready,
          prefetchStatus: null,
          requestId: 'requestId:1' as Protocol.Network.RequestId,
          ruleSetIds: ['ruleSetId:1'] as Protocol.Preload.RuleSetId[],
          nodeIds: [1] as Protocol.DOM.BackendNodeId[],
        },
        {
          action: Protocol.Preload.SpeculationAction.Prerender,
          key: {
            loaderId: 'loaderId:1' as Protocol.Network.LoaderId,
            action: Protocol.Preload.SpeculationAction.Prerender,
            url: 'https://example.com/prerendered.html' as Platform.DevToolsPath.UrlString,
          },
          status: SDK.PreloadingModel.PreloadingStatus.Failure,
          prerenderStatus: Protocol.Preload.PrerenderFinalStatus.ActivationNavigationParameterMismatch,
          disallowedMojoInterface: null,
          mismatchedHeaders: [
            {
              headerName: 'sec-ch-ua' as string,
              initialValue: '"Not_A Brand";v="8", "Chromium";v="120"' as string,
              activationValue: undefined,
            },
            {
              headerName: 'sec-ch-ua-mobile' as string,
              initialValue: '?0' as string,
              activationValue: '?1' as string,
            },
          ] as Protocol.Preload.PrerenderMismatchedHeaders[],
          ruleSetIds: ['ruleSetId:1'] as Protocol.Preload.RuleSetId[],
          nodeIds: [1] as Protocol.DOM.BackendNodeId[],
        },
      ],
    };

    const component = await renderUsedPreloadingView(data);
    assertShadowRoot(component.shadowRoot);
    const headers = getElementsWithinComponent(
        component, 'devtools-report devtools-report-section-header', ReportView.ReportView.ReportSectionHeader);
    const sections = getElementsWithinComponent(
        component, 'devtools-report devtools-report-section', ReportView.ReportView.ReportSection);
    const grid = getElementWithinComponent(
        component, 'devtools-resources-preloading-mismatched-headers-grid',
        PreloadingComponents.PreloadingMismatchedHeadersGrid.PreloadingMismatchedHeadersGrid);

    assert.strictEqual(headers.length, 3);
    assert.strictEqual(sections.length, 4);

    assert.include(headers[0]?.textContent, 'Speculative loading status');
    assert.include(
        sections[0]?.textContent,
        'The initiating page attempted to prerender this page\'s URL, but the prerender failed, so a full navigation was performed instead.');

    assert.include(headers[1]?.textContent, 'Failure reason');
    assert.include(
        sections[1]?.textContent,
        'The prerender was not used because during activation time, different navigation parameters (e.g., HTTP headers) were calculated than during the original prerendering navigation request.');

    assert.include(headers[2]?.textContent, 'Mismatched HTTP request headers');
    assertGridContents(
        grid,
        ['Header name', 'Value in initial navigation', 'Value in activation navigation'],
        [
          ['sec-ch-ua', '"Not_A Brand";v="8", "Chromium";v="120"', '<missing>'],
          ['sec-ch-ua-mobile', '?0', '?1'],
        ],
    );
  });

  it('multiple mismatched header with one of each value of null', async () => {
    const data: PreloadingComponents.UsedPreloadingView.UsedPreloadingViewData = {
      pageURL: 'https://example.com/prerendered.html' as Platform.DevToolsPath.UrlString,
      attempts: [
        {
          action: Protocol.Preload.SpeculationAction.Prefetch,
          key: {
            loaderId: 'loaderId:1' as Protocol.Network.LoaderId,
            action: Protocol.Preload.SpeculationAction.Prefetch,
            url: 'https://example.com/prefetched.html' as Platform.DevToolsPath.UrlString,
          },
          status: SDK.PreloadingModel.PreloadingStatus.Ready,
          prefetchStatus: null,
          requestId: 'requestId:1' as Protocol.Network.RequestId,
          ruleSetIds: ['ruleSetId:1'] as Protocol.Preload.RuleSetId[],
          nodeIds: [1] as Protocol.DOM.BackendNodeId[],
        },
        {
          action: Protocol.Preload.SpeculationAction.Prerender,
          key: {
            loaderId: 'loaderId:1' as Protocol.Network.LoaderId,
            action: Protocol.Preload.SpeculationAction.Prerender,
            url: 'https://example.com/prerendered.html' as Platform.DevToolsPath.UrlString,
          },
          status: SDK.PreloadingModel.PreloadingStatus.Failure,
          prerenderStatus: Protocol.Preload.PrerenderFinalStatus.ActivationNavigationParameterMismatch,
          disallowedMojoInterface: null,
          mismatchedHeaders: [
            {
              headerName: 'sec-ch-ua' as string,
              initialValue: '"Not_A Brand";v="8", "Chromium";v="120"' as string,
              activationValue: undefined,
            },
            {
              headerName: 'sec-ch-ua-mobile' as string,
              initialValue: undefined,
              activationValue: '?1' as string,
            },
            {
              headerName: 'sec-ch-ua-platform' as string,
              initialValue: 'Linux' as string,
              activationValue: undefined,
            },
          ] as Protocol.Preload.PrerenderMismatchedHeaders[],
          ruleSetIds: ['ruleSetId:1'] as Protocol.Preload.RuleSetId[],
          nodeIds: [1] as Protocol.DOM.BackendNodeId[],
        },
      ],
    };

    const component = await renderUsedPreloadingView(data);
    assertShadowRoot(component.shadowRoot);
    const headers = getElementsWithinComponent(
        component, 'devtools-report devtools-report-section-header', ReportView.ReportView.ReportSectionHeader);
    const sections = getElementsWithinComponent(
        component, 'devtools-report devtools-report-section', ReportView.ReportView.ReportSection);
    const grid = getElementWithinComponent(
        component, 'devtools-resources-preloading-mismatched-headers-grid',
        PreloadingComponents.PreloadingMismatchedHeadersGrid.PreloadingMismatchedHeadersGrid);

    assert.strictEqual(headers.length, 3);
    assert.strictEqual(sections.length, 4);

    assert.include(headers[0]?.textContent, 'Speculative loading status');
    assert.include(
        sections[0]?.textContent,
        'The initiating page attempted to prerender this page\'s URL, but the prerender failed, so a full navigation was performed instead.');

    assert.include(headers[1]?.textContent, 'Failure reason');
    assert.include(
        sections[1]?.textContent,
        'The prerender was not used because during activation time, different navigation parameters (e.g., HTTP headers) were calculated than during the original prerendering navigation request.');

    assert.include(headers[2]?.textContent, 'Mismatched HTTP request headers');
    assertGridContents(
        grid,
        ['Header name', 'Value in initial navigation', 'Value in activation navigation'],
        [
          ['sec-ch-ua', '"Not_A Brand";v="8", "Chromium";v="120"', '<missing>'],
          ['sec-ch-ua-mobile', '<missing>', '?1'],
          ['sec-ch-ua-platform', 'Linux', '<missing>'],
        ],
    );
  });
});
