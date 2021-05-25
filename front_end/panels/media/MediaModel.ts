// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/* eslint-disable rulesdir/no_underscored_properties */

import * as SDK from '../../core/sdk/sdk.js';
import type * as ProtocolProxyApi from '../../generated/protocol-proxy-api.js';
import type * as Protocol from '../../generated/protocol.js';

export interface PlayerEvent extends Protocol.Media.PlayerEvent {
  value: string;
  displayTimestamp: string;
  event: string;
}

export const enum ProtocolTriggers {
  PlayerPropertiesChanged = 'PlayerPropertiesChanged',
  PlayerEventsAdded = 'PlayerEventsAdded',
  PlayerMessagesLogged = 'PlayerMessagesLogged',
  PlayerErrorsRaised = 'PlayerErrorsRaised',
  PlayersCreated = 'PlayersCreated',
}

export class MediaModel extends SDK.SDKModel.SDKModel implements ProtocolProxyApi.MediaDispatcher,
                                                                 SDK.SDKModel.Observer {
  _enabled: boolean;
  _agents: Map<string, ProtocolProxyApi.MediaApi>;

  constructor(target: SDK.SDKModel.Target) {
    super(target);

    this._enabled = false;
    this._agents = new Map();
    SDK.SDKModel.TargetManager.instance().observeTargets(this);
  }

  async resumeModel(): Promise<void> {
    if (!this._enabled) {
      return Promise.resolve();
    }
    for (const agent of this._agents.values()) {
      await agent.invoke_enable();
    }
  }

  ensureEnabled(): void {
    for (const agent of this._agents.values()) {
      agent.invoke_enable();
    }
    this._enabled = true;
  }

  playerPropertiesChanged(event: Protocol.Media.PlayerPropertiesChangedEvent): void {
    this.dispatchEventToListeners(ProtocolTriggers.PlayerPropertiesChanged, event);
  }

  playerEventsAdded(event: Protocol.Media.PlayerEventsAddedEvent): void {
    this.dispatchEventToListeners(ProtocolTriggers.PlayerEventsAdded, event);
  }

  playerMessagesLogged(event: Protocol.Media.PlayerMessagesLoggedEvent): void {
    this.dispatchEventToListeners(ProtocolTriggers.PlayerMessagesLogged, event);
  }

  playerErrorsRaised(event: Protocol.Media.PlayerErrorsRaisedEvent): void {
    this.dispatchEventToListeners(ProtocolTriggers.PlayerErrorsRaised, event);
  }

  playersCreated({players}: Protocol.Media.PlayersCreatedEvent): void {
    this.dispatchEventToListeners(ProtocolTriggers.PlayersCreated, players);
  }

  targetAdded(target: SDK.SDKModel.Target): void {
    target.registerMediaDispatcher(this);
    this._agents.set(target.id(), target.mediaAgent());
    if (this._enabled) {
      target.mediaAgent().invoke_enable();
    }
  }

  targetRemoved(target: SDK.SDKModel.Target): void {
    this._agents.delete(target.id());
  }
}
SDK.SDKModel.SDKModel.register(MediaModel, {capabilities: SDK.SDKModel.Capability.DOM, autostart: false});
