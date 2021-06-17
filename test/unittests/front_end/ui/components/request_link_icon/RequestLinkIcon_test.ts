// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assertNotNullOrUndefined} from '../../../../../../front_end/core/platform/platform.js';
import type * as Logs from '../../../../../../front_end/models/logs/logs.js';
import type * as SDK from '../../../../../../front_end/core/sdk/sdk.js';
import * as Common from '../../../../../../front_end/core/common/common.js';
import * as RequestLinkIcon from '../../../../../../front_end/ui/components/request_link_icon/request_link_icon.js';
import * as IconButton from '../../../../../../front_end/ui/components/icon_button/icon_button.js';
import {assertElement, assertShadowRoot, renderElementIntoDOM} from '../../../helpers/DOMHelpers.js';
import * as Coordinator from '../../../../../../front_end/ui/components/render_coordinator/render_coordinator.js';

const {assert} = chai;

const coordinator = Coordinator.RenderCoordinator.RenderCoordinator.instance();

const renderRequestLinkIcon = async(data: RequestLinkIcon.RequestLinkIcon.Data): Promise<{
  component: RequestLinkIcon.RequestLinkIcon.RequestLinkIcon,
  shadowRoot: ShadowRoot,
}> => {
  const component = new RequestLinkIcon.RequestLinkIcon.RequestLinkIcon();
  component.data = data;
  renderElementIntoDOM(component);
  assertShadowRoot(component.shadowRoot);
  await coordinator.done();
  return {component, shadowRoot: component.shadowRoot};
};

export const extractData = (shadowRoot: ShadowRoot): {
  iconData: IconButton.Icon.IconData,
  label: string|null,
  containerClasses: string[],
} => {
  const icon = shadowRoot.querySelector('devtools-icon');
  assertElement(icon, IconButton.Icon.Icon);
  const container = shadowRoot.querySelector('span');
  assertNotNullOrUndefined(container);
  const label = shadowRoot.querySelector('[aria-label="Shortened URL"]');
  if (label !== null) {
    assertElement(label, HTMLSpanElement);
  }
  return {
    iconData: icon.data,
    label: label ? label.textContent : null,
    containerClasses: Array.from(container.classList),
  };
};

export const extractElements = (shadowRoot: ShadowRoot): {
  icon: IconButton.Icon.Icon,
  container: HTMLSpanElement,
  label?: HTMLSpanElement,
} => {
  const icon = shadowRoot.querySelector('devtools-icon');
  assertElement(icon, IconButton.Icon.Icon);
  const container = shadowRoot.querySelector('span');
  assertNotNullOrUndefined(container);
  const label = shadowRoot.querySelector('span > span');
  if (label !== null) {
    assertElement(label, HTMLSpanElement);
    return {
      icon,
      container,
      label,
    };
  }
  return {icon, container};
};

class MockRequestResolver {
  private promise: Promise<SDK.NetworkRequest.NetworkRequest|null>;
  resolve: (result: SDK.NetworkRequest.NetworkRequest|null) => void = () => {
    throw new Error('resolve uninitialized');
  };

  constructor() {
    this.promise = new Promise(r => {
      this.resolve = r;
    });
  }
  waitForNetworkRequest() {
    return this.promise;
  }
}

describe('RequestLinkIcon', () => {
  describe('with simple requests', () => {
    const mockRequest = {
      url() {
        return 'http://foo.bar/baz';
      },
    };

    const mockRequestWithTrailingSlash = {
      url() {
        return 'http://foo.bar/baz/';
      },
    };

    const failingRequestResolver = {
      async waitForNetworkRequest() {
        throw new Error('Couldn\'t resolve');
      },
    };

    it('renders correctly without a request', async () => {
      const {shadowRoot} = await renderRequestLinkIcon({
        affectedRequest: {requestId: 'foo'},
        requestResolver: failingRequestResolver as unknown as Logs.RequestResolver.RequestResolver,
      });

      const {iconData, label} = extractData(shadowRoot);
      assert.strictEqual('iconName' in iconData ? iconData.iconName : null, 'network_panel_icon');
      assert.strictEqual(iconData.color, 'var(--issue-color-yellow)');
      assert.isNull(label, 'Didn\'t expect a label');
    });

    it('renders correctly with a request', async () => {
      const {shadowRoot} = await renderRequestLinkIcon({
        request: mockRequest as unknown as SDK.NetworkRequest.NetworkRequest,
      });

      const {iconData, label} = extractData(shadowRoot);
      assert.strictEqual('iconName' in iconData ? iconData.iconName : null, 'network_panel_icon');
      assert.strictEqual(iconData.color, 'var(--color-link)');
      assert.isNull(label, 'Didn\'t expect a label');
    });

    it('renders the request label correctly without a trailing slash', async () => {
      const {shadowRoot} = await renderRequestLinkIcon({
        request: mockRequest as unknown as SDK.NetworkRequest.NetworkRequest,
        displayURL: true,
      });

      const {label} = extractData(shadowRoot);
      assert.strictEqual(label, 'baz');
    });

    it('renders the request label correctly with a trailing slash', async () => {
      const {shadowRoot} = await renderRequestLinkIcon({
        request: mockRequestWithTrailingSlash as unknown as SDK.NetworkRequest.NetworkRequest,
        displayURL: true,
      });

      const {label} = extractData(shadowRoot);
      assert.strictEqual(label, 'baz/');
    });

    it('renders the request label correctly without a request', async () => {
      const {shadowRoot} = await renderRequestLinkIcon({
        affectedRequest: {requestId: 'foo', url: 'https://alpha.beta/gamma'},
        requestResolver: failingRequestResolver as unknown as Logs.RequestResolver.RequestResolver,
        displayURL: true,
      });

      const {label} = extractData(shadowRoot);
      assert.strictEqual(label, 'gamma');
    });

    it('the style reacts to the presence of a request', async () => {
      const {shadowRoot} = await renderRequestLinkIcon({
        request: mockRequest as unknown as SDK.NetworkRequest.NetworkRequest,
      });

      const {containerClasses} = extractData(shadowRoot);
      assert.include(containerClasses, 'link');
    });

    it('the style reacts to the absence of a request', async () => {
      const {shadowRoot} = await renderRequestLinkIcon({
        affectedRequest: {requestId: 'foo', url: 'https://alpha.beta/gamma'},
        requestResolver: failingRequestResolver as unknown as Logs.RequestResolver.RequestResolver,
      });

      const {containerClasses} = extractData(shadowRoot);
      assert.notInclude(containerClasses, 'link');
    });
  });

  describe('transitions upon request resolution', () => {
    const mockRequest = {
      url() {
        return 'http://foo.bar/baz';
      },
    };

    it('to change the style correctly', async () => {
      const resolver = new MockRequestResolver();
      const {shadowRoot} = await renderRequestLinkIcon({
        affectedRequest: {requestId: 'foo', url: 'https://alpha.beta/gamma'},
        requestResolver: resolver as unknown as Logs.RequestResolver.RequestResolver,
      });

      const {containerClasses: containerClassesBefore} = extractData(shadowRoot);
      assert.notInclude(containerClassesBefore, 'link');

      resolver.resolve(mockRequest as unknown as SDK.NetworkRequest.NetworkRequest);

      await new Promise(r => setTimeout(r));  // Drain Microtask queue to get the cooridnator.write posted.
      await coordinator.done();

      const {containerClasses: containerClassesAfter} = extractData(shadowRoot);
      assert.include(containerClassesAfter, 'link');
    });

    it('to set the label correctly', async () => {
      const resolver = new MockRequestResolver();
      const {shadowRoot} = await renderRequestLinkIcon({
        affectedRequest: {requestId: 'foo', url: 'https://alpha.beta/gamma'},
        requestResolver: resolver as unknown as Logs.RequestResolver.RequestResolver,
        displayURL: true,
      });

      const {label: labelBefore} = extractData(shadowRoot);
      assert.strictEqual(labelBefore, 'gamma');

      resolver.resolve(mockRequest as unknown as SDK.NetworkRequest.NetworkRequest);

      await new Promise(r => setTimeout(r));  // Drain Microtask queue to get the cooridnator.write posted.
      await coordinator.done();

      const {label: labelAfter} = extractData(shadowRoot);
      assert.strictEqual(labelAfter, 'baz');
    });

    it('to set icon color correctly', async () => {
      const resolver = new MockRequestResolver();
      const {shadowRoot} = await renderRequestLinkIcon({
        affectedRequest: {requestId: 'foo', url: 'https://alpha.beta/gamma'},
        requestResolver: resolver as unknown as Logs.RequestResolver.RequestResolver,
        displayURL: true,
      });

      const {iconData: iconDataBefore} = extractData(shadowRoot);
      assert.strictEqual(iconDataBefore.color, 'var(--issue-color-yellow)');

      resolver.resolve(mockRequest as unknown as SDK.NetworkRequest.NetworkRequest);

      await new Promise(r => setTimeout(r));  // Drain Microtask queue to get the cooridnator.write posted.
      await coordinator.done();

      const {iconData: iconDataAfter} = extractData(shadowRoot);
      assert.strictEqual(iconDataAfter.color, 'var(--color-link)');
    });
  });

  describe('handles clicks correctly', () => {
    const mockRequest = {
      url() {
        return 'http://foo.bar/baz';
      },
    };

    it('if the icon is clicked', async () => {
      const revealOverride = sinon.fake(Common.Revealer.reveal);
      const {shadowRoot} = await renderRequestLinkIcon({
        request: mockRequest as unknown as SDK.NetworkRequest.NetworkRequest,
        displayURL: true,
        revealOverride,
      });

      const {icon} = extractElements(shadowRoot);

      icon.click();

      assert.isTrue(revealOverride.called);
    });

    it('if the container is clicked', async () => {
      const revealOverride = sinon.fake(Common.Revealer.reveal);
      const {shadowRoot} = await renderRequestLinkIcon({
        request: mockRequest as unknown as SDK.NetworkRequest.NetworkRequest,
        displayURL: true,
        revealOverride,
      });

      const {container} = extractElements(shadowRoot);

      container.click();

      assert.isTrue(revealOverride.called);
    });

    it('if the label is clicked', async () => {
      const revealOverride = sinon.fake(Common.Revealer.reveal);
      const {shadowRoot} = await renderRequestLinkIcon({
        request: mockRequest as unknown as SDK.NetworkRequest.NetworkRequest,
        displayURL: true,
        revealOverride,
      });

      const {label} = extractElements(shadowRoot);

      label?.click();

      assert.isTrue(revealOverride.called);
    });
  });
});
