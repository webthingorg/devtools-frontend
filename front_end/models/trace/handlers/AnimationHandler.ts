// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Helpers from '../helpers/helpers.js';
import * as Types from '../types/types.js';

import {HandlerState} from './types.js';

const animations: Types.TraceEvents.TraceEventAnimation[] = [];
const compositeAnimations: Types.TraceEvents.TraceEventAnimation[] = [];
const animationsSyntheticEvents: Types.TraceEvents.SyntheticAnimationPair[] = [];
const compositeAnimationsSyntheticEvents: Types.TraceEvents.SyntheticAnimationPair[] = [];

export interface AnimationData {
  animations: readonly Types.TraceEvents.SyntheticAnimationPair[];
  compositeAnimations: readonly Types.TraceEvents.SyntheticAnimationPair[];
}
let handlerState = HandlerState.UNINITIALIZED;

export function reset(): void {
  animations.length = 0;
  compositeAnimations.length = 0;
  animationsSyntheticEvents.length = 0;
  compositeAnimationsSyntheticEvents.length = 0;
}

export function handleEvent(event: Types.TraceEvents.TraceEventData): void {
  if (Types.TraceEvents.isTraceEventAnimation(event)) {
    animations.push(event);
    /**
     * Animation events containing composite information are pairs of ASYNC_NESTABLE_START ('b')
     * and ASYNC_NESTABLE_INSTANT ('n') that are in a non "running" state. We filter for these in order
     * to create the synthetic pairs appropriately in finalize().
     *
     * There are times when ASYNC_NESTABLE_INSTANT ('n') don't have a corresponding
     * ASYNC_NESTABLE_END ('e') event, so let's just use 'b' & 'n' events for our compositeAnimationsSyntheticEvents.
     */
    const isStartAnimationEvent = event.ph === Types.TraceEvents.Phase.ASYNC_NESTABLE_START;
    const isNotRunningState =
        event.ph === Types.TraceEvents.Phase.ASYNC_NESTABLE_INSTANT && event.args.data.state !== 'running';
    if (isStartAnimationEvent || isNotRunningState) {
      compositeAnimations.push(event);
    }
    return;
  }
}

export async function finalize(): Promise<void> {
  const syntheticEvents = Helpers.Trace.createMatchedSortedSyntheticEvents(animations);
  const syntheticCompositeEvents = Helpers.Trace.createMatchedSortedSyntheticEvents(compositeAnimations);
  animationsSyntheticEvents.push(...syntheticEvents);
  compositeAnimationsSyntheticEvents.push(...syntheticCompositeEvents);
  handlerState = HandlerState.FINALIZED;
}

export function data(): AnimationData {
  if (handlerState !== HandlerState.FINALIZED) {
    throw new Error('Animation handler is not finalized');
  }

  return {
    animations: Array.from(animationsSyntheticEvents),
    compositeAnimations: Array.from(compositeAnimationsSyntheticEvents),
  };
}
