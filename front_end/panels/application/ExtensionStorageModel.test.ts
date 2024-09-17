// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as SDK from '../../core/sdk/sdk.js';
import * as Protocol from '../../generated/protocol.js';
import {createTarget} from '../../testing/EnvironmentHelpers.js';
import {describeWithMockConnection} from '../../testing/MockConnection.js';

import * as Resources from './application.js';

describeWithMockConnection('ExtensionStorageModel', () => {
  let extensionStorageModel: Resources.ExtensionStorageModel.ExtensionStorageModel;
  let extensionStorage: Resources.ExtensionStorageModel.ExtensionStorage;
  let target: SDK.Target.Target;
  const initId = 'extensionid';
  const initName = 'Test Extension';
  const initStorageArea = Protocol.Extensions.StorageArea.Local;

  beforeEach(() => {
    target = createTarget();
    extensionStorageModel = new Resources.ExtensionStorageModel.ExtensionStorageModel(target);
    extensionStorage =
        new Resources.ExtensionStorageModel.ExtensionStorage(extensionStorageModel, initId, initName, initStorageArea);
  });

  it('ExtensionStorage is instantiated correctly', () => {
    assert.strictEqual(extensionStorage.extensionId, initId);
    assert.strictEqual(extensionStorage.name, initName);
    assert.strictEqual(extensionStorage.storageArea, initStorageArea);
  });
});
