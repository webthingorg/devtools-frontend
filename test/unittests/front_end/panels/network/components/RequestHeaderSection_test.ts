// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as NetworkComponents from '../../../../../../front_end/panels/network/components/components.js';
import * as Coordinator from '../../../../../../front_end/ui/components/render_coordinator/render_coordinator.js';
import type * as SDK from '../../../../../../front_end/core/sdk/sdk.js';

import {
  assertElement,
  assertShadowRoot,
  getCleanTextContentFromElements,
  renderElementIntoDOM,
} from '../../../helpers/DOMHelpers.js';
import {describeWithEnvironment} from '../../../helpers/EnvironmentHelpers.js';

const coordinator = Coordinator.RenderCoordinator.RenderCoordinator.instance();

const {assert} = chai;

describeWithEnvironment('ResponseHeaderSection', () => {
  it('renders provisional headers warning', async () => {
    const request = {
      cachedInMemory: () => true,
      requestHeaders: () =>
          [{name: ':method', value: 'GET'},
           {name: 'accept-encoding', value: 'gzip, deflate, br'},
           {name: 'cache-control', value: 'no-cache'},
    ],
      requestHeadersText: () => undefined,
    } as unknown as SDK.NetworkRequest.NetworkRequest;

    const component = new NetworkComponents.RequestHeaderSection.RequestHeaderSection();
    renderElementIntoDOM(component);
    component.data = {request};
    await coordinator.done();
    assertElement(component, HTMLElement);
    assertShadowRoot(component.shadowRoot);

    assert.strictEqual(
        getCleanTextContentFromElements(component.shadowRoot, '.call-to-action')[0],
        'Provisional headers are shown. Disable cache to see full headers. Learn more',
    );
  });
});
