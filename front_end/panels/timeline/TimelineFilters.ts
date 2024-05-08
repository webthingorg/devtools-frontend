// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as TraceEngine from '../../models/trace/trace.js';

import {TimelineUIUtils} from './TimelineUIUtils.js';

export abstract class TimelineEventFilter {
  abstract accept(
      event: TraceEngine.Types.TraceEvents.TraceEventData,
      traceParsedData?: TraceEngine.Handlers.Types.TraceParseData): boolean;
}

export class TimelineVisibleEventsFilter extends TimelineEventFilter {
  private readonly visibleTypes: Set<string>;
  constructor(visibleTypes: string[]) {
    super();
    this.visibleTypes = new Set(visibleTypes);
  }

  accept(event: TraceEngine.Types.TraceEvents.TraceEventData): boolean {
    if (TraceEngine.Types.Extensions.isSyntheticExtensionEntry(event) ||
        TraceEngine.Types.TraceEvents.isSyntheticTraceEntry(event)) {
      return true;
    }
    return this.visibleTypes.has(TimelineVisibleEventsFilter.eventType(event));
  }

  static eventType(event: TraceEngine.Types.TraceEvents.TraceEventData): TraceEngine.Types.TraceEvents.KnownEventName {
    // Any blink.console category events are treated as ConsoleTime events
    if (TraceEngine.Legacy.eventHasCategory(event, 'blink.console')) {
      return TraceEngine.Types.TraceEvents.KnownEventName.ConsoleTime;
    }
    // Any blink.user_timing egory events are treated as UserTiming events
    if (TraceEngine.Legacy.eventHasCategory(event, 'blink.user_timing')) {
      return TraceEngine.Types.TraceEvents.KnownEventName.UserTiming;
    }
    return event.name as TraceEngine.Types.TraceEvents.KnownEventName;
  }
}

export class TimelineInvisibleEventsFilter extends TimelineEventFilter {
  #invisibleTypes: Set<TraceEngine.Types.TraceEvents.KnownEventName>;

  constructor(invisibleTypes: TraceEngine.Types.TraceEvents.KnownEventName[]) {
    super();
    this.#invisibleTypes = new Set(invisibleTypes);
  }

  accept(event: TraceEngine.Types.TraceEvents.TraceEventData): boolean {
    return !this.#invisibleTypes.has(TimelineVisibleEventsFilter.eventType(event));
  }
}

export class IsLong extends TimelineEventFilter {
  #minimumRecordDurationMilli = TraceEngine.Types.Timing.MilliSeconds(0);
  constructor() {
    super();
  }

  setMinimumRecordDuration(value: TraceEngine.Types.Timing.MilliSeconds): void {
    this.#minimumRecordDurationMilli = value;
  }

  accept(event: TraceEngine.Types.TraceEvents.TraceEventData): boolean {
    const {duration} = TraceEngine.Helpers.Timing.eventTimingsMilliSeconds(event);
    return duration >= this.#minimumRecordDurationMilli;
  }
}

export class Category extends TimelineEventFilter {
  constructor() {
    super();
  }

  accept(event: TraceEngine.Types.TraceEvents.TraceEventData): boolean {
    return !TimelineUIUtils.eventStyle(event).category.hidden;
  }
}

export class TimelineRegExp extends TimelineEventFilter {
  private regExpInternal!: RegExp|null;
  constructor(regExp?: RegExp) {
    super();
    this.setRegExp(regExp || null);
  }

  setRegExp(regExp: RegExp|null): void {
    this.regExpInternal = regExp;
  }

  regExp(): RegExp|null {
    return this.regExpInternal;
  }

  accept(
      event: TraceEngine.Types.TraceEvents.TraceEventData,
      traceParsedData?: TraceEngine.Handlers.Types.TraceParseData): boolean {
    return !this.regExpInternal || TimelineUIUtils.testContentMatching(event, this.regExpInternal, traceParsedData);
  }
}

export class ExclusiveNameFilter extends TimelineEventFilter {
  #excludeNames: Set<TraceEngine.Types.TraceEvents.KnownEventName>;
  constructor(excludeNames: TraceEngine.Types.TraceEvents.KnownEventName[]) {
    super();
    this.#excludeNames = new Set(excludeNames);
  }

  accept(event: TraceEngine.Types.TraceEvents.TraceEventData): boolean {
    return !this.#excludeNames.has(event.name as TraceEngine.Types.TraceEvents.KnownEventName);
  }
}
