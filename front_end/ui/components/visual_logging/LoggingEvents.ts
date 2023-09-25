// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {getLoggingState} from './LoggingState.js';

export interface VisualElementImpression {
  veid: number;
  type: number;
  parent?: number;
  context?: number;
}

interface ImpressionEvent {
  impressions: VisualElementImpression[];
}

export function logImpressions(elements: Element[]): void {
  const impressions = [];
  for (const element of elements) {
    const loggingState = getLoggingState(element);
    if (!loggingState) {
      continue;
    }
    const impression: VisualElementImpression = {veid: loggingState.veid, type: loggingState.config.ve};
    if (loggingState.parent) {
      impression.parent = loggingState.parent.veid;
    }
    impression.context = loggingState.config.context;
    impressions.push(impression);
  }
  if (impressions.length) {
    // TODO(dsv): Call UI bindings here
  }
}
