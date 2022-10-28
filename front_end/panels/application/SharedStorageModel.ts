/*
 * Copyright (C) 2021 Google Inc. All rights reserved.
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

import * as Common from '../../core/common/common.js';
import * as SDK from '../../core/sdk/sdk.js';
import type * as Protocol from '../../generated/protocol.js';
import type * as ProtocolProxyApi from '../../generated/protocol-proxy-api.js';

export class SharedStorage extends Common.ObjectWrapper.ObjectWrapper<SharedStorage.EventTypes> {
  private readonly model: SharedStorageModel;
  private readonly securityOriginInternal: string;

  constructor(model: SharedStorageModel, securityOrigin: string) {
    super();
    this.model = model;
    this.securityOriginInternal = securityOrigin;
  }

  get securityOrigin(): string {
    return this.securityOriginInternal;
  }

  getEntries(): Promise<Protocol.Storage.SharedStorageEntry[]|null> {
    return this.model.storageAgent.invoke_getSharedStorageEntries({ownerOrigin: this.securityOrigin})
        .then(({entries}) => entries);
  }
}

export namespace SharedStorage {
  // TODO(crbug.com/1167717): Make this a const enum.
  // eslint-disable-next-line rulesdir/const_enum
  export enum Events {
    SharedStorageAccessed = 'SharedStorageAccessed',
  }

  export interface SharedStorageAccessedEvent {
    accessTime: Protocol.Network.TimeSinceEpoch;
    type: Protocol.Storage.SharedStorageAccessType;
    mainFrameId: Protocol.Page.FrameId;
    params: Protocol.Storage.SharedStorageAccessParams;
  }

  export type EventTypes = {
    [Events.SharedStorageAccessed]: SharedStorageAccessedEvent,
  };
}

export class SharedStorageModel extends SDK.SDKModel.SDKModel<EventTypes> implements
    ProtocolProxyApi.StorageDispatcher {
  private readonly securityOriginManager: SDK.SecurityOriginManager.SecurityOriginManager;
  private storagesInternal: {
    [securityOrigin: string]: SharedStorage,
  };
  readonly storageAgent: ProtocolProxyApi.StorageApi;
  private enabled?: boolean;

  constructor(target: SDK.Target.Target) {
    super(target);
    target.registerStorageDispatcher(this);
    this.securityOriginManager = target.model(SDK.SecurityOriginManager.SecurityOriginManager) as
        SDK.SecurityOriginManager.SecurityOriginManager;
    this.storagesInternal = {};
    this.storageAgent = target.storageAgent();
    this.enabled = false;
  }

  enable(): void {
    if (this.enabled) {
      return;
    }

    this.securityOriginManager.addEventListener(
        SDK.SecurityOriginManager.Events.SecurityOriginAdded, this.securityOriginAdded, this);
    this.securityOriginManager.addEventListener(
        SDK.SecurityOriginManager.Events.SecurityOriginRemoved, this.securityOriginRemoved, this);

    for (const securityOrigin of this.securityOriginManager.securityOrigins()) {
      this.maybeAddOrigin(securityOrigin);
    }

    void this.storageAgent.invoke_setSharedStorageTracking({enable: true});
    this.enabled = true;
  }

  disable(): void {
    if (!this.enabled) {
      return;
    }

    this.securityOriginManager.removeEventListener(
        SDK.SecurityOriginManager.Events.SecurityOriginAdded, this.securityOriginAdded, this);
    this.securityOriginManager.removeEventListener(
        SDK.SecurityOriginManager.Events.SecurityOriginRemoved, this.securityOriginRemoved, this);

    void this.storageAgent.invoke_setSharedStorageTracking({enable: false});

    const storagesTemp: Array<string> = [];
    for (const storageInternal in this.storagesInternal) {
      const parsedStorageInternal = JSON.parse(storageInternal);
      storagesTemp.push(parsedStorageInternal.securityOrigin);
    }

    for (const securityOrigin in storagesTemp) {
      this.removeOrigin(securityOrigin);
    }

    this.enabled = false;
  }

  private securityOriginAdded(event: Common.EventTarget.EventTargetEvent<string>): void {
    this.maybeAddOrigin(event.data);
  }

  private maybeAddOrigin(securityOrigin: string): void {
    const parsed = new Common.ParsedURL.ParsedURL(securityOrigin);
    // These are "opaque" origins which are not supposed to support shared storage.
    if (!parsed.isValid || parsed.scheme === 'data' || parsed.scheme === 'about' || parsed.scheme === 'javascript') {
      return;
    }

    // Only add origin if we are able to confirm that it's using shared storage.
    const metadataResponse =
        await this.storageAgent.invoke_getSharedStorageMetadata({ownerOrigin: this.securityOrigin});
    if (typeof metadataResponse.getError() !== 'undefined') {
      return;
    }

    console.assert(!this.storagesInternal[securityOrigin]);
    const storage = new SharedStorage(this, securityOrigin);
    this.storagesInternal[securityOrigin] = storage;
    this.dispatchEventToListeners(Events.SharedStorageAdded, storage);
  }

  private securityOriginRemoved(event: Common.EventTarget.EventTargetEvent<string>): void {
    this.removeOrigin(event.data);
  }

  private removeOrigin(securityOrigin: string): void {
    const storage = this.storagesInternal[securityOrigin];
    if (!storage) {
      return;
    }
    delete this.storagesInternal[securityOrigin];
    this.dispatchEventToListeners(Events.SharedStorageRemoved, storage);
  }

  sharedStorageAccessed(event: Protocol.Storage.SharedStorageAccessedEvent): void {
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
