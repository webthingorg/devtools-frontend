// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as TraceEngine from '../../models/trace/trace.js';
import type * as PerfUI from '../../ui/legacy/components/perf_ui/perf_ui.js';

import {
  type TrackAppenderName,
} from './CompatibilityTracksAppender.js';
import {buildGroupStyle, TrackAppenderBase} from './TrackAppender.js';

export class GPUTrackAppender extends TrackAppenderBase {
  readonly appenderName: TrackAppenderName = 'GPU';

  /**
   * Gets the style for GPU group.
   */
  getGroupStyle(): PerfUI.FlameChart.GroupStyle {
    return buildGroupStyle({shareHeaderLine: false});
  }

  /**
   * Gets the color an event added by GPU appender should be rendered with.
   */
  colorForEvent(event: TraceEngine.Types.TraceEvents.TraceEventData): string {
    if (!TraceEngine.Types.TraceEvents.isTraceEventGPUTask(event)) {
      throw new Error(`Unexpected GPU Task: The event's type is '${event.name}'`);
    }
    return 'hsl(109, 33%, 55%)';
  }

  /**
   * Gets the title an event added by GPU appender should be rendered with.
   */
  titleForEvent(event: TraceEngine.Types.TraceEvents.TraceEventData): string {
    if (TraceEngine.Types.TraceEvents.isTraceEventGPUTask(event)) {
      return 'GPU';
    }
    return event.name;
  }
}
