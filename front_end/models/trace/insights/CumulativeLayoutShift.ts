// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Helpers from '../helpers/helpers.js';
import * as Types from '../types/types.js';

import {
  type InsightResult,
  type NavigationInsightContext,
  type RequiredData,
} from './types.js';

export function deps(): ['Meta', 'Animations', 'LayoutShifts', 'NetworkRequests'] {
  return ['Meta', 'Animations', 'LayoutShifts', 'NetworkRequests'];
}

export const enum AnimationFailureReasons {
  UNSUPPORTED_CSS_PROPERTY = 'UNSUPPORTED_CSS_PROPERTY',
  TRANSFROM_BOX_SIZE_DEPENDENT = 'TRANSFROM_BOX_SIZE_DEPENDENT',
  FILTER_MAY_MOVE_PIXELS = 'FILTER_MAY_MOVE_PIXELS',
  NON_REPLACE_COMPOSITE_MODE = 'NON_REPLACE_COMPOSITE_MODE',
  INCOMPATIBLE_ANIMATIONS = 'INCOMPATIBLE_ANIMATIONS',
  UNSUPPORTED_TIMING_PARAMS = 'UNSUPPORTED_TIMING_PARAMS',
}

export interface NoncompositedAnimationFailure {
  /**
   * Animation name.
   */
  name?: string;
  /**
   * Failure reason based on mask number defined in
   * https://source.chromium.org/search?q=f:compositor_animations.h%20%22enum%20FailureReason%22.
   */
  failureReasons: AnimationFailureReasons[];
  /**
   * Unsupported properties.
   */
  unsupportedProperties?: Types.TraceEvents.TraceEventAnimation['args']['data']['unsupportedProperties'];
}

/**
 * Each failure reason is represented by a bit flag. The bit shift operator '<<' is used to define
 * which bit corresponds to each failure reason.
 * https://source.chromium.org/search?q=f:compositor_animations.h%20%22enum%20FailureReason%22
 * @type {{flag: number, failure: AnimationFailureReasons}[]}
 */
const ACTIONABLE_FAILURE_REASONS = [
  {
    flag: 1 << 13,
    failure: AnimationFailureReasons.UNSUPPORTED_CSS_PROPERTY,
  },
  {
    flag: 1 << 11,
    failure: AnimationFailureReasons.TRANSFROM_BOX_SIZE_DEPENDENT,
  },
  {
    flag: 1 << 12,
    failure: AnimationFailureReasons.FILTER_MAY_MOVE_PIXELS,
  },
  {
    flag: 1 << 4,
    failure: AnimationFailureReasons.NON_REPLACE_COMPOSITE_MODE,
  },
  {
    flag: 1 << 6,
    failure: AnimationFailureReasons.INCOMPATIBLE_ANIMATIONS,
  },
  {
    flag: 1 << 3,
    failure: AnimationFailureReasons.UNSUPPORTED_TIMING_PARAMS,
  },
];

// 500ms window.
// Use this window to consider events and requests that may have caused a layout shift.
const INVALIDATION_WINDOW = Helpers.Timing.secondsToMicroseconds(Types.Timing.Seconds(0.5));

export interface LayoutShiftRootCausesData {
  iframes: Types.TraceEvents.TraceEventRenderFrameImplCreateChildFrame[];
  fontRequests: Types.TraceEvents.SyntheticNetworkRequest[];
}

function isInInvalidationWindow(
    event: Types.TraceEvents.TraceEventData, shift: Types.TraceEvents.TraceEventLayoutShift): boolean {
  const iframeEndTime = event.dur ? event.ts + event.dur : event.ts;
  return iframeEndTime < shift.ts && iframeEndTime >= shift.ts - INVALIDATION_WINDOW;
}

/**
 * Returns a list of NoncompositedAnimationFailures.
 */
function getNonCompositedAnimations(animations: readonly Types.TraceEvents.SyntheticAnimationPair[]):
    NoncompositedAnimationFailure[] {
  const failures: NoncompositedAnimationFailure[] = [];
  for (const event of animations) {
    const beginEvent = event.args.data.beginEvent;
    const instantEvents = event.args.data.instantEvents || [];
    /**
     * Animation events containing composite information are ASYNC_NESTABLE_INSTANT ('n').
     * An animation may also contain multiple 'n' events, so we look through those with useful non-composited data.
     */
    for (const event of instantEvents) {
      const failureMask = event.args.data.compositeFailed;
      const unsupportedProperties = event.args.data.unsupportedProperties;
      if (!failureMask || !unsupportedProperties) {
        continue;
      }
      const failureReasons = ACTIONABLE_FAILURE_REASONS.filter(reason => failureMask & reason.flag).map(reason => {
        return reason.failure;
      });
      const failure: NoncompositedAnimationFailure = {
        name: beginEvent.args.data.displayName,
        failureReasons,
        unsupportedProperties,
      };
      failures.push(failure);
    }
  }
  return failures;
}

/**
 * Given a list of layout shifts, match their root causes to them.
 */
function getRootCausesPerShift(
    layoutShifts: Types.TraceEvents.TraceEventLayoutShift[],
    networkRequests: Types.TraceEvents.SyntheticNetworkRequest[],
    iframeCreatedEvents: readonly Types.TraceEvents.TraceEventRenderFrameImplCreateChildFrame[]):
    Map<Types.TraceEvents.TraceEventLayoutShift, LayoutShiftRootCausesData> {
  const rootCausesByShift = new Map<Types.TraceEvents.TraceEventLayoutShift, LayoutShiftRootCausesData>();

  for (const shift of layoutShifts) {
    // Iframes
    const iframeCauses = iframeCreatedEvents.filter(event => isInInvalidationWindow(event, shift));

    // Font requests
    const fontRequestCauses = networkRequests.filter(
        req => isInInvalidationWindow(req, shift) && req.args.data.mimeType.startsWith('font') &&
            req.args.data.resourceType === 'Font');

    rootCausesByShift.set(shift, {iframes: iframeCauses, fontRequests: fontRequestCauses});
  }
  return rootCausesByShift;
}

export function generateInsight(
    traceParsedData: RequiredData<typeof deps>, context: NavigationInsightContext): InsightResult<{
  animationFailures?: readonly NoncompositedAnimationFailure[],
  shifts?: Map<Types.TraceEvents.TraceEventLayoutShift, LayoutShiftRootCausesData>,
}> {
  const isWithinSameNavigation = ((event: Types.TraceEvents.TraceEventData): boolean => {
    const nav =
        Helpers.Trace.getNavigationForTraceEvent(event, context.frameId, traceParsedData.Meta.navigationsByFrameId);
    return nav?.args.data?.navigationId === context.navigationId;
  });

  const compositeAnimationEvents = traceParsedData.Animations.animations.filter(isWithinSameNavigation);
  const animationFailures = getNonCompositedAnimations(compositeAnimationEvents);

  const iframeEvents =
      traceParsedData.LayoutShifts.renderFrameImplCreateChildFrameEvents.filter(isWithinSameNavigation);
  const networkRequests = traceParsedData.NetworkRequests.byTime.filter(isWithinSameNavigation);

  const layoutShifts = traceParsedData.LayoutShifts.clusters.flatMap(
      cluster =>
          // Use one of the events in the cluster to determine if within the same navigation.
      isWithinSameNavigation(cluster.events[0]) ? cluster.events : [],
  );

  // Get root causes.
  const shifts = getRootCausesPerShift(layoutShifts, networkRequests, iframeEvents);

  return {
    animationFailures,
    shifts,
  };
}
