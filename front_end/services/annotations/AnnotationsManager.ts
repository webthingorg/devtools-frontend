import * as Types from '../../models/trace/types/types.js';

let instance: AnnotationsManager|null = null;
export class AnnotationsManager {
    #allTraceEntries: Types.TraceEvents.SyntheticTraceEntry[]= [];

    static instance(opts: {
        forceNew: boolean|null,
      } = {forceNew: null}): AnnotationsManager {
        const forceNew = Boolean(opts.forceNew);
        if (!instance || forceNew) {
          instance = new AnnotationsManager();
        }
        return instance;
      }

    private constructor() {
        console.log("hey");
    }

    setSyntheticEntriesUnsortedArray(entries: Types.TraceEvents.SyntheticTraceEntry[]) {
        this.#allTraceEntries = entries;
    }
}