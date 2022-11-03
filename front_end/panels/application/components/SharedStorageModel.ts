/*
 * Copyright (C) 2022 Google Inc. All rights reserved.
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

import * as Common from '../../../core/common/common.js';
import * as SDK from '../../../core/sdk/sdk.js';
import * as Protocol from '../../../generated/protocol.js';
import type * as ProtocolProxyApi from '../../../generated/protocol-proxy-api.js';

export class SharedStorage extends Common.ObjectWrapper.ObjectWrapper<SharedStorage.EventTypes> {
  readonly #model: SharedStorageModel;
  readonly #securityOriginInternal: string;

  constructor(model: SharedStorageModel, securityOrigin: string) {
    super();
    this.#model = model;
    this.#securityOriginInternal = securityOrigin;
  }

  get securityOrigin(): string {
    return this.#securityOriginInternal;
  }

  async getMetadata(): Promise<Protocol.Storage.SharedStorageMetadata|null> {
    const response = await this.#model.storageAgent.invoke_getSharedStorageMetadata({ownerOrigin: this.securityOrigin});
    if (!response || response.getError()) {
      return null;
    }
    return response.metadata;
  }

  async getEntries(): Promise<Protocol.Storage.GetSharedStorageEntriesResponse> {
    return this.#model.storageAgent.invoke_getSharedStorageEntries({ownerOrigin: this.securityOrigin});
  }

  deleteEntry(key: string): void {
    // void this.#model.storageAgent.invoke_deleteSharedStorageEntry({ownerOrigin: this.securityOrigin, key});
    // DELETE THE FOLLOWING STATEMENT, NECESSARY ONLY AS LONG AS THE ABOVE IS COMMENTED OUT.
    void key;
  }

  clear(): void {
    // void this.#model.storageAgent.invoke_clearSharedStorageEntries({ownerOrigin: this.securityOrigin});
  }
}

export namespace SharedStorage {
  // TODO(crbug.com/1167717): Make this a const enum.
  // eslint-disable-next-line rulesdir/const_enum
  export enum Events {
    SharedStorageChanged = 'SharedStorageChanged',
  }

  export interface SharedStorageChangedEvent {
    accessTime: Protocol.Network.TimeSinceEpoch;
    type: Protocol.Storage.SharedStorageAccessType;
    mainFrameId: Protocol.Page.FrameId;
    params: Protocol.Storage.SharedStorageAccessParams;
  }

  export type EventTypes = {
    [Events.SharedStorageChanged]: SharedStorageChangedEvent,
  };
}

export class SharedStorageModel extends SDK.SDKModel.SDKModel<EventTypes> implements
    ProtocolProxyApi.StorageDispatcher {
  readonly #securityOriginManager: SDK.SecurityOriginManager.SecurityOriginManager;
  #storagesInternal: Map<string, SharedStorage>;
  readonly storageAgent: ProtocolProxyApi.StorageApi;
  #enabled?: boolean;

  constructor(target: SDK.Target.Target) {
    super(target);
    target.registerStorageDispatcher(this);
    this.#securityOriginManager = target.model(SDK.SecurityOriginManager.SecurityOriginManager) as
        SDK.SecurityOriginManager.SecurityOriginManager;
    this.#storagesInternal = new Map();
    this.storageAgent = target.storageAgent();
    this.#enabled = false;
  }

  enable(): void {
    if (this.#enabled) {
      return;
    }

    this.#securityOriginManager.addEventListener(
        SDK.SecurityOriginManager.Events.SecurityOriginAdded, this.#securityOriginAdded, this);
    this.#securityOriginManager.addEventListener(
        SDK.SecurityOriginManager.Events.SecurityOriginRemoved, this.#securityOriginRemoved, this);

    for (const securityOrigin of this.#securityOriginManager.securityOrigins()) {
      this.#maybeAddOrigin(securityOrigin).catch(() => {});
    }

    void this.storageAgent.invoke_setSharedStorageTracking({enable: true});
    this.#enabled = true;
  }

  disable(): void {
    if (!this.#enabled) {
      return;
    }

    this.#securityOriginManager.removeEventListener(
        SDK.SecurityOriginManager.Events.SecurityOriginAdded, this.#securityOriginAdded, this);
    this.#securityOriginManager.removeEventListener(
        SDK.SecurityOriginManager.Events.SecurityOriginRemoved, this.#securityOriginRemoved, this);

    void this.storageAgent.invoke_setSharedStorageTracking({enable: false});

    const storagesTemp: Array<string> = [];
    for (const storage in this.#storagesInternal.keys()) {
      storagesTemp.push(storage);
    }

    for (const securityOrigin in storagesTemp) {
      this.#removeOrigin(securityOrigin);
    }

    this.#enabled = false;
  }

  async #securityOriginAdded(event: Common.EventTarget.EventTargetEvent<string>): Promise<void> {
    await this.#maybeAddOrigin(event.data);
  }

  async #maybeAddOrigin(securityOrigin: string): Promise<void> {
    const parsed = new Common.ParsedURL.ParsedURL(securityOrigin);
    // These are "opaque" origins which are not supposed to support shared storage.
    if (!parsed.isValid || parsed.scheme === 'data' || parsed.scheme === 'about' || parsed.scheme === 'javascript') {
      return;
    }

    // Only add origin if we are able to confirm that it's using shared storage.
    const metadataResponse = await this.storageAgent.invoke_getSharedStorageMetadata({ownerOrigin: securityOrigin});
    if (typeof metadataResponse.getError() !== 'undefined') {
      return;
    }

    // Only add origin if it's not already added.
    if (this.#storagesInternal.has(securityOrigin)) {
      return;
    }

    const storage = new SharedStorage(this, securityOrigin);
    this.#storagesInternal.set(securityOrigin, storage);
    this.dispatchEventToListeners(Events.SharedStorageAdded, storage);
  }

  #securityOriginRemoved(event: Common.EventTarget.EventTargetEvent<string>): void {
    this.#removeOrigin(event.data);
  }

  #removeOrigin(securityOrigin: string): void {
    const storage = this.#storagesInternal.get(securityOrigin);
    if (!storage) {
      return;
    }
    this.#storagesInternal.delete(securityOrigin);
    this.dispatchEventToListeners(Events.SharedStorageRemoved, storage);
  }

  storages(): Array<SharedStorage> {
    const result = new Array<SharedStorage>();
    for (const key in this.#storagesInternal.keys()) {
      result.push(this.#storagesInternal.get(key) as SharedStorage);
    }
    return result;
  }

  sharedStorageAccessed(event: Protocol.Storage.SharedStorageAccessedEvent): void {
    if (!this.#storagesInternal.has(event.ownerOrigin) &&
        this.#securityOriginManager.securityOrigins().indexOf(event.ownerOrigin) > -1) {
      this.#maybeAddOrigin(event.ownerOrigin).catch(() => {});
    }

    const sharedStorage = this.#storagesInternal.get(event.ownerOrigin);

    // Forward events that may have changed `sharedStorage` to listenters for `sharedStorage`.
    if (sharedStorage &&
        (event.type === Protocol.Storage.SharedStorageAccessType.DocumentSet ||
         event.type === Protocol.Storage.SharedStorageAccessType.DocumentAppend ||
         event.type === Protocol.Storage.SharedStorageAccessType.DocumentDelete ||
         event.type === Protocol.Storage.SharedStorageAccessType.DocumentClear ||
         event.type === Protocol.Storage.SharedStorageAccessType.WorkletSet ||
         event.type === Protocol.Storage.SharedStorageAccessType.WorkletAppend ||
         event.type === Protocol.Storage.SharedStorageAccessType.WorkletDelete ||
         event.type === Protocol.Storage.SharedStorageAccessType.WorkletClear)) {
      const eventData =
          {accessTime: event.accessTime, type: event.type, mainFrameId: event.mainFrameId, params: event.params};
      sharedStorage.dispatchEventToListeners(SharedStorage.Events.SharedStorageChanged, eventData);
    }

    this.dispatchEventToListeners(Events.SharedStorageAccess, event);
  }

  indexedDBListUpdated(_event: Protocol.Storage.IndexedDBListUpdatedEvent): void {
  }

  indexedDBContentUpdated(_event: Protocol.Storage.IndexedDBContentUpdatedEvent): void {
  }

  cacheStorageListUpdated(_event: Protocol.Storage.CacheStorageListUpdatedEvent): void {
  }

  cacheStorageContentUpdated(_event: Protocol.Storage.CacheStorageContentUpdatedEvent): void {
  }

  interestGroupAccessed(_event: Protocol.Storage.InterestGroupAccessedEvent): void {
  }
}

SDK.SDKModel.SDKModel.register(SharedStorageModel, {capabilities: SDK.Target.Capability.Storage, autostart: false});

export const enum Events {
  SharedStorageAccess = 'SharedStorageAccess',
  SharedStorageAdded = 'SharedStorageAdded',
  SharedStorageRemoved = 'SharedStorageRemoved',
}

export type EventTypes = {
  [Events.SharedStorageAccess]: Protocol.Storage.SharedStorageAccessedEvent,
  [Events.SharedStorageAdded]: SharedStorage,
  [Events.SharedStorageRemoved]: SharedStorage,
};
