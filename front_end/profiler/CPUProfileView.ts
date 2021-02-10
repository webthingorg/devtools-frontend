/*
 * Copyright (C) 2008 Apple Inc. All Rights Reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/* eslint-disable rulesdir/no_underscored_properties */

import * as Common from '../common/common.js'; // eslint-disable-line no-unused-vars
import * as Components from '../components/components.js';
import * as Host from '../host/host.js';
import * as i18n from '../i18n/i18n.js';
import * as PerfUI from '../perf_ui/perf_ui.js';
import * as Platform from '../platform/platform.js'; // eslint-disable-line no-unused-vars
import * as SDK from '../sdk/sdk.js';
import * as UI from '../ui/ui.js';

import { ProfileFlameChartDataProvider } from './CPUProfileFlameChart.js';
import { Formatter, ProfileDataGridNode } from './ProfileDataGrid.js'; // eslint-disable-line no-unused-vars
import { ProfileEvents, ProfileHeader, ProfileType } from './ProfileHeader.js'; // eslint-disable-line no-unused-vars
import { ProfileView, WritableProfileHeader } from './ProfileView.js';

export const UIStrings = {
  /**
  *@description Time of a single activity, as opposed to the total time
  */
  selfTime: 'Self Time',
  /**
  *@description Text for the total time of something
  */
  totalTime: 'Total Time',
  /**
  *@description Text in CPUProfile View of a profiler tool
  */
  recordJavascriptCpuProfile: 'Record JavaScript CPU Profile',
  /**
  *@description Text in CPUProfile View of a profiler tool
  */
  stopCpuProfiling: 'Stop CPU profiling',
  /**
  *@description Text in CPUProfile View of a profiler tool
  */
  startCpuProfiling: 'Start CPU profiling',
  /**
  *@description Text in CPUProfile View of a profiler tool
  */
  cpuProfiles: 'CPU PROFILES',
  /**
  *@description Text in CPUProfile View of a profiler tool, that show how much time a script spend executing a function.
  */
  cpuProfilesShow: 'CPU profiles show where the execution time is spent in your page\'s JavaScript functions.',
  /**
  *@description Text in CPUProfile View of a profiler tool
  */
  recording: 'Recording…',
  /**
  *@description Time in miliseconds
  *@example {30.1} PH1
  */
  fms: '{PH1} ms',
  /**
  *@description Text in CPUProfile View of a profiler tool
  *@example {21.33} PH1
  */
  formatPercent: '{PH1} %',
  /**
  *@description Text for the name of something
  */
  name: 'Name',
  /**
  *@description Text for web URLs
  */
  url: 'URL',
  /**
  *@description Text in CPUProfile View of a profiler tool
  */
  aggregatedSelfTime: 'Aggregated self time',
  /**
  *@description Text in CPUProfile View of a profiler tool
  */
  aggregatedTotalTime: 'Aggregated total time',
  /**
  *@description Text that indicates something is not optimized
  */
  notOptimized: 'Not optimized',
};
const str_ = i18n.i18n.registerUIStrings('profiler/CPUProfileView.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);
// Transformation: updatePropertyDeclarations
// Transformation: updateInterfacesImplementations
export class CPUProfileView extends ProfileView implements UI.SearchableView.Searchable {
  profileHeader: CPUProfileHeader;
  adjustedTotal: number;
  // Transformation: updateParameters
  constructor(profileHeader: CPUProfileHeader) {
    super();
    this.profileHeader = profileHeader;
    this.initialize(new NodeFormatter(this));
    const profile = profileHeader.profileModel();
    this.adjustedTotal = profile.profileHead.total;
    this.adjustedTotal -= profile.idleNode ? profile.idleNode.total : 0;
    this.setProfile(profile);
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  wasShown(): void {
    super.wasShown();
    PerfUI.LineLevelProfile.Performance.instance().reset();
    PerfUI.LineLevelProfile.Performance.instance().appendCPUProfile(this.profileHeader.profileModel());
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  columnHeader(columnId: string): Common.UIString.LocalizedString {
    switch (columnId) {
      case 'self':
        return i18nString(UIStrings.selfTime);
      case 'total':
        return i18nString(UIStrings.totalTime);
    }
    return Common.UIString.LocalizedEmptyString;
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  createFlameChartDataProvider(): ProfileFlameChartDataProvider {
    return new CPUFlameChartDataProvider(this.profileHeader.profileModel(), this.profileHeader._cpuProfilerModel);
  }
}

// Transformation: updatePropertyDeclarations
export class CPUProfileType extends ProfileType {
  _recording: boolean;
  // Transformation: updateParameters
  constructor() {
    super(CPUProfileType.TypeId, i18nString(UIStrings.recordJavascriptCpuProfile));
    this._recording = false;

    SDK.SDKModel.TargetManager.instance().addModelListener(SDK.CPUProfilerModel.CPUProfilerModel, SDK.CPUProfilerModel.Events.ConsoleProfileFinished, this._consoleProfileFinished, this);
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  profileBeingRecorded(): CPUProfileHeader | null {
    return; /** @type {?CPUProfileHeader} */
    // Transformation: updateCast
    super.profileBeingRecorded() as CPUProfileHeader | null;
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  typeName(): string {
    return 'CPU';
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  fileExtension(): string {
    return '.cpuprofile';
  }

  get buttonTooltip() {
    return this._recording ? i18nString(UIStrings.stopCpuProfiling) : i18nString(UIStrings.startCpuProfiling);
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  buttonClicked(): boolean {
    if (this._recording) {
      this._stopRecordingProfile();
      return false;
    }
    this._startRecordingProfile();
    return true;
  }

  get treeItemTitle() {
    return i18nString(UIStrings.cpuProfiles);
  }

  get description() {
    return i18nString(UIStrings.cpuProfilesShow);
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  _consoleProfileFinished(event: Common.EventTarget.EventTargetEvent): void {
    const data = (event.data as {
      id: string;
      scriptLocation: SDK.DebuggerModel.Location;
      title: string;
      cpuProfile: Protocol.Profiler.Profile | undefined;
      cpuProfilerModel: SDK.CPUProfilerModel.CPUProfilerModel;
    });
    const cpuProfile = (data.cpuProfile as Protocol.Profiler.Profile);
    const profile = new CPUProfileHeader(data.cpuProfilerModel, this, data.title);
    profile.setProtocolProfile(cpuProfile);
    this.addProfile(profile);
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  _startRecordingProfile(): void {
    const cpuProfilerModel = UI.Context.Context.instance().flavor(SDK.CPUProfilerModel.CPUProfilerModel);
    if (this.profileBeingRecorded() || !cpuProfilerModel) {
      return;
    }
    const profile = new CPUProfileHeader(cpuProfilerModel, this);
    this.setProfileBeingRecorded(profile);
    SDK.SDKModel.TargetManager.instance().suspendAllTargets();
    this.addProfile(profile);
    profile.updateStatus(i18nString(UIStrings.recording));
    this._recording = true;
    cpuProfilerModel.startRecording();
    Host.userMetrics.actionTaken(Host.UserMetrics.Action.ProfilesCPUProfileTaken);
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  async _stopRecordingProfile(): Promise<void> {
    this._recording = false;
    const profileBeingRecorded = this.profileBeingRecorded();
    if (!profileBeingRecorded || !profileBeingRecorded._cpuProfilerModel) {
      return;
    }

    const profile = await profileBeingRecorded._cpuProfilerModel.stopRecording();
    const recordedProfile = this.profileBeingRecorded();
    if (recordedProfile) {
      if (!profile) {
        throw new Error('Expected profile to be non-null');
      }
      recordedProfile.setProtocolProfile(profile);
      recordedProfile.updateStatus('');
      this.setProfileBeingRecorded(null);
    }

    await SDK.SDKModel.TargetManager.instance().resumeAllTargets();
    this.dispatchEventToListeners(ProfileEvents.ProfileComplete, recordedProfile);
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  createProfileLoadedFromFile(title: string): ProfileHeader {
    return new CPUProfileHeader(null, this, title);
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  profileBeingRecordedRemoved(): void {
    this._stopRecordingProfile();
  }
}

CPUProfileType.TypeId = 'CPU';

// Transformation: updatePropertyDeclarations
export class CPUProfileHeader extends WritableProfileHeader {
  _cpuProfilerModel: SDK.CPUProfilerModel.CPUProfilerModel | null;
  _profileModel?: SDK.CPUProfileDataModel.CPUProfileDataModel;
  // Transformation: updateParameters
  constructor(cpuProfilerModel: SDK.CPUProfilerModel.CPUProfilerModel | null, type: CPUProfileType, title?: string) {
    super(cpuProfilerModel && cpuProfilerModel.debuggerModel(), type, title);
    this._cpuProfilerModel = cpuProfilerModel;
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  createView(): ProfileView {
    return new CPUProfileView(this);
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  protocolProfile(): Protocol.Profiler.Profile {
    if (!this._protocolProfile) {
      throw new Error('Expected _protocolProfile to be available');
    }
    return this._protocolProfile;
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  profileModel(): SDK.CPUProfileDataModel.CPUProfileDataModel {
    if (!this._profileModel) {
      throw new Error('Expected _profileModel to be available');
    }
    return this._profileModel;
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  setProfile(profile: Protocol.Profiler.Profile): void {
    const target = this._cpuProfilerModel && this._cpuProfilerModel.target() || null;
    this._profileModel = new SDK.CPUProfileDataModel.CPUProfileDataModel(profile, target);
  }
}

// Transformation: updatePropertyDeclarations
// Transformation: updateInterfacesImplementations
export class NodeFormatter implements Formatter {
  _profileView: CPUProfileView;
  // Transformation: updateParameters
  constructor(profileView: CPUProfileView) {
    this._profileView = profileView;
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  formatValue(value: number): string {
    return i18nString(UIStrings.fms, { PH1: value.toFixed(1) });
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  formatValueAccessibleText(value: number): string {
    return this.formatValue(value);
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  formatPercent(value: number, node: ProfileDataGridNode): string {
    if (this._profileView) {
      const profile = this._profileView.profile();
      if (profile &&
        node.profileNode !== (profile as SDK.CPUProfileDataModel.CPUProfileDataModel).idleNode) {
        return i18nString(UIStrings.formatPercent, { PH1: value.toFixed(2) });
      }
    }
    return '';
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  linkifyNode(node: ProfileDataGridNode): Element | null {
    const cpuProfilerModel = this._profileView.profileHeader._cpuProfilerModel;
    const target = cpuProfilerModel ? cpuProfilerModel.target() : null;
    const options = { className: 'profile-node-file', columnNumber: undefined, tabStop: undefined };
    return this._profileView.linkifier().maybeLinkifyConsoleCallFrame(target, node.profileNode.callFrame, options);
  }
}

// Transformation: updatePropertyDeclarations
export class CPUFlameChartDataProvider extends ProfileFlameChartDataProvider {
  _cpuProfile: SDK.CPUProfileDataModel.CPUProfileDataModel;
  _cpuProfilerModel: SDK.CPUProfilerModel.CPUProfilerModel | null;
  _maxStackDepth?: number;
  entryNodes?: SDK.ProfileTreeModel.ProfileNode[];
  timelineData_?: PerfUI.FlameChart.TimelineData | null;
  _entrySelfTimes?: Float32Array;
  // Transformation: updateParameters
  constructor(cpuProfile: SDK.CPUProfileDataModel.CPUProfileDataModel, cpuProfilerModel: SDK.CPUProfilerModel.CPUProfilerModel | null) {
    super();
    this._cpuProfile = cpuProfile;
    this._cpuProfilerModel = cpuProfilerModel;
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  minimumBoundary(): number {
    return this._cpuProfile.profileStartTime;
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  totalTime(): number {
    return this._cpuProfile.profileHead.total;
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  entryHasDeoptReason(entryIndex: number): boolean {
    const node = (this.entryNodes[entryIndex] as SDK.CPUProfileDataModel.CPUProfileNode);
    return Boolean(node.deoptReason);
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  _calculateTimelineData(): PerfUI.FlameChart.TimelineData {
    const 
    // Transformation: updateVariableDeclarations
    entries: (ChartEntry | null)[] = [];
    const 
    // Transformation: updateVariableDeclarations
    stack: number[] = [];
    let maxDepth = 5;

    // Transformation: updateReturnType
    // Transformation: updateParameters
    function onOpenFrame(): void {
      stack.push(entries.length);
      // Reserve space for the entry, as they have to be ordered by startTime.
      // The entry itself will be put there in onCloseFrame.
      entries.push(null);
    }
    // Transformation: updateReturnType
    // Transformation: updateParameters
    function onCloseFrame(depth: number, node: SDK.CPUProfileDataModel.CPUProfileNode, startTime: number, totalTime: number, selfTime: number): void {
      const index = (stack.pop() as number);
      entries[index] = new CPUFlameChartDataProvider.ChartEntry(depth, totalTime, startTime, selfTime, node);
      maxDepth = Math.max(maxDepth, depth);
    }
    this._cpuProfile.forEachFrame(onOpenFrame, onCloseFrame);

    const 
    // Transformation: updateVariableDeclarations
    entryNodes: SDK.CPUProfileDataModel.CPUProfileNode[] = new Array(entries.length);
    const entryLevels = new Uint16Array(entries.length);
    const entryTotalTimes = new Float32Array(entries.length);
    const entrySelfTimes = new Float32Array(entries.length);
    const entryStartTimes = new Float64Array(entries.length);

    for (let i = 0; i < entries.length; ++i) {
      const entry = entries[i];
      if (!entry) {
        continue;
      }
      entryNodes[i] = entry.node;
      entryLevels[i] = entry.depth;
      entryTotalTimes[i] = entry.duration;
      entryStartTimes[i] = entry.startTime;
      entrySelfTimes[i] = entry.selfTime;
    }

    this._maxStackDepth = maxDepth + 1;
    this.entryNodes = entryNodes;
    this.timelineData_ = new PerfUI.FlameChart.TimelineData(entryLevels, entryTotalTimes, entryStartTimes, null);

    this._entrySelfTimes = entrySelfTimes;

    return this.timelineData_;
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  prepareHighlightedEntryInfo(entryIndex: number): Element | null {
    const timelineData = this.timelineData_;
    const node = this.entryNodes[entryIndex];
    if (!node) {
      return null;
    }

    const 
    // Transformation: updateVariableDeclarations
    entryInfo: {
      title: string;
      value: string;
    }[] = [];
    // Transformation: updateReturnType
    // Transformation: updateParameters
    function pushEntryInfoRow(title: string, value: string): void {
      entryInfo.push({ title: title, value: value });
    }
    // Transformation: updateReturnType
    // Transformation: updateParameters
    function millisecondsToString(ms: number): string {
      if (ms === 0) {
        return '0';
      }
      if (ms < 1000) {
        return i18nString(UIStrings.fms, { PH1: ms.toFixed(1) });
      }
      return Number.secondsToString(ms / 1000, true);
    }
    const name = UI.UIUtils.beautifyFunctionName(node.functionName);
    pushEntryInfoRow(i18nString(UIStrings.name), name);
    const selfTime = millisecondsToString((this._entrySelfTimes as Float32Array)[entryIndex]);
    const totalTime = millisecondsToString((timelineData as PerfUI.FlameChart.TimelineData).entryTotalTimes[entryIndex]);
    pushEntryInfoRow(i18nString(UIStrings.selfTime), selfTime);
    pushEntryInfoRow(i18nString(UIStrings.totalTime), totalTime);
    const linkifier = new Components.Linkifier.Linkifier();
    const link = linkifier.maybeLinkifyConsoleCallFrame(this._cpuProfilerModel && this._cpuProfilerModel.target(), node.callFrame);
    if (link) {
      pushEntryInfoRow(i18nString(UIStrings.url), link.textContent || '');
    }
    linkifier.dispose();
    pushEntryInfoRow(i18nString(UIStrings.aggregatedSelfTime), Number.secondsToString(node.self / 1000, true));
    pushEntryInfoRow(i18nString(UIStrings.aggregatedTotalTime), Number.secondsToString(node.total / 1000, true));
    const deoptReason = (node as SDK.CPUProfileDataModel.CPUProfileNode).deoptReason;
    if (deoptReason) {
      pushEntryInfoRow(i18nString(UIStrings.notOptimized), deoptReason);
    }

    return ProfileView.buildPopoverTable(entryInfo);
  }
}

CPUFlameChartDataProvider.ChartEntry = class {
  // Transformation: updateParameters
  constructor(depth: number, duration: number, startTime: number, selfTime: number, node: SDK.CPUProfileDataModel.CPUProfileNode) {
    this.depth = depth;
    this.duration = duration;
    this.startTime = startTime;
    this.selfTime = selfTime;
    this.node = node;
  }
};
