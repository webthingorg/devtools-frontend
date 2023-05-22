// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {Capability, type Target} from './Target.js';
import {SDKModel} from './SDKModel.js';
import * as Common from '../common/common.js';
import type * as Platform from '../platform/platform.js';

export class StorageKeyManager extends SDKModel<EventTypes> {
  #mainStorageKeyInternal: string;
  #storageKeysInternal: Set<string>;
  constructor(target: Target) {
    super(target);

    this.#mainStorageKeyInternal = '';
    this.#storageKeysInternal = new Set();
  }

  updateStorageKeys(storageKeys: Set<string>): void {
    const oldStorageKeys = this.#storageKeysInternal;
    this.#storageKeysInternal = storageKeys;

    for (const storageKey of oldStorageKeys) {
      if (!this.#storageKeysInternal.has(storageKey)) {
        this.dispatchEventToListeners(Events.StorageKeyRemoved, storageKey);
      }
    }

    for (const storageKey of this.#storageKeysInternal) {
      if (!oldStorageKeys.has(storageKey)) {
        this.dispatchEventToListeners(Events.StorageKeyAdded, storageKey);
      }
    }
  }

  storageKeys(): string[] {
    return [...this.#storageKeysInternal];
  }

  mainStorageKey(): string {
    return this.#mainStorageKeyInternal;
  }

  setMainStorageKey(storageKey: string): void {
    this.#mainStorageKeyInternal = storageKey;
    this.dispatchEventToListeners(Events.MainStorageKeyChanged, {
      mainStorageKey: this.#mainStorageKeyInternal,
    });
  }

  static parseStorageKeyForDisplay(storageKey: string): DisplayStorageKey|null {
    // Based on the canonical implementation of StorageKey::Deserialize in
    // third_party/blink/common/storage_key/storage_key.cc
    const TOP_LEVEL_SITE = '0';
    const NONCE_HIGH = '1';
    const ANCESTOR_CHAIN_BIT = '3';
    const TOP_LEVEL_SITE_OPAQUE_NONCE_HIGH = '4';
    const components = storageKey.split('^');
    if (components.length > 4) {
      return null;
    }
    const origin = Common.ParsedURL.ParsedURL.extractOrigin(components[0] as Platform.DevToolsPath.UrlString);
    if (components.length === 1) {
      return {origin};
    }

    if (components[1].charAt(0) === TOP_LEVEL_SITE) {
      if (components.length > 2) {
        return null;
      }
      const topLevelSite = components[1].substring(1) as Platform.DevToolsPath.UrlString;
      return {origin, topLevelSite};
    }
    if (components[1].charAt(0) === ANCESTOR_CHAIN_BIT) {
      if (components.length > 2) {
        return null;
      }
      const ancestorChainHasCrossSite = components[1].charAt(1) === '1';
      return {origin, topLevelSite: origin, ancestorChainHasCrossSite};
    }
    if (components[1].charAt(0) === NONCE_HIGH) {
      return {origin, hasNonce: true};
    }
    if (components[1].charAt(0) === TOP_LEVEL_SITE_OPAQUE_NONCE_HIGH) {
      return {origin, topLevelSiteIsOpaque: true, hasNonce: true};
    }
    return null;
  }
}

export interface DisplayStorageKey {
  origin: Platform.DevToolsPath.UrlString;
  topLevelSite?: Platform.DevToolsPath.UrlString;
  topLevelSiteIsOpaque?: boolean;
  ancestorChainHasCrossSite?: boolean;
  hasNonce?: boolean;
}

// TODO(crbug.com/1167717): Make this a const enum again
// eslint-disable-next-line rulesdir/const_enum
export enum Events {
  StorageKeyAdded = 'StorageKeyAdded',
  StorageKeyRemoved = 'StorageKeyRemoved',
  MainStorageKeyChanged = 'MainStorageKeyChanged',
}

export interface MainStorageKeyChangedEvent {
  mainStorageKey: string;
}

export type EventTypes = {
  [Events.StorageKeyAdded]: string,
  [Events.StorageKeyRemoved]: string,
  [Events.MainStorageKeyChanged]: MainStorageKeyChangedEvent,
};

// TODO(jarhar): this is the one of the two usages of Capability.None. Do something about it!
SDKModel.register(StorageKeyManager, {capabilities: Capability.None, autostart: false});
