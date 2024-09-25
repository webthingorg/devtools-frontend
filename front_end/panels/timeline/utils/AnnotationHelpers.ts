// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Platform from '../../../core/platform/platform.js';
import * as Trace from '../../../models/trace/trace.js';
import type * as Overlays from '../overlays/overlays.js';

export function getAnnotationEntries(
    annotation: Trace.Types.File.Annotation,
    ): Trace.Types.Events.Event[] {
  const entries: Trace.Types.Events.Event[] = [];
  switch (annotation.type) {
    case 'ENTRY_LABEL':
      entries.push(annotation.entry);
      break;
    case 'TIME_RANGE':
      break;
    case 'ENTRIES_LINK':
      entries.push(annotation.entryFrom);
      if (annotation.entryTo) {
        entries.push(annotation.entryTo);
      }
      break;
    default:
      Platform.assertNever(annotation, 'Unsupported annotation type');
  }
  return entries;
}

/**
 * Gets a trace window that contains the given annotation. May return `null`
 * if there is no valid window (an ENTRIES_LINK without a `to` entry for
 * example.)
 */
export function getAnnotationWindow(
    annotation: Trace.Types.File.Annotation,
    ): Trace.Types.Timing.TraceWindowMicroSeconds|null {
  let annotationWindow: Trace.Types.Timing.TraceWindowMicroSeconds|null = null;
  const minVisibleEntryDuration = Trace.Types.Timing.MilliSeconds(1);

  switch (annotation.type) {
    case 'ENTRY_LABEL': {
      const eventDuration =
          annotation.entry.dur ?? Trace.Helpers.Timing.millisecondsToMicroseconds(minVisibleEntryDuration);

      annotationWindow = Trace.Helpers.Timing.traceWindowFromMicroSeconds(
          annotation.entry.ts,
          Trace.Types.Timing.MicroSeconds(annotation.entry.ts + eventDuration),
      );

      break;
    }
    case 'TIME_RANGE': {
      annotationWindow = annotation.bounds;
      break;
    }
    case 'ENTRIES_LINK': {
      // If entryTo does not exist, the annotation is in the process of being created.
      // Do not allow to zoom into it in this case.
      if (!annotation.entryTo) {
        break;
      }

      const fromEventDuration = (annotation.entryFrom.dur) ?? minVisibleEntryDuration;
      const toEventDuration = annotation.entryTo.dur ?? minVisibleEntryDuration;

      // To choose window max, check which entry ends later
      const fromEntryEndTS = (annotation.entryFrom.ts + fromEventDuration);
      const toEntryEndTS = (annotation.entryTo.ts + toEventDuration);
      const maxTimestamp = Math.max(fromEntryEndTS, toEntryEndTS);

      annotationWindow = Trace.Helpers.Timing.traceWindowFromMicroSeconds(
          annotation.entryFrom.ts,
          Trace.Types.Timing.MicroSeconds(maxTimestamp),
      );
      break;
    }
    default:
      Platform.assertNever(annotation, 'Unsupported annotation type');
  }

  return annotationWindow;
}

export function isTimeRangeLabel(overlay: Overlays.Overlays.TimelineOverlay):
    overlay is Overlays.Overlays.TimeRangeLabel {
  return overlay.type === 'TIME_RANGE';
}

export function isEntriesLink(overlay: Overlays.Overlays.TimelineOverlay): overlay is Overlays.Overlays.EntriesLink {
  return overlay.type === 'ENTRIES_LINK';
}

export function isEntryLabel(overlay: Overlays.Overlays.TimelineOverlay): overlay is Overlays.Overlays.EntryLabel {
  return overlay.type === 'ENTRY_LABEL';
}

function getAnnotationTimestamp(annotation: Trace.Types.File.Annotation): Trace.Types.Timing.MicroSeconds {
  if (Trace.Types.File.isEntryLabelAnnotation(annotation)) {
    return annotation.entry.ts;
  }
  if (Trace.Types.File.isEntriesLinkAnnotation(annotation)) {
    return annotation.entryFrom.ts;
  }
  if (Trace.Types.File.isTimeRangeAnnotation(annotation)) {
    return annotation.bounds.min;
  }
  // This part of code shouldn't be reached. If it is here then the annotation has an invalid type, so return the
  // max timestamp to push it to the end.
  console.error('Invalid annotation type.');
  // Since we need to compare the values, so use `MAX_SAFE_INTEGER` instead of `MAX_VALUE`.
  return Trace.Types.Timing.MicroSeconds(Number.MAX_SAFE_INTEGER);
}

export function compareAnnotationsTimestamps(
    firstAnnotation: Trace.Types.File.Annotation, secondAnnotation: Trace.Types.File.Annotation): number {
  return getAnnotationTimestamp(firstAnnotation) - getAnnotationTimestamp(secondAnnotation);
}
