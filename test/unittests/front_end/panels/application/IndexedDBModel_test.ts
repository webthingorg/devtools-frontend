// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import * as SDK from '../../../../../front_end/core/sdk/sdk.js';
import * as Resources from '../../../../../front_end/panels/application/application.js';
import {createTarget} from '../../helpers/EnvironmentHelpers.js';
import {
  describeWithMockConnection,
  dispatchEvent,
  setMockConnectionResponseHandler,
} from '../../helpers/MockConnection.js';
import type * as ProtocolProxyApi from '../../../../../front_end/generated/protocol-proxy-api.js';

describeWithMockConnection('IndexedDBModel', () => {
  let indexedDBModel: Resources.IndexedDBModel.IndexedDBModel;
  let target: SDK.Target.Target;
  let indexedDBAgent: ProtocolProxyApi.IndexedDBApi;
  let manager: SDK.StorageKeyManager.StorageKeyManager|null;
  const testKey = 'test-storage-key';
  const testDBId = new Resources.IndexedDBModel.DatabaseId(null, testKey, 'test-database');

  beforeEach(async () => {
    target = createTarget();
    indexedDBModel = new Resources.IndexedDBModel.IndexedDBModel(target);
    indexedDBAgent = target.indexedDBAgent();
    manager = target.model(SDK.StorageKeyManager.StorageKeyManager);
    setMockConnectionResponseHandler('IndexedDB.requestDatabase', () => {
      return {
        databaseWithObjectStores: {
          name: 'test-database',
          version: 1,
          objectStores: [
            {
              name: 'test-store',
              keyPath: {
                type: 'null',
              },
              autoIncrement: false,
              indexes: [],
            },
          ],
        },
      };
    });
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
    assert.isTrue(trackIndexedDBSpy.calledOnceWith({storageKey: testKey}));
    assert.isTrue(requestIndexedDBNamesSpy.calledOnceWith({storageKey: testKey}));

    manager?.dispatchEventToListeners(SDK.StorageKeyManager.Events.StorageKeyRemoved, testKey);
    assert.isTrue(untrackIndexedDBSpy.calledOnceWith({storageKey: testKey}));
  });

  it('handles an indexedDBListUpdated event', async () => {
    const idbListUpdatedSpy = sinon.spy(indexedDBModel, 'indexedDBListUpdated');

    indexedDBModel.enable();
    dispatchEvent(target, 'Storage.indexedDBListUpdated', {origin: '', storageKey: testKey});
    assert.isTrue(idbListUpdatedSpy.calledOnce);
  });

  it('handles an indexedDBContentUpdated event', async () => {
    const eventDispatcherSpy = sinon.spy(indexedDBModel, 'dispatchEventToListeners');

    indexedDBModel.enable();
    dispatchEvent(
        target, 'Storage.indexedDBContentUpdated',
        {origin: '', storageKey: testKey, databaseName: 'test-database', objectStoreName: 'test-store'});
    assert.isTrue(eventDispatcherSpy.calledOnceWith(
        Resources.IndexedDBModel.Events.IndexedDBContentUpdated as unknown as sinon.SinonMatcher,
        {databaseId: testDBId, objectStoreName: 'test-store', model: indexedDBModel}));
  });

  it('calls protocol methods on refreshDatabase', () => {
    const requestDatabaseSpy = sinon.spy(indexedDBAgent, 'invoke_requestDatabase');

    indexedDBModel.enable();
    indexedDBModel.refreshDatabase(testDBId);
    assert.isTrue(requestDatabaseSpy.calledOnceWith({storageKey: testKey, databaseName: 'test-database'}));
  });

  it('calls protocol method on loadObjectStoreData', () => {
    const requestDataSpy = sinon.spy(indexedDBAgent, 'invoke_requestData');

    indexedDBModel.enable();
    indexedDBModel.loadObjectStoreData(testDBId, 'test-store', null, 0, 50, () => {});
    assert.isTrue(requestDataSpy.calledOnceWith({
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
    assert.isTrue(getMetadataSpy.calledOnceWith(
        {storageKey: testKey, databaseName: 'test-database', objectStoreName: 'test-store'}));
  });

  it('calls protocol method on clearObjectStore', async () => {
    const clearObjectStoreSpy = sinon.spy(indexedDBAgent, 'invoke_clearObjectStore');

    indexedDBModel.enable();
    void indexedDBModel.clearObjectStore(testDBId, 'test-store');
    assert.isTrue(clearObjectStoreSpy.calledOnceWith(
        {storageKey: testKey, databaseName: 'test-database', objectStoreName: 'test-store'}));
  });

  it('calls protocol method on deleteDatabase', async () => {
    const deleteDatabaseSpy = sinon.spy(indexedDBAgent, 'invoke_deleteDatabase');

    indexedDBModel.enable();
    void indexedDBModel.deleteDatabase(testDBId);
    assert.isTrue(deleteDatabaseSpy.calledOnceWith({storageKey: testKey, databaseName: 'test-database'}));
  });
});
