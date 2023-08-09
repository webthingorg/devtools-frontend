// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as Trace from '../../../../../front_end/models/trace/trace.js';
import * as Types from '../../../../../front_end/models/trace/types/types.js';
import { Breadcrumb } from '../../../../../front_end/panels/timeline/Breadcrumbs.js';
import * as Timeline from '../../../../../front_end/panels/timeline/timeline.js';

describe.only('Timeline breadcrumbs', () => {
  it('can create breadcrumbs', () => {
    const initialTraceWindow: Trace.Types.Timing.TraceWindow = {
      min: Types.Timing.MicroSeconds(1),
      max: Types.Timing.MicroSeconds(10),
      range: Types.Timing.MicroSeconds(9),
    };

    const crumbs = new Timeline.Breadcrumbs.Breadcrumbs(initialTraceWindow);
    
    const tracewindow1: Trace.Types.Timing.TraceWindow = {
      min: Types.Timing.MicroSeconds(3),
      max: Types.Timing.MicroSeconds(9),
      range: Types.Timing.MicroSeconds(6),
    };
    

    const tracewindow2: Trace.Types.Timing.TraceWindow = {
      min: Types.Timing.MicroSeconds(4),
      max: Types.Timing.MicroSeconds(6),
      range: Types.Timing.MicroSeconds(2),
    };
    
    crumbs.add(tracewindow1);
    crumbs.add(tracewindow2);

    
    const breadcrumb2: Breadcrumb = {
      window: tracewindow2,
      child: null
    }
    
    const breadcrumb1: Breadcrumb = {
      window: tracewindow1,
      child: breadcrumb2,
    }
        
    const initialBreadcrumb: Breadcrumb = {
      window: initialTraceWindow,
      child: breadcrumb1,
    }

    assert.deepEqual(crumbs.allCrumbs(), [initialBreadcrumb, breadcrumb1, breadcrumb2]);
  });

  // it('can remove breadcrumbs', () => {
  //   const initialTraceWindow: Trace.Types.Timing.TraceWindow = {
  //     min: Types.Timing.MicroSeconds(1),
  //     max: Types.Timing.MicroSeconds(10),
  //     range: Types.Timing.MicroSeconds(9),
  //   };
  //   const crumbs = new Timeline.Breadcrumbs.Breadcrumbs(initialTraceWindow);

  //   const breadcrumb1: Trace.Types.Timing.TraceWindow = {
  //     min: Types.Timing.MicroSeconds(3),
  //     max: Types.Timing.MicroSeconds(9),
  //     range: Types.Timing.MicroSeconds(6),
  //   };

  //   const breadcrumb2: Trace.Types.Timing.TraceWindow = {
  //     min: Types.Timing.MicroSeconds(4),
  //     max: Types.Timing.MicroSeconds(6),
  //     range: Types.Timing.MicroSeconds(2),
  //   };

  //   crumbs.add(breadcrumb1);
  //   crumbs.add(breadcrumb2);

  //   assert.deepEqual(crumbs.allCrumbs(), [initialTraceWindow, breadcrumb1, breadcrumb2]);

  //   crumbs.makeBreadcrumbActive(breadcrumb1);
  //   assert.deepEqual(crumbs.allCrumbs(), [initialTraceWindow, breadcrumb1]);
  // });

  // it('does not create a child breadcrumb with equal to the parent TraceWindow', () => {
  //   const initialTraceWindow: Trace.Types.Timing.TraceWindow = {
  //     min: Types.Timing.MicroSeconds(1),
  //     max: Types.Timing.MicroSeconds(10),
  //     range: Types.Timing.MicroSeconds(9),
  //   };
  //   const crumbs = new Timeline.Breadcrumbs.Breadcrumbs(initialTraceWindow);

  //   const breadcrumb1: Trace.Types.Timing.TraceWindow = {
  //     min: Types.Timing.MicroSeconds(1),
  //     max: Types.Timing.MicroSeconds(10),
  //     range: Types.Timing.MicroSeconds(9),
  //   };

  //   crumbs.add(breadcrumb1);

  //   assert.deepEqual(crumbs.allCrumbs(), [initialTraceWindow]);
  // });

  // it('does not create a child breadcrumb with TraceWindow outside of parent TraceWindow bounds', () => {
  //   const initialTraceWindow: Trace.Types.Timing.TraceWindow = {
  //     min: Types.Timing.MicroSeconds(1),
  //     max: Types.Timing.MicroSeconds(10),
  //     range: Types.Timing.MicroSeconds(9),
  //   };
  //   const crumbs = new Timeline.Breadcrumbs.Breadcrumbs(initialTraceWindow);

  //   const breadcrumb1: Trace.Types.Timing.TraceWindow = {
  //     min: Types.Timing.MicroSeconds(0),
  //     max: Types.Timing.MicroSeconds(10),
  //     range: Types.Timing.MicroSeconds(10),
  //   };

  //   crumbs.add(breadcrumb1);

  //   assert.deepEqual(crumbs.allCrumbs(), [initialTraceWindow]);
  // });
});
