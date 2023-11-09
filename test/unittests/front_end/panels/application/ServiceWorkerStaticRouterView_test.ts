// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import type * as SDKModule from '../../../../../front_end/core/sdk/sdk.js';
import * as Resources from '../../../../../front_end/panels/application/application.js';
import * as Protocol from '../../../../../front_end/generated/protocol.js';
import {describeWithLocale} from '../../helpers/EnvironmentHelpers.js';

import View = Resources.ServiceWorkerStaticRouterView;

describeWithLocale('ServiceWorkerStaticRouterView', () => {
  let SDK: typeof SDKModule;
  before(async () => {
    SDK = await import('../../../../../front_end/core/sdk/sdk.js');
  });

  const versionId = 0;
  const registrationId = 'fake-sw-id' as Protocol.ServiceWorker.RegistrationID;
  const routerRules = [
    {
      condition: {urlPattern: '/foo/bar'},
      source: ['network'],
    },
    {
      condition: {urlPattern: '/baz'},
      source: ['fetch-event'],
    },
  ];

  it('shows router info', () => {
    const payload: Protocol.ServiceWorker.ServiceWorkerRegistration = {registrationId, scopeURL: '', isDeleted: false};
    const registration: SDKModule.ServiceWorkerManager.ServiceWorkerRegistration =
        new SDK.ServiceWorkerManager.ServiceWorkerRegistration(payload);

    const view = new View.ServiceWorkerStaticRouterView(registration);
    const {element} = view;

    view.update();
    assert.isFalse(element.hasChildNodes());

    const versionPayload: Protocol.ServiceWorker.ServiceWorkerVersion = {
      registrationId,
      versionId: versionId.toString(),
      scriptURL: '',
      status: Protocol.ServiceWorker.ServiceWorkerVersionStatus.New,
      runningStatus: Protocol.ServiceWorker.ServiceWorkerVersionRunningStatus.Starting,
      routerRules: JSON.stringify(routerRules),
    };
    registration.updateVersion(versionPayload);
    view.update();
    assert.isFalse(element.hasChildNodes());

    registration.updateVersion(Object.assign({}, versionPayload, {
      status: Protocol.ServiceWorker.ServiceWorkerVersionStatus.Installing,
      runningStatus: Protocol.ServiceWorker.ServiceWorkerVersionRunningStatus.Running,
    }));
    view.update();
    assert.isFalse(element.hasChildNodes());

    // Registered routers appear only when the SW is activated.
    registration.updateVersion(Object.assign({}, versionPayload, {
      status: Protocol.ServiceWorker.ServiceWorkerVersionStatus.Activated,
      runningStatus: Protocol.ServiceWorker.ServiceWorkerVersionRunningStatus.Running,
    }));
    view.update();
    assert.isTrue(element.hasChildNodes());
    const rules = Array.from(element.querySelectorAll('.router-rule'));
    assert.strictEqual(rules.length, 2);
    rules.map((rule, idx) => {
      assert.strictEqual(
          rule.querySelector('.condition .rule-value')?.textContent, JSON.stringify(routerRules[idx].condition));
      assert.strictEqual(
          rule.querySelector('.source .rule-value')?.textContent, JSON.stringify(routerRules[idx].source));
    });
  });
});
