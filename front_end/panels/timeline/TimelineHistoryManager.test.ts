// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as TraceEngine from '../../models/trace/trace.js';
import * as AnnotationsManager from '../../services/annotations_manager/annotations_manager.js';
import {
  describeWithEnvironment,
  registerNoopActions,
} from '../../testing/EnvironmentHelpers.js';
import {TraceLoader} from '../../testing/TraceLoader.js';
import * as UI from '../../ui/legacy/legacy.js';

import * as Timeline from './timeline.js';

const {assert} = chai;

describeWithEnvironment('TimelineHistoryManager', function() {
  let historyManager: Timeline.TimelineHistoryManager.TimelineHistoryManager;
  beforeEach(() => {
    registerNoopActions(['timeline.show-history']);
    historyManager = new Timeline.TimelineHistoryManager.TimelineHistoryManager();
  });

  afterEach(() => {
    UI.ActionRegistry.ActionRegistry.reset();
  });

  it('can select from multiple parsed data objects', async function() {
    // Add two parsed data objects to the history manager.
    const firstFileModels = await TraceLoader.allModels(this, 'slow-interaction-button-click.json.gz');
    historyManager.addRecording(
        {
          data: {
            legacyModel: firstFileModels.performanceModel,
            traceParseDataIndex: 1,
            fileMetadata: null,
          },
          filmStripForPreview: null,
          traceParsedData: firstFileModels.traceParsedData,
          startTime: null,
        },
    );

    const secondFileModels = await TraceLoader.allModels(this, 'slow-interaction-keydown.json.gz');
    historyManager.addRecording({
      data: {
        legacyModel: secondFileModels.performanceModel,
        traceParseDataIndex: 2,
        fileMetadata: null,
      },
      filmStripForPreview: null,
      traceParsedData: secondFileModels.traceParsedData,
      startTime: null,
    });

    // Make sure the correct model tuples (legacy and new engine) are returned when
    // using the history manager to navigate between trace files..
    const previousRecording = historyManager.navigate(1);
    assert.strictEqual(previousRecording?.legacyModel, firstFileModels.performanceModel);
    assert.strictEqual(previousRecording?.traceParseDataIndex, 1);

    const nextRecording = historyManager.navigate(-1);
    assert.strictEqual(nextRecording?.legacyModel, secondFileModels.performanceModel);
    assert.strictEqual(nextRecording?.traceParseDataIndex, 2);
  });

  it('can maintain and update breadcrumbs in the metadata when switching between multiple parsed data objects',
     async function() {
       // Add two parsed data objects to the history manager.
       const firstFileModels = await TraceLoader.allModels(this, 'slow-interaction-button-click.json.gz');
       historyManager.addRecording(
           {
             data: {
               legacyModel: firstFileModels.performanceModel,
               traceParseDataIndex: 1,
               fileMetadata: {},
             },
             filmStripForPreview: null,
             traceParsedData: firstFileModels.traceParsedData,
             startTime: null,
           },
       );

       // Initialize an annotations manager with the trace bounds of the whole trace.
       // This should create the first breadcrumb from the whole trace.
       let annotationsManager = AnnotationsManager.AnnotationsManager.AnnotationsManager.maybeInstance(
           {entryToNodeMap: new Map(), wholeTraceBounds: firstFileModels.traceParsedData.Meta.traceBounds});
       // Create an add a breadcrumb that is 10 Microseconds shorter than the whole trace window.
       const firstFileBreadcrumbWindow = {
         ...firstFileModels.traceParsedData.Meta.traceBounds,
         max: firstFileModels.traceParsedData.Meta.traceBounds.max - 10 as TraceEngine.Types.Timing.MicroSeconds,
       };
       annotationsManager?.getTimelineBreadcrumbs().add(firstFileBreadcrumbWindow);
       // Update annotations before adding a new recording. This function is actually called from the TimelinePanel before adding a new recording.
       historyManager.updateCurrentRecordingAnnotations();

       const secondFileModels = await TraceLoader.allModels(this, 'slow-interaction-keydown.json.gz');
       historyManager.addRecording({
         data: {
           legacyModel: secondFileModels.performanceModel,
           traceParseDataIndex: 2,
           fileMetadata: {},
         },
         filmStripForPreview: null,
         traceParsedData: secondFileModels.traceParsedData,
         startTime: null,
       });

       annotationsManager = AnnotationsManager.AnnotationsManager.AnnotationsManager.maybeInstance(
           {entryToNodeMap: new Map(), wholeTraceBounds: secondFileModels.traceParsedData.Meta.traceBounds});
       const secondFileBreadcrumbWindow = {
         ...secondFileModels.traceParsedData.Meta.traceBounds,
         max: secondFileModels.traceParsedData.Meta.traceBounds.max - 10 as TraceEngine.Types.Timing.MicroSeconds,
       };
       annotationsManager?.getTimelineBreadcrumbs().add(secondFileBreadcrumbWindow);

       historyManager.updateCurrentRecordingAnnotations();

       const previousRecording = historyManager.navigate(1);
       assert.strictEqual(previousRecording?.legacyModel, firstFileModels.performanceModel);
       assert.strictEqual(previousRecording?.traceParseDataIndex, 1);
       // Make sure the breadcrumb created in the first file persists.
       assert.deepEqual(previousRecording?.fileMetadata?.annotations?.initialBreadcrumb, {
         window: firstFileModels.traceParsedData.Meta.traceBounds,
         child: {window: firstFileBreadcrumbWindow, child: null},
       });

       const nextRecording = historyManager.navigate(-1);
       assert.strictEqual(nextRecording?.legacyModel, secondFileModels.performanceModel);
       assert.strictEqual(nextRecording?.traceParseDataIndex, 2);
       assert.deepEqual(nextRecording?.fileMetadata?.annotations?.initialBreadcrumb, {
         window: secondFileModels.traceParsedData.Meta.traceBounds,
         child: {window: secondFileBreadcrumbWindow, child: null},
       });
     });

  it('can maintain and update hidden entries in the metadata when switching between multiple parsed data objects',
     async function() {
       // Add two parsed data objects to the history manager.
       const firstFileModels = await TraceLoader.allModels(this, 'slow-interaction-button-click.json.gz');
       historyManager.addRecording(
           {
             data: {
               legacyModel: firstFileModels.performanceModel,
               traceParseDataIndex: 1,
               fileMetadata: {},
             },
             filmStripForPreview: null,
             traceParsedData: firstFileModels.traceParsedData,
             startTime: null,
           },
       );

       // Initialize an annotations manager with the entry to node map of the trace.
       let annotationsManager = AnnotationsManager.AnnotationsManager.AnnotationsManager.maybeInstance({
         entryToNodeMap: firstFileModels.traceParsedData.Samples.entryToNode,
         wholeTraceBounds: firstFileModels.traceParsedData.Meta.traceBounds,
       });

       // Get second and sixth entries and hide them by applying entries filter actions.
       const firstEntryToHideFirstFile = Array.from(firstFileModels.traceParsedData.Samples.entryToNode.keys())[2];
       const secondEntryToHideFirstFile = Array.from(firstFileModels.traceParsedData.Samples.entryToNode.keys())[6];
       annotationsManager?.getEntriesFilter().applyFilterAction(
           {type: TraceEngine.EntriesFilter.FilterAction.MERGE_FUNCTION, entry: firstEntryToHideFirstFile});
       annotationsManager?.getEntriesFilter().applyFilterAction(
           {type: TraceEngine.EntriesFilter.FilterAction.MERGE_FUNCTION, entry: secondEntryToHideFirstFile});

       // Update annotations before adding a new recording. This function is actually called from the TimelinePanel before adding a new recording.
       historyManager.updateCurrentRecordingAnnotations();

       const secondFileModels = await TraceLoader.allModels(this, 'slow-interaction-keydown.json.gz');
       historyManager.addRecording({
         data: {
           legacyModel: secondFileModels.performanceModel,
           traceParseDataIndex: 2,
           fileMetadata: {},
         },
         filmStripForPreview: null,
         traceParsedData: secondFileModels.traceParsedData,
         startTime: null,
       });

       annotationsManager = AnnotationsManager.AnnotationsManager.AnnotationsManager.maybeInstance({
         entryToNodeMap: secondFileModels.traceParsedData.Samples.entryToNode,
         wholeTraceBounds: secondFileModels.traceParsedData.Meta.traceBounds,
       });
       const entryToHideSecondFile = Array.from(secondFileModels.traceParsedData.Samples.entryToNode.keys())[5];
       annotationsManager?.getEntriesFilter().applyFilterAction(
           {type: TraceEngine.EntriesFilter.FilterAction.MERGE_FUNCTION, entry: entryToHideSecondFile});

       historyManager.updateCurrentRecordingAnnotations();

       const previousRecording = historyManager.navigate(1);
       assert.strictEqual(previousRecording?.legacyModel, firstFileModels.performanceModel);
       assert.strictEqual(previousRecording?.traceParseDataIndex, 1);
       // Make sure that the correct entries are marked as hidden and modified.
       assert.deepEqual(
           previousRecording?.fileMetadata?.annotations?.entriesFilterAnnotations.modifiedEntriesIndexes, [1, 5]);
       assert.deepEqual(
           previousRecording?.fileMetadata?.annotations?.entriesFilterAnnotations.hiddenEntriesIndexes, [2, 6]);

       const nextRecording = historyManager.navigate(-1);
       assert.strictEqual(nextRecording?.legacyModel, secondFileModels.performanceModel);
       assert.strictEqual(nextRecording?.traceParseDataIndex, 2);
       assert.deepEqual(
           previousRecording?.fileMetadata?.annotations?.entriesFilterAnnotations.modifiedEntriesIndexes, [4]);
       assert.deepEqual(
           previousRecording?.fileMetadata?.annotations?.entriesFilterAnnotations.hiddenEntriesIndexes, [5]);
     });
});
