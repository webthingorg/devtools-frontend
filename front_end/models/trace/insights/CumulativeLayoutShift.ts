// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Helpers from '../helpers/helpers.js';
import type * as Types from '../types/types.js';

import {
  AnimationFailureReasons,
  type InsightResult,
  type NavigationInsightContext,
  type RequiredData,
} from './types.js';

export function deps(): ['Meta', 'Animations'] {
  return ['Meta', 'Animations'];
}

export interface NoncompositedAnimationFailures {
  /**
   * Animation name.
   */
  name?: string;
  /**
   * Failure reason based on mask number defined in https://source.chromium.org/search?q=f:compositor_animations.h%20%22enum%20FailureReason%22.
   */
  failureReasons: AnimationFailureReasons[];
  /**
   * Unsupported properties.
   */
  unsupportedProperties?: string[];
}

/**
 * Each failure reason is represented by a bit flag. The bit shift operator '<<' is used to define which bit corresponds to each failure reason.
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

function getNonCompositedAnimations(animations: readonly Types.TraceEvents.SyntheticAnimationPair[]):
    NoncompositedAnimationFailures[] {
  const failures: NoncompositedAnimationFailures[] = [];
  for (const event of animations) {
    const statusEvent = event.args.data.statusEvent;
    const beginEvent = event.args.data.beginEvent;
    if (statusEvent) {
      const failureMask = statusEvent.args.data.compositeFailed;
      const unsupportedProperties = statusEvent.args.data.unsupportedProperties;
      if (failureMask) {
        const failureReasons = ACTIONABLE_FAILURE_REASONS.filter(reason => failureMask & reason.flag).map(reason => {
          return reason.failure;
        });
        const failure: NoncompositedAnimationFailures = {
          name: beginEvent.args.data.displayName,
          failureReasons,
          unsupportedProperties,
        };
        failures.push(failure);
      }
    }
  }
  return failures;
}

export function generateInsight(traceParsedData: RequiredData<typeof deps>, context: NavigationInsightContext):
    InsightResult<{animationFailures?: NoncompositedAnimationFailures[]}> {
  const animationEvents = traceParsedData.Animations.animations.filter(event => {
    const nav =
        Helpers.Trace.getNavigationForTraceEvent(event, context.frameId, traceParsedData.Meta.navigationsByFrameId);
    return nav?.args.data?.navigationId === context.navigationId;
  });
  const animationFailures = getNonCompositedAnimations(animationEvents);
  return {
    animationFailures,
  };
}
