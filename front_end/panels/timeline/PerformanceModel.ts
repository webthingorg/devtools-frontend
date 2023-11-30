// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../core/common/common.js';
import type * as SDK from '../../core/sdk/sdk.js';
import * as TimelineModel from '../../models/timeline_model/timeline_model.js';
import * as TraceEngine from '../../models/trace/trace.js';
import * as TraceBounds from '../../services/trace_bounds/trace_bounds.js';

import {TimelineUIUtils} from './TimelineUIUtils.js';

export class PerformanceModel extends Common.ObjectWrapper.ObjectWrapper<EventTypes> {
  private mainTargetInternal: SDK.Target.Target|null;
  private tracingModelInternal: TraceEngine.Legacy.TracingModel|null;
  private filtersInternal: TimelineModel.TimelineModelFilter.TimelineModelFilter[];
  private readonly timelineModelInternal: TimelineModel.TimelineModel.TimelineModelImpl;
  private readonly frameModelInternal: TimelineModel.TimelineFrameModel.TimelineFrameModel;
  private windowInternal: Window;
  private recordStartTimeInternal?: number;
  #activeBreadcrumbWindow?: TraceEngine.Types.Timing.TraceWindow;

  constructor() {
    super();
    this.mainTargetInternal = null;
    this.tracingModelInternal = null;
    this.filtersInternal = [];

    this.timelineModelInternal = new TimelineModel.TimelineModel.TimelineModelImpl();
    this.frameModelInternal = new TimelineModel.TimelineFrameModel.TimelineFrameModel(
        event => TimelineUIUtils.eventStyle(event).category.name);

    this.windowInternal = {left: 0, right: Infinity};

    this.recordStartTimeInternal = undefined;
  }

  setMainTarget(target: SDK.Target.Target): void {
    this.mainTargetInternal = target;
  }

  mainTarget(): SDK.Target.Target|null {
    return this.mainTargetInternal;
  }

  setRecordStartTime(time: number): void {
    this.recordStartTimeInternal = time;
  }

  recordStartTime(): number|undefined {
    return this.recordStartTimeInternal;
  }

  setFilters(filters: TimelineModel.TimelineModelFilter.TimelineModelFilter[]): void {
    this.filtersInternal = filters;
  }

  filters(): TimelineModel.TimelineModelFilter.TimelineModelFilter[] {
    return this.filtersInternal;
  }

  isVisible(event: TraceEngine.Legacy.Event): boolean {
    return this.filtersInternal.every(f => f.accept(event));
  }

  async setTracingModel(model: TraceEngine.Legacy.TracingModel, isFreshRecording = false): Promise<void> {
    this.tracingModelInternal = model;
    this.timelineModelInternal.setEvents(model, isFreshRecording);

    const mainTracks = this.timelineModelInternal.tracks().filter(
        track => track.type === TimelineModel.TimelineModel.TrackType.MainThread && track.forMainFrame &&
            track.events.length);

    const threadData = mainTracks.map(track => {
      const event = track.events[0];
      return {thread: event.thread, time: event.startTime};
    });
    this.frameModelInternal.addTraceEvents(
        this.mainTargetInternal, this.timelineModelInternal.inspectedTargetEvents(), threadData);
  }

  tracingModel(): TraceEngine.Legacy.TracingModel {
    if (!this.tracingModelInternal) {
      throw 'call setTracingModel before accessing PerformanceModel';
    }
    return this.tracingModelInternal;
  }

  timelineModel(): TimelineModel.TimelineModel.TimelineModelImpl {
    return this.timelineModelInternal;
  }

  frames(): TimelineModel.TimelineFrameModel.TimelineFrame[] {
    return this.frameModelInternal.getFrames();
  }

  frameModel(): TimelineModel.TimelineFrameModel.TimelineFrameModel {
    return this.frameModelInternal;
  }

  setWindow(window: Window, animate?: boolean, breadcrumb?: TraceEngine.Types.Timing.TraceWindow): void {
    const didWindowOrBreadcrumbChange = this.windowInternal.left !== window.left ||
        this.windowInternal.right !== window.right || (breadcrumb && (this.#activeBreadcrumbWindow !== breadcrumb));
    this.windowInternal = window;
    if (breadcrumb) {
      this.#activeBreadcrumbWindow = breadcrumb;
    }
    if (didWindowOrBreadcrumbChange) {
      this.dispatchEventToListeners(Events.WindowChanged, {window, animate, breadcrumbWindow: breadcrumb});
      TraceBounds.TraceBounds.BoundsManager.instance().setTimelineVisibleWindow(
          TraceEngine.Helpers.Timing.traceWindowFromMilliSeconds(
              TraceEngine.Types.Timing.MilliSeconds(window.left),
              TraceEngine.Types.Timing.MilliSeconds(window.right),
              ),
          {shouldAnimate: Boolean(animate)},
      );
      if (breadcrumb) {
        TraceBounds.TraceBounds.BoundsManager.instance().setMiniMapBounds(breadcrumb);
      }
    }
  }

  window(): Window {
    return this.windowInternal;
  }

  minimumRecordTime(): number {
    return this.timelineModelInternal.minimumRecordTime();
  }

  maximumRecordTime(): number {
    return this.timelineModelInternal.maximumRecordTime();
  }
}

// TODO(crbug.com/1167717): Make this a const enum again
// eslint-disable-next-line rulesdir/const_enum
export enum Events {
  WindowChanged = 'WindowChanged',
  NamesResolved = 'NamesResolved',
}
export interface WindowChangedEvent {
  window: Window;
  animate: boolean|undefined;
  breadcrumbWindow?: TraceEngine.Types.Timing.TraceWindow;
}

export type EventTypes = {
  [Events.WindowChanged]: WindowChangedEvent,
  [Events.NamesResolved]: void,
};

export interface Window {
  left: number;
  right: number;
}
