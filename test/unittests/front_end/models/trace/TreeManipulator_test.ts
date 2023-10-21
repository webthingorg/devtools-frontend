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

describe('TreeManipulator', function() {
  it('parses a stack and returns all the entries and tree', async function() {
    const data = await TraceLoader.traceEngine(this, 'basic-stack.json.gz');
    const mainThread = getMainThread(data.Renderer);
    const stack = new TraceEngine.TreeManipulator.TreeManipulator(mainThread, data.Renderer.entryToNode);
    assert.deepEqual(mainThread.entries, stack.visibleEntriesAndTree().entries);
    assert.deepEqual(mainThread.tree, stack.visibleEntriesAndTree().tree);
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
    const entryOne = findFirstEntry(mainThread.entries, entry => {
      // Processing this trace ends up with two distinct stacks for basicStackOne()
      // So we find the first one so we can focus this test on just one stack.
      return TraceEngine.Types.TraceEvents.isProfileCall(entry) && entry.callFrame.functionName === 'basicStackOne' &&
          entry.dur === 827;
    });
    const entryTwo = findFirstEntry(mainThread.entries, entry => {
      // Processing this trace ends up with two distinct stacks for basicTwo()
      // So we find the first one so we can focus this test on just one stack.
      return TraceEngine.Types.TraceEvents.isProfileCall(entry) && entry.callFrame.functionName === 'basicTwo' &&
          entry.dur === 827;
    });
    const entryThree = findFirstEntry(mainThread.entries, entry => {
      // Processing this trace ends up with two distinct stacks for basicThree()
      // So we find the first one so we can focus this test on just one stack.
      return TraceEngine.Types.TraceEvents.isProfileCall(entry) && entry.callFrame.functionName === 'basicThree' &&
          entry.dur === 827;
    });

    const stack = new TraceEngine.TreeManipulator.TreeManipulator(mainThread, data.Renderer.entryToNode);
    stack.applyAction({type: 'MERGE_FUNCTION', entry: entryTwo});

    const visibleEntries = stack.visibleEntriesAndTree().entries;
    assert.isFalse(visibleEntries.includes(entryTwo), 'entryTwo is still visible');
    // Check entryTwo's parent and child are still visible
    const entryOneIndexAfterAction = visibleEntries.findIndex(entry => {
      return TraceEngine.Types.TraceEvents.isProfileCall(entry) && entry.callFrame.functionName === 'basicStackOne' &&
          entry.dur === 827;
    });
    const entryThreeIndexAfterAction = visibleEntries.findIndex(entry => {
      return TraceEngine.Types.TraceEvents.isProfileCall(entry) && entry.callFrame.functionName === 'basicThree' &&
          entry.dur === 827;
    });
    // Add a sanity check, since |basicTwo| is no longer visible, the |basicStackOne| and |basicThree| should be
    // connected.
    assert.strictEqual(entryOneIndexAfterAction + 1, entryThreeIndexAfterAction);
    assert.deepEqual(
        stack.visibleEntriesAndTree()
            .tree.nodes.get(entryOneIndexAfterAction as TraceEngine.Helpers.TreeHelpers.TraceEntryNodeId)
            ?.entry,
        entryOne);
    assert.deepEqual(
        stack.visibleEntriesAndTree()
            .tree.nodes.get(entryThreeIndexAfterAction as TraceEngine.Helpers.TreeHelpers.TraceEntryNodeId)
            ?.entry,
        entryThree);

    // Only one entry - the one for the `basicTwo` function - should have been hidden.
    assert.strictEqual(visibleEntries.length, mainThread.entries.length - 1);
    // The tree should be built in the TraceEngine. Or in the TreeManipulator.
    assert.exists(mainThread.tree);
    const originalTreeMaxDepth = mainThread.tree?.maxDepth as number;
    // In this test case, the stack we modified is the tallest, so when we merge one function in this stack, the
    // |maxDepth| is reduced by 1.
    assert.strictEqual(stack.visibleEntriesAndTree().tree.maxDepth, originalTreeMaxDepth - 1);
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
    const stack = new TraceEngine.TreeManipulator.TreeManipulator(mainThread, data.Renderer.entryToNode);
    stack.applyAction({type: 'MERGE_FUNCTION', entry: entryTwo});
    // Add some sanity check here, see 'supports the user merging an entry into its parent' test for more information.
    assert.isFalse(stack.visibleEntriesAndTree().entries.includes(entryTwo), 'entryTwo is still visible');
    assert.strictEqual(stack.visibleEntriesAndTree().entries.length, mainThread.entries.length - 1);
    assert.exists(mainThread.tree);
    const originalTreeMaxDepth = mainThread.tree?.maxDepth as number;
    assert.strictEqual(stack.visibleEntriesAndTree().tree.maxDepth, originalTreeMaxDepth - 1);

    // Now remove the action and ensure that all entries are now visible.
    stack.removeActiveAction({type: 'MERGE_FUNCTION', entry: entryTwo});
    assert.strictEqual(
        stack.visibleEntriesAndTree().entries.length, mainThread.entries.length, 'All the entries should be visible.');
    assert.deepEqual(mainThread.entries, stack.visibleEntriesAndTree().entries);
    assert.deepEqual(mainThread.tree, stack.visibleEntriesAndTree().tree);
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
    const stack = new TraceEngine.TreeManipulator.TreeManipulator(mainThread, data.Renderer.entryToNode);
    stack.applyAction({type: 'COLLAPSE_FUNCTION', entry: basicTwoCallEntry});

    // We collapsed at the `basicTwo` entry - so it should be visible itself.
    const visibleEntries = stack.visibleEntriesAndTree().entries;
    assert.isTrue(visibleEntries.includes(basicTwoCallEntry), 'entryTwo is not visible');
    // But all fib() calls below it in the stack should now be hidden.
    const allFibonacciInStackAreHidden = fibonacciCalls.every(fibCall => {
      return visibleEntries.includes(fibCall) === false;
    });
    assert.isTrue(allFibonacciInStackAreHidden, 'Some fibonacci calls are still visible');
    // Make sure all fib() calls are not in the tree either.
    stack.visibleEntriesAndTree().tree.nodes.forEach(value => {
      if (TraceEngine.Types.TraceEvents.isProfileCall(value.entry)) {
        assert.notEqual(value.entry.callFrame.functionName, 'fibonacci');
      }
    });
  });
});
