// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assertNotNullOrUndefined} from '../../../../../../front_end/core/platform/platform.js';
import * as SDK from '../../../../../../front_end/core/sdk/sdk.js';
import * as Protocol from '../../../../../../front_end/generated/protocol.js';
import * as Resources from '../../../../../../front_end/panels/application/application.js';
import * as DataGrid from '../../../../../../front_end/ui/components/data_grid/data_grid.js';
import * as Coordinator from '../../../../../../front_end/ui/components/render_coordinator/render_coordinator.js';
import * as UI from '../../../../../../front_end/ui/legacy/legacy.js';
import {
  assertShadowRoot,
  getElementWithinComponent,
} from '../../../helpers/DOMHelpers.js';
import {createTarget} from '../../../helpers/EnvironmentHelpers.js';
import {
  describeWithMockConnection,
  dispatchEvent,
} from '../../../helpers/MockConnection.js';
import {getHeaderCells, getValuesOfAllBodyRows} from '../../../ui/components/DataGridHelpers.js';

const {assert} = chai;

const coordinator = Coordinator.RenderCoordinator.RenderCoordinator.instance();

const getHeaderText = (cell: HTMLTableCellElement): string|null => {
  return cell.textContent?.trim() ||
      cell.querySelector('devtools-resources-reports-grid-status-header')?.shadowRoot?.textContent?.trim() || null;
};

describeWithMockConnection('PreloadingView', async () => {
  it('renders grid and details', async () => {
    const target = createTarget({id: 'targetId' as Protocol.Target.TargetID});
    const model = target.model(SDK.PrerenderingModel.PrerenderingModel);
    assertNotNullOrUndefined(model);
    const view = new Resources.PreloadingView.PreloadingView(model);
    const container = new UI.Widget.VBox();
    view.show(container.element);

    const prerenderedFrameId = '1';

    dispatchEvent(target, 'Page.frameNavigated', {
      frame: {
        id: 'main',
        loaderId: 'foo',
        url: 'https://example.com/',
        domainAndRegistry: 'example.com',
        securityOrigin: 'https://example.com/',
        mimeType: 'text/html',
        secureContextType: Protocol.Page.SecureContextType.Secure,
        crossOriginIsolatedContextType: Protocol.Page.CrossOriginIsolatedContextType.Isolated,
        gatedAPIFeatures: [],
      },
    });
    dispatchEvent(target, 'Target.targetInfoChanged', {
      targetInfo: {
        targetId: prerenderedFrameId,
        type: 'frame',
        subtype: 'prerender',
        url: 'https://example.com/prerendered.html',
        title: '',
        attached: true,
        canAccessOpener: true,
      },
    });

    const gridComponent = view.getGridForTest();
    assertShadowRoot(gridComponent.shadowRoot);
    const detailsComponent = await view.getBottomForTest();
    assertShadowRoot(detailsComponent.shadowRoot);

    // getBottomForTest triggers PreloadingDetailsView.doUpdate and schedule rendering.
    // Then wait for the rendering. The calling order must be like this.
    await coordinator.done();

    const controller = getElementWithinComponent(
        gridComponent, 'devtools-data-grid-controller', DataGrid.DataGridController.DataGridController);
    const grid = getElementWithinComponent(controller, 'devtools-data-grid', DataGrid.DataGrid.DataGrid);
    assertShadowRoot(grid.shadowRoot);

    const header = Array.from(getHeaderCells(grid.shadowRoot), getHeaderText);
    const rows = getValuesOfAllBodyRows(grid.shadowRoot);
    rows[0][0] = 'Date.now()';
    assert.deepEqual([header, ...rows], [
      ['Started at', 'Type', 'Trigger', 'URL', 'Status'],
      ['Date.now()', 'Prerendering', 'Opaque', 'https://example.com/prerendered.html', 'Prerendering'],
    ]);

    const placeholder = detailsComponent.shadowRoot.querySelector('div.preloading-noselected div p');

    assert.strictEqual(placeholder?.textContent, 'Select an element for more details');
  });
});
