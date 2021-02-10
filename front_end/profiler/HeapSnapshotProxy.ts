/*
 * Copyright (C) 2011 Google Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/* eslint-disable rulesdir/no_underscored_properties */

import * as Common from '../common/common.js';
import * as HeapSnapshotModel from '../heap_snapshot_model/heap_snapshot_model.js'; // eslint-disable-line no-unused-vars
import * as i18n from '../i18n/i18n.js';
import { ChildrenProvider } from './ChildrenProvider.js'; // eslint-disable-line no-unused-vars

export const UIStrings = {
  /**
  *@description Text in Heap Snapshot Proxy of a profiler tool
  *@example {functionName} PH1
  */
  anErrorOccurredWhenACallToMethod: 'An error occurred when a call to method \'{PH1}\' was requested',
};
const str_ = i18n.i18n.registerUIStrings('profiler/HeapSnapshotProxy.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);
// Transformation: updatePropertyDeclarations
export class HeapSnapshotWorkerProxy extends Common.ObjectWrapper.ObjectWrapper {
  _eventHandler: (arg0: string, arg1: any) => void;
  _nextObjectId: number;
  _nextCallId: number;
  _callbacks: Map<number, (arg0: any) => void>;
  _previousCallbacks: Set<number>;
  _worker: Common.Worker.WorkerWrapper;
  _interval?: number;
  // Transformation: updateParameters
  constructor(eventHandler: (arg0: string, arg1: any) => void) {
    super();
    this._eventHandler = eventHandler;
    this._nextObjectId = 1;
    this._nextCallId = 1;
    this._callbacks = new Map();
    this._previousCallbacks = new Set();
    // We use the legacy file here, as below we postMessage and expect certain objects to be
    // defined on the global scope. Ideally we use some sort of import-export mechanism across
    // worker boundaries, but that requires a partial rewrite of the heap_snapshot_worker.
    this._worker = Common.Worker.WorkerWrapper.fromURL(new URL('../heap_snapshot_worker/heap_snapshot_worker-legacy.js', import.meta.url));
    this._worker.onmessage = this._messageReceived.bind(this);
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  createLoader(profileUid: number, snapshotReceivedCallback: (arg0: HeapSnapshotProxy) => void): HeapSnapshotLoaderProxy {
    const objectId = this._nextObjectId++;
    const proxy = new HeapSnapshotLoaderProxy(this, objectId, profileUid, snapshotReceivedCallback);
    this._postMessage({
      callId: this._nextCallId++,
      disposition: 'create',
      objectId: objectId,
      methodName: 'HeapSnapshotWorker.HeapSnapshotLoader'
    });
    return proxy;
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  dispose(): void {
    this._worker.terminate();
    if (this._interval) {
      clearInterval(this._interval);
    }
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  disposeObject(objectId: number): void {
    this._postMessage({ callId: this._nextCallId++, disposition: 'dispose', objectId: objectId });
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  evaluateForTest(script: string, callback: (arg0: any) => void): void {
    const callId = this._nextCallId++;
    this._callbacks.set(callId, callback);
    this._postMessage({ callId: callId, disposition: 'evaluateForTest', source: script });
  }

  /**
   * @template T
   */
  // Transformation: updateReturnType
  // Transformation: updateParameters
  callFactoryMethod(callback: ((...arg0: unknown[]) => void) | null, objectId: string, methodName: string, proxyConstructor: new (...arg1: unknown[]) => T): Object | null {
    const callId = this._nextCallId++;
    const methodArguments = Array.prototype.slice.call(arguments, 4);
    const newObjectId = this._nextObjectId++;

    if (callback) {
      this._callbacks.set(callId, 
      // Transformation: updateParameters
      remoteResult => {
        callback(remoteResult ? new proxyConstructor(this, newObjectId) : null);
      });
      this._postMessage({
        callId: callId,
        disposition: 'factory',
        objectId: objectId,
        methodName: methodName,
        methodArguments: methodArguments,
        newObjectId: newObjectId
      });
      return null;
    }
    this._postMessage({
      callId: callId,
      disposition: 'factory',
      objectId: objectId,
      methodName: methodName,
      methodArguments: methodArguments,
      newObjectId: newObjectId
    });
    return new proxyConstructor(this, newObjectId);
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  callMethod(callback: (arg0: any) => void, objectId: string, methodName: string): void {
    const callId = this._nextCallId++;
    const methodArguments = Array.prototype.slice.call(arguments, 3);
    if (callback) {
      this._callbacks.set(callId, callback);
    }
    this._postMessage({
      callId: callId,
      disposition: 'method',
      objectId: objectId,
      methodName: methodName,
      methodArguments: methodArguments
    });
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  startCheckingForLongRunningCalls(): void {
    if (this._interval) {
      return;
    }
    this._checkLongRunningCalls();
    this._interval = setInterval(this._checkLongRunningCalls.bind(this), 300);
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  _checkLongRunningCalls(): void {
    for (const callId of this._previousCallbacks) {
      if (!this._callbacks.has(callId)) {
        this._previousCallbacks.delete(callId);
      }
    }
    const hasLongRunningCalls = Boolean(this._previousCallbacks.size);
    this.dispatchEventToListeners(HeapSnapshotWorkerProxy.Events.Wait, hasLongRunningCalls);
    for (const callId of this._callbacks.keys()) {
      this._previousCallbacks.add(callId);
    }
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  _messageReceived(event: MessageEvent<any>): void {
    const data = event.data;
    if (data.eventName) {
      if (this._eventHandler) {
        this._eventHandler(data.eventName, data.data);
      }
      return;
    }
    if (data.error) {
      if (data.errorMethodName) {
        Common.Console.Console.instance().error(i18nString(UIStrings.anErrorOccurredWhenACallToMethod, { PH1: data.errorMethodName }));
      }
      Common.Console.Console.instance().error(data['errorCallStack']);
      this._callbacks.delete(data.callId);
      return;
    }
    const callback = this._callbacks.get(data.callId);
    if (!callback) {
      return;
    }
    this._callbacks.delete(data.callId);
    callback(data.result);
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  _postMessage(message: any): void {
    this._worker.postMessage(message);
  }
}

HeapSnapshotWorkerProxy.Events = {
  Wait: Symbol('Wait')
};

// Transformation: updatePropertyDeclarations
export class HeapSnapshotProxyObject {
  _worker: HeapSnapshotWorkerProxy;
  _objectId: number;
  // Transformation: updateParameters
  constructor(worker: HeapSnapshotWorkerProxy, objectId: number) {
    this._worker = worker;
    this._objectId = objectId;
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  _callWorker(workerMethodName: string, args: any[]): any {
    args.splice(1, 0, this._objectId);
    const worker = (this._worker as any)[workerMethodName];
    if (!worker) {
      throw new Error(`Could not find worker with name ${workerMethodName}.`);
    }
    return worker.apply(this._worker, args);
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  dispose(): void {
    this._worker.disposeObject(this._objectId);
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  disposeWorker(): void {
    this._worker.dispose();
  }

  /**
   * @template T
   */
  // Transformation: updateReturnType
  // Transformation: updateParameters
  callFactoryMethod(callback: ((...arg0: unknown[]) => void) | null, methodName: string, proxyConstructor: new (...arg1: unknown[]) => T, ...var_args: any[]): T {
    return this._callWorker('callFactoryMethod', Array.prototype.slice.call(arguments, 0));
  }

  /**
   * @template T
   */
  // Transformation: updateReturnType
  // Transformation: updateParameters
  _callMethodPromise(methodName: string, ...var_args: any[]): Promise<T> {
    const args = Array.prototype.slice.call(arguments);
    return new Promise(
    // Transformation: updateParameters
    resolve => this._callWorker('callMethod', [resolve, ...args]));
  }
}

// Transformation: updatePropertyDeclarations
// Transformation: updateInterfacesImplementations
export class HeapSnapshotLoaderProxy extends HeapSnapshotProxyObject implements Common.StringOutputStream.OutputStream {
  _profileUid: number;
  _snapshotReceivedCallback: (arg0: HeapSnapshotProxy) => void;
  // Transformation: updateParameters
  constructor(worker: HeapSnapshotWorkerProxy, objectId: number, profileUid: number, snapshotReceivedCallback: (arg0: HeapSnapshotProxy) => void) {
    super(worker, objectId);
    this._profileUid = profileUid;
    this._snapshotReceivedCallback = snapshotReceivedCallback;
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  async write(chunk: string): Promise<void> {
    await this._callMethodPromise('write', chunk);
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  async close(): Promise<void> {
    await this._callMethodPromise('close');
    const snapshotProxy = await new Promise(
    // Transformation: updateParameters
    resolve => this.callFactoryMethod(resolve, 'buildSnapshot', HeapSnapshotProxy));
    this.dispose();
    snapshotProxy.setProfileUid(this._profileUid);
    await snapshotProxy.updateStaticData();
    this._snapshotReceivedCallback(snapshotProxy);
  }
}

// Transformation: updatePropertyDeclarations
export class HeapSnapshotProxy extends HeapSnapshotProxyObject {
  _staticData: HeapSnapshotModel.HeapSnapshotModel.StaticData | null;
  _profileUid?: string;
  // Transformation: updateParameters
  constructor(worker: HeapSnapshotWorkerProxy, objectId: number) {
    super(worker, objectId);
    this._staticData = null;
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  search(searchConfig: HeapSnapshotModel.HeapSnapshotModel.SearchConfig, filter: HeapSnapshotModel.HeapSnapshotModel.NodeFilter): Promise<number[]> {
    return this._callMethodPromise('search', searchConfig, filter);
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  aggregatesWithFilter(filter: HeapSnapshotModel.HeapSnapshotModel.NodeFilter): Promise<{
    [x: string]: HeapSnapshotModel.HeapSnapshotModel.Aggregate;
  }> {
    return this._callMethodPromise('aggregatesWithFilter', filter);
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  aggregatesForDiff(): Promise<{
    [x: string]: HeapSnapshotModel.HeapSnapshotModel.AggregateForDiff;
  }> {
    return this._callMethodPromise('aggregatesForDiff');
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  calculateSnapshotDiff(baseSnapshotId: string, baseSnapshotAggregates: {
    [x: string]: HeapSnapshotModel.HeapSnapshotModel.AggregateForDiff;
  }): Promise<{
    [x: string]: HeapSnapshotModel.HeapSnapshotModel.Diff;
  }> {
    return this._callMethodPromise('calculateSnapshotDiff', baseSnapshotId, baseSnapshotAggregates);
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  nodeClassName(snapshotObjectId: number): Promise<string | null> {
    return this._callMethodPromise('nodeClassName', snapshotObjectId);
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  createEdgesProvider(nodeIndex: number): HeapSnapshotProviderProxy {
    return this.callFactoryMethod(null, 'createEdgesProvider', HeapSnapshotProviderProxy, nodeIndex);
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  createRetainingEdgesProvider(nodeIndex: number): HeapSnapshotProviderProxy {
    return this.callFactoryMethod(null, 'createRetainingEdgesProvider', HeapSnapshotProviderProxy, nodeIndex);
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  createAddedNodesProvider(baseSnapshotId: string, className: string): HeapSnapshotProviderProxy | null {
    return this.callFactoryMethod(null, 'createAddedNodesProvider', HeapSnapshotProviderProxy, baseSnapshotId, className);
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  createDeletedNodesProvider(nodeIndexes: number[]): HeapSnapshotProviderProxy | null {
    return this.callFactoryMethod(null, 'createDeletedNodesProvider', HeapSnapshotProviderProxy, nodeIndexes);
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  createNodesProvider(filter: (arg0: any) => boolean): HeapSnapshotProviderProxy | null {
    return this.callFactoryMethod(null, 'createNodesProvider', HeapSnapshotProviderProxy, filter);
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  createNodesProviderForClass(className: string, nodeFilter: HeapSnapshotModel.HeapSnapshotModel.NodeFilter): HeapSnapshotProviderProxy | null {
    return this.callFactoryMethod(null, 'createNodesProviderForClass', HeapSnapshotProviderProxy, className, nodeFilter);
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  allocationTracesTops(): Promise<HeapSnapshotModel.HeapSnapshotModel.SerializedAllocationNode[]> {
    return this._callMethodPromise('allocationTracesTops');
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  allocationNodeCallers(nodeId: number): Promise<HeapSnapshotModel.HeapSnapshotModel.AllocationNodeCallers> {
    return this._callMethodPromise('allocationNodeCallers', nodeId);
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  allocationStack(nodeIndex: number): Promise<HeapSnapshotModel.HeapSnapshotModel.AllocationStackFrame[] | null> {
    return this._callMethodPromise('allocationStack', nodeIndex);
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  dispose(): void {
    throw new Error('Should never be called');
  }

  get nodeCount() {
    if (!this._staticData) {
      return 0;
    }
    return this._staticData.nodeCount;
  }

  get rootNodeIndex() {
    if (!this._staticData) {
      return 0;
    }
    return this._staticData.rootNodeIndex;
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  async updateStaticData(): Promise<void> {
    this._staticData = await this._callMethodPromise('updateStaticData');
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  getStatistics(): Promise<HeapSnapshotModel.HeapSnapshotModel.Statistics> {
    return this._callMethodPromise('getStatistics');
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  getLocation(nodeIndex: number): Promise<HeapSnapshotModel.HeapSnapshotModel.Location | null> {
    return this._callMethodPromise('getLocation', nodeIndex);
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  getSamples(): Promise<HeapSnapshotModel.HeapSnapshotModel.Samples | null> {
    return this._callMethodPromise('getSamples');
  }

  get totalSize() {
    if (!this._staticData) {
      return 0;
    }
    return this._staticData.totalSize;
  }

  get uid() {
    return this._profileUid;
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  setProfileUid(profileUid: string): void {
    this._profileUid = profileUid;
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  maxJSObjectId(): number {
    if (!this._staticData) {
      return 0;
    }
    return this._staticData.maxJSObjectId;
  }
}

// Transformation: updatePropertyDeclarations
// Transformation: updateInterfacesImplementations
export class HeapSnapshotProviderProxy extends HeapSnapshotProxyObject implements ChildrenProvider {
  // Transformation: updateParameters
  constructor(worker: HeapSnapshotWorkerProxy, objectId: number) {
    super(worker, objectId);
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  nodePosition(snapshotObjectId: number): Promise<number> {
    return this._callMethodPromise('nodePosition', snapshotObjectId);
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  isEmpty(): Promise<boolean> {
    return this._callMethodPromise('isEmpty');
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  serializeItemsRange(startPosition: number, endPosition: number): Promise<HeapSnapshotModel.HeapSnapshotModel.ItemsRange> {
    return this._callMethodPromise('serializeItemsRange', startPosition, endPosition);
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  async sortAndRewind(comparator: HeapSnapshotModel.HeapSnapshotModel.ComparatorConfig): Promise<void> {
    await this._callMethodPromise('sortAndRewind', comparator);
  }
}
