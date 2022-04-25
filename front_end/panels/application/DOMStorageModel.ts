// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/*
 * Copyright (C) 2008 Nokia Inc.  All rights reserved.
 * Copyright (C) 2013 Samsung Electronics. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 * 3.  Neither the name of Apple Computer, Inc. ("Apple") nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import * as Common from '../../core/common/common.js';
import * as SDK from '../../core/sdk/sdk.js';
import type * as Protocol from '../../generated/protocol.js';
import type * as ProtocolProxyApi from '../../generated/protocol-proxy-api.js';

export class DOMStorage extends Common.ObjectWrapper.ObjectWrapper<DOMStorage.EventTypes> {
  private readonly model: DOMStorageModel;
  private readonly securityOriginInternal: string|null;
  private readonly storageKeyInternal: string|null;
  private readonly isLocalStorageInternal: boolean;

  constructor(model: DOMStorageModel, securityOrigin: string, storageKey: string, isLocalStorage: boolean) {
    super();
    this.model = model;
    this.securityOriginInternal = securityOrigin;
    this.storageKeyInternal = storageKey;
    this.isLocalStorageInternal = isLocalStorage;
  }

  static storageIdWithSecurityOrigin(securityOrigin: string, isLocalStorage: boolean): Protocol.DOMStorage.StorageId {
    return {securityOrigin: securityOrigin, isLocalStorage: isLocalStorage};
  }

  static storageIdWithStorageKey(storageKey: string, isLocalStorage: boolean): Protocol.DOMStorage.StorageId {
    return {storageKey: storageKey, isLocalStorage: isLocalStorage};
  }

  get id(): Protocol.DOMStorage.StorageId {
    console.log("Storage key available: ", this.storageKeyInternal);
    if (this.storageKeyInternal) {
      console.log("ID w storage key: ", this.idWithStorageKey);
      return this.idWithStorageKey;
    }
    return this.idWithSecurityOrigin;
  }

  get idWithSecurityOrigin(): Protocol.DOMStorage.StorageId {
    return DOMStorage.storageIdWithSecurityOrigin(this.securityOriginInternal!, this.isLocalStorageInternal);
  }

  get idWithStorageKey(): Protocol.DOMStorage.StorageId {
    console.log("SK in idWithStorageKey: ", this.storageKeyInternal);
    return DOMStorage.storageIdWithStorageKey(this.storageKeyInternal!, this.isLocalStorageInternal);
  }

  get securityOrigin(): string|null {
    return this.securityOriginInternal;
  }

  get storageKey(): string|null {
    return this.storageKeyInternal;
  }

  get isLocalStorage(): boolean {
    return this.isLocalStorageInternal;
  }

  getItems(): Promise<Protocol.DOMStorage.Item[]|null> {
    console.log("ID: ", this.id.storageKey);
    return this.model.agent.invoke_getDOMStorageItems({storageId: this.id}).then(({entries}) => entries);
  }

  setItem(key: string, value: string): void {
    void this.model.agent.invoke_setDOMStorageItem({storageId: this.id, key, value});
  }

  getStorageKeyForFrame(frameId: Protocol.Page.FrameId): Promise<Protocol.DOMStorage.GetStorageKeyForFrameResponse> {
    console.log("GET STORAGE KEY FOR FRAME", new Error().stack);
    return this.model.agent.invoke_getStorageKeyForFrame({frameId: frameId});
  }

  removeItem(key: string): void {
    void this.model.agent.invoke_removeDOMStorageItem({storageId: this.id, key});
  }

  clear(): void {
    void this.model.agent.invoke_clear({storageId: this.id});
  }
}

export namespace DOMStorage {
  // TODO(crbug.com/1167717): Make this a const enum again
  // eslint-disable-next-line rulesdir/const_enum
  export enum Events {
    DOMStorageItemsCleared = 'DOMStorageItemsCleared',
    DOMStorageItemRemoved = 'DOMStorageItemRemoved',
    DOMStorageItemAdded = 'DOMStorageItemAdded',
    DOMStorageItemUpdated = 'DOMStorageItemUpdated',
  }

  export interface DOMStorageItemRemovedEvent {
    key: string;
  }

  export interface DOMStorageItemAddedEvent {
    key: string;
    value: string;
  }

  export interface DOMStorageItemUpdatedEvent {
    key: string;
    oldValue: string;
    value: string;
  }

  export type EventTypes = {
    [Events.DOMStorageItemsCleared]: void,
    [Events.DOMStorageItemRemoved]: DOMStorageItemRemovedEvent,
    [Events.DOMStorageItemAdded]: DOMStorageItemAddedEvent,
    [Events.DOMStorageItemUpdated]: DOMStorageItemUpdatedEvent,
  };
}

export class DOMStorageModel extends SDK.SDKModel.SDKModel<EventTypes> {
  private readonly securityOriginManager: SDK.SecurityOriginManager.SecurityOriginManager|null;
  private readonly storageKeyManager: SDK.StorageKeyManager.StorageKeyManager|null;
  private storagesInternal: {
    [x: string]: DOMStorage,
  };
  readonly agent: ProtocolProxyApi.DOMStorageApi;
  private enabled?: boolean;

  constructor(target: SDK.Target.Target) {
    super(target);

    this.securityOriginManager = target.model(SDK.SecurityOriginManager.SecurityOriginManager);
    this.storageKeyManager = target.model(SDK.StorageKeyManager.StorageKeyManager);
    this.storagesInternal = {};
    this.agent = target.domstorageAgent();
  }

  enable(): void {
    console.log('ENABLE STACK TRACE: ', new Error().stack);
    if (this.enabled) {
      return;
    }

    this.target().registerDOMStorageDispatcher(new DOMStorageDispatcher(this));
    if (this.storageKeyManager) {
      this.storageKeyManager.addEventListener(SDK.StorageKeyManager.Events.StorageKeyAdded, this.storageKeyAdded, this);
      this.storageKeyManager.addEventListener(
          SDK.StorageKeyManager.Events.StorageKeyRemoved, this.storageKeyRemoved, this);

      for (const storageKey of this.storageKeyManager.storageKeys()) {
        this.addStorageKey(storageKey);
      }
    } else if (this.securityOriginManager) {
      this.securityOriginManager.addEventListener(
          SDK.SecurityOriginManager.Events.SecurityOriginAdded, this.securityOriginAdded, this);
      this.securityOriginManager.addEventListener(
          SDK.SecurityOriginManager.Events.SecurityOriginRemoved, this.securityOriginRemoved, this);

      for (const securityOrigin of this.securityOriginManager.securityOrigins()) {
        this.addOrigin(securityOrigin);
      }
    }
    void this.agent.invoke_enable();

    this.enabled = true;
  }

  clearForOrigin(origin: string): void {
    if (!this.enabled) {
      return;
    }
    for (const isLocal of [true, false]) {
      const key = this.keyForSecurityOrigin(origin, isLocal);
      const storage = this.storagesInternal[key];
      if (!storage) {
        return;
      }
      storage.clear();
    }
    this.removeOrigin(origin);
    this.addOrigin(origin);
  }

  clearForStorageKey(storageKey: string): void {
    if (!this.enabled) {
      return;
    }
    for (const isLocal of [true, false]) {
      const key = this.keyForStorageKey(storageKey, isLocal);
      const storage = this.storagesInternal[key];
      if (!storage) {
        return;
      }
      storage.clear();
    }
    this.removeStorageKey(storageKey);
    this.addStorageKey(storageKey);
  }

  private securityOriginAdded(event: Common.EventTarget.EventTargetEvent<string>): void {
    this.addOrigin(event.data);
  }

  private storageKeyAdded(event: Common.EventTarget.EventTargetEvent<string>): void {
    this.addStorageKey(event.data);
  }

  private addOrigin(securityOrigin: string): void {
    console.log('ADD ORIGIN CALLED with secOrigin: ', securityOrigin);
    console.log(new Error().stack);
    const parsed = new Common.ParsedURL.ParsedURL(securityOrigin);
    // These are "opaque" origins which are not supposed to support DOM storage.
    if (!parsed.isValid || parsed.scheme === 'data' || parsed.scheme === 'about' || parsed.scheme === 'javascript') {
      console.log('INVALID PARSED');
      return;
    }

    for (const isLocal of [true, false]) {
      const key = this.keyForSecurityOrigin(securityOrigin, isLocal);
      console.log('KEY: ', key);
      //console.assert(!this.storagesInternal[key]);
      const storage = new DOMStorage(this, securityOrigin, '', isLocal);
      this.storagesInternal[key] = storage;
      console.log('STORAGES INTERNAL', this.storagesInternal.toString());
      console.log('Storage Added');
      this.dispatchEventToListeners(Events.DOMStorageAdded, storage);
    }
  }

  private addStorageKey(storageKey: string): void {
    console.log('ADD ORIGIN CALLED with sKey: ', storageKey);
    console.log(new Error().stack);

    for (const isLocal of [true, false]) {
      const key = this.keyForStorageKey(storageKey, isLocal);
      console.log('KEY: ', key);
      console.assert(!this.storagesInternal[key]);
      const storage = new DOMStorage(this, '', storageKey, isLocal);
      this.storagesInternal[key] = storage;
      console.log('STORAGES INTERNAL', this.storagesInternal.toString());
      console.log('Storage Added');
      this.dispatchEventToListeners(Events.DOMStorageAdded, storage);
    }
  }

  private securityOriginRemoved(event: Common.EventTarget.EventTargetEvent<string>): void {
    this.removeOrigin(event.data);
  }

  private storageKeyRemoved(event: Common.EventTarget.EventTargetEvent<string>): void {
    this.removeStorageKey(event.data);
  }

  private removeOrigin(securityOrigin: string): void {
    for (const isLocal of [true, false]) {
      const key = this.keyForSecurityOrigin(securityOrigin, isLocal);
      const storage = this.storagesInternal[key];
      if (!storage) {
        continue;
      }
      delete this.storagesInternal[key];
      this.dispatchEventToListeners(Events.DOMStorageRemoved, storage);
    }
  }

  private removeStorageKey(storageKey: string): void {
    for (const isLocal of [true, false]) {
      const key = this.keyForStorageKey(storageKey, isLocal);
      const storage = this.storagesInternal[key];
      if (!storage) {
        continue;
      }
      delete this.storagesInternal[key];
      this.dispatchEventToListeners(Events.DOMStorageRemoved, storage);
    }
  }

  private storageKey(securityOrigin: string, storageKey: string, isLocalStorage: boolean): string {
    if (storageKey) {
      return JSON.stringify(DOMStorage.storageIdWithStorageKey(storageKey, isLocalStorage));
    }
    return JSON.stringify(DOMStorage.storageIdWithSecurityOrigin(securityOrigin, isLocalStorage));
  }

  private keyForSecurityOrigin(securityOrigin: string, isLocalStorage: boolean) {
    return this.storageKey(securityOrigin, '', isLocalStorage);
  }

  private keyForStorageKey(storageKey: string, isLocalStorage: boolean) {
    return this.storageKey('', storageKey, isLocalStorage);
  }

  domStorageItemsCleared(storageId: Protocol.DOMStorage.StorageId): void {
    const domStorage = this.storageForId(storageId);
    if (!domStorage) {
      return;
    }

    domStorage.dispatchEventToListeners(DOMStorage.Events.DOMStorageItemsCleared);
  }

  domStorageItemRemoved(storageId: Protocol.DOMStorage.StorageId, key: string): void {
    const domStorage = this.storageForId(storageId);
    if (!domStorage) {
      return;
    }

    const eventData = {key: key};
    domStorage.dispatchEventToListeners(DOMStorage.Events.DOMStorageItemRemoved, eventData);
  }

  domStorageItemAdded(storageId: Protocol.DOMStorage.StorageId, key: string, value: string): void {
    console.log('domStorageItemAdded called');
    console.error('DOM storage Item added called');
    const domStorage = this.storageForId(storageId);
    if (!domStorage) {
      console.log('NO DOM STORAGE FOUND');
      return;
    }

    console.log('DOM STORAGE FOUND');

    const eventData = {key: key, value: value};
    domStorage.dispatchEventToListeners(DOMStorage.Events.DOMStorageItemAdded, eventData);
  }

  domStorageItemUpdated(storageId: Protocol.DOMStorage.StorageId, key: string, oldValue: string, value: string): void {
    const domStorage = this.storageForId(storageId);
    if (!domStorage) {
      return;
    }

    const eventData = {key: key, oldValue: oldValue, value: value};
    domStorage.dispatchEventToListeners(DOMStorage.Events.DOMStorageItemUpdated, eventData);
  }

  storageForId(storageId: Protocol.DOMStorage.StorageId): DOMStorage {
    console.log('Storage ID to find storage for: ', JSON.stringify(storageId));
    console.log('Storages internal keys: ', this.storagesInternal);
    return this.storagesInternal[JSON.stringify(storageId)];
  }

  storages(): DOMStorage[] {
    const result = [];
    for (const id in this.storagesInternal) {
      result.push(this.storagesInternal[id]);
    }
    return result;
  }
}

SDK.SDKModel.SDKModel.register(DOMStorageModel, {capabilities: SDK.Target.Capability.DOM, autostart: false});

// TODO(crbug.com/1167717): Make this a const enum again
// eslint-disable-next-line rulesdir/const_enum
export enum Events {
  DOMStorageAdded = 'DOMStorageAdded',
  DOMStorageRemoved = 'DOMStorageRemoved',
}

export type EventTypes = {
  [Events.DOMStorageAdded]: DOMStorage,
  [Events.DOMStorageRemoved]: DOMStorage,
};

export class DOMStorageDispatcher implements ProtocolProxyApi.DOMStorageDispatcher {
  private readonly model: DOMStorageModel;
  constructor(model: DOMStorageModel) {
    this.model = model;
  }

  domStorageItemsCleared({storageId}: Protocol.DOMStorage.DomStorageItemsClearedEvent): void {
    this.model.domStorageItemsCleared(storageId);
  }

  domStorageItemRemoved({storageId, key}: Protocol.DOMStorage.DomStorageItemRemovedEvent): void {
    this.model.domStorageItemRemoved(storageId, key);
  }

  domStorageItemAdded({storageId, key, newValue}: Protocol.DOMStorage.DomStorageItemAddedEvent): void {
    this.model.domStorageItemAdded(storageId, key, newValue);
  }

  domStorageItemUpdated({storageId, key, oldValue, newValue}: Protocol.DOMStorage.DomStorageItemUpdatedEvent): void {
    this.model.domStorageItemUpdated(storageId, key, oldValue, newValue);
  }
}
