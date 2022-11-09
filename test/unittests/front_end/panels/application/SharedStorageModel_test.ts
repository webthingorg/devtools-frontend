// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import * as SDK from '../../../../../front_end/core/sdk/sdk.js';
import {assertNotNullOrUndefined} from '../../../../../front_end/core/platform/platform.js';
import type * as Protocol from '../../../../../front_end/generated/protocol.js';
import * as Resources from '../../../../../front_end/panels/application/application.js';
import {createTarget} from '../../helpers/EnvironmentHelpers.js';
import {
  describeWithMockConnection,
  setMockConnectionResponseHandler,
  setVoidMockConnectionResponseHandler,
} from '../../helpers/MockConnection.js';

const getMetadataHandler = (params: Protocol.Storage.GetSharedStorageMetadataRequest) => {
  assert.isString(params.ownerOrigin);
  return {
    metadata: {
      creationTime: 100 as Protocol.Network.TimeSinceEpoch,
      length: 4,
      remainingBudget: 2.5,
    } as unknown as Protocol.Storage.SharedStorageMetadata,
  };
};

describeWithMockConnection('SharedStorageModel', () => {
  let sharedStorageModel: Resources.SharedStorageModel.SharedStorageModel;
  let sharedStorage: Resources.SharedStorageModel.SharedStorage;
  let target: SDK.Target.Target;
  const testOrigin = 'http://a.test';

  beforeEach(() => {
    target = createTarget();
    sharedStorageModel = new Resources.SharedStorageModel.SharedStorageModel(target);
    sharedStorage = new Resources.SharedStorageModel.SharedStorage(sharedStorageModel, testOrigin);

    // CDP connection mock: for `Storage.setSharedStorageTracking`
    setVoidMockConnectionResponseHandler('Storage.setSharedStorageTracking', params => {
      assert.isBoolean(params.enable);
    });
  });

  it('SharedStorage is instantiated correctly', () => {
    assert.strictEqual(sharedStorage.securityOrigin, testOrigin);
  });

  it('SecurityOrigin events trigger addition/removal of SharedStorage', async () => {
    // CDP Connection mock: for `Storage.getSharedStorageMetadata`
    setMockConnectionResponseHandler('Storage.getSharedStorageMetadata', getMetadataHandler);

    await sharedStorageModel.enable();

    const manager = target.model(SDK.SecurityOriginManager.SecurityOriginManager);
    assertNotNullOrUndefined(manager);

    assert.isEmpty(sharedStorageModel.storages());

    const addedPromise = sharedStorageModel.once(Resources.SharedStorageModel.Events.SharedStorageAdded);
    manager.dispatchEventToListeners(SDK.SecurityOriginManager.Events.SecurityOriginAdded, testOrigin);
    await addedPromise;
    assertNotNullOrUndefined(sharedStorageModel.storageForOrigin(testOrigin));

    manager.dispatchEventToListeners(SDK.SecurityOriginManager.Events.SecurityOriginRemoved, testOrigin);
    assert.isEmpty(sharedStorageModel.storages());
  });

  it('SecurityOrigin events do not trigger addition of SharedStorage if origin invalid', async () => {
    // CDP Connection mock: for `Storage.getSharedStorageMetadata`
    setMockConnectionResponseHandler('Storage.getSharedStorageMetadata', getMetadataHandler);

    await sharedStorageModel.enable();

    const manager = target.model(SDK.SecurityOriginManager.SecurityOriginManager);
    assertNotNullOrUndefined(manager);

    assert.isEmpty(sharedStorageModel.storages());

    manager.dispatchEventToListeners(SDK.SecurityOriginManager.Events.SecurityOriginAdded, 'invalid');
    assert.isEmpty(sharedStorageModel.storages());
  });

  it('SecurityOrigin events do not trigger addition of SharedStorage if origin not using API', async () => {
    await sharedStorageModel.enable();

    const manager = target.model(SDK.SecurityOriginManager.SecurityOriginManager);
    assertNotNullOrUndefined(manager);

    assert.isEmpty(sharedStorageModel.storages());

    manager.dispatchEventToListeners(SDK.SecurityOriginManager.Events.SecurityOriginAdded, testOrigin);
    assert.isEmpty(sharedStorageModel.storages());
  });

  it('SecurityOrigin events do not trigger addition of SharedStorage if origin already added', async () => {
    // CDP Connection mock: for `Storage.getSharedStorageMetadata`
    setMockConnectionResponseHandler('Storage.getSharedStorageMetadata', getMetadataHandler);

    await sharedStorageModel.enable();

    const manager = target.model(SDK.SecurityOriginManager.SecurityOriginManager);
    assertNotNullOrUndefined(manager);

    assert.isEmpty(sharedStorageModel.storages());

    const addedPromise = sharedStorageModel.once(Resources.SharedStorageModel.Events.SharedStorageAdded);
    manager.dispatchEventToListeners(SDK.SecurityOriginManager.Events.SecurityOriginAdded, testOrigin);
    await addedPromise;
    assertNotNullOrUndefined(sharedStorageModel.storageForOrigin(testOrigin));
    assert.strictEqual(1, sharedStorageModel.numStoragesForTesting());

    manager.dispatchEventToListeners(SDK.SecurityOriginManager.Events.SecurityOriginAdded, testOrigin);
    assert.strictEqual(1, sharedStorageModel.numStoragesForTesting());
  });
});
