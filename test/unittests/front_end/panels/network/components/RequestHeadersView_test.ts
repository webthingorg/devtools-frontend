// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Protocol from '../../../../../../front_end/generated/protocol.js';
import * as NetworkComponents from '../../../../../../front_end/panels/network/components/components.js';
import * as Coordinator from '../../../../../../front_end/ui/components/render_coordinator/render_coordinator.js';
import {
  assertShadowRoot,
  getCleanTextContentFromElements,
  renderElementIntoDOM,
} from '../../../helpers/DOMHelpers.js';
import {describeWithEnvironment} from '../../../helpers/EnvironmentHelpers.js';

const coordinator = Coordinator.RenderCoordinator.RenderCoordinator.instance();

const {assert} = chai;

describeWithEnvironment('RequestHeadersView', () => {
  it('renders the General section', async () => {
    const component = new NetworkComponents.RequestHeadersView.RequestHeadersComponent();
    renderElementIntoDOM(component);
    component.data = {
      request: {
        statusCode: 200,
        statusText: 'OK',
        requestMethod: 'GET',
        url: () => 'https://www.example.com/index.html',
        cachedInMemory: () => true,
        remoteAddress: () => '199.36.158.100:443',
        referrerPolicy: () => Protocol.Network.RequestReferrerPolicy.StrictOriginWhenCrossOrigin,
      },
    } as NetworkComponents.RequestHeadersView.RequestHeadersComponentData;

    assertShadowRoot(component.shadowRoot);
    await coordinator.done();

    const names = getCleanTextContentFromElements(component.shadowRoot, '.header-name');
    assert.deepEqual(names, [
      'Request URL:',
      'Request Method:',
      'Status Code:',
      'Remote Address:',
      'Referrer Policy:',
    ]);

    const values = getCleanTextContentFromElements(component.shadowRoot, '.header-value');
    assert.deepEqual(values, [
      'https://www.example.com/index.html',
      'GET',
      '200 OK (from memory cache)',
      '199.36.158.100:443',
      'strict-origin-when-cross-origin',
    ]);
  });
});
