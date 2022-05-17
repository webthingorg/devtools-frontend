// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import {createTarget} from '../../helpers/EnvironmentHelpers.js';
import {describeWithMockConnection} from '../../helpers/MockConnection.js';
import type * as SDKModule from '../../../../../front_end/core/sdk/sdk.js';

describeWithMockConnection('StorageKeyManager', () => {
  let SDK: typeof SDKModule;
  let manager: SDKModule.StorageKeyManager.StorageKeyManager;
  before(async () => {
    SDK = await import('../../../../../front_end/core/sdk/sdk.js');
  });

  it('can be instantiated', () => {
    assert.doesNotThrow(() => {
      const target = createTarget();
      manager = new SDK.StorageKeyManager.StorageKeyManager(target);
    });
  });

  it('updates storage keys correctly', () => {
    const keys = ['storagekey1', 'storagekey2'];

    assert.isEmpty(manager.storageKeys());
    manager.updateStorageKeys(new Set<string>(keys));
    assert.deepEqual(manager.storageKeys(), keys);
  });

  it('updates main storage key correctly', () => {
    const mainKey = 'storagekey1';

    assert.isEmpty(manager.mainStorageKey());
    manager.setMainStorageKey(mainKey);
    assert.strictEqual(manager.mainStorageKey(), mainKey);
  });
});
