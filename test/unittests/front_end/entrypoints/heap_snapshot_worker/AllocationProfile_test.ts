// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
/* eslint-disable @typescript-eslint/no-unused-vars */

import * as heap_snapshot_worker from '../../../../../front_end/entrypoints/heap_snapshot_worker/heap_snapshot_worker.js';

describe('AllocationProfile', () => {
  it('initializes', () => {
    class TestAllocationProfile extends heap_snapshot_worker.AllocationProfile.AllocationProfile {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      override buildFunctionAllocationInfos(profile: any) {
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      override buildAllocationTree(profile: any, liveObjectStats: any): any {
      }
    }

    const allocationProfile = new TestAllocationProfile({string: []}, null);
  });
});
