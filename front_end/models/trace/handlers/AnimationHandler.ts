// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Helpers from '../helpers/helpers.js';
import * as Types from '../types/types.js';

import {HandlerState} from './types.js';

const animations: Types.TraceEvents.TraceEventAnimation[] = [];
const animationsSyntheticEvents: Types.TraceEvents.SyntheticAnimationPair[] = [];

export interface AnimationData {
  animations: readonly Types.TraceEvents.SyntheticAnimationPair[];
}
let handlerState = HandlerState.UNINITIALIZED;

export function reset(): void {
  animations.length = 0;
  animationsSyntheticEvents.length = 0;
}

export function handleEvent(event: Types.TraceEvents.TraceEventData): void {
  if (Types.TraceEvents.isTraceEventAnimation(event)) {
    // Skip the animation events in running state they don't have the non composited animation information we want.
    if (event.ph === Types.TraceEvents.Phase.ASYNC_NESTABLE_INSTANT) {
      if (event.args.data.state === 'running') {
        return;
      }
    }
    animations.push(event);
    return;
  }
}

export async function finalize(): Promise<void> {
  const syntheticEvents = Helpers.Trace.createMatchedSortedSyntheticEvents(animations);
  animationsSyntheticEvents.push(...syntheticEvents);
  handlerState = HandlerState.FINALIZED;
}

export function data(): AnimationData {
  if (handlerState !== HandlerState.FINALIZED) {
    throw new Error('Animation handler is not finalized');
  }

  return {
    animations: Array.from(animationsSyntheticEvents),
  };
}
