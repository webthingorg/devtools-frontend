// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import type * as SDK from '../../../../../front_end/core/sdk/sdk.js';
import type * as Protocol from '../../../../../front_end/generated/protocol.js';
import * as Resources from '../../../../../front_end/panels/application/application.js';
import {createTarget} from '../../helpers/EnvironmentHelpers.js';
import {describeWithMockConnection} from '../../helpers/MockConnection.js';

describeWithMockConnection('DOMStorageModel', () => {
  let target: SDK.Target.Target;
  let domStorageModel: Resources.DOMStorageModel.DOMStorageModel;
  let domStorage: Resources.DOMStorageModel.DOMStorage;

  it('can be instantiated', () => {
    assert.doesNotThrow(() => {
      target = createTarget();
      domStorageModel = new Resources.DOMStorageModel.DOMStorageModel(target);
    });
  });

  it('DOMStorage can be instantiated correctly', () => {
    const key = 'storageKey1';

    assert.doesNotThrow(() => {
      domStorage = new Resources.DOMStorageModel.DOMStorage(domStorageModel, '', key, true);
    });
    assert.strictEqual(domStorage.storageKey, key);
    assert.deepStrictEqual(domStorage.id, {storageKey: key, isLocalStorage: true} as Protocol.DOMStorage.StorageId);
  });
});
