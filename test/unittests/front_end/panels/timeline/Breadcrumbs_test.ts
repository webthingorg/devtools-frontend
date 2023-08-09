// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as Trace from '../../../../../front_end/models/trace/trace.js';
import * as Types from '../../../../../front_end/models/trace/types/types.js';
import * as Timeline from '../../../../../front_end/panels/timeline/timeline.js';

describe('Timeline breadcrumbs', () => {
  it('can create a breadcrumbs', () => {
    const initialTraceWindow: Trace.Types.Timing.TraceWindow = {
      min: Types.Timing.MicroSeconds(1),
      max: Types.Timing.MicroSeconds(10),
      range: Types.Timing.MicroSeconds(9),
    };
    const crumbs = new Timeline.Breadcrumbs.Breadcrumbs(initialTraceWindow);

    const newBreadcrumb: Trace.Types.Timing.TraceWindow = {
      min: Types.Timing.MicroSeconds(3),
      max: Types.Timing.MicroSeconds(9),
      range: Types.Timing.MicroSeconds(6),
    };

    const newBreadcrumb2: Trace.Types.Timing.TraceWindow = {
      min: Types.Timing.MicroSeconds(4),
      max: Types.Timing.MicroSeconds(6),
      range: Types.Timing.MicroSeconds(2),
    };

    crumbs.addNewBreadcrumb(newBreadcrumb);
    crumbs.addNewBreadcrumb(newBreadcrumb2);

    assert.deepEqual(crumbs.getBreacrumbsTraceWindows(), [initialTraceWindow, newBreadcrumb, newBreadcrumb2]);
  });
});
