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

describeWithMockConnection('DOMStorageModel', () => {
  it('emits correct events on clearStorageByStorageKey', () => {
    const testKey = 'test-storage-key';
    const testId = {storageKey: testKey, isLocalStorage: true} as Protocol.DOMStorage.StorageId;

    const target = createTarget();
    const domStorageModel = target.model(Resources.DOMStorageModel.DOMStorageModel);
    assertNotNullOrUndefined(domStorageModel);
    assert.isEmpty(domStorageModel.storages());
    domStorageModel.enable();
    const manager = target.model(SDK.StorageKeyManager.StorageKeyManager);
    assertNotNullOrUndefined(manager);
    manager.dispatchEventToListeners(SDK.StorageKeyManager.Events.StorageKeyAdded, testKey);
    assertNotNullOrUndefined(domStorageModel.storageForId(testId));

    const dispatcherSpy = sinon.spy(domStorageModel, 'dispatchEventToListeners');
    Resources.StorageView.StorageView.clearByStorageKey(target, testKey, [Protocol.Storage.StorageType.All]);
    // must be called 4 times, twice with DOMStorageRemoved for local and non-local storage and twice with DOMStorageAdded
    assert.strictEqual(dispatcherSpy.callCount, 4);
    sinon.assert.calledWith(
        dispatcherSpy, Resources.DOMStorageModel.Events.DOMStorageRemoved as unknown as sinon.SinonMatcher);
    sinon.assert.calledWith(
        dispatcherSpy, Resources.DOMStorageModel.Events.DOMStorageAdded as unknown as sinon.SinonMatcher);
  });
});
