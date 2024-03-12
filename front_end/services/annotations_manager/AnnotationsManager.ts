// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Types from '../../models/trace/types/types.js';

let instance: AnnotationsManager|null = null;

export interface Annotations {
  hiddenRendererEventsIndexes: number[];
  hiddenProfileCallsSampleIndexes: number[];
  hiddenProfileCallsDepths: number[];
}
export class AnnotationsManager {
  /**
   * Array with renderer entries in the original order they appear in the trace file.
   * We use it to find the position on annotated entries and save them into the trace file.
   * To load and apply the annotations from the file, get the entry with the the corresponding index.
   */
  #allTraceRendererEntries: Types.TraceEvents.SyntheticTraceEntry[] = [];
  /**
   * Array with all hidden entries. This array corresponds to the one in EntriesFilter.
   */
  #hiddenEntries: Types.TraceEvents.TraceEventData[] = [];

  static instance(opts: {
    forceNew: boolean|null,
  } = {forceNew: null}): AnnotationsManager {
    const forceNew = Boolean(opts.forceNew);
    if (!instance || forceNew) {
      instance = new AnnotationsManager();
    }
    return instance;
  }

  static removeInstance(): void {
    instance = null;
  }
  private constructor() {
  }

  setAllTraceRendererEntriesUnsorted(entries: Types.TraceEvents.SyntheticTraceEntry[]): void {
    this.#allTraceRendererEntries = entries;
  }

  /**
   * Builds all annotations and returns the object written into the 'annotations' trae file metada field.
   */
  getAnnotations(): Annotations {
    const indexesOfSynteticEntries = [];
    for (const entry of this.#hiddenEntries) {
      if (!Types.TraceEvents.isProfileCall(entry)) {
        indexesOfSynteticEntries.push(this.#allTraceRendererEntries.indexOf(entry));
      }
    }

    return {
      hiddenRendererEventsIndexes: indexesOfSynteticEntries,
      hiddenProfileCallsSampleIndexes: [],
      hiddenProfileCallsDepths: [],
    };
  }

  setHiddenEntries(hiddenEntries: Types.TraceEvents.TraceEventData[]): void {
    this.#hiddenEntries = hiddenEntries;
  }
}
