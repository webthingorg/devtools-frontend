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
import {describeWithRealConnection} from '../../helpers/RealConnection.js';

describeWithRealConnection('IndexedDBModel', () => {
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
          name: 'test-database0',
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
    setMockConnectionResponseHandler('IndexedDB.requestDatabaseNames', () => {
      return {
        databaseNames: ['test-database0', 'test-database-1'],
      };
    });
  });

  it.only('calls protocol method on getMetadata', async () => {
    const trackIndexedDBSpy = sinon.spy(target.storageAgent(), 'invoke_trackIndexedDBForStorageKey' as never);
    const requestIndexedDBNamesSpy = sinon.spy(indexedDBAgent, 'invoke_requestDatabaseNames');
    const requestDatabaseSpy = sinon.spy(indexedDBAgent, 'invoke_requestDatabase');
    const applicationSidebar = Resources.ResourcesPanel.ResourcesPanel.showAndGetSidebar();
    indexedDBModel.enable();
    manager?.dispatchEventToListeners(SDK.StorageKeyManager.Events.StorageKeyAdded, testKey);
    assert.isTrue(trackIndexedDBSpy.calledOnceWith({storageKey: testKey}));
    assert.isTrue(requestIndexedDBNamesSpy.calledOnceWith({storageKey: testKey}));
    console.log(requestDatabaseSpy.callCount);
    await new Promise<void>(resolve => {
      setTimeout(() => {
        resolve();
      }, 5000);
    });
    assert.isTrue(setTimeout(() => {
      requestDatabaseSpy.calledTwice;
    }, 3000));
  });
});
