// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import type * as Common from '../../../../../front_end/core/common/common.js';
import * as SDK from '../../../../../front_end/core/sdk/sdk.js';
import * as Protocol from '../../../../../front_end/generated/protocol.js';
import {createTarget} from '../../helpers/EnvironmentHelpers.js';
import {describeWithMockConnection} from '../../helpers/MockConnection.js';
import BucketEvents = SDK.StorageBucketsModel.Events;

class StorageBucketModelListener {
  #model: SDK.StorageBucketsModel.StorageBucketsModel;
  #bucketEvents = new Map<BucketEvents, Array<SDK.StorageBucketsModel.BucketEvent>>();

  constructor(model: SDK.StorageBucketsModel.StorageBucketsModel) {
    this.#model = model;

    this.#addEventListener(BucketEvents.BucketAdded);
    this.#addEventListener(BucketEvents.BucketRemoved);
    this.#addEventListener(BucketEvents.BucketChanged);
  }

  events(eventType: BucketEvents) {
    let bucketEvents = this.#bucketEvents.get(eventType);
    if (!bucketEvents) {
      bucketEvents = new Array<SDK.StorageBucketsModel.BucketEvent>();
      this.#bucketEvents.set(eventType, bucketEvents);
    }
    return bucketEvents;
  }

  bucketInfos(eventType: BucketEvents) {
    return this.events(eventType).map(event => event.bucket);
  }

  eventCount(eventType: BucketEvents) {
    return this.events(eventType).length;
  }

  async waitForBucketEvents(eventType: BucketEvents, eventCount: number) {
    while (this.eventCount(eventType) < eventCount) {
      await this.#model.once(eventType);
    }
  }

  #addEventListener(eventType: BucketEvents) {
    this.#model.addEventListener(
        eventType, (event: Common.EventTarget.EventTargetEvent<SDK.StorageBucketsModel.BucketEvent>) => {
          this.events(eventType).push(event.data);
        });
  }
}

describeWithMockConnection('StorageBucketsModel', () => {
  let storageKeyManager: SDK.StorageKeyManager.StorageKeyManager;
  let storageBucketsModel: SDK.StorageBucketsModel.StorageBucketsModel;
  let target: SDK.Target.Target;
  let listener: StorageBucketModelListener;

  const STORAGE_KEYS: string[] = [
    'storagekey1',
    'storagekey2',
    'storagekey3',
  ];

  const STORAGE_BUCKETS: Protocol.Storage.StorageBucketInfo[] = [
    {
      storageKey: STORAGE_KEYS[0],
      id: '0',
      name: 'bucket1',
      isDefault: true,
      expiration: 0,
      quota: 0,
      persistent: false,
      durability: Protocol.Storage.StorageBucketsDurability.Strict,
    },
    {
      storageKey: STORAGE_KEYS[0],
      id: '1',
      name: 'bucket2',
      isDefault: false,
      expiration: 0,
      quota: 0,
      persistent: false,
      durability: Protocol.Storage.StorageBucketsDurability.Strict,
    },
    {
      storageKey: STORAGE_KEYS[1],
      id: '2',
      name: 'bucket3',
      isDefault: true,
      expiration: 0,
      quota: 0,
      persistent: false,
      durability: Protocol.Storage.StorageBucketsDurability.Strict,
    },
    {
      storageKey: STORAGE_KEYS[2],
      id: '3',
      name: 'bucket4',
      isDefault: true,
      expiration: 0,
      quota: 0,
      persistent: false,
      durability: Protocol.Storage.StorageBucketsDurability.Strict,
    },
  ];

  const getBucketsForStorageKeys = (...storageKeys: string[]) => {
    return STORAGE_BUCKETS.filter(bucket => storageKeys.includes(bucket.storageKey));
  };

  const setStorageBucketTrackingStub =
      ({storageKey}: {storageKey: string}): Promise<Protocol.ProtocolResponseWithError> => {
        for (const bucket of getBucketsForStorageKeys(storageKey)) {
          storageBucketsModel.storageBucketCreatedOrUpdated({bucket});
        }
        return Promise.resolve({
          getError: () => undefined,
        });
      };

  beforeEach(() => {
    target = createTarget();
    storageKeyManager =
        target.model(SDK.StorageKeyManager.StorageKeyManager) as SDK.StorageKeyManager.StorageKeyManager;
    storageBucketsModel =
        target.model(SDK.StorageBucketsModel.StorageBucketsModel) as SDK.StorageBucketsModel.StorageBucketsModel;
    listener = new StorageBucketModelListener(storageBucketsModel);
  });

  describe('StorageKeyAdded', () => {
    it('starts tracking for the storage key', async () => {
      const storageKey = STORAGE_KEYS[0];

      const setStorageBucketTrackingSpy =
          sinon.stub(storageBucketsModel.storageAgent, 'invoke_setStorageBucketTracking').resolves({
            getError: () => undefined,
          });
      storageBucketsModel.enable();

      assert.isTrue(setStorageBucketTrackingSpy.notCalled);
      storageKeyManager.updateStorageKeys(new Set([storageKey]));
      assert.isTrue(setStorageBucketTrackingSpy.calledOnceWithExactly({storageKey, enable: true}));
    });

    it('adds buckets for storage keys that already have been added', async () => {
      const storageKeys = [STORAGE_KEYS[0], STORAGE_KEYS[2]];
      const bucketsForStorageKeyCount = 3;
      sinon.stub(storageBucketsModel.storageAgent, 'invoke_setStorageBucketTracking')
          .callsFake(setStorageBucketTrackingStub);

      storageKeyManager.updateStorageKeys(new Set(storageKeys));
      storageBucketsModel.enable();

      await listener.waitForBucketEvents(BucketEvents.BucketAdded, bucketsForStorageKeyCount);
      assert.isTrue(listener.eventCount(BucketEvents.BucketAdded) === bucketsForStorageKeyCount);
      assert.deepEqual(getBucketsForStorageKeys(...storageKeys), listener.bucketInfos(BucketEvents.BucketAdded));
    });
  });

  describe('StorageKeyRemoved', () => {
    it('stops tracking for the storage key', async () => {
      const storageKey = STORAGE_KEYS[0];

      const setStorageBucketTrackingSpy =
          sinon.stub(storageBucketsModel.storageAgent, 'invoke_setStorageBucketTracking').resolves({
            getError: () => undefined,
          });

      storageBucketsModel.enable();
      assert.isTrue(setStorageBucketTrackingSpy.notCalled);

      storageKeyManager.updateStorageKeys(new Set([storageKey]));
      storageKeyManager.updateStorageKeys(new Set([]));
      assert.isTrue(setStorageBucketTrackingSpy.callCount === 2);
      assert.isTrue(setStorageBucketTrackingSpy.secondCall.calledWithExactly({storageKey, enable: false}));
    });

    it('removes all buckets for removed storage key', async () => {
      const storageKeys = [STORAGE_KEYS[2], STORAGE_KEYS[0]];
      sinon.stub(storageBucketsModel.storageAgent, 'invoke_setStorageBucketTracking')
          .callsFake(setStorageBucketTrackingStub);

      storageBucketsModel.enable();
      storageKeyManager.updateStorageKeys(new Set(storageKeys));
      await listener.waitForBucketEvents(BucketEvents.BucketAdded, 3);

      const removedStorageKey = storageKeys.pop() as string;
      storageKeyManager.updateStorageKeys(new Set(storageKeys));
      await listener.waitForBucketEvents(BucketEvents.BucketRemoved, 2);
      assert.isTrue(listener.eventCount(BucketEvents.BucketRemoved) === 2);
      assert.deepEqual(getBucketsForStorageKeys(removedStorageKey), listener.bucketInfos(BucketEvents.BucketRemoved));
    });
  });

  describe('CreatedUpdatedDeletedBucket', () => {
    it('notifies when a bucket is created', async () => {
      const STORAGE_BUCKET_TO_CREATE = {
        storageKey: STORAGE_KEYS[0],
        id: '4',
        name: 'bucket5',
        isDefault: false,
        expiration: 0,
        quota: 0,
        persistent: false,
        durability: Protocol.Storage.StorageBucketsDurability.Strict,
      };
      const storageKeys = [STORAGE_KEYS[0], STORAGE_KEYS[2]];
      sinon.stub(storageBucketsModel.storageAgent, 'invoke_setStorageBucketTracking')
          .callsFake(setStorageBucketTrackingStub);

      storageBucketsModel.enable();
      storageKeyManager.updateStorageKeys(new Set(storageKeys));

      await listener.waitForBucketEvents(BucketEvents.BucketAdded, 3);
      assert.isTrue(listener.eventCount(BucketEvents.BucketAdded) === 3);
      const expectedBuckets = getBucketsForStorageKeys(...storageKeys);
      assert.deepEqual(expectedBuckets, listener.bucketInfos(BucketEvents.BucketAdded));

      storageBucketsModel.storageBucketCreatedOrUpdated({bucket: STORAGE_BUCKET_TO_CREATE});
      await listener.waitForBucketEvents(BucketEvents.BucketAdded, 4);
      assert.isTrue(listener.eventCount(BucketEvents.BucketAdded) === 4);
      expectedBuckets.push(STORAGE_BUCKET_TO_CREATE);
      assert.deepEqual(expectedBuckets, listener.bucketInfos(BucketEvents.BucketAdded));
    });

    it('notifies when a bucket is updated', async () => {
      const STORAGE_BUCKET_UPDATED = {...STORAGE_BUCKETS[0], expiration: 100};
      const storageKeys = [STORAGE_KEYS[0], STORAGE_KEYS[2]];
      sinon.stub(storageBucketsModel.storageAgent, 'invoke_setStorageBucketTracking')
          .callsFake(setStorageBucketTrackingStub);

      storageBucketsModel.enable();
      storageKeyManager.updateStorageKeys(new Set(storageKeys));

      await listener.waitForBucketEvents(BucketEvents.BucketAdded, 3);
      assert.isTrue(listener.eventCount(BucketEvents.BucketChanged) === 0);

      storageBucketsModel.storageBucketCreatedOrUpdated({bucket: STORAGE_BUCKET_UPDATED});
      await listener.waitForBucketEvents(BucketEvents.BucketChanged, 1);
      assert.isTrue(listener.eventCount(BucketEvents.BucketChanged) === 1);
      assert.deepEqual(listener.bucketInfos(BucketEvents.BucketChanged)[0], STORAGE_BUCKET_UPDATED);
    });

    it('notifies when a bucket is deleted', async () => {
      const STORAGE_BUCKET_REMOVED = STORAGE_BUCKETS[0];
      const storageKeys = [STORAGE_KEYS[0], STORAGE_KEYS[2]];
      sinon.stub(storageBucketsModel.storageAgent, 'invoke_setStorageBucketTracking')
          .callsFake(setStorageBucketTrackingStub);

      storageBucketsModel.enable();
      storageKeyManager.updateStorageKeys(new Set(storageKeys));

      await listener.waitForBucketEvents(BucketEvents.BucketAdded, 3);
      assert.isTrue(listener.eventCount(BucketEvents.BucketRemoved) === 0);

      storageBucketsModel.storageBucketDeleted({bucketId: STORAGE_BUCKET_REMOVED.id});
      await listener.waitForBucketEvents(BucketEvents.BucketRemoved, 1);
      assert.isTrue(listener.eventCount(BucketEvents.BucketRemoved) === 1);
      assert.deepEqual(listener.bucketInfos(BucketEvents.BucketRemoved)[0], STORAGE_BUCKET_REMOVED);
    });
  });

  describe('GetBucketFunctions', () => {
    it('gets all buckets', async () => {
      sinon.stub(storageBucketsModel.storageAgent, 'invoke_setStorageBucketTracking')
          .callsFake(setStorageBucketTrackingStub);

      storageBucketsModel.enable();
      storageKeyManager.updateStorageKeys(new Set(STORAGE_KEYS));

      await listener.waitForBucketEvents(BucketEvents.BucketAdded, 4);
      assert.deepEqual(new Set(STORAGE_BUCKETS), storageBucketsModel.getBuckets());
    });

    it('gets buckets for storage key', async () => {
      sinon.stub(storageBucketsModel.storageAgent, 'invoke_setStorageBucketTracking')
          .callsFake(setStorageBucketTrackingStub);

      storageBucketsModel.enable();
      storageKeyManager.updateStorageKeys(new Set(STORAGE_KEYS));

      await listener.waitForBucketEvents(BucketEvents.BucketAdded, 4);
      assert.deepEqual(
          new Set(getBucketsForStorageKeys(STORAGE_KEYS[0])),
          storageBucketsModel.getBucketsForStorageKey(STORAGE_KEYS[0]));
      assert.deepEqual(
          new Set(getBucketsForStorageKeys(STORAGE_KEYS[1])),
          storageBucketsModel.getBucketsForStorageKey(STORAGE_KEYS[1]));
      assert.deepEqual(
          new Set(getBucketsForStorageKeys(STORAGE_KEYS[2])),
          storageBucketsModel.getBucketsForStorageKey(STORAGE_KEYS[2]));
    });

    it('gets buckets by id', async () => {
      sinon.stub(storageBucketsModel.storageAgent, 'invoke_setStorageBucketTracking')
          .callsFake(setStorageBucketTrackingStub);

      storageBucketsModel.enable();
      storageKeyManager.updateStorageKeys(new Set(STORAGE_KEYS));

      await listener.waitForBucketEvents(BucketEvents.BucketAdded, 4);
      assert.deepEqual(STORAGE_BUCKETS[0], storageBucketsModel.getBucketById(STORAGE_BUCKETS[0].id));
      assert.deepEqual(STORAGE_BUCKETS[1], storageBucketsModel.getBucketById(STORAGE_BUCKETS[1].id));
      assert.deepEqual(STORAGE_BUCKETS[2], storageBucketsModel.getBucketById(STORAGE_BUCKETS[2].id));
      assert.deepEqual(STORAGE_BUCKETS[3], storageBucketsModel.getBucketById(STORAGE_BUCKETS[3].id));
    });

    it('gets bucket by name', async () => {
      sinon.stub(storageBucketsModel.storageAgent, 'invoke_setStorageBucketTracking')
          .callsFake(setStorageBucketTrackingStub);

      storageBucketsModel.enable();
      storageKeyManager.updateStorageKeys(new Set(STORAGE_KEYS));

      await listener.waitForBucketEvents(BucketEvents.BucketAdded, 4);
      assert.deepEqual(
          STORAGE_BUCKETS[0],
          storageBucketsModel.getBucketByName(STORAGE_BUCKETS[0].storageKey, STORAGE_BUCKETS[0].name));
      assert.deepEqual(
          STORAGE_BUCKETS[1],
          storageBucketsModel.getBucketByName(STORAGE_BUCKETS[1].storageKey, STORAGE_BUCKETS[1].name));
      assert.deepEqual(
          STORAGE_BUCKETS[2],
          storageBucketsModel.getBucketByName(STORAGE_BUCKETS[2].storageKey, STORAGE_BUCKETS[2].name));
      assert.deepEqual(
          STORAGE_BUCKETS[3],
          storageBucketsModel.getBucketByName(STORAGE_BUCKETS[3].storageKey, STORAGE_BUCKETS[3].name));
    });

    it('gets default bucket when name isnt given', async () => {
      sinon.stub(storageBucketsModel.storageAgent, 'invoke_setStorageBucketTracking')
          .callsFake(setStorageBucketTrackingStub);

      storageBucketsModel.enable();
      storageKeyManager.updateStorageKeys(new Set(STORAGE_KEYS));

      await listener.waitForBucketEvents(BucketEvents.BucketAdded, 4);
      assert.deepEqual(STORAGE_BUCKETS[0], storageBucketsModel.getBucketByName(STORAGE_BUCKETS[0].storageKey));
      assert.deepEqual(STORAGE_BUCKETS[2], storageBucketsModel.getBucketByName(STORAGE_BUCKETS[2].storageKey));
      assert.deepEqual(STORAGE_BUCKETS[3], storageBucketsModel.getBucketByName(STORAGE_BUCKETS[3].storageKey));
    });
  });

  it('deletes the bucket', () => {
    const storageBucket = STORAGE_BUCKETS[0];
    const setStorageBucketTrackingSpy =
        sinon.stub(storageBucketsModel.storageAgent, 'invoke_deleteStorageBucket').resolves({
          getError: () => undefined,
        });

    storageBucketsModel.deleteBucket(storageBucket);
    assert.isTrue(setStorageBucketTrackingSpy.calledOnceWithExactly(
        {storageKey: storageBucket.storageKey, bucketName: storageBucket.name}));
  });
});
