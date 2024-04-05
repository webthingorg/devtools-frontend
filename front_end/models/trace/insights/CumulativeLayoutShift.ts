// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as Types from '../types/types.js';

import {type InsightResult, type RequiredData} from './types.js';

export function deps(): ['Meta', 'Animations'] {
  return ['Meta', 'Animations'];
}

export interface NoncompositedAnimationFailures {
  /**
   * Animation name.
   * TODO: get the name ?
   */
  name?: string;
  /**
   * Failure mask number defined in https://source.chromium.org/search?q=f:compositor_animations.h%20%22enum%20FailureReason%22.
   */
  failureMask: number;
  /**
   * Unsupported properties.
   */
  unsupportedProperties: string[];
}

function getNonCompositedAnimations(animations: readonly Types.TraceEvents.SyntheticAnimationPair[]):
    NoncompositedAnimationFailures[] {
  const failures: NoncompositedAnimationFailures[] = [];
  for (const event of animations) {
    const statusEvent = event.args.data.statusEvent;
    if (statusEvent) {
      const failureMask = statusEvent.args.data.compositeFailed;
      const unsupportedProperties = statusEvent.args.data.unsupportedProperties;
      if (failureMask && unsupportedProperties) {
        failures.push({failureMask, unsupportedProperties});
      }
    }
  }
  return failures;
}

export function generateInsight(traceParsedData: RequiredData<typeof deps>):
    InsightResult<{animationFailures?: NoncompositedAnimationFailures[]}> {
  const animationEvents = traceParsedData.Animations.animations;
  const animationFailures = getNonCompositedAnimations(animationEvents);
  return {
    animationFailures,
  };
}
