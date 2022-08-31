// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import * as SDK from '../../../../../front_end/core/sdk/sdk.js';
import * as Resources from '../../../../../front_end/panels/application/application.js';
import {createTarget} from '../../helpers/EnvironmentHelpers.js';
import {
  describeWithMockConnection,
} from '../../helpers/MockConnection.js';
import type * as ProtocolProxyApi from '../../../../../front_end/generated/protocol-proxy-api.js';

describeWithMockConnection('IndexedDBModel', () => {
  let indexedDBModel: Resources.IndexedDBModel.IndexedDBModel;
  let target: SDK.Target.Target;
  let indexedDBAgent: ProtocolProxyApi.IndexedDBApi;
  let manager: SDK.StorageKeyManager.StorageKeyManager|null;
  const testKey = 'test-storage-key';
  const testDBId = new Resources.IndexedDBModel.DatabaseId(undefined, testKey, 'test-database');

  beforeEach(async () => {
    target = createTarget();
    indexedDBModel = new Resources.IndexedDBModel.IndexedDBModel(target);
    indexedDBAgent = target.indexedDBAgent();
    manager = target.model(SDK.StorageKeyManager.StorageKeyManager);
  });

  it('handles StorageKeyAdded events when enabled up to requestIndexedDBNames', async () => {
    const storageKeyAddedSpy =
        sinon.spy(indexedDBModel, 'storageKeyAdded' as keyof Resources.IndexedDBModel.IndexedDBModel);
    const trackIndexedDBSpy = sinon.spy(target.storageAgent(), 'invoke_trackIndexedDBForStorageKey' as never);
    const requestIndexedDBNamesSpy = sinon.spy(indexedDBAgent, 'invoke_requestDatabaseNames');
    const untrackIndexedDBSpy = sinon.spy(target.storageAgent(), 'invoke_untrackIndexedDBForStorageKey');

    manager?.dispatchEventToListeners(SDK.StorageKeyManager.Events.StorageKeyAdded, testKey);
    assert.isTrue(storageKeyAddedSpy.notCalled);

    indexedDBModel.enable();
    manager?.dispatchEventToListeners(SDK.StorageKeyManager.Events.StorageKeyAdded, testKey);
    assert.isTrue(storageKeyAddedSpy.calledOnce);
    assert.isTrue(trackIndexedDBSpy.calledOnceWithExactly({storageKey: testKey}));
    assert.isTrue(requestIndexedDBNamesSpy.calledOnceWithExactly({storageKey: testKey}));

    manager?.dispatchEventToListeners(SDK.StorageKeyManager.Events.StorageKeyRemoved, testKey);
    assert.isTrue(untrackIndexedDBSpy.calledOnceWithExactly({storageKey: testKey}));
  });

  it('calls protocol method on clearObjectStore', async () => {
    const clearObjectStoreSpy = sinon.spy(indexedDBAgent, 'invoke_clearObjectStore');

    indexedDBModel.enable();
    void indexedDBModel.clearObjectStore(testDBId, 'test-store');
    assert.isTrue(clearObjectStoreSpy.calledOnceWithExactly(
        {storageKey: testKey, databaseName: 'test-database', objectStoreName: 'test-store'}));
  });

  it('calls protocol method on deleteEntries', async () => {
    const testKeyRange = {lower: undefined, lowerOpen: false, upper: undefined, upperOpen: true} as IDBKeyRange;
    const deleteEntriesSpy = sinon.spy(indexedDBAgent, 'invoke_deleteObjectStoreEntries');

    indexedDBModel.enable();
    void indexedDBModel.deleteEntries(testDBId, 'test-store', testKeyRange);
    assert.isTrue(deleteEntriesSpy.calledOnceWithExactly(
        {storageKey: testKey, databaseName: 'test-database', objectStoreName: 'test-store', keyRange: testKeyRange}));
  });

  it('calls protocol method on loadObjectStoreData', () => {
    const requestDataSpy = sinon.spy(indexedDBAgent, 'invoke_requestData');

    indexedDBModel.enable();
    indexedDBModel.loadObjectStoreData(testDBId, 'test-store', null, 0, 50, () => {});
    assert.isTrue(requestDataSpy.calledOnceWithExactly({
      storageKey: testKey,
      databaseName: 'test-database',
      objectStoreName: 'test-store',
      indexName: '',
      skipCount: 0,
      pageSize: 50,
      keyRange: undefined,
    }));
  });

  it('calls protocol method on getMetadata', () => {
    const getMetadataSpy = sinon.spy(indexedDBAgent, 'invoke_getMetadata');

    indexedDBModel.enable();
    void indexedDBModel.getMetadata(testDBId, new Resources.IndexedDBModel.ObjectStore('test-store', null, false));
    assert.isTrue(getMetadataSpy.calledOnceWithExactly(
        {storageKey: testKey, databaseName: 'test-database', objectStoreName: 'test-store'}));
  });
});
