// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import * as SDK from '../../../../../front_end/core/sdk/sdk.js';
import {assertNotNullOrUndefined} from '../../../../../front_end/core/platform/platform.js';
import type * as Protocol from '../../../../../front_end/generated/protocol.js';
import * as Resources from '../../../../../front_end/panels/application/application.js';
import {createTarget} from '../../helpers/EnvironmentHelpers.js';
import {describeWithMockConnection, setMockConnectionResponseHandler} from '../../helpers/MockConnection.js';
import type * as ProtocolProxyApi from '../../../../../front_end/generated/protocol-proxy-api.js';

describeWithMockConnection('CacheStorageModel', () => {
  let cacheStorageModel: SDK.ServiceWorkerCacheModel.ServiceWorkerCacheModel;
  let cache: SDK.ServiceWorkerCacheModel.Cache;
  let target: SDK.Target.Target;
  let manager: SDK.StorageKeyManager.StorageKeyManager|null;
  let cacheAgent: ProtocolProxyApi.CacheStorageApi;

  const testKey = 'test-key';

  beforeEach(() => {
    target = createTarget();
    cacheStorageModel = new SDK.ServiceWorkerCacheModel.ServiceWorkerCacheModel(target);
    cache = new SDK.ServiceWorkerCacheModel.Cache(
        cacheStorageModel, undefined, testKey, 'test-cache', 'id' as Protocol.CacheStorage.CacheId);
    manager = target.model(SDK.StorageKeyManager.StorageKeyManager);
    cacheAgent = target.cacheStorageAgent();
  });

  describe('StorageKeyAdded', () => {
    it('registers cache only when the model is enabled', async () => {
      const cacheAdeddSpy = sinon.spy(cacheStorageModel, 'dispatchEventToListeners');
      const cacheNamePromise = new Promise<string>(resolve => {
        cacheStorageModel.addEventListener(SDK.ServiceWorkerCacheModel.Events.CacheAdded, event => {
          resolve(event.data.cache.cacheName);
        });
      });
      setMockConnectionResponseHandler(
          'CacheStorage.requestCacheNames',
          () => ({caches: [{cacheId: 'id', storageKey: testKey, cacheName: 'test-cache'}]}));

      manager?.dispatchEventToListeners(SDK.StorageKeyManager.Events.StorageKeyAdded, testKey);
      assert.isFalse(cacheAdeddSpy.calledWithExactly(
          SDK.ServiceWorkerCacheModel.Events.CacheAdded as unknown as sinon.SinonMatcher,
          {model: cacheStorageModel, cache}));

      cacheStorageModel.enable();
      manager?.dispatchEventToListeners(SDK.StorageKeyManager.Events.StorageKeyAdded, testKey);
      assert.strictEqual(await cacheNamePromise, 'test-cache');
    });

    it('starts tracking cache', () => {
      const trackCacheSpy = sinon.spy(target.storageAgent(), 'invoke_trackCacheStorageForStorageKey' as never);

      cacheStorageModel.enable();
      manager?.dispatchEventToListeners(SDK.StorageKeyManager.Events.StorageKeyAdded, testKey);

      assert.isTrue(trackCacheSpy.calledOnceWithExactly({storageKey: testKey}));
    });
  });

  it('stops tracking cache', () => {
    const untrackCacheSpy = sinon.spy(target.storageAgent(), 'invoke_untrackCacheStorageForStorageKey' as never);

    cacheStorageModel.enable();
    manager?.dispatchEventToListeners(SDK.StorageKeyManager.Events.StorageKeyAdded, testKey);
    manager?.dispatchEventToListeners(SDK.StorageKeyManager.Events.StorageKeyRemoved, testKey);

    assert.isTrue(untrackCacheSpy.calledOnceWithExactly({storageKey: testKey}));
  });

  it.only('calls protocol method and dispatch event on refreshCacheNames', async () => {
    const requestCacheNamesSpy = sinon.spy(cacheAgent, 'invoke_requestCacheNames');
    const cacheAddedPromise = new Promise<void>(resolve => {
      cacheStorageModel.addEventListener(SDK.ServiceWorkerCacheModel.Events.CacheAdded, () => {
        resolve();
      });
    });

    setMockConnectionResponseHandler('IndexedDB.requestDatabaseNames', () => ({databaseNames: ['test-database']}));
    cacheStorageModel.enable();
    manager?.dispatchEventToListeners(SDK.StorageKeyManager.Events.StorageKeyAdded, testKey);

    void cacheStorageModel.refreshCacheNames();

    assert.isTrue(requestCacheNamesSpy.calledWithExactly({storageKey: testKey}));
    await cacheAddedPromise;
  });

  it('dispatches event on cacheStorageContentUpdated', () => {
    const dispatcherSpy = sinon.spy(cacheStorageModel, 'dispatchEventToListeners');

    cacheStorageModel.cacheStorageContentUpdated({origin: '', storageKey: testKey, cacheName: 'test-cache'});

    assert.isTrue(dispatcherSpy.calledOnceWithExactly(
        SDK.ServiceWorkerCacheModel.Events.CacheStorageContentUpdated as unknown as sinon.SinonMatcher,
        {origin: '', storageKey: testKey, cacheName: 'test-cache'}));
  });

  // it('requests database names and loads db on indexedDBListUpdated', async () => {
  //   const requestDBNamesSpy = sinon.spy(indexedDBAgent, 'invoke_requestDatabaseNames');
  //   const databaseLoadedPromise = new Promise<void>(resolve => {
  //     indexedDBModel.addEventListener(Resources.IndexedDBModel.Events.DatabaseLoaded, () => {
  //       resolve();
  //     });
  //   });
  //   setMockConnectionResponseHandler('IndexedDB.requestDatabaseNames', () => ({databaseNames: ['test-database']}));
  //   setMockConnectionResponseHandler(
  //       'IndexedDB.requestDatabase',
  //       () => ({databaseWithObjectStores: {name: 'test-database', version: '1', objectStores: []}}));
  //   indexedDBModel.enable();
  //   manager?.dispatchEventToListeners(SDK.StorageKeyManager.Events.StorageKeyAdded, testKey);

  //   indexedDBModel.indexedDBListUpdated({origin: '', storageKey: testKey});

  //   assert.isTrue(requestDBNamesSpy.calledWithExactly({storageKey: testKey}));
  //   await databaseLoadedPromise;
  // });
});
