import * as Types from '../../models/trace/types/types.js';

let instance: AnnotationsManager|null = null;

export interface Annotations {
  hiddenRendererEventsIndexes: number[],
  hiddenProfileCallsSampleIndexes: number[],
  hiddenProfileCallsDepths: number[],
}
export class AnnotationsManager {
    #allTraceEntries: Types.TraceEvents.SyntheticTraceEntry[]= [];
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

    private constructor() {}

    setSyntheticEntriesUnsortedArray(entries: Types.TraceEvents.SyntheticTraceEntry[]) {
      this.#allTraceEntries = entries;
    }

    getAnnotations(): Annotations {
      const indexesOfSynteticEntries = [];
      for(const entry of this.#hiddenEntries) {
        if(!Types.TraceEvents.isProfileCall(entry)) {
          indexesOfSynteticEntries.push(this.#allTraceEntries.indexOf(entry));
        }
      }

      return {
        hiddenRendererEventsIndexes: indexesOfSynteticEntries,
        hiddenProfileCallsSampleIndexes: [],
        hiddenProfileCallsDepths: [],
      };
    }

    setHiddenEntries(hiddenEntries: Types.TraceEvents.TraceEventData[]): void{
      this.#hiddenEntries = hiddenEntries;
    }
    
}