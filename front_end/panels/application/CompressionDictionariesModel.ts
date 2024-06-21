// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as Common from '../../core/common/common.js';
import * as SDK from '../../core/sdk/sdk.js';
import type * as Protocol from '../../generated/protocol.js';

export class CompressionDictionariesModel extends SDK.SDKModel.SDKModel<EventTypes> {
  readonly storages: Map<string, Protocol.Network.CompressionDictionaryStorageInfo>;
  #enabled: boolean;

  constructor(target: SDK.Target.Target) {
    super(target);
    this.storages = new Map();
    this.#enabled = false;
  }
  enable(): void {
    if (this.#enabled) {
      return;
    }
    this.#enabled = true;
    this.target()
        .model(SDK.NetworkManager.NetworkManager)
        ?.addEventListener(
            SDK.NetworkManager.Events.CompressionDictionaryStorageChanged, this.#onCompressionDictionaryStorageChanged,
            this);
    const frameManager = SDK.FrameManager.FrameManager.instance();
    frameManager.addEventListener(SDK.FrameManager.Events.FrameAddedToTarget, this.#frameAddedToTarget, this);
    frameManager.addEventListener(SDK.FrameManager.Events.FrameRemoved, this.#frameRemoved, this);
    frameManager.addEventListener(SDK.FrameManager.Events.FrameNavigated, this.#frameNavigated, this);
    frameManager.addEventListener(SDK.FrameManager.Events.OutermostFrameNavigated, this.#outermostFrameNavigated, this);
    void this.#updateCompressionDictionariesTracking();
  }

  disable(): void {
    if (!this.#enabled) {
      return;
    }
    this.#enabled = false;
    this.target()
        .model(SDK.NetworkManager.NetworkManager)
        ?.removeEventListener(
            SDK.NetworkManager.Events.CompressionDictionaryStorageChanged, this.#onCompressionDictionaryStorageChanged,
            this);
    const frameManager = SDK.FrameManager.FrameManager.instance();
    frameManager.removeEventListener(SDK.FrameManager.Events.FrameAddedToTarget, this.#frameAddedToTarget, this);
    frameManager.removeEventListener(SDK.FrameManager.Events.FrameRemoved, this.#frameRemoved, this);
    frameManager.removeEventListener(SDK.FrameManager.Events.FrameNavigated, this.#frameNavigated, this);
    frameManager.removeEventListener(
        SDK.FrameManager.Events.OutermostFrameNavigated, this.#outermostFrameNavigated, this);
    void this.#updateCompressionDictionariesTracking();
  }

  #onCompressionDictionaryStorageChanged(
      event: Common.EventTarget.EventTargetEvent<Protocol.Network.CompressionDictionaryStorageChangedEvent>): void {
    this.storages.clear();
    for (const storageInfo of event.data.storages) {
      this.storages.set(CompressionDictionariesModel.getStorageKey(storageInfo), storageInfo);
    }

    this.dispatchEventToListeners(Events.CompressionDictionaryStorageChanged);
  }

  #frameAddedToTarget(_event: Common.EventTarget.EventTargetEvent<{frame: SDK.ResourceTreeModel.ResourceTreeFrame}>):
      void {
    void this.#updateCompressionDictionariesTracking();
  }

  #frameRemoved(_event: Common.EventTarget.EventTargetEvent<{frameId: Protocol.Page.FrameId}>): void {
    void this.#updateCompressionDictionariesTracking();
  }

  #frameNavigated(_event: Common.EventTarget.EventTargetEvent<{frame: SDK.ResourceTreeModel.ResourceTreeFrame}>): void {
    void this.#updateCompressionDictionariesTracking();
  }

  #outermostFrameNavigated(
      _event: Common.EventTarget.EventTargetEvent<{frame: SDK.ResourceTreeModel.ResourceTreeFrame}>): void {
    void this.#updateCompressionDictionariesTracking();
  }

  async #updateCompressionDictionariesTracking(): Promise<void> {
    const frameManager = SDK.FrameManager.FrameManager.instance();
    const frames = this.#enabled ?
        frameManager.getAllFrames()
            .filter(frame => {
              return frame.resourceTreeModel().target().outermostTarget() === this.target().outermostTarget();
            })
            .map(frame => frame.id) :
        [];
    await this.target().networkAgent().invoke_setCompressionDictionariesTracking({frames: frames});
  }

  deleteDictionary(topFrameSite: string, frameOrigin: string, match: string, matchDest: string): void {
    void this.target().networkAgent().invoke_deleteCompressionDictionary({
      topFrameSite: topFrameSite,
      frameOrigin: frameOrigin,
      match: match,
      matchDest: matchDest.split(',').map(i => i.trim()),
    });
  }
  deleteAllDictionaries(topFrameSite: string, frameOrigin: string): void {
    void this.target().networkAgent().invoke_deleteCompressionDictionaries(
        {topFrameSite: topFrameSite, frameOrigin: frameOrigin});
  }

  static getStorageKey(info: Protocol.Network.CompressionDictionaryStorageInfo): string {
    return info.topFrameSite + '\0' + info.frameOrigin;
  }
}

SDK.SDKModel.SDKModel.register(
    CompressionDictionariesModel, {capabilities: SDK.Target.Capability.Network, autostart: false});

export enum Events {
  CompressionDictionaryStorageChanged = 'CompressionDictionaryStorageChanged',
}

export type EventTypes = {
  [Events.CompressionDictionaryStorageChanged]: void,
};
