// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Copyright 2021 Google LLC. All rights reserved.

// import * as Common from '../../../../../devtools-frontend/front_end/core/common/common.js';
// import * as Core from '../core/core.js';

// import {LighthouseProcessor} from './LighthouseProcessor.js';
import * as Handlers from './handlers/handlers.js';
import {TraceProcessor} from './TraceProcessor.js';
import type * as Types from './types/types.js';

export class Model extends EventTarget {
  readonly #traceProcessor = new TraceProcessor(Handlers.ModelHandlers);
  readonly #traces: ParsedTraceFile[] = [];
  readonly #nextNumberByDomain = new Map<string, number>();

  readonly #recordingsAvailable: string[] = [];
  #lastRecordingIndex = 0;

  constructor() {
    super();
  }

  async parse(
      traceEvents: Types.TraceEvents.TraceEventData[], metadata: TraceFileMetaData = {},
      freshRecording = false): Promise<void> {
    // During parsing, periodically update any listeners on each processors'
    // progress (if they have any updates).

    const onTraceUpdate = (event: Event): void => {
      const {data} = event as TraceParseEvent;
      this.dispatchEvent(new ModelUpdateEvent({type: ModelUpdateType.TRACE, data: data}));
    };

    this.#traceProcessor.addEventListener(TraceParseEvent.eventName, onTraceUpdate);

    // Create a parsed trace file, populating it in parallel as each processor
    // finishes its parsing process.

    const file: ParsedTraceFile = {
      traceEvents,
      metadata,
      traceParsedData: null,
    };

    // When processors have finished parsing, store the parsed data so that it
    // is available to call sites notified by each respective 'done' update.

    const traceProcessing = async(): Promise<void> => {
      await this.#traceProcessor.parse(traceEvents, freshRecording);
      file.traceParsedData = this.#traceProcessor.data;
      this.#lastRecordingIndex++;
      let recordingName = `Trace ${this.#lastRecordingIndex}`;
      let origin: string|null = null;
      if (file.traceParsedData) {
        origin = extractOriginFromTrace(file.traceParsedData);
        if (origin) {
          // TODO: this is broken; fix this when the helper is merged into devtools-frontend.
          // const nextSequenceForDomain =
          //     Core.Helpers.CommonHelpers.getWithDefault(this.#nextNumberByDomain, origin, () => 1);
          const nextSequenceForDomain = 1;
          recordingName = `${origin} (${nextSequenceForDomain})`;
          this.#nextNumberByDomain.set(origin, nextSequenceForDomain + 1);
        }
      }
      this.#recordingsAvailable.push(recordingName);
      this.dispatchEvent(new ModelUpdateEvent({type: ModelUpdateType.TRACE, data: 'done'}));
    };

    try {
      // Wait for all outstanding promises before finishing the async execution,
      // but perform all tasks in parallel.
      await traceProcessing();
      // We only push the file onto this.#traces here once we know it's valid
      // and there's been no errors in the parsing.
      this.#traces.push(file);
    } catch (e) {
      throw e;
    } finally {
      // All processors have finished parsing, no more updates are expected.
      // Finally, update any listeners that all processors are 'done'.
      this.#traceProcessor.removeEventListener(TraceParseEvent.eventName, onTraceUpdate);
      this.dispatchEvent(new ModelUpdateEvent({type: ModelUpdateType.GLOBAL, data: 'done'}));
    }
  }

  traceParsedData(index: number): Handlers.Types.TraceParseData|null {
    if (!this.#traces[index]) {
      return null;
    }

    return this.#traces[index].traceParsedData;
  }

  metadata(index: number): TraceFileMetaData|null {
    if (!this.#traces[index]) {
      return null;
    }

    return this.#traces[index].metadata;
  }

  traceEvents(index: number): Types.TraceEvents.TraceEventData[]|null {
    if (!this.#traces[index]) {
      return null;
    }

    return this.#traces[index].traceEvents;
  }

  size(): number {
    return this.#traces.length;
  }

  deleteTraceByIndex(recordingIndex: number): void {
    this.#traces.splice(recordingIndex, 1);
    this.#recordingsAvailable.splice(recordingIndex, 1);
  }

  getRecordingsAvailable(): string[] {
    return this.#recordingsAvailable;
  }

  reset(): void {
    this.#traceProcessor.reset();
  }
}

/**
 * This parsed trace file is used by the Model. It keeps multiple instances
 * of these so that the user can swap between them. The key is that it is
 * essentially the TraceFile plus whatever the model has parsed from it.
 */
export type ParsedTraceFile<K = unknown> = TraceFile<K>&{
  traceParsedData: Handlers.Types.TraceParseData | null,
};

export const enum ModelUpdateType {
  GLOBAL = 0,
  TRACE = 1,
  LIGHTHOUSE = 2,
}

export type ModelUpdateEventData = ModelUpdateEventGlobalData|ModelUpdateEventTraceData|ModelUpdateEventLighthouseData;

export type ModelUpdateEventGlobalData = {
  type: ModelUpdateType.GLOBAL,
  data: GlobalParseEventData,
};

export type ModelUpdateEventTraceData = {
  type: ModelUpdateType.TRACE,
  data: TraceParseEventData,
};

export type ModelUpdateEventLighthouseData = {
  type: ModelUpdateType.LIGHTHOUSE,
  data: LighthouseParseEventData,
};

export type GlobalParseEventData = 'done';
export type TraceParseEventData = TraceParseEventProgressData|'done';
export type LighthouseParseEventData = 'done';

export type TraceParseEventProgressData = {
  index: number,
  total: number,
};

export class ModelUpdateEvent extends Event {
  static readonly eventName = 'modelupdate';
  constructor(public data: ModelUpdateEventData) {
    super(ModelUpdateEvent.eventName);
  }
}

export function extractOriginFromTrace(_trace: Handlers.Types.TraceParseData): string|null {
  return null;
  // const firstNavigation = trace.Meta.mainFrameURL;
  // const url = Common.ParsedURL.ParsedURL.fromString(firstNavigation);
  // if (url) {
  //   // We do this to save some space in the toolbar - seeing the `www` is less
  //   // useful than seeing `foo.com` if it's truncated at narrow widths
  //   if (url.host.startsWith('www.')) {
  //     return url.host.slice(4);
  //   }
  //   return url.host;
  // }
  // return null;
}

export function isModelUpdateEventDataGlobal(object: ModelUpdateEventData): object is ModelUpdateEventGlobalData {
  return object.type === ModelUpdateType.GLOBAL;
}

export function isModelUpdateEventDataTrace(object: ModelUpdateEventData): object is ModelUpdateEventTraceData {
  return object.type === ModelUpdateType.TRACE;
}

export class TraceParseEvent extends Event {
  static readonly eventName = 'traceparse';
  constructor(public data: TraceParseEventData, init: EventInit = {bubbles: true}) {
    super(TraceParseEvent.eventName, init);
  }
}

export type TraceFile<K = unknown> = {
  traceEvents: Types.TraceEvents.TraceEventData[],
  metadata: TraceFileMetaData<K>,
};

/**
 * Trace metadata that we persist to the file. This will allow us to
 * store specifics for the trace, e.g., which tracks should be visible
 * on load.
 */
export interface TraceFileMetaData<K = unknown> {
  source?: 'DevTools';
  trackConfiguration?: TrackConfigurationOptions<K>;
  networkThrottling?: string;
  cpuThrottling?: number;
}

// We genericize this so that later we can pass it the names of tracks
// exported from library/components/tracks. This in turn means that we
// can ensure a little bit of type safety with respect to the track
// types we initialize.
//
// Since the track config is persisted to the trace metadata, there is
// nothing to stop someone from editing the names there, so despite this type
// information we still explicitly map from the name to the particular
// track type in the view, ignoring any we don't recognize.
export interface TrackConfigurationOptions<TrackName> {
  tracks: Array<{name: TrackName, visible: boolean}>;
}

export type TraceFileContents<T = unknown> = TraceFile<T>|Types.TraceEvents.TraceEventData[];

declare global {
  interface HTMLElementEventMap {
    [TraceParseEvent.eventName]: TraceParseEvent;
  }
}
