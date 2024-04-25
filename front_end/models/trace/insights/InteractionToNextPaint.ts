// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {type SyntheticInteractionPair} from '../types/TraceEvents.js';

import {type InsightAnnotation, type InsightResult, type NavigationInsightContext, type RequiredData} from './types.js';

export function deps(): ['UserInteractions'] {
  return ['UserInteractions'];
}

type Result = InsightResult<{
  longestInteractionEvent?: SyntheticInteractionPair,
  highPercentileInteractionEvent?: SyntheticInteractionPair,
}>;

function createAnnotations(event: SyntheticInteractionPair): InsightAnnotation[] {
  // Determine end times (in microseconds) for each phase.
  const startTs = event.args.data.beginEvent.ts;
  const endTs = event.args.data.endEvent.ts;
  const inputDelay = event.processingStart;
  const processing = event.processingEnd;
  const presentation = endTs;

  return [
    {
      type: 'range',
      from: startTs,
      to: inputDelay,
      text: 'Input delay',
    },
    {
      type: 'range',
      from: inputDelay,
      to: processing,
      text: 'Processing duration',
    },
    {
      type: 'range',
      from: processing,
      to: presentation,
      text: 'Presentation delay',
    },
  ];
}

export function generateInsight(traceParsedData: RequiredData<typeof deps>, context: NavigationInsightContext): Result {
  const interactionEvents = traceParsedData.UserInteractions.interactionEvents.filter(event => {
    return event.args.data.navigationId === context.navigationId;
  });

  if (!interactionEvents.length) {
    // A valid result, when there is no user interaction.
    return {};
  }

  const longestByInteractionId = new Map<number, SyntheticInteractionPair>();
  for (const event of interactionEvents) {
    const key = event.interactionId;
    const longest = longestByInteractionId.get(key);
    if (!longest || event.dur > longest.dur) {
      longestByInteractionId.set(key, event);
    }
  }
  const normalizedInteractionEvents = [...longestByInteractionId.values()];
  normalizedInteractionEvents.sort((a, b) => b.dur - a.dur);
  const longestInteractionEvent = normalizedInteractionEvents[0];
  const annotations =
    longestInteractionEvent ? createAnnotations(longestInteractionEvent) : undefined;

  // INP is the "nearest-rank"/inverted_cdf 98th percentile, except Chrome only
  // keeps the 10 worst events around, so it can never be more than the 10th from
  // last array element. To keep things simpler, sort desc and pick from front.
  // See https://source.chromium.org/chromium/chromium/src/+/main:components/page_load_metrics/browser/responsiveness_metrics_normalization.cc;l=45-59;drc=cb0f9c8b559d9c7c3cb4ca94fc1118cc015d38ad
  const highPercentileIndex = Math.min(9, Math.floor(normalizedInteractionEvents.length / 50));

  return {
    annotations,
    longestInteractionEvent,
    highPercentileInteractionEvent: normalizedInteractionEvents[highPercentileIndex],
  };
}
