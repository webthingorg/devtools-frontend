// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as ApplicationComponents from '../../../../../../front_end/panels/application/components/components.js';
import * as DataGrid from '../../../../../../front_end/ui/components/data_grid/data_grid.js';
import * as Coordinator from '../../../../../../front_end/ui/components/render_coordinator/render_coordinator.js';
import {
  assertShadowRoot,
  getElementWithinComponent,
  renderElementIntoDOM,
} from '../../../helpers/DOMHelpers.js';
import {describeWithLocale} from '../../../helpers/EnvironmentHelpers.js';
import {getValuesOfAllBodyRows} from '../../../ui/components/DataGridHelpers.js';

const coordinator = Coordinator.RenderCoordinator.RenderCoordinator.instance();

const {assert} = chai;

async function renderBounceTrackingMitigationsView(trackingSites: string[], seenButtonClick: boolean):
    Promise<ApplicationComponents.BounceTrackingMitigationsView.BounceTrackingMitigationsView> {
  const component = new ApplicationComponents.BounceTrackingMitigationsView.BounceTrackingMitigationsView();
  renderElementIntoDOM(component);
  component.data = {trackingSites, seenButtonClick};

  // The data-grid's renderer is scheduled, so we need to wait until the coordinator
  // is done before we can test against it.
  await coordinator.done();

  return component;
}

function getInternalDataGridShadowRoot(
    component: ApplicationComponents.BounceTrackingMitigationsView.BounceTrackingMitigationsView): ShadowRoot {
  const dataGridController = getElementWithinComponent(
      component, 'devtools-data-grid-controller', DataGrid.DataGridController.DataGridController);
  const dataGrid = getElementWithinComponent(dataGridController, 'devtools-data-grid', DataGrid.DataGrid.DataGrid);
  assertShadowRoot(dataGrid.shadowRoot);
  return dataGrid.shadowRoot;
}

describeWithLocale('BounceTrackingMitigationsView', () => {
  it('renders deleted sites in a table', async () => {
    const component = await renderBounceTrackingMitigationsView(
        [
          'tracker-1.example',
          'tracker-2.example',
        ],
        true);

    const dataGridShadowRoot = getInternalDataGridShadowRoot(component);
    const rowValues = getValuesOfAllBodyRows(dataGridShadowRoot);
    assert.deepEqual(rowValues, [
      ['tracker-1.example'],
      ['tracker-2.example'],
    ]);
  });

  it('hides deleted sites table and shows explanation message when there are no deleted tracking sites', async () => {
    const component = await renderBounceTrackingMitigationsView([], true);
    assertShadowRoot(component.shadowRoot);

    const nullGridElement = component.shadowRoot.querySelector('devtools-data-grid-controller');
    assert.isNull(nullGridElement);

    const sections = component.shadowRoot.querySelectorAll('devtools-report-section');
    const sectionsText = Array.from(sections).map(section => section.textContent?.trim());
    const expected = [
      'Force run',
      'No potential bounce tracking sites were identified for state clearing. Either there are none or bounce tracking mitigations are not enabled.',
      'Learn more: Bounce Tracking Mitigations',
    ];

    assert.deepStrictEqual(sectionsText, expected);
  });

  it('shows no message or table if the force run button has not been clicked', async () => {
    const component = await renderBounceTrackingMitigationsView([], false);
    assertShadowRoot(component.shadowRoot);

    const nullGridElement = component.shadowRoot.querySelector('devtools-data-grid-controller');
    assert.isNull(nullGridElement);

    const sections = component.shadowRoot.querySelectorAll('devtools-report-section');
    const sectionsText = Array.from(sections).map(section => section.textContent?.trim());
    const expected = [
      'Force run',
      'Learn more: Bounce Tracking Mitigations',
    ];

    assert.deepStrictEqual(sectionsText, expected);
  });
});
