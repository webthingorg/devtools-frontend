// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as TraceEngine from '../../models/trace/trace.js';
import type * as PerfUI from '../../ui/legacy/components/perf_ui/perf_ui.js';

import {
  type TrackAppenderName,
} from './CompatibilityTracksAppender.js';
import {buildGroupStyle, TrackAppenderBase} from './TrackAppender.js';

export class InteractionsTrackAppender extends TrackAppenderBase {
  readonly appenderName: TrackAppenderName = 'Interactions';

  /**
   * Gets the style for Interactions group.
   */
  getGroupStyle(): PerfUI.FlameChart.GroupStyle {
    return buildGroupStyle({shareHeaderLine: false, useFirstLineForOverview: true, collapsible: false});
  }

  /**
   * Gets the title an event added by Interactions appender should be rendered with.
   */
  titleForEvent(event: TraceEngine.Types.TraceEvents.TraceEventData): string {
    if (TraceEngine.Handlers.ModelHandlers.UserInteractions.eventIsInteractionEvent(event)) {
      let eventText = 'Interaction';
      if (event.args.data?.type) {
        eventText += ` type:${event.args.data.type}`;
      }
      eventText += ` id:${event.interactionId}`;
      return eventText;
    }
    return event.name;
  }
}
