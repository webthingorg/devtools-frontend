// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Copyright 2023222 The Chromium Author2s. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as TraceEngine from '../../../../../front_end/models/trace/trace.js';
import {TraceLoader} from '../../helpers/TraceLoader.js';

function getMainThread(data: TraceEngine.Handlers.ModelHandlers.Renderer.RendererHandlerData):
    TraceEngine.Handlers.ModelHandlers.Renderer.RendererThread {
  let mainThread: TraceEngine.Handlers.ModelHandlers.Renderer.RendererThread|null = null;
  for (const [, process] of data.processes) {
    for (const [, thread] of process.threads) {
      if (thread.name === 'CrRendererMain') {
        mainThread = thread;
        break;
      }
    }
  }
  if (!mainThread) {
    throw new Error('Could not find main thread.');
  }
  return mainThread;
}

function findFirstEntry(
    allEntries: readonly TraceEngine.Types.TraceEvents.TraceEntry[],
    predicate: (entry: TraceEngine.Types.TraceEvents.TraceEntry) => boolean): TraceEngine.Types.TraceEvents.TraceEntry {
  const entry = allEntries.find(entry => predicate(entry));
  if (!entry) {
    throw new Error('Could not find expected entry.');
  }
  return entry;
}

describe('EntriesFilter', function() {
  it('parses a stack and returns an empty list of invisible entries', async function() {
    const data = await TraceLoader.traceEngine(this, 'basic-stack.json.gz');
    const stack = new TraceEngine.EntriesFilter.EntriesFilter(data.Renderer.entryToNode);
    assert.deepEqual([], stack.invisibleEntries());
  });

  it('supports the user merging an entry into its parent', async function() {
    const data = await TraceLoader.traceEngine(this, 'basic-stack.json.gz');
    const mainThread = getMainThread(data.Renderer);
    /** This stack looks roughly like so (with some events omitted):
     * ======== basicStackOne ============
     * =========== basicTwo ==============
     * =========== basicThree ============
     *              ======== fibonacci ===
     *              ======== fibonacci ===
     *              ======== fibonacci ===
     *              ======== fibonacci ===
     *              ======== fibonacci ===
     *                  ==== fibonacci ===
     *
     * In this test we want to test the user merging basicTwo into its parent, so the resulting trace should look like so:
     * ======== basicStackOne ============
     * =========== basicThree ============ << No more basicTwo, it has been merged.
     *              ======== fibonacci ===
     *              ======== fibonacci ===
     *              ======== fibonacci ===
     *              ======== fibonacci ===
     *              ======== fibonacci ===
     *                  ==== fibonacci ===
     *
     **/
    const entryTwo = findFirstEntry(mainThread.entries, entry => {
      // Processing this trace ends up with two distinct stacks for basicTwo()
      // So we find the first one so we can focus this test on just one stack.
      return TraceEngine.Types.TraceEvents.isProfileCall(entry) && entry.callFrame.functionName === 'basicTwo' &&
          entry.dur === 827;
    });
    const stack = new TraceEngine.EntriesFilter.EntriesFilter(data.Renderer.entryToNode);
    stack.applyAction({type: TraceEngine.EntriesFilter.FilterApplyAction.MERGE_FUNCTION, entry: entryTwo});
    assert.isTrue(stack.invisibleEntries().includes(entryTwo), 'entryTwo is invisble');
    // Only one entry - the one for the `basicTwo` function - should have been hidden.
    assert.strictEqual(stack.invisibleEntries().length, 1);
  });

  it('supports removing an action', async function() {
    const data = await TraceLoader.traceEngine(this, 'basic-stack.json.gz');

    // First we merge basicTwo() into its parent which is the same as the test above.
    const mainThread = getMainThread(data.Renderer);
    const entryTwo = findFirstEntry(mainThread.entries, entry => {
      // Processing this trace ends up with two distinct stacks for basicTwo()
      // So we find the first one so we can focus this test on just one stack.
      return TraceEngine.Types.TraceEvents.isProfileCall(entry) && entry.callFrame.functionName === 'basicTwo' &&
          entry.dur === 827;
    });
    const stack = new TraceEngine.EntriesFilter.EntriesFilter(data.Renderer.entryToNode);
    stack.applyAction({type: TraceEngine.EntriesFilter.FilterApplyAction.MERGE_FUNCTION, entry: entryTwo});
    assert.isTrue(stack.invisibleEntries().includes(entryTwo), 'entryTwo is invisible');
    // Only one entry - the one for the `basicTwo` function - should have been hidden.
    assert.strictEqual(stack.invisibleEntries().length, 1);

    // Now remove the action and ensure that all entries are now visible.
    stack.removeActiveAction({type: TraceEngine.EntriesFilter.FilterApplyAction.MERGE_FUNCTION, entry: entryTwo});
    assert.strictEqual(stack.invisibleEntries().length, 0, 'All the entries should be visible.');
  });

  it('supports collapsing an entry', async function() {
    const data = await TraceLoader.traceEngine(this, 'basic-stack.json.gz');
    const mainThread = getMainThread(data.Renderer);
    /** This stack looks roughly like so (with some events omitted):
     * ======== basicStackOne ============
     * =========== basicTwo ==============
     * =========== basicThree ============
     *              ======== fibonacci ===
     *              ======== fibonacci ===
     *              ======== fibonacci ===
     *              ======== fibonacci ===
     *              ======== fibonacci ===
     *                  ==== fibonacci ===
     *
     * In this test we want to test the user collapsing basicTwo, which should have the effect of keeping basicTwo visible, but removing all of its children:
     * ======== basicStackOne ============
     * =========== basicTwo ==============
     *                                    << all children removed
     **/
    const basicTwoCallEntry = findFirstEntry(mainThread.entries, entry => {
      // Processing this trace ends up with two distinct stacks for basicTwo()
      // So we find the first one so we can focus this test on just one stack.
      return TraceEngine.Types.TraceEvents.isProfileCall(entry) && entry.callFrame.functionName === 'basicTwo' &&
          entry.dur === 827;
    });

    // Gather the fib() calls under the first basicTwo stack, by finding all
    // the calls whose end time is less than or equal to the end time of the
    // `basicTwo` function.
    const fibonacciCalls = mainThread.entries.filter(entry => {
      const isFibCall =
          TraceEngine.Types.TraceEvents.isProfileCall(entry) && entry.callFrame.functionName === 'fibonacci';
      if (!isFibCall) {
        return false;
      }
      const {endTime} = TraceEngine.Helpers.Timing.eventTimingsMicroSeconds(entry);
      const basicTwoCallEndTime = TraceEngine.Helpers.Timing.eventTimingsMicroSeconds(basicTwoCallEntry).endTime;
      return endTime <= basicTwoCallEndTime;
    });
    const stack = new TraceEngine.EntriesFilter.EntriesFilter(data.Renderer.entryToNode);
    stack.applyAction({type: TraceEngine.EntriesFilter.FilterApplyAction.COLLAPSE_FUNCTION, entry: basicTwoCallEntry});

    // We collapsed at the `basicTwo` entry - so it should not be included in the invisible list itself.
    assert.isFalse(stack.invisibleEntries().includes(basicTwoCallEntry), 'entryTwo is not visible');
    // But all fib() calls below it in the stack should now be invisible.
    const allFibonacciInStackAreHidden = fibonacciCalls.every(fibCall => {
      return stack.invisibleEntries().includes(fibCall);
    });
    assert.isTrue(allFibonacciInStackAreHidden, 'Some fibonacci calls are still visible');
  });

  it('supports collapsing all repeating entries among descendants', async function() {
    
  })
});
