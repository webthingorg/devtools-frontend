// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as TraceEngine from '../../../../models/trace/trace.js';
import * as TimelineComponents from '../../../../panels/timeline/components/components.js';
import * as Timeline from '../../../../panels/timeline/timeline.js';
import * as EnvironmentHelpers from '../../../../testing/EnvironmentHelpers.js';
import * as TraceLoader from '../../../../testing/TraceLoader.js';
import * as Components from '../../../../ui/legacy/components/utils/utils.js';
import * as ComponentSetup from '../../helpers/helpers.js';

await EnvironmentHelpers.initializeGlobalVars();
await ComponentSetup.ComponentServerSetup.setup();
const detailsLinkifier = new Components.Linkifier.Linkifier();

/**
 * Render details for a Layout shift event.
 **/
async function renderDetails() {
  const container = document.querySelector('#container');
  if (!container) {
    throw new Error('No container');
  }

  const {traceData, insights} = await TraceLoader.TraceLoader.traceEngine(/* mocha context */ null, 'shift-attribution.json.gz');
  console.log("🤡 ~ renderDetails ~ insights:", insights);

const shiftEvent = traceData.LayoutShifts.clusters[0].worstShiftEvent as TraceEngine.Types.TraceEvents.SyntheticLayoutShift;
  console.log("🤡 ~ renderDetails ~ shiftEvent:", shiftEvent);
  const maybeTarget = Timeline.TargetForEvent.targetForEvent(traceData, shiftEvent);
  console.log("traceData.LayoutShifts.clusters: ", traceData.LayoutShifts.clusters);
  const details = new TimelineComponents.LayoutShiftDetails.LayoutShiftDetails(detailsLinkifier);
  details.setData(shiftEvent, insights, maybeTarget);

  container.appendChild(details);
}

await renderDetails();
