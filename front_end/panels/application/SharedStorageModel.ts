// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../core/common/common.js';
import * as SDK from '../../core/sdk/sdk.js';
import * as Protocol from '../../generated/protocol.js';
import type * as ProtocolProxyApi from '../../generated/protocol-proxy-api.js';

export class SharedStorage extends Common.ObjectWrapper.ObjectWrapper<SharedStorage.EventTypes> {
  readonly #model: SharedStorageModel;
  readonly #securityOrigin: string;

  constructor(model: SharedStorageModel, securityOrigin: string) {
    super();
    this.#model = model;
    this.#securityOrigin = securityOrigin;
  }

  get securityOrigin(): string {
    return this.#securityOrigin;
  }

  async getMetadata(): Promise<Protocol.Storage.SharedStorageMetadata|null> {
    return this.#model.storageAgent.invoke_getSharedStorageMetadata({ownerOrigin: this.securityOrigin})
        .then(({metadata}) => metadata);
  }

  async getEntries(): Promise<Protocol.Storage.SharedStorageEntry[]|null> {
    return this.#model.storageAgent.invoke_getSharedStorageEntries({ownerOrigin: this.securityOrigin})
        .then(({entries}) => entries);
  }

  async deleteEntry(key: string): Promise<void> {
    await this.#model.storageAgent.invoke_deleteSharedStorageEntry({ownerOrigin: this.securityOrigin, key});
  }

  async clear(): Promise<void> {
    await this.#model.storageAgent.invoke_clearSharedStorageEntries({ownerOrigin: this.securityOrigin});
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
  #storages: Map<string, SharedStorage>;
  readonly storageAgent: ProtocolProxyApi.StorageApi;
  #enabled: boolean;

  constructor(target: SDK.Target.Target) {
    super(target);
    target.registerStorageDispatcher(this);
    this.#securityOriginManager = target.model(SDK.SecurityOriginManager.SecurityOriginManager) as
        SDK.SecurityOriginManager.SecurityOriginManager;
    this.#storages = new Map();
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

    void this.storageAgent.invoke_setSharedStorageTracking({enable: true});
    void this.#addAllOrigins();
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
    this.#removeAllOrigins();
    this.#enabled = false;
  }

  async #addAllOrigins(): Promise<void> {
    for (const securityOrigin of this.#securityOriginManager.securityOrigins()) {
      await this.#maybeAddOrigin(securityOrigin);
    }
  }

  #removeAllOrigins(): void {
    const storagesTemp = new Array<string>();
    this.#storages.forEach((value: SharedStorage, key: string) => {
      storagesTemp.push(key);
    });

    for (const securityOrigin in storagesTemp) {
      this.#removeOrigin(securityOrigin);
    }
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

    // Only add origin if it's not already added.
    if (this.#storages.has(securityOrigin)) {
      return;
    }

    // Only add origin if we are able to confirm that it's using shared storage.
    const metadataResponse = await this.storageAgent.invoke_getSharedStorageMetadata({ownerOrigin: securityOrigin});
    if (typeof metadataResponse.getError() !== 'undefined') {
      return;
    }

    const storage = new SharedStorage(this, securityOrigin);
    this.#storages.set(securityOrigin, storage);
    this.dispatchEventToListeners(Events.SharedStorageAdded, storage);
  }

  #securityOriginRemoved(event: Common.EventTarget.EventTargetEvent<string>): void {
    this.#removeOrigin(event.data);
  }

  #removeOrigin(securityOrigin: string): void {
    const storage = this.#storages.get(securityOrigin);
    if (!storage) {
      return;
    }
    this.#storages.delete(securityOrigin);
    this.dispatchEventToListeners(Events.SharedStorageRemoved, storage);
  }

  storages(): Array<SharedStorage> {
    const result = new Array<SharedStorage>();
    this.#storages.forEach((value: SharedStorage) => {
      result.push(value);
    });
    return result;
  }

  sharedStorageAccessed(event: Protocol.Storage.SharedStorageAccessedEvent): void {
    const sharedStorage = this.#storages.get(event.ownerOrigin);

    // Forward events that may have changed `sharedStorage` to listeners for `sharedStorage`.
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
