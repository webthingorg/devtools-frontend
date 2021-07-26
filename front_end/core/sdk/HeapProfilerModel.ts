// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.


import type * as ProtocolProxyApi from '../../generated/protocol-proxy-api.js';
import type * as Protocol from '../../generated/protocol.js';

import type {DebuggerModel} from './DebuggerModel.js';       // eslint-disable-line no-unused-vars
import type {RemoteObject} from './RemoteObject.js';         // eslint-disable-line no-unused-vars
import {RuntimeModel} from './RuntimeModel.js';              // eslint-disable-line no-unused-vars
import type {Target} from './Target.js';
import {Capability} from './Target.js';
import {SDKModel} from './SDKModel.js';

export class HeapProfilerModel extends SDKModel {
  private enabled: boolean;
  private readonly heapProfilerAgent: ProtocolProxyApi.HeapProfilerApi;
  private readonly memoryAgent: ProtocolProxyApi.MemoryApi;
  private readonly runtimeModelInternal: RuntimeModel;
  private samplingProfilerDepth: number;

  constructor(target: Target) {
    super(target);
    target.registerHeapProfilerDispatcher(new HeapProfilerDispatcher(this));
    this.enabled = false;
    this.heapProfilerAgent = target.heapProfilerAgent();
    this.memoryAgent = target.memoryAgent();
    this.runtimeModelInternal = (target.model(RuntimeModel) as RuntimeModel);
    this.samplingProfilerDepth = 0;
  }

  debuggerModel(): DebuggerModel {
    return this.runtimeModelInternal.debuggerModel();
  }

  runtimeModel(): RuntimeModel {
    return this.runtimeModelInternal;
  }

  async enable(): Promise<void> {
    if (this.enabled) {
      return;
    }

    this.enabled = true;
    await this.heapProfilerAgent.invoke_enable();
  }

  async startSampling(samplingRateInBytes?: number): Promise<boolean> {
    if (this.samplingProfilerDepth++) {
      return false;
    }
    const defaultSamplingIntervalInBytes = 16384;
    const response = await this.heapProfilerAgent.invoke_startSampling(
        {samplingInterval: samplingRateInBytes || defaultSamplingIntervalInBytes});
    return Boolean(response.getError());
  }

  async stopSampling(): Promise<Protocol.HeapProfiler.SamplingHeapProfile|null> {
    if (!this.samplingProfilerDepth) {
      throw new Error('Sampling profiler is not running.');
    }
    if (--this.samplingProfilerDepth) {
      return this.getSamplingProfile();
    }
    const response = await this.heapProfilerAgent.invoke_stopSampling();
    if (response.getError()) {
      return null;
    }
    return response.profile;
  }

  async getSamplingProfile(): Promise<Protocol.HeapProfiler.SamplingHeapProfile|null> {
    const response = await this.heapProfilerAgent.invoke_getSamplingProfile();
    if (response.getError()) {
      return null;
    }
    return response.profile;
  }

  async collectGarbage(): Promise<boolean> {
    const response = await this.heapProfilerAgent.invoke_collectGarbage();
    return Boolean(response.getError());
  }

  async snapshotObjectIdForObjectId(objectId: string): Promise<string|null> {
    const response = await this.heapProfilerAgent.invoke_getHeapObjectId({objectId});
    if (response.getError()) {
      return null;
    }
    return response.heapSnapshotObjectId;
  }

  async objectForSnapshotObjectId(snapshotObjectId: string, objectGroupName: string): Promise<RemoteObject|null> {
    const result = await this.heapProfilerAgent.invoke_getObjectByHeapObjectId(
        {objectId: snapshotObjectId, objectGroup: objectGroupName});
    if (result.getError()) {
      return null;
    }
    return this.runtimeModelInternal.createRemoteObject(result.result);
  }

  async addInspectedHeapObject(snapshotObjectId: string): Promise<boolean> {
    const response = await this.heapProfilerAgent.invoke_addInspectedHeapObject({heapObjectId: snapshotObjectId});
    return Boolean(response.getError());
  }

  async takeHeapSnapshot(heapSnapshotOptions: Protocol.HeapProfiler.TakeHeapSnapshotRequest): Promise<void> {
    await this.heapProfilerAgent.invoke_takeHeapSnapshot(heapSnapshotOptions);
  }

  async startTrackingHeapObjects(recordAllocationStacks: boolean): Promise<boolean> {
    const response =
        await this.heapProfilerAgent.invoke_startTrackingHeapObjects({trackAllocations: recordAllocationStacks});
    return Boolean(response.getError());
  }

  async stopTrackingHeapObjects(reportProgress: boolean): Promise<boolean> {
    const response = await this.heapProfilerAgent.invoke_stopTrackingHeapObjects({reportProgress});
    return Boolean(response.getError());
  }

  heapStatsUpdate(samples: number[]): void {
    this.dispatchEventToListeners(Events.HeapStatsUpdate, samples);
  }

  lastSeenObjectId(lastSeenObjectId: number, timestamp: number): void {
    this.dispatchEventToListeners(Events.LastSeenObjectId, {lastSeenObjectId: lastSeenObjectId, timestamp: timestamp});
  }

  addHeapSnapshotChunk(chunk: string): void {
    this.dispatchEventToListeners(Events.AddHeapSnapshotChunk, chunk);
  }

  reportHeapSnapshotProgress(done: number, total: number, finished?: boolean): void {
    this.dispatchEventToListeners(Events.ReportHeapSnapshotProgress, {done: done, total: total, finished: finished});
  }

  resetProfiles(): void {
    this.dispatchEventToListeners(Events.ResetProfiles, this);
  }
}

// TODO(crbug.com/1167717): Make this a const enum again
// eslint-disable-next-line rulesdir/const_enum
export enum Events {
  HeapStatsUpdate = 'HeapStatsUpdate',
  LastSeenObjectId = 'LastSeenObjectId',
  AddHeapSnapshotChunk = 'AddHeapSnapshotChunk',
  ReportHeapSnapshotProgress = 'ReportHeapSnapshotProgress',
  ResetProfiles = 'ResetProfiles',
}

export interface NativeProfilerCallFrame {
  functionName: string;
  url: string;
  scriptId?: string;
  lineNumber?: number;
  columnNumber?: number;
}

export interface CommonHeapProfileNode {
  callFrame: NativeProfilerCallFrame;
  selfSize: number;
  id?: number;
  children: CommonHeapProfileNode[];
}

export interface CommonHeapProfile {
  head: CommonHeapProfileNode;
  modules: Protocol.Memory.Module[];
}

class HeapProfilerDispatcher implements ProtocolProxyApi.HeapProfilerDispatcher {
  private readonly heapProfilerModel: HeapProfilerModel;
  constructor(model: HeapProfilerModel) {
    this.heapProfilerModel = model;
  }

  heapStatsUpdate({statsUpdate}: Protocol.HeapProfiler.HeapStatsUpdateEvent): void {
    this.heapProfilerModel.heapStatsUpdate(statsUpdate);
  }

  lastSeenObjectId({lastSeenObjectId, timestamp}: Protocol.HeapProfiler.LastSeenObjectIdEvent): void {
    this.heapProfilerModel.lastSeenObjectId(lastSeenObjectId, timestamp);
  }

  addHeapSnapshotChunk({chunk}: Protocol.HeapProfiler.AddHeapSnapshotChunkEvent): void {
    this.heapProfilerModel.addHeapSnapshotChunk(chunk);
  }

  reportHeapSnapshotProgress({done, total, finished}: Protocol.HeapProfiler.ReportHeapSnapshotProgressEvent): void {
    this.heapProfilerModel.reportHeapSnapshotProgress(done, total, finished);
  }

  resetProfiles(): void {
    this.heapProfilerModel.resetProfiles();
  }
}

SDKModel.register(HeapProfilerModel, {capabilities: Capability.JS, autostart: false});
