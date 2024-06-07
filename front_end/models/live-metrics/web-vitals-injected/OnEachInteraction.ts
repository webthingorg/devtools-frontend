// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileoverview web-vitals.js doesn't provide a log of all interactions.
 * This was largely copied from the web vitals extension:
 * https://github.com/GoogleChrome/web-vitals-extension/blob/main/src/browser_action/on-each-interaction.js
 */

import {INPThresholds, Metric, INPAttribution, DEFAULT_DURATION_THRESHOLD} from '../../../third_party/web-vitals/web-vitals.js';

export interface InteractionWithAttribution {
  attribution: {
    interactionTargetElement: Node|null,
    interactionTime: number,
    interactionType: INPAttribution['interactionType'],
    interactionId: number;
  },
  entries: PerformanceEntry[],
  rating: Metric['rating'],
  value: number,
}

export function onEachInteraction(callback: (interaction: InteractionWithAttribution) => void) {
  const valueToRating = (score: number) => score <= INPThresholds[0] ? 'good' : score <= INPThresholds[1] ? 'needs-improvement' : 'poor';

  const eventObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const interactions = new Map<number, PerformanceEventTiming[]>();

    const performanceEventTimings = entries
      .filter((entry): entry is PerformanceEventTiming => 'interactionId' in entry)
      .filter((entry) => entry.interactionId);

    for (const entry of performanceEventTimings) {
      const interaction = interactions.get(entry.interactionId) || [];
      interaction.push(entry);
      interactions.set(entry.interactionId, interaction);
    }

    // Will report as a single interaction even if parts are in separate frames.
    // Consider splitting by animation frame.
    for (const [interactionId, interaction] of interactions.entries()) {
      const entry = interaction.reduce((prev, curr) => prev.duration >= curr.duration ? prev : curr);
      const value = entry.duration;

      const firstEntryWithTarget = interaction.find(entry => entry.target);

      callback({
        attribution: {
          interactionTargetElement: firstEntryWithTarget?.target ?? null,
          interactionTime: entry.startTime,
          interactionType: entry.name.startsWith('key') ? 'keyboard' : 'pointer',
          interactionId,
        },
        entries: interaction,
        rating: valueToRating(value),
        value,
      });
    }
  });

  eventObserver.observe({
    type: 'first-input',
    buffered: true,
  })

  eventObserver.observe({
    type: 'event',
    durationThreshold: DEFAULT_DURATION_THRESHOLD,
    buffered: true,
  });
}
