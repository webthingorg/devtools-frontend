// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import * as SDK from '../../../../../front_end/core/sdk/sdk.js';
import {assertNotNullOrUndefined} from '../../../../../front_end/core/platform/platform.js';
// import type * as Protocol from '../../../../../front_end/generated/protocol.js';
import * as Resources from '../../../../../front_end/panels/application/application.js';
import {createTarget} from '../../helpers/EnvironmentHelpers.js';
import {describeWithMockConnection} from '../../helpers/MockConnection.js';

describeWithMockConnection('SharedStorageModel', () => {
  let sharedStorageModel: Resources.SharedStorageModel.SharedStorageModel;
  let sharedStorage: Resources.SharedStorageModel.SharedStorage;
  let target: SDK.Target.Target;
  const testOrigin = 'a.test';

  beforeEach(() => {
    target = createTarget();
    sharedStorageModel = new Resources.SharedStorageModel.SharedStorageModel(target);
    sharedStorage = new Resources.SharedStorageModel.SharedStorage(sharedStorageModel, testOrigin);
  });

  it('SharedStorage is instantiated correctly', () => {
    assert.strictEqual(sharedStorage.securityOrigin, testOrigin);
  });

  it('SecurityOrigin events trigger addition/removal of SharedStorage', () => {
    sharedStorageModel.enable().catch(() => {});
    const manager = target.model(SDK.SecurityOriginManager.SecurityOriginManager);
    assertNotNullOrUndefined(manager);

    assert.isEmpty(sharedStorageModel.storages());
  });
});
