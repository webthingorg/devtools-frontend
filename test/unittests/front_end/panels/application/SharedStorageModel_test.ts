// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import type * as Common from '../../../../../front_end/core/common/common.js';
import * as SDK from '../../../../../front_end/core/sdk/sdk.js';
import {assertNotNullOrUndefined} from '../../../../../front_end/core/platform/platform.js';
import * as Protocol from '../../../../../front_end/generated/protocol.js';
import * as Resources from '../../../../../front_end/panels/application/application.js';
import {createTarget} from '../../helpers/EnvironmentHelpers.js';
import {
  describeWithMockConnection,
  setMockConnectionResponseHandler,
} from '../../helpers/MockConnection.js';

class SharedStorageListener {
  #model: Resources.SharedStorageModel.SharedStorageModel;
  #storagesWatched: Array<Resources.SharedStorageModel.SharedStorageForOrigin>;
  #accessEvents: Array<Protocol.Storage.SharedStorageAccessedEvent>;
  #changeEvents:
      Map<Resources.SharedStorageModel.SharedStorageForOrigin,
          Array<Resources.SharedStorageModel.SharedStorageForOrigin.SharedStorageChangedEvent>>;

  constructor(model: Resources.SharedStorageModel.SharedStorageModel) {
    this.#model = model;
    this.#storagesWatched = new Array<Resources.SharedStorageModel.SharedStorageForOrigin>();
    this.#accessEvents = new Array<Protocol.Storage.SharedStorageAccessedEvent>();
    this.#changeEvents = new Map<
        Resources.SharedStorageModel.SharedStorageForOrigin,
        Array<Resources.SharedStorageModel.SharedStorageForOrigin.SharedStorageChangedEvent>>();

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
          Resources.SharedStorageModel.SharedStorageForOrigin.Events.SharedStorageChanged,
          this.#sharedStorageChanged.bind(this, storage), this);
    }
  }

  get accessEvents(): Array<Protocol.Storage.SharedStorageAccessedEvent> {
    return this.#accessEvents;
  }

  changeEventsForStorage(storage: Resources.SharedStorageModel.SharedStorageForOrigin):
      Array<Resources.SharedStorageModel.SharedStorageForOrigin.SharedStorageChangedEvent>|null {
    return this.#changeEvents.get(storage) || null;
  }

  changeEventsEmpty(): boolean {
    return this.#changeEvents.size === 0;
  }

  #sharedStorageAdded(event: Common.EventTarget.EventTargetEvent<Resources.SharedStorageModel.SharedStorageForOrigin>):
      void {
    const storage = (event.data as Resources.SharedStorageModel.SharedStorageForOrigin);
    this.#storagesWatched.push(storage);
    storage.addEventListener(
        Resources.SharedStorageModel.SharedStorageForOrigin.Events.SharedStorageChanged,
        this.#sharedStorageChanged.bind(this, storage), this);
  }

  #sharedStorageRemoved(
      event: Common.EventTarget.EventTargetEvent<Resources.SharedStorageModel.SharedStorageForOrigin>): void {
    const storage = (event.data as Resources.SharedStorageModel.SharedStorageForOrigin);
    storage.removeEventListener(
        Resources.SharedStorageModel.SharedStorageForOrigin.Events.SharedStorageChanged,
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
      storage: Resources.SharedStorageModel.SharedStorageForOrigin,
      event: Common.EventTarget
          .EventTargetEvent<Resources.SharedStorageModel.SharedStorageForOrigin.SharedStorageChangedEvent>): void {
    if (!this.#changeEvents.has(storage)) {
      this.#changeEvents.set(
          storage, new Array<Resources.SharedStorageModel.SharedStorageForOrigin.SharedStorageChangedEvent>());
    }
    this.#changeEvents.get(storage)?.push(
        event.data as Resources.SharedStorageModel.SharedStorageForOrigin.SharedStorageChangedEvent);
  }

  async waitForStoragesAdded(expectedCount: number): Promise<void> {
    while (this.#storagesWatched.length < expectedCount) {
      await this.#model.once(Resources.SharedStorageModel.Events.SharedStorageAdded);
    }
  }
}

describeWithMockConnection('SharedStorageModel', () => {
  let sharedStorageModel: Resources.SharedStorageModel.SharedStorageModel;
  let target: SDK.Target.Target;
  let listener: SharedStorageListener;

  const testOrigin = 'http://a.test';
  const testOriginB = 'http://b.test';
  const testOriginC = 'http://c.test';

  const id = 'AA' as Protocol.Page.FrameId;

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

  const events = [
    {
      accessTime: 0,
      type: Protocol.Storage.SharedStorageAccessType.DocumentAppend,
      mainFrameId: id,
      ownerOrigin: testOrigin,
      params: {key: 'key0', value: 'value0'} as Protocol.Storage.SharedStorageAccessParams,
    },
    {
      accessTime: 10,
      type: Protocol.Storage.SharedStorageAccessType.WorkletGet,
      mainFrameId: id,
      ownerOrigin: testOrigin,
      params: {key: 'key0'} as Protocol.Storage.SharedStorageAccessParams,
    },
    {
      accessTime: 15,
      type: Protocol.Storage.SharedStorageAccessType.WorkletLength,
      mainFrameId: id,
      ownerOrigin: testOriginB,
      params: {} as Protocol.Storage.SharedStorageAccessParams,
    },
    {
      accessTime: 20,
      type: Protocol.Storage.SharedStorageAccessType.DocumentClear,
      mainFrameId: id,
      ownerOrigin: testOriginB,
      params: {} as Protocol.Storage.SharedStorageAccessParams,
    },
    {
      accessTime: 100,
      type: Protocol.Storage.SharedStorageAccessType.WorkletSet,
      mainFrameId: id,
      ownerOrigin: testOriginC,
      params: {key: 'key0', value: 'value1', ignoreIfPresent: true} as Protocol.Storage.SharedStorageAccessParams,
    },
    {
      accessTime: 50,
      type: Protocol.Storage.SharedStorageAccessType.WorkletRemainingBudget,
      mainFrameId: id,
      ownerOrigin: testOriginC,
      params: {} as Protocol.Storage.SharedStorageAccessParams,
    },
  ];

  beforeEach(() => {
    target = createTarget();
    sharedStorageModel = new Resources.SharedStorageModel.SharedStorageModel(target);
    listener = new SharedStorageListener(sharedStorageModel);
  });

  afterEach(() => {
    listener.disable();
    sharedStorageModel.disable();
  });

  it('SharedStorage is instantiated correctly', () => {
    const sharedStorage = new Resources.SharedStorageModel.SharedStorageForOrigin(sharedStorageModel, testOrigin);
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

    const manager = target.model(SDK.SecurityOriginManager.SecurityOriginManager);
    assertNotNullOrUndefined(manager);

    const originSet = new Set([testOrigin, testOriginB, testOriginC]);
    manager.updateSecurityOrigins(originSet);
    assert.strictEqual(3, manager.securityOrigins().length);

    const addedPromise = listener.waitForStoragesAdded(3);

    void sharedStorageModel.enable();
    await addedPromise;

    assert.strictEqual(3, sharedStorageModel.numStoragesForTesting());

    assertNotNullOrUndefined(sharedStorageModel.storageForOrigin(testOrigin));
    assertNotNullOrUndefined(sharedStorageModel.storageForOrigin(testOriginB));
    assertNotNullOrUndefined(sharedStorageModel.storageForOrigin(testOriginC));

    sharedStorageModel.disable();
    assert.isEmpty(sharedStorageModel.storages());
  });

  it('SharedStorageAccess events are dispatched to listeners', async () => {
    // CDP Connection mock: for `Storage.getSharedStorageMetadata`
    setMockConnectionResponseHandler('Storage.getSharedStorageMetadata', getMetadataHandler);

    const manager = target.model(SDK.SecurityOriginManager.SecurityOriginManager);
    assertNotNullOrUndefined(manager);

    void sharedStorageModel.enable();

    for (const event of events) {
      sharedStorageModel.sharedStorageAccessed(event);
    }

    assert.deepEqual(events, listener.accessEvents);
  });

  it('SharedStorageChanged events are dispatched to listeners', async () => {
    // CDP Connection mock: for `Storage.getSharedStorageMetadata`
    setMockConnectionResponseHandler('Storage.getSharedStorageMetadata', getMetadataHandler);

    const manager = target.model(SDK.SecurityOriginManager.SecurityOriginManager);
    assertNotNullOrUndefined(manager);

    void sharedStorageModel.enable();

    // For change events whose origins aren't yet in the model, the origin is added
    // to the model, with the `SharedStorageAdded` event being subsequently dispatched
    // instead of the `SharedStorageChanged` event.
    const addedPromise = listener.waitForStoragesAdded(3);
    for (const event of events) {
      sharedStorageModel.sharedStorageAccessed(event);
    }
    await addedPromise;

    assert.strictEqual(3, sharedStorageModel.numStoragesForTesting());
    assert.deepEqual(events, listener.accessEvents);
    assert.isTrue(listener.changeEventsEmpty());

    // All events will be dispatched as `SharedStorageAccess` events, but only change
    // events for existing origins will be forwarded as `SharedStorageChanged` events.
    for (const event of events) {
      sharedStorageModel.sharedStorageAccessed(event);
    }

    assert.deepEqual(events.concat(events), listener.accessEvents);

    const storageA = sharedStorageModel.storageForOrigin(testOrigin);
    assertNotNullOrUndefined(storageA);
    assert.deepEqual(listener.changeEventsForStorage(storageA), [
      {
        accessTime: 0,
        type: Protocol.Storage.SharedStorageAccessType.DocumentAppend,
        mainFrameId: id,
        params: {key: 'key0', value: 'value0'} as Protocol.Storage.SharedStorageAccessParams,
      },
    ]);

    const storageB = sharedStorageModel.storageForOrigin(testOriginB);
    assertNotNullOrUndefined(storageB);
    assert.deepEqual(listener.changeEventsForStorage(storageB), [
      {
        accessTime: 20,
        type: Protocol.Storage.SharedStorageAccessType.DocumentClear,
        mainFrameId: id,
        params: {} as Protocol.Storage.SharedStorageAccessParams,
      },
    ]);

    const storageC = sharedStorageModel.storageForOrigin(testOriginC);
    assertNotNullOrUndefined(storageC);
    assert.deepEqual(listener.changeEventsForStorage(storageC), [
      {
        accessTime: 100,
        type: Protocol.Storage.SharedStorageAccessType.WorkletSet,
        mainFrameId: id,
        params: {key: 'key0', value: 'value1', ignoreIfPresent: true} as Protocol.Storage.SharedStorageAccessParams,
      },
    ]);
  });
});
