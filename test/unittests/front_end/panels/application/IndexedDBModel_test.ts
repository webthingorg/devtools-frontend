// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import * as SDK from '../../../../../front_end/core/sdk/sdk.js';
import * as Resources from '../../../../../front_end/panels/application/application.js';
import {createTarget} from '../../helpers/EnvironmentHelpers.js';
import {describeWithMockConnection, setMockConnectionResponseHandler} from '../../helpers/MockConnection.js';
import type * as ProtocolProxyApi from '../../../../../front_end/generated/protocol-proxy-api.js';
import {ObjectStore} from '../../../../../front_end/panels/application/IndexedDBModel.js';

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
    manager?.dispatchEventToListeners(SDK.StorageKeyManager.Events.StorageKeyAdded, testKey);
    assert.isTrue(storageKeyAddedSpy.notCalled);
    indexedDBModel.enable();
    manager?.dispatchEventToListeners(SDK.StorageKeyManager.Events.StorageKeyAdded, testKey);
    assert.isTrue(storageKeyAddedSpy.calledOnce);
    assert.isTrue(trackIndexedDBSpy.calledOnceWith({storageKey: testKey}));
    assert.isTrue(requestIndexedDBNamesSpy.calledOnceWith({storageKey: testKey}));
  });

  it('calls protocol methods on refreshDatabase and loadObjectStoreData', () => {
    const requestDatabaseSpy = sinon.spy(indexedDBAgent, 'invoke_requestDatabase');
    const requestDataSpy = sinon.spy(indexedDBAgent, 'invoke_requestData');
    indexedDBModel.enable();
    indexedDBModel.refreshDatabase(testDBId);
    assert.isTrue(requestDatabaseSpy.calledOnceWith({storageKey: testKey, databaseName: 'test-database'}));

    indexedDBModel.loadObjectStoreData(testDBId, 'test-store', null, 0, 50, () => {});
    assert.isTrue(requestDataSpy.calledOnce);
  });

  it('calls protocol method on getMetadata', () => {
    const getMetadataSpy = sinon.spy(indexedDBAgent, 'invoke_getMetadata');
    indexedDBModel.enable();
    indexedDBModel.getMetadata(testDBId, new ObjectStore('test-store', null, false));
    assert.isTrue(getMetadataSpy.calledOnce);
  });
});
