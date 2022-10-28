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
  readonly storageAgent: ProtocolProxyApi.StorageApi;
  private enabled?: boolean;

  constructor(target: SDK.Target.Target) {
    super(target);
    target.registerStorageDispatcher(this);
    this.storageAgent = target.storageAgent();
    this.enabled = false;
  }

  enable(): void {
    if (this.enabled) {
      return;
    }
    void this.storageAgent.invoke_setSharedStorageTracking({enable: true});
  }

  disable(): void {
    if (!this.enabled) {
      return;
    }
    void this.storageAgent.invoke_setSharedStorageTracking({enable: false});
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
}

export type EventTypes = {
  [Events.SharedStorageAccess]: Protocol.Storage.SharedStorageAccessedEvent,
};
