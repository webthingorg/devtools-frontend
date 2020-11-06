// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import {createTarget} from '../helpers/EnvironmentHelpers.js';
import {describeWithMockConnection} from '../helpers/MockConnection.js';
import * as Animation from '../../../../front_end/animation/animation.js';

describeWithMockConnection('AnimationModel', () => {
  it('can be instantiated', () => {
    assert.doesNotThrow(() => {
      const target = createTarget();
      new Animation.AnimationModel.AnimationModel(target);
    });
  });
});
