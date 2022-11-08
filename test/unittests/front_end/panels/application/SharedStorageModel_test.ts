// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import * as Common from '../../../../../front_end/core/common/common.js';
import * as SDK from '../../../../../front_end/core/sdk/sdk.js';
import {assertNotNullOrUndefined} from '../../../../../front_end/core/platform/platform.js';
import type * as Protocol from '../../../../../front_end/generated/protocol.js';
import * as Resources from '../../../../../front_end/panels/application/application.js';
import {createTarget} from '../../helpers/EnvironmentHelpers.js';
import {describeWithMockConnection, setMockConnectionResponseHandler} from '../../helpers/MockConnection.js';

describeWithMockConnection.only('SharedStorageModel', () => {
  let sharedStorageModel: Resources.SharedStorageModel.SharedStorageModel;
  let sharedStorage: Resources.SharedStorageModel.SharedStorage;
  let target: SDK.Target.Target;
  const testOrigin = 'http://a.test';

  beforeEach(() => {
    target = createTarget();
    sharedStorageModel = new Resources.SharedStorageModel.SharedStorageModel(target);
    sharedStorage = new Resources.SharedStorageModel.SharedStorage(sharedStorageModel, testOrigin);
  });

  it('SharedStorage is instantiated correctly', () => {
    assert.strictEqual(sharedStorage.securityOrigin, testOrigin);
  });

  it('SecurityOrigin events trigger addition/removal of SharedStorage', async () => {
    // CDP Connection mock: for Storage.getSharedStorageMetadata
    setMockConnectionResponseHandler('Storage.getSharedStorageMetadata', params => {
      // debug
      console.error('mock called');
      assert.isString(params.ownerOrigin);
      return {
        metadata: {
          creationTime: 100 as Protocol.Network.TimeSinceEpoch,
          length: 4,
          remainingBudget: 2.5,
        },
      };
    });

    await sharedStorageModel.enable();
    const metadata = await sharedStorageModel.storageAgent.invoke_getSharedStorageMetadata({ownerOrigin: testOrigin})

    assertNotNullOrUndefined(metadata);
    console.error(JSON.stringify(metadata));
  });
});
