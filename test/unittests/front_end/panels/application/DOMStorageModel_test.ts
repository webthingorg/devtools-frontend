// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import * as SDK from '../../../../../front_end/core/sdk/sdk.js';
import {assertNotNullOrUndefined} from '../../../../../front_end/core/platform/platform.js';
import type * as Protocol from '../../../../../front_end/generated/protocol.js';
import * as Resources from '../../../../../front_end/panels/application/application.js';
import {createTarget} from '../../helpers/EnvironmentHelpers.js';
import {describeWithMockConnection} from '../../helpers/MockConnection.js';

describeWithMockConnection('DOMStorageModel', () => {
  let target: SDK.Target.Target;
  let domStorageModel: Resources.DOMStorageModel.DOMStorageModel;
  let domStorage: Resources.DOMStorageModel.DOMStorage;
  let manager: SDK.StorageKeyManager.StorageKeyManager;
  const testKey = 'storageKey';
  const testId = {storageKey: testKey, isLocalStorage: true} as Protocol.DOMStorage.StorageId;

  it('can be instantiated', () => {
    assert.doesNotThrow(() => {
      target = createTarget();
      domStorageModel = new Resources.DOMStorageModel.DOMStorageModel(target);
    });
    domStorageModel.removeSecurityOriginManagerForTest();
    domStorageModel.enable();
    const managerOrNull = domStorageModel.storageKeyManagerForTest;
    assertNotNullOrUndefined(managerOrNull);
    manager = managerOrNull;
  });

  it('DOMStorage can be instantiated correctly', () => {
    const key = 'storageKey1';
    assert.doesNotThrow(() => {
      domStorage = new Resources.DOMStorageModel.DOMStorage(domStorageModel, '', key, true);
    });
    assert.strictEqual(domStorage.storageKey, key);
    assert.deepStrictEqual(domStorage.id, {storageKey: key, isLocalStorage: true} as Protocol.DOMStorage.StorageId);
  });

  it('StorageKeyAdded event triggers addition of DOMStorage', () => {
    assert.isEmpty(domStorageModel.storages());
    manager.dispatchEventToListeners(SDK.StorageKeyManager.Events.StorageKeyAdded, testKey);
    assertNotNullOrUndefined(domStorageModel.storageForId(testId));
  });

  it('StorageKeyRemoved event triggers removal of DOMStorage', () => {
    assertNotNullOrUndefined(domStorageModel.storageForId(testId));
    manager.dispatchEventToListeners(SDK.StorageKeyManager.Events.StorageKeyRemoved, testKey);
    assert.isUndefined(domStorageModel.storageForId(testId));
  });
});
