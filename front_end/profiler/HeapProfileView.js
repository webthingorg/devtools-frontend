// Copyright 2016 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../common/common.js';
import * as Components from '../components/components.js';
import * as PerfUI from '../perf_ui/perf_ui.js';
import * as Platform from '../platform/platform.js';
import * as Root from '../root/root.js';
import * as SDK from '../sdk/sdk.js';
import * as UI from '../ui/ui.js';

import {ProfileFlameChartDataProvider} from './CPUProfileFlameChart.js';
import {HeapTimelineOverview, IdsRangeChanged, Samples} from './HeapTimelineOverview.js';  // eslint-disable-line no-unused-vars
import {Formatter, ProfileDataGridNode} from './ProfileDataGrid.js';           // eslint-disable-line no-unused-vars
import {ProfileEvents, ProfileHeader, ProfileType} from './ProfileHeader.js';  // eslint-disable-line no-unused-vars
import {ProfileView, WritableProfileHeader} from './ProfileView.js';

/**
 * @param {!SamplingHeapProfileHeader} profileHeader
 * @return {!Protocol.HeapProfiler.SamplingHeapProfile}
 */
function convertToSamplingHeapProfile(profileHeader) {
  return /** @type {!Protocol.HeapProfiler.SamplingHeapProfile} */ (
      profileHeader._profile || profileHeader.protocolProfile());
}

/**
 * @implements {UI.SearchableView.Searchable}
 * @unrestricted
 */
export class HeapProfileView extends ProfileView {
  /**
   * @param {!SamplingHeapProfileHeader} profileHeader
   */
  constructor(profileHeader) {
    super();

    this.profileHeader = profileHeader;
    this._profileType = profileHeader.profileType();
    this.initialize(new NodeFormatter(this));
    const profile = new SamplingHeapProfileModel(convertToSamplingHeapProfile(profileHeader));
    this.adjustedTotal = profile.total;
    this.setProfile(profile);

    this._selectedSizeText = new UI.Toolbar.ToolbarText();

    /** @type {!Array<number>} */
    this._timestamps = [];
    /** @type {!Array<number>} */
    this._sizes = [];
    /** @type {!Array<number>} */
    this._max = [];
    /** @type {!Array<number>} */
    this._ordinals = [];
    /** @type {number} */
    this._totalTime = 0;
    /** @type {number} */
    this._lastOrdinal = 0;

    this._timelineOverview = new HeapTimelineOverview();

    if (Root.Runtime.experiments.isEnabled('samplingHeapProfilerTimeline')) {
      this._timelineOverview.addEventListener(IdsRangeChanged, this._onIdsRangeChanged.bind(this));
      this._timelineOverview.show(this.element, this.element.firstChild);
      this._timelineOverview.start();

      this._profileType.addEventListener(SamplingHeapProfileType.Events.StatsUpdate, this._onStatsUpdate, this);
      this._profileType.once(ProfileEvents.ProfileComplete).then(() => {
        this._profileType.removeEventListener(SamplingHeapProfileType.Events.StatsUpdate, this._onStatsUpdate, this);
        this._timelineOverview.stop();
        this._timelineOverview.updateGrid();
      });
    }
  }

  /**
   * @override
   * @return {!Promise<!Array<!UI.Toolbar.ToolbarItem>>}
   */
  async toolbarItems() {
    return [...await super.toolbarItems(), this._selectedSizeText];
  }

  /**
   * @param {!Common.EventTarget.EventTargetEvent} event
   */
  _onIdsRangeChanged(event) {
    const minId = /** @type {number} */ (event.data.minId);
    const maxId = /** @type {number} */ (event.data.maxId);
    this._selectedSizeText.setText(ls`Selected size: ${Platform.NumberUtilities.bytesToString(event.data.size)}`);
    this._setSelectionRange(minId, maxId);
  }

  /**
   * @param {number} minId
   * @param {number} maxId
   */
  _setSelectionRange(minId, maxId) {
    const profileData = convertToSamplingHeapProfile(/** @type {!SamplingHeapProfileHeader} */ (this.profileHeader));
    const profile = new SamplingHeapProfileModel(profileData, minId, maxId);
    this.adjustedTotal = profile.total;
    this.setProfile(profile);
  }

  /**
   * @param {!Common.EventTarget.EventTargetEvent} event
   */
  _onStatsUpdate(event) {
    const profile = event.data;

    if (!this._totalTime) {
      this._timestamps = [];
      this._sizes = [];
      this._max = [];
      this._ordinals = [];
      this._totalTime = 30000;
      this._lastOrdinal = 0;
    }

    this._sizes.fill(0);
    this._sizes.push(0);
    this._timestamps.push(Date.now());
    this._ordinals.push(this._lastOrdinal + 1);
    for (const sample of profile.samples) {
      this._lastOrdinal = Math.max(this._lastOrdinal, sample.ordinal);
      const bucket = this._ordinals.upperBound(sample.ordinal) - 1;
      this._sizes[bucket] += sample.size;
    }
    this._max.push(this._sizes[this._sizes.length - 1]);

    const lastTimestamp = this._timestamps[this._timestamps.length - 1];
    if (lastTimestamp - this._timestamps[0] > this._totalTime) {
      this._totalTime *= 2;
    }

    const samples = /** @type {!Samples} */ ({
      sizes: this._sizes,
      max: this._max,
      ids: this._ordinals,
      timestamps: this._timestamps,
      totalTime: this._totalTime,
    });

    this._timelineOverview.setSamples(samples);
  }

  /**
   * @override
   * @param {string} columnId
   * @return {string}
   */
  columnHeader(columnId) {
    switch (columnId) {
      case 'self':
        return Common.UIString.UIString('Self Size (bytes)');
      case 'total':
        return Common.UIString.UIString('Total Size (bytes)');
    }
    return '';
  }

  /**
   * @override
   * @return {!ProfileFlameChartDataProvider}
   */
  createFlameChartDataProvider() {
    return new HeapFlameChartDataProvider(
        /** @type {!SamplingHeapProfileModel} */ (this.profile()), this.profileHeader.heapProfilerModel());
  }

}

/**
 * @unrestricted
 */
export class SamplingHeapProfileTypeBase extends ProfileType {
  /**
   * @param {string} typeId
   * @param {string} description
   */
  constructor(typeId, description) {
    super(typeId, description);
    this._recording = false;
  }

  /**
   * @override
   * @return {?SamplingHeapProfileHeader}
   */
  profileBeingRecorded() {
    return /** @type {?SamplingHeapProfileHeader} */ (super.profileBeingRecorded());
  }

  /**
   * @override
   * @return {string}
   */
  typeName() {
    return 'Heap';
  }

  /**
   * @override
   * @return {string}
   */
  fileExtension() {
    return '.heapprofile';
  }

  /**
   * @override
   */
  get buttonTooltip() {
    return this._recording ? ls`Stop heap profiling` : ls`Start heap profiling`;
  }

  /**
   * @override
   * @return {boolean}
   */
  buttonClicked() {
    if (this._recording) {
      this._stopRecordingProfile();
    } else {
      this._startRecordingProfile();
    }
    return this._recording;
  }

  _startRecordingProfile() {
    const heapProfilerModel = UI.Context.Context.instance().flavor(SDK.HeapProfilerModel.HeapProfilerModel);
    if (this.profileBeingRecorded() || !heapProfilerModel) {
      return;
    }
    const profileHeader = new SamplingHeapProfileHeader(heapProfilerModel, this);
    this.setProfileBeingRecorded(profileHeader);
    this.addProfile(profileHeader);
    profileHeader.updateStatus(ls`Recording…`);

    const icon = UI.Icon.Icon.create('smallicon-warning');
    UI.Tooltip.Tooltip.install(icon, ls`Heap profiler is recording`);
    UI.InspectorView.InspectorView.instance().setPanelIcon('heap_profiler', icon);

    this._recording = true;
    this._startSampling();
  }

  async _stopRecordingProfile() {
    this._recording = false;
    const recordedProfile = this.profileBeingRecorded();
    if (!recordedProfile || !recordedProfile.heapProfilerModel()) {
      return;
    }

    recordedProfile.updateStatus(ls`Stopping…`);
    const profile = await this._stopSampling();
    if (recordedProfile) {
      console.assert(profile !== undefined);
      recordedProfile.setProtocolProfile(/** @type {?} */ (profile));
      recordedProfile.updateStatus('');
      this.setProfileBeingRecorded(null);
    }
    UI.InspectorView.InspectorView.instance().setPanelIcon('heap_profiler', null);
    this.dispatchEventToListeners(ProfileEvents.ProfileComplete, recordedProfile);
  }

  /**
   * @override
   * @param {string} title
   * @return {!ProfileHeader}
   */
  createProfileLoadedFromFile(title) {
    return new SamplingHeapProfileHeader(null, this, title);
  }

  /**
   * @override
   */
  profileBeingRecordedRemoved() {
    this._stopRecordingProfile();
  }

  _startSampling() {
    throw 'Not implemented';
  }

  /**
   * @return {!Promise<!Protocol.HeapProfiler.SamplingHeapProfile>}
   */
  _stopSampling() {
    throw 'Not implemented';
  }
}

/** @type {!SamplingHeapProfileType} */
let samplingHeapProfileTypeInstance;

/**
 * @unrestricted
 */
export class SamplingHeapProfileType extends SamplingHeapProfileTypeBase {
  constructor() {
    super(SamplingHeapProfileType.TypeId, ls`Allocation sampling`);
    if (!samplingHeapProfileTypeInstance) {
      samplingHeapProfileTypeInstance = this;
    }

    /** @type {number} */
    this._updateTimer = 0;
    this._updateIntervalMs = 200;
  }

  static get instance() {
    return samplingHeapProfileTypeInstance;
  }

  /**
   * @override
   */
  get treeItemTitle() {
    return ls`SAMPLING PROFILES`;
  }

  /**
   * @override
   */
  get description() {
    return ls`Record memory allocations using sampling method.
              This profile type has minimal performance overhead and can be used for long running operations.
              It provides good approximation of allocations broken down by JavaScript execution stack.`;
  }

  /**
   * @override
   * @return {boolean}
   */
  hasTemporaryView() {
    return Root.Runtime.experiments.isEnabled('samplingHeapProfilerTimeline');
  }

  /**
   * @override
   */
  _startSampling() {
    const heapProfilerModel = this._obtainRecordingProfile();
    if (!heapProfilerModel) {
      return;
    }

    heapProfilerModel.startSampling();
    if (Root.Runtime.experiments.isEnabled('samplingHeapProfilerTimeline')) {
      this._updateTimer = window.setTimeout(() => {
        this._updateStats();
      }, this._updateIntervalMs);
    }
  }

  /**
   * @return {?SDK.HeapProfilerModel.HeapProfilerModel}
   */
  _obtainRecordingProfile() {
    const recordingProfile = this.profileBeingRecorded();
    if (recordingProfile) {
      const heapProfilerModel = recordingProfile.heapProfilerModel();
      return heapProfilerModel;
    }
    return null;
  }

  /**
   * @override
   * @return {!Promise<!Protocol.HeapProfiler.SamplingHeapProfile>}
   */
  async _stopSampling() {
    window.clearTimeout(this._updateTimer);
    this._updateTimer = 0;
    this.dispatchEventToListeners(SamplingHeapProfileType.Events.RecordingStopped);
    const heapProfilerModel = this._obtainRecordingProfile();
    if (!heapProfilerModel) {
      throw new Error('No heap profiler model');
    }

    const samplingProfile = await heapProfilerModel.stopSampling();
    if (!samplingProfile) {
      throw new Error('No sampling profile found');
    }
    return samplingProfile;
  }

  async _updateStats() {
    const heapProfilerModel = this._obtainRecordingProfile();
    if (!heapProfilerModel) {
      return;
    }

    const profile = await heapProfilerModel.getSamplingProfile();
    if (!this._updateTimer) {
      return;
    }
    this.dispatchEventToListeners(SamplingHeapProfileType.Events.StatsUpdate, profile);
    this._updateTimer = window.setTimeout(() => {
      this._updateStats();
    }, this._updateIntervalMs);
  }
}

SamplingHeapProfileType.TypeId = 'SamplingHeap';

/** @override @suppress {checkPrototypalTypes} @enum {symbol} */
SamplingHeapProfileType.Events = {
  RecordingStopped: Symbol('RecordingStopped'),
  StatsUpdate: Symbol('StatsUpdate')
};

/**
 * @unrestricted
 */
export class SamplingHeapProfileHeader extends WritableProfileHeader {
  /**
   * @param {?SDK.HeapProfilerModel.HeapProfilerModel} heapProfilerModel
   * @param {!SamplingHeapProfileTypeBase} type
   * @param {string=} title
   */
  constructor(heapProfilerModel, type, title) {
    super(
        heapProfilerModel && heapProfilerModel.debuggerModel(), type,
        title || Common.UIString.UIString('Profile %d', type.nextProfileUid()));
    this._heapProfilerModel = heapProfilerModel;
    this._protocolProfile = {
      head: {
        callFrame: {
          functionName: '',
          scriptId: '',
          url: '',
          lineNumber: 0,
          columnNumber: 0,
        },
        children: [],
        selfSize: 0,
        id: 0,
      },
      samples: [],
      startTime: 0,
      endTime: 0,
      nodes: [],
    };
  }

  /**
   * @override
   * @return {!HeapProfileView}
   */
  createView() {
    return new HeapProfileView(this);
  }

  /**
   * @return {!Protocol.HeapProfiler.SamplingHeapProfile}
   */
  protocolProfile() {
    return this._protocolProfile;
  }

  /**
   * @return {?SDK.HeapProfilerModel.HeapProfilerModel}
   */
  heapProfilerModel() {
    return this._heapProfilerModel;
  }
}

/**
 * @unrestricted
 */
export class SamplingHeapProfileNode extends SDK.ProfileTreeModel.ProfileNode {
  /**
   * @param {!Protocol.HeapProfiler.SamplingHeapProfileNode} node
   */
  constructor(node) {
    const callFrame = node.callFrame || /** @type {!Protocol.Runtime.CallFrame} */ ({
                        // Backward compatibility for old CpuProfileNode format.
                        // @ts-ignore https://crbug.com/1150777
                        functionName: node['functionName'],
                        // @ts-ignore https://crbug.com/1150777
                        scriptId: node['scriptId'],
                        // @ts-ignore https://crbug.com/1150777
                        url: node['url'],
                        // @ts-ignore https://crbug.com/1150777
                        lineNumber: node['lineNumber'] - 1,
                        // @ts-ignore https://crbug.com/1150777
                        columnNumber: node['columnNumber'] - 1,
                      });
    super(callFrame);
    this.self = node.selfSize;
  }
}

/**
 * @unrestricted
 */
export class SamplingHeapProfileModel extends SDK.ProfileTreeModel.ProfileTreeModel {
  /**
   * @param {!Protocol.HeapProfiler.SamplingHeapProfile} profile
   * @param {number=} minOrdinal
   * @param {number=} maxOrdinal
   */
  constructor(profile, minOrdinal, maxOrdinal) {
    super();
    this.modules = /** @type {?} */ (profile).modules || [];

    /** @type {?Map<number, number>} */
    let nodeIdToSizeMap = null;
    if (minOrdinal || maxOrdinal) {
      nodeIdToSizeMap = new Map();
      minOrdinal = minOrdinal || 0;
      maxOrdinal = maxOrdinal || Infinity;
      for (const sample of profile.samples) {
        if (sample.ordinal < minOrdinal || sample.ordinal > maxOrdinal) {
          continue;
        }
        const size = nodeIdToSizeMap.get(sample.nodeId) || 0;
        nodeIdToSizeMap.set(sample.nodeId, size + sample.size);
      }
    }

    this.initialize(translateProfileTree(profile.head));

    /**
     * @param {!Protocol.HeapProfiler.SamplingHeapProfileNode} root
     * @return {!SamplingHeapProfileNode}
     */
    function translateProfileTree(root) {
      const resultRoot = new SamplingHeapProfileNode(root);
      const sourceNodeStack = [root];
      const targetNodeStack = [resultRoot];
      while (sourceNodeStack.length) {
        const sourceNode = /** @type {!Protocol.HeapProfiler.SamplingHeapProfileNode} */ (sourceNodeStack.pop());
        const targetNode = /** @type {!SamplingHeapProfileNode} */ (targetNodeStack.pop());
        targetNode.children = sourceNode.children.map(child => {
          const targetChild = new SamplingHeapProfileNode(child);
          if (nodeIdToSizeMap) {
            targetChild.self = nodeIdToSizeMap.get(child.id) || 0;
          }
          return targetChild;
        });
        sourceNodeStack.push(...sourceNode.children);
        targetNodeStack.push(...targetNode.children);
      }
      pruneEmptyBranches(resultRoot);
      return resultRoot;
    }

    /**
     * @param {!SDK.ProfileTreeModel.ProfileNode} node
     * @return {boolean}
     */
    function pruneEmptyBranches(node) {
      node.children = node.children.filter(pruneEmptyBranches);
      return !!(node.children.length || node.self);
    }
  }
}

/**
 * @implements {Formatter}
 * @unrestricted
 */
export class NodeFormatter {
  /**
   * @param {!HeapProfileView} profileView
   */
  constructor(profileView) {
    this._profileView = profileView;
  }

  /**
   * @override
   * @param {number} value
   * @return {string}
   */
  formatValue(value) {
    return Number.withThousandsSeparator(value);
  }

  /**
   * @override
   * @param {number} value
   * @return {string}
   */
  formatValueAccessibleText(value) {
    return ls`${value} bytes`;
  }

  /**
   * @override
   * @param {number} value
   * @param {!ProfileDataGridNode} node
   * @return {string}
   */
  formatPercent(value, node) {
    return Common.UIString.UIString('%.2f\xa0%%', value);
  }

  /**
   * @override
   * @param  {!ProfileDataGridNode} node
   * @return {?Element}
   */
  linkifyNode(node) {
    const heapProfilerModel = this._profileView.profileHeader.heapProfilerModel();
    const target = heapProfilerModel ? heapProfilerModel.target() : null;
    const options = {
      className: 'profile-node-file',
      columnNumber: undefined,
      tabStop: undefined,
    };
    return this._profileView.linkifier().maybeLinkifyConsoleCallFrame(target, node.profileNode.callFrame, options);
  }
}

/**
 * @unrestricted
 */
export class HeapFlameChartDataProvider extends ProfileFlameChartDataProvider {
  /**
   * @param {!SDK.ProfileTreeModel.ProfileTreeModel} profile
   * @param {?SDK.HeapProfilerModel.HeapProfilerModel} heapProfilerModel
   */
  constructor(profile, heapProfilerModel) {
    super();
    this._profile = profile;
    this._heapProfilerModel = heapProfilerModel;
    /** @type {!Array<!SDK.ProfileTreeModel.ProfileNode>} */
    this._entryNodes = [];
  }

  /**
   * @override
   * @return {number}
   */
  minimumBoundary() {
    return 0;
  }

  /**
   * @override
   * @return {number}
   */
  totalTime() {
    return this._profile.root.total;
  }

  /**
   * @override
   * @param {number} entryIndex
   * @return {boolean}
   */
  entryHasDeoptReason(entryIndex) {
    return false;
  }

  /**
   * @override
   * @param {number} value
   * @param {number=} precision
   * @return {string}
   */
  formatValue(value, precision) {
    return Common.UIString.UIString('%s\xa0kB', Number.withThousandsSeparator(value / 1e3));
  }

  /**
   * @override
   * @return {!PerfUI.FlameChart.TimelineData}
   */
  _calculateTimelineData() {
    /**
     * @param  {!SDK.ProfileTreeModel.ProfileNode} node
     * @return {number}
     */
    function nodesCount(node) {
      return node.children.reduce((count, node) => count + nodesCount(node), 1);
    }
    const count = nodesCount(this._profile.root);
    /** @type {!Array<!SDK.ProfileTreeModel.ProfileNode>} */
    const entryNodes = new Array(count);
    const entryLevels = new Uint16Array(count);
    const entryTotalTimes = new Float32Array(count);
    const entryStartTimes = new Float64Array(count);
    let depth = 0;
    let maxDepth = 0;
    let position = 0;
    let index = 0;

    /**
     * @param {!SDK.ProfileTreeModel.ProfileNode} node
     */
    function addNode(node) {
      const start = position;
      entryNodes[index] = node;
      entryLevels[index] = depth;
      entryTotalTimes[index] = node.total;
      entryStartTimes[index] = position;
      ++index;
      ++depth;
      node.children.forEach(addNode);
      --depth;
      maxDepth = Math.max(maxDepth, depth);
      position = start + node.total;
    }
    addNode(this._profile.root);

    this._maxStackDepth = maxDepth + 1;
    this._entryNodes = entryNodes;
    this._timelineData = new PerfUI.FlameChart.TimelineData(entryLevels, entryTotalTimes, entryStartTimes, null);

    return this._timelineData;
  }

  /**
   * @override
   * @param {number} entryIndex
   * @return {?Element}
   */
  prepareHighlightedEntryInfo(entryIndex) {
    const node = this._entryNodes[entryIndex];
    if (!node) {
      return null;
    }
    /** @type {!Array<{ title: string, value: string }>} */
    const entryInfo = [];
    /**
     * @param {string} title
     * @param {string} value
     */
    function pushEntryInfoRow(title, value) {
      entryInfo.push({title: title, value: value});
    }
    pushEntryInfoRow(ls`Name`, UI.UIUtils.beautifyFunctionName(node.functionName));
    pushEntryInfoRow(ls`Self size`, Platform.NumberUtilities.bytesToString(node.self));
    pushEntryInfoRow(ls`Total size`, Platform.NumberUtilities.bytesToString(node.total));
    const linkifier = new Components.Linkifier.Linkifier();
    const link = linkifier.maybeLinkifyConsoleCallFrame(
        this._heapProfilerModel ? this._heapProfilerModel.target() : null, node.callFrame);
    if (link) {
      pushEntryInfoRow(ls`URL`, /** @type {string} */ (link.textContent));
    }
    linkifier.dispose();
    return ProfileView.buildPopoverTable(entryInfo);
  }
}
