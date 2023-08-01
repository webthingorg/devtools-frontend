// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as i18n from '../../core/i18n/i18n.js';
import * as TraceEngine from '../../models/trace/trace.js';
import * as Common from '../../core/common/common.js';
import * as UI from '../../ui/legacy/legacy.js';
import * as PerfUI from '../../ui/legacy/components/perf_ui/perf_ui.js';

import {
  type TrackAppender,
  type TrackAppenderName,
  type CompatibilityTracksAppender,
  type HighlightedEntryInfo,
} from './CompatibilityTracksAppender.js';
import * as CPUProfile from '../../models/cpu_profile/cpu_profile.js';
import {buildGroupStyle, buildTrackHeader, getFormattedTime} from './AppenderUtils.js';
import { TimelineFlameChartEntry } from './TimelineFlameChartDataProvider';

const UIStrings = {
  /**
   *@description Text in Timeline Flame Chart Data Provider of the Performance panel
   */
  cpu: 'CPU',
};

const str_ = i18n.i18n.registerUIStrings('panels/timeline/CPUTrackAppender.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);


export class CPUChartEntry {
  depth: number;
  duration: number;
  startTime: number;//milliseconds
  selfTime: number;
  node: CPUProfile.ProfileTreeModel.ProfileNode;

  constructor(
      depth: number, duration: number, startTime: number, selfTime: number,
      node: CPUProfile.ProfileTreeModel.ProfileNode) {
    this.depth = depth;
    this.duration = duration;
    this.startTime = startTime;
    this.selfTime = selfTime;
    this.node = node;
  }
}

export class CPUTrackAppender{
  // readonly appenderName = 'CPU';
  readonly colorGeneratorInternal: Common.Color.Generator;

  // #compatibilityBuilder: CompatibilityTracksAppender;
  #flameChartData: PerfUI.FlameChart.FlameChartTimelineData;
  #cpuDataModel: CPUProfile.CPUProfileDataModel.CPUProfileDataModel;
  #entryData: TimelineFlameChartEntry[];

  constructor(
      // compatibilityBuilder: CompatibilityTracksAppender,
      flameChartData: PerfUI.FlameChart.FlameChartTimelineData,
      cpuDataModel: CPUProfile.CPUProfileDataModel.CPUProfileDataModel,
      entryData: TimelineFlameChartEntry[]) {
    console.log('cpu appender init')
    this.colorGeneratorInternal = new Common.Color.Generator(
      {min: 30, max: 330, count: undefined}, {min: 50, max: 80, count: 5}, {min: 80, max: 90, count: 3});

    this.colorGeneratorInternal.setColorForID('(idle)', 'hsl(0, 0%, 94%)');
    this.colorGeneratorInternal.setColorForID('(program)', 'hsl(0, 0%, 80%)');
    this.colorGeneratorInternal.setColorForID('(garbage collector)', 'hsl(0, 0%, 80%)');

    // this.#compatibilityBuilder = compatibilityBuilder;
    this.#flameChartData = flameChartData;
    this.#cpuDataModel = cpuDataModel;
    this.#entryData = entryData;
  }

  appendTrackAtLevel(trackStartLevel: number, expanded?: boolean|undefined): number {
    console.error('cpu appender append')
    this.#appendTrackHeaderAtLevel(trackStartLevel, expanded);

    // // Add one level for header;
    // const currentLevel = trackStartLevel + 1;

    const entries: (CPUChartEntry|null)[] = [];
    const stack: number[] = [];
    let maxDepth = 0;

    function onOpenFrame(): void {
      stack.push(entries.length);
      // Reserve space for the entry, as they have to be ordered by startTime.
      // The entry itself will be put there in onCloseFrame.
      entries.push(null);
    }
    function onCloseFrame(
        depth: number, node: CPUProfile.ProfileTreeModel.ProfileNode, startTime: number, totalTime: number,
        selfTime: number): void {
      const index = stack.pop();
      if(index === undefined) {
        throw Error('no open frame found')
      }
      entries[index] = new CPUChartEntry(depth, totalTime, startTime, selfTime, node);
      maxDepth = Math.max(maxDepth, depth);
    }
    this.#cpuDataModel.forEachFrame(onOpenFrame, onCloseFrame);

    // // const entryNodes: CPUProfile.ProfileTreeModel.ProfileNode[] = new Array(entries.length);
    // const entryLevels = new Uint16Array(entries.length);
    // const entryTotalTimes = new Float32Array(entries.length);
    // // const entrySelfTimes = new Float32Array(entries.length);
    // const entryStartTimes = new Float64Array(entries.length);
    for (let i = 0; i < entries.length; ++i) {
      const entry = entries[i];
      if (!entry) {
        continue;
      }
      this.#entryData.push(entry)
      // entryNodes[i] = entry.node;
      this.#flameChartData.entryLevels[i] = entry.depth + trackStartLevel;
      this.#flameChartData.entryTotalTimes[i] = entry.duration;
      this.#flameChartData.entryStartTimes[i] = entry.startTime;
      // entrySelfTimes[i] = entry.selfTime;
    }

    return maxDepth + trackStartLevel + 1
  }

  #appendTrackHeaderAtLevel(currentLevel: number, expanded?: boolean): void {
    const style = buildGroupStyle({shareHeaderLine: false});
    const group = buildTrackHeader(currentLevel, i18nString(UIStrings.cpu), style, /* selectable= */ true, expanded);
    this.#flameChartData.groups.push(group);
    // this.#compatibilityBuilder.registerTrackForGroup(group, this);
  }

  /**
   * Gets the events to be shown in the tree views of the details pane
   * (Bottom-up, Call tree, etc.). These are the events from the track
   * that can be arranged in a tree shape.
   */
  eventsForTreeView(): TraceEngine.Types.TraceEvents.TraceEventData[] {
    const profileModel = this.#cpuDataModel

    // const finalizedData:
    //     ProfileData = {rawProfile: preProcessedData.rawProfile, parsedProfile: profileModel, profileCalls: []};
    const trackingStack: Partial<TraceEngine.Types.TraceEvents.TraceEventSyntheticProfileCall>[] = [];
    const calls : TraceEngine.Types.TraceEvents.TraceEventSyntheticProfileCall []= []

    profileModel.forEachFrame(openFrameCallback, closeFrameCallback);
    // Helpers.Trace.sortTraceEventsInPlace(finalizedData.profileCalls);
    // const dataByThread = Platform.MapUtilities.getWithDefault(profilesInProcess, processId, () => new Map());
    // dataByThread.set(threadId, finalizedData);

    function openFrameCallback(
        _depth: number, node: CPUProfile.ProfileTreeModel.ProfileNode, timeStampMs: number): void {
      const ts = TraceEngine.Helpers.Timing.millisecondsToMicroseconds(TraceEngine.Types.Timing.MilliSeconds(timeStampMs));
      trackingStack.push({callFrame: node.callFrame, ts, pid: 0 as TraceEngine.Types.TraceEvents.ProcessID, children: [], tid: 0 as TraceEngine.Types.TraceEvents.ThreadID});
    }
    function closeFrameCallback(
        depth: number, node: CPUProfile.ProfileTreeModel.ProfileNode, _timeStamp: number, durMs: number,
        selfTimeMs: number): void {
      const partialProfileCall = trackingStack.pop();
      if (!partialProfileCall) {
        return;
      }
      const {callFrame, ts, pid, children, tid} = partialProfileCall;
      if (callFrame === undefined || ts === undefined || pid === undefined ||
          children === undefined || tid === undefined) {
        return;
      }
      const dur = TraceEngine.Helpers.Timing.millisecondsToMicroseconds(TraceEngine.Types.Timing.MilliSeconds(durMs));
      const selfTime = TraceEngine.Helpers.Timing.millisecondsToMicroseconds(TraceEngine.Types.Timing.MilliSeconds(selfTimeMs));
      const completeProfileCall: TraceEngine.Types.TraceEvents.TraceEventSyntheticProfileCall = {
        callFrame,
        ts,
        pid,
        dur,
        selfTime,
        children,
        ph: TraceEngine.Types.TraceEvents.Phase.COMPLETE,
        cat: '',
        name: 'ProfileCall',
        tid,
        nodeId: node.id,
      };
      const parent = trackingStack.at(-1);
      // const calls = finalizedData.profileCalls;
      calls.push(completeProfileCall);
      if (!parent) {
        return;
      }
      parent.children = parent.children || [];
      parent.children.push(completeProfileCall);
      if (parent.selfTime) {
        parent.selfTime = TraceEngine.Types.Timing.MicroSeconds(parent.selfTime - dur);
      }
    }
    return calls
  }

  /*
    ------------------------------------------------------------------------------------
     The following methods  are invoked by the flame chart renderer to query features about
     events on rendering.
    ------------------------------------------------------------------------------------
  */

  /**
   * Gets the color an event added by this appender should be rendered with.
   */
  colorForEvent(node: CPUChartEntry): string {
    // For idle and program, we want different 'shades of gray', so we fallback to functionName as scriptId = 0
    // For rest of nodes e.g eval scripts, if url is empty then scriptId will be guaranteed to be non-zero
    return this.colorGeneratorInternal.colorForID(
      node.node.url || (node.node.scriptId !== '0' ? node.node.scriptId : node.node.functionName));
  }

  /**
   * Gets the title an event added by this appender should be rendered with.
   */
  titleForEvent(node: CPUChartEntry): string {
    return 'CPU'
    return UI.UIUtils.beautifyFunctionName(node.node.functionName);
  }

  /**
   * Returns the info shown when an event added by this appender
   * is hovered in the timeline.
   */
  highlightedEntryInfo(node: CPUChartEntry): HighlightedEntryInfo {
    const title = this.titleForEvent(node);
    const totalTime = TraceEngine.Helpers.Timing.millisecondsToMicroseconds(TraceEngine.Types.Timing.MilliSeconds(node.duration))
    const selfTime = TraceEngine.Helpers.Timing.millisecondsToMicroseconds(TraceEngine.Types.Timing.MilliSeconds(node.selfTime))
    return {title, formattedTime: getFormattedTime(totalTime, selfTime)};
  }
}
