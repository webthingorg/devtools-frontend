// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import type * as Common from '../../../../../front_end/core/common/common.js';
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

class SharedStorageListener {
  #model: Resources.SharedStorageModel.SharedStorageModel;
  #storagesWatched: Array<Resources.SharedStorageModel.SharedStorage>;
  #accessEvents: Array<Protocol.Storage.SharedStorageAccessedEvent>;
  #changeEvents:
      Map<Resources.SharedStorageModel.SharedStorage,
          Array<Resources.SharedStorageModel.SharedStorage.SharedStorageChangedEvent>>;

  constructor(model: Resources.SharedStorageModel.SharedStorageModel) {
    this.#model = model;
    this.#storagesWatched = new Array<Resources.SharedStorageModel.SharedStorage>();
    this.#accessEvents = new Array<Protocol.Storage.SharedStorageAccessedEvent>();
    this.#changeEvents = new Map<
        Resources.SharedStorageModel.SharedStorage,
        Array<Resources.SharedStorageModel.SharedStorage.SharedStorageChangedEvent>>();

    this.#model.addEventListener(
        Resources.SharedStorageModel.Events.SharedStorageAdded, this.#sharedStorageAdded, this);
    this.#model.addEventListener(
        Resources.SharedStorageModel.Events.SharedStorageRemoved, this.#sharedStorageRemoved, this);
    this.#model.addEventListener(
        Resources.SharedStorageModel.Events.SharedStorageAccess, this.#sharedStorageAccess, this);
  }

  disable(): void {
    this.#model.removeEventListener(
        Resources.SharedStorageModel.Events.SharedStorageAdded, this.#sharedStorageAdded, this);
    this.#model.removeEventListener(
        Resources.SharedStorageModel.Events.SharedStorageRemoved, this.#sharedStorageRemoved, this);
    this.#model.removeEventListener(
        Resources.SharedStorageModel.Events.SharedStorageAccess, this.#sharedStorageAccess, this);

    for (const storage of this.#storagesWatched) {
      storage.removeEventListener(
          Resources.SharedStorageModel.SharedStorage.Events.SharedStorageChanged,
          this.#sharedStorageChanged.bind(this, storage), this);
    }
  }

  #sharedStorageAdded(event: Common.EventTarget.EventTargetEvent<Resources.SharedStorageModel.SharedStorage>): void {
    const storage = (event.data as Resources.SharedStorageModel.SharedStorage);
    this.#storagesWatched.push(storage);
    storage.addEventListener(
        Resources.SharedStorageModel.SharedStorage.Events.SharedStorageChanged,
        this.#sharedStorageChanged.bind(this, storage), this);
  }

  #sharedStorageRemoved(event: Common.EventTarget.EventTargetEvent<Resources.SharedStorageModel.SharedStorage>): void {
    const storage = (event.data as Resources.SharedStorageModel.SharedStorage);
    storage.removeEventListener(
        Resources.SharedStorageModel.SharedStorage.Events.SharedStorageChanged,
        this.#sharedStorageChanged.bind(this, storage), this);
    const index = this.#storagesWatched.indexOf(storage);
    if (index === -1) {
      return;
    }
    this.#storagesWatched = this.#storagesWatched.splice(index, 1);
  }

  #sharedStorageAccess(event: Common.EventTarget.EventTargetEvent<Protocol.Storage.SharedStorageAccessedEvent>): void {
    this.#accessEvents.push(event.data as Protocol.Storage.SharedStorageAccessedEvent);
  }

  #sharedStorageChanged(
      storage: Resources.SharedStorageModel.SharedStorage,
      event: Common.EventTarget.EventTargetEvent<Resources.SharedStorageModel.SharedStorage.SharedStorageChangedEvent>):
      void {
    if (!this.#changeEvents.has(storage)) {
      this.#changeEvents.set(
          storage, new Array<Resources.SharedStorageModel.SharedStorage.SharedStorageChangedEvent>());
    }
    this.#changeEvents.get(storage)?.push(
        event.data as Resources.SharedStorageModel.SharedStorage.SharedStorageChangedEvent);
  }

  async waitForStoragesAdded(expectedCount: number): Promise<void> {
    while (this.#storagesWatched.length < expectedCount) {
      await this.#model.once(Resources.SharedStorageModel.Events.SharedStorageAdded);
    }
  }
}

describeWithMockConnection('SharedStorageModel', () => {
  let sharedStorageModel: Resources.SharedStorageModel.SharedStorageModel;
  let sharedStorage: Resources.SharedStorageModel.SharedStorage;
  let target: SDK.Target.Target;
  let listener: SharedStorageListener;
  const testOrigin = 'http://a.test';

  beforeEach(() => {
    target = createTarget();
    sharedStorageModel = new Resources.SharedStorageModel.SharedStorageModel(target);
    sharedStorage = new Resources.SharedStorageModel.SharedStorage(sharedStorageModel, testOrigin);
    listener = new SharedStorageListener(sharedStorageModel);

    // CDP connection mock: for `Storage.setSharedStorageTracking`
    setVoidMockConnectionResponseHandler('Storage.setSharedStorageTracking', params => {
      assert.isBoolean(params.enable);
    });
  });

  afterEach(() => {
    listener.disable();
    sharedStorageModel.disable();
  });

  it('SharedStorage is instantiated correctly', () => {
    assert.strictEqual(sharedStorage.securityOrigin, testOrigin);
  });

  it('SecurityOrigin events trigger addition/removal of SharedStorage', async () => {
    // CDP Connection mock: for `Storage.getSharedStorageMetadata`
    setMockConnectionResponseHandler('Storage.getSharedStorageMetadata', getMetadataHandler);

    void sharedStorageModel.enable();

    assert.isEmpty(sharedStorageModel.storages());

    const manager = target.model(SDK.SecurityOriginManager.SecurityOriginManager);
    assertNotNullOrUndefined(manager);

    const addedPromise = listener.waitForStoragesAdded(1);

    manager.dispatchEventToListeners(SDK.SecurityOriginManager.Events.SecurityOriginAdded, testOrigin);
    await addedPromise;

    assertNotNullOrUndefined(sharedStorageModel.storageForOrigin(testOrigin));

    manager.dispatchEventToListeners(SDK.SecurityOriginManager.Events.SecurityOriginRemoved, testOrigin);
    assert.isEmpty(sharedStorageModel.storages());
  });

  it('SecurityOrigin events do not trigger addition of SharedStorage if origin invalid', async () => {
    // CDP Connection mock: for `Storage.getSharedStorageMetadata`
    setMockConnectionResponseHandler('Storage.getSharedStorageMetadata', getMetadataHandler);

    void sharedStorageModel.enable();

    assert.isEmpty(sharedStorageModel.storages());

    const manager = target.model(SDK.SecurityOriginManager.SecurityOriginManager);
    assertNotNullOrUndefined(manager);

    manager.dispatchEventToListeners(SDK.SecurityOriginManager.Events.SecurityOriginAdded, 'invalid');
    assert.isEmpty(sharedStorageModel.storages());
  });

  it('SecurityOrigin events do not trigger addition of SharedStorage if origin not using API', async () => {
    void sharedStorageModel.enable();

    assert.isEmpty(sharedStorageModel.storages());

    const manager = target.model(SDK.SecurityOriginManager.SecurityOriginManager);
    assertNotNullOrUndefined(manager);

    manager.dispatchEventToListeners(SDK.SecurityOriginManager.Events.SecurityOriginAdded, testOrigin);
    assert.isEmpty(sharedStorageModel.storages());
  });

  it('SecurityOrigin events do not trigger addition of SharedStorage if origin already added', async () => {
    // CDP Connection mock: for `Storage.getSharedStorageMetadata`
    setMockConnectionResponseHandler('Storage.getSharedStorageMetadata', getMetadataHandler);

    void sharedStorageModel.enable();

    assert.isEmpty(sharedStorageModel.storages());

    const addedPromise = listener.waitForStoragesAdded(1);

    const manager = target.model(SDK.SecurityOriginManager.SecurityOriginManager);
    assertNotNullOrUndefined(manager);

    manager.dispatchEventToListeners(SDK.SecurityOriginManager.Events.SecurityOriginAdded, testOrigin);
    await addedPromise;

    assertNotNullOrUndefined(sharedStorageModel.storageForOrigin(testOrigin));
    assert.strictEqual(1, sharedStorageModel.numStoragesForTesting());

    manager.dispatchEventToListeners(SDK.SecurityOriginManager.Events.SecurityOriginAdded, testOrigin);
    assert.strictEqual(1, sharedStorageModel.numStoragesForTesting());
  });

  it('SecurityOrigins are added/removed when model is enabled/disabled', async () => {
    // CDP Connection mock: for `Storage.getSharedStorageMetadata`
    setMockConnectionResponseHandler('Storage.getSharedStorageMetadata', getMetadataHandler);

    const testOriginB = 'http://b.test';
    const testOriginC = 'http://c.test';

    const originSet = new Set([testOrigin, testOriginB, testOriginC]);

    const manager = target.model(SDK.SecurityOriginManager.SecurityOriginManager);
    assertNotNullOrUndefined(manager);

    manager.updateSecurityOrigins(originSet);
    assert.strictEqual(3, manager.securityOrigins().length);

    const addedPromise = listener.waitForStoragesAdded(3);

    await sharedStorageModel.enable();
    await addedPromise;

    assert.strictEqual(3, sharedStorageModel.numStoragesForTesting());

    assertNotNullOrUndefined(sharedStorageModel.storageForOrigin(testOrigin));
    assertNotNullOrUndefined(sharedStorageModel.storageForOrigin(testOriginB));
    assertNotNullOrUndefined(sharedStorageModel.storageForOrigin(testOriginC));

    sharedStorageModel.disable();
    assert.isEmpty(sharedStorageModel.storages());
  });
});
