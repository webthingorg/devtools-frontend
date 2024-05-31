// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as TraceEngine from '../../models/trace/trace.js';
import {TraceLoader} from '../../testing/TraceLoader.js';

import * as ModificationsManager from './modifications_manager.js';

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
    allEntries: readonly TraceEngine.Types.TraceEvents.SyntheticTraceEntry[],
    predicate: (entry: TraceEngine.Types.TraceEvents.SyntheticTraceEntry) =>
        boolean): TraceEngine.Types.TraceEvents.SyntheticTraceEntry {
  const entry = allEntries.find(entry => predicate(entry));
  if (!entry) {
    throw new Error('Could not find expected entry.');
  }
  return entry;
}

describe('ModificationsManager', () => {
  it('correctly implements a bidirectional key <-> event mapping', async function() {
    const data = await TraceLoader.traceEngine(null, 'basic-stack.json.gz');
    const modificationsManager = ModificationsManager.ModificationsManager.ModificationsManager.activeManager();
    if (!modificationsManager) {
      throw new Error('Modifications manager does not exist.');
    }
    const mainThread = getMainThread(data.Renderer);
    assert.exists(modificationsManager);
    // Find first 'Timer Fired' entry in the trace
    const rawEntry = findFirstEntry(mainThread.entries, entry => {
      return entry.name === 'TimerFire';
    });

    const syntheticEvent = data.NetworkRequests.byTime[0];
    const profileCall = findFirstEntry(mainThread.entries, entry => TraceEngine.Types.TraceEvents.isProfileCall(entry));
    const rawEntryKey = modificationsManager.keyForEvent(rawEntry);
    const syntheticEventKey = modificationsManager.keyForEvent(syntheticEvent);
    const profileCallKey = modificationsManager.keyForEvent(profileCall);

    // Test event -> key mappings
    assert.deepEqual(rawEntryKey, ['r', 8036]);
    assert.deepEqual(syntheticEventKey, ['s', 2078]);
    assert.deepEqual(profileCallKey, ['p', 55385, 259, 38, 4]);

    const resolvedRawEntry =
        modificationsManager.eventForKey(rawEntryKey as TraceEngine.Types.File.TraceEventSerializableKey);
    const resolvedSyntheticEntry =
        modificationsManager.eventForKey(syntheticEventKey as TraceEngine.Types.File.TraceEventSerializableKey);
    const resolvedProfileCall =
        modificationsManager.eventForKey(profileCallKey as TraceEngine.Types.File.TraceEventSerializableKey);

    // Test key -> event mappings
    assert.strictEqual(resolvedRawEntry, rawEntry);
    assert.strictEqual(resolvedSyntheticEntry, syntheticEvent);
    assert.strictEqual(resolvedProfileCall, profileCall);
  });

  it('applies modifications when present in a trace file', async function() {
    await TraceLoader.traceEngine(null, 'web-dev-modifications.json.gz');
    const modificationsManager = ModificationsManager.ModificationsManager.ModificationsManager.activeManager();
    if (!modificationsManager) {
      throw new Error('Modifications manager does not exist.');
    }
    modificationsManager.applyModificationsIfPresent();
    const entriesFilter = modificationsManager.getEntriesFilter();
    assert.strictEqual(entriesFilter.expandableEntries().length, 1);
    assert.strictEqual(entriesFilter.invisibleEntries().length, 42);
    assert.deepEqual(modificationsManager.getTimelineBreadcrumbs().initialBreadcrumb, {
      'window': {'min': 967569605481, 'max': 967573120579, 'range': 3515098},
      'child':
          {'window': {'min': 967569967927.7909, 'max': 967571964564.4985, 'range': 1996636.7076416016}, 'child': null},
    } as TraceEngine.Types.File.Breadcrumb);
  });

  it('generates a serializable modifications json ', async function() {
    await TraceLoader.traceEngine(null, 'web-dev-modifications.json.gz');
    const modificationsManager = ModificationsManager.ModificationsManager.ModificationsManager.activeManager();
    if (!modificationsManager) {
      throw new Error('Modifications manager does not exist.');
    }
    modificationsManager.applyModificationsIfPresent();
    const entriesFilter = modificationsManager.getEntriesFilter();
    const modifications = modificationsManager.toJSON();
    assert.strictEqual(entriesFilter.expandableEntries().length, 1);
    assert.strictEqual(modifications.entriesModifications.expandableEntries.length, 1);
    assert.strictEqual(modifications.entriesModifications.hiddenEntries.length, 42);
    assert.deepEqual(modifications.initialBreadcrumb, {
      'window': {'min': 967569605481, 'max': 967573120579, 'range': 3515098},
      'child':
          {'window': {'min': 967569967927.7909, 'max': 967571964564.4985, 'range': 1996636.7076416016}, 'child': null},
    } as TraceEngine.Types.File.Breadcrumb);
  });
});
