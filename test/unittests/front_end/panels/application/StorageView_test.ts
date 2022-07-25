// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import * as SDK from '../../../../../front_end/core/sdk/sdk.js';
import {assertNotNullOrUndefined} from '../../../../../front_end/core/platform/platform.js';
import * as Protocol from '../../../../../front_end/generated/protocol.js';
import * as Resources from '../../../../../front_end/panels/application/application.js';
import {createTarget} from '../../helpers/EnvironmentHelpers.js';
import {describeWithMockConnection} from '../../helpers/MockConnection.js';

describeWithMockConnection('StorageView', () => {
  const testKey = 'test-storage-key';
  let target: SDK.Target.Target;
  let domStorageModel: Resources.DOMStorageModel.DOMStorageModel|null;
  let manager: SDK.StorageKeyManager.StorageKeyManager|null;

  beforeEach(() => {
    target = createTarget();
    domStorageModel = target.model(Resources.DOMStorageModel.DOMStorageModel);
    domStorageModel?.enable();
    manager = target.model(SDK.StorageKeyManager.StorageKeyManager);
  });

  it('emits correct events on clearStorageByStorageKey', () => {
    const testId = {storageKey: testKey, isLocalStorage: true} as Protocol.DOMStorage.StorageId;

    assertNotNullOrUndefined(domStorageModel);
    assert.isEmpty(domStorageModel.storages());
    assertNotNullOrUndefined(manager);
    manager.dispatchEventToListeners(SDK.StorageKeyManager.Events.StorageKeyAdded, testKey);
    assertNotNullOrUndefined(domStorageModel.storageForId(testId));

    const dispatcherSpy = sinon.spy(domStorageModel, 'dispatchEventToListeners');
    const spyClearDataForStorageKey = sinon.stub(target.storageAgent(), 'invoke_clearDataForStorageKey');
    Resources.StorageView.StorageView.clearByStorageKey(target, testKey, [Protocol.Storage.StorageType.All]);
    // must be called 4 times, twice with DOMStorageRemoved for local and non-local storage and twice with DOMStorageAdded
    assert.isTrue(spyClearDataForStorageKey.calledOnce);
    assert.strictEqual(dispatcherSpy.callCount, 4);
    sinon.assert.calledWith(
        dispatcherSpy, Resources.DOMStorageModel.Events.DOMStorageRemoved as unknown as sinon.SinonMatcher);
    sinon.assert.calledWith(
        dispatcherSpy, Resources.DOMStorageModel.Events.DOMStorageAdded as unknown as sinon.SinonMatcher);
  });

  it('changes subtitle on MainStorageKeyChanged event', () => {
    assertNotNullOrUndefined(domStorageModel);
    assertNotNullOrUndefined(manager);
    const view = new Resources.StorageView.StorageView();

    manager.dispatchEventToListeners(SDK.StorageKeyManager.Events.MainStorageKeyChanged, {mainStorageKey: testKey});
    const subtitle =
        view.element.shadowRoot?.querySelector('div.flex-auto')?.shadowRoot?.querySelector('div.report-subtitle');
    assert.strictEqual(subtitle?.textContent, testKey);
  });
});
