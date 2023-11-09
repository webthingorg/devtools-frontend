// Copyright (c) 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as SDK from '../../core/sdk/sdk.js';
import * as UI from '../../ui/legacy/legacy.js';

export class ServiceWorkerStaticRouterView {
  private registration: SDK.ServiceWorkerManager.ServiceWorkerRegistration;
  element: HTMLElement;
  constructor(registration: SDK.ServiceWorkerManager.ServiceWorkerRegistration) {
    this.registration = registration;
    this.element = document.createElement('ul');
  }

  update(): void {
    const version = this.getActiveVersion();
    if (!version) {
      return;
    }
    const rules = version.routerRules;
    if (!rules || rules.length === 0) {
      return;
    }

    this.element.classList.add('router-rules');
    this.element.removeChildren();

    rules.forEach((rule, i) => {
      const listItem = this.element.createChild('li', 'router-rule');
      UI.UIUtils.createTextChild(listItem.createChild('div', 'rule-id'), `Rule ${i + 1}`);
      const ruleItem = listItem.createChild('ul', 'item');

      const condition = ruleItem.createChild('li', 'condition');
      UI.UIUtils.createTextChild(condition.createChild('div', 'rule-type'), 'Condition');
      UI.UIUtils.createTextChild(condition.createChild('div', 'rule-value'), rule.condition);

      const source = ruleItem.createChild('li', 'source');
      UI.UIUtils.createTextChild(source.createChild('div', 'rule-type'), 'Source');
      UI.UIUtils.createTextChild(source.createChild('div', 'rule-value'), rule.source);
    });
  }

  private getActiveVersion(): SDK.ServiceWorkerManager.ServiceWorkerVersion|undefined {
    return this.registration.versionsByMode().get(SDK.ServiceWorkerManager.ServiceWorkerVersion.Modes.Active);
  }
}
