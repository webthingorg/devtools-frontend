// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// import * as Common from '../../../core/common/common.js';
// import * as Platform from '../../../core/platform/platform.js';
import * as Helpers from '../helpers/helpers.js';
import * as CPUProfile from '../../cpu_profile/cpu_profile.js';
// import * as Types from '../types/types.js';

function handleTask(data: any) {
  const {config, options, pid, tid, rawProfile} = data;
  let {entries} = data;

  // Step 1. Massage the data.
  Helpers.Trace.sortTraceEventsInPlace(entries);

  // Step 2. Inject profile calls from samples
  let profileCalls;
  if (rawProfile) {
    const cpuProfile = new CPUProfile.CPUProfileDataModel.CPUProfileDataModel(rawProfile);
    const samplesIntegrator =
        cpuProfile && new Helpers.SamplesIntegrator.SamplesIntegrator(cpuProfile, pid, tid, config);
    profileCalls = samplesIntegrator?.buildProfileCalls(entries);
    if (profileCalls) {
      entries = Helpers.Trace.mergeEventsInOrder(entries, profileCalls);
    }
  }

  // Step 3. Build the tree.
  const treeData = Helpers.TreeHelpers.treify(entries, options);

  self.postMessage({pid, tid, profileCalls, treeData});
}

self.onmessage = function(event: MessageEvent): void {
  try {
    handleTask(event.data);
  } catch (error) {
    self.postMessage({error});
  }
};

self.postMessage('workerReady');
