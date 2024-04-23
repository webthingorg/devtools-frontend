// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Types from '../types/types.js';

const frames = new Map<string, Types.TraceEvents.TraceFrame>();

export function reset(): void {
  frames.clear();
}

export function handleEvent(event: Types.TraceEvents.TraceEventData): void {
  if (Types.TraceEvents.isTraceEventTracingStartedInBrowser(event)) {
    for (const frame of event.args.data?.frames ?? []) {
      // The ID of a frame is stored under the `frame` key.
      frames.set(frame.frame, frame);
    }
    return;
  }

  // CommitLoad events can contain an updated URL or Name for a frame.
  if (Types.TraceEvents.isTraceEventCommitLoad(event)) {
    const frameData = event.args.data;
    if (!frameData) {
      return;
    }
    const frame = frames.get(frameData.frame);
    if (!frame) {
      return;
    }

    if (frameData.url) {
      frame.url = frameData.url;
    }
    if (frameData.name) {
      frame.name = frameData.name;
    }
  }
}

export interface PageFrameData {
  frames: Map<string, Types.TraceEvents.TraceFrame>;
}
export function data(): PageFrameData {
  return {
    frames,
  };
}
