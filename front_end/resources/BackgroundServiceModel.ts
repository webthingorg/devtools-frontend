// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/* eslint-disable rulesdir/no_underscored_properties */

import * as SDK from '../sdk/sdk.js';

export class BackgroundServiceModel extends SDK.SDKModel.SDKModel implements ProtocolProxyApi.BackgroundServiceDispatcher {
  _backgroundServiceAgent: ProtocolProxyApi.BackgroundServiceApi;
  _events: Map<any, any>;
  constructor(target: SDK.SDKModel.Target) {
    super(target);
    this._backgroundServiceAgent = target.backgroundServiceAgent();
    target.registerBackgroundServiceDispatcher(this);

    /** @const {!Map<!Protocol.BackgroundService.ServiceName, Array<!Protocol.BackgroundService.BackgroundServiceEvent>>} */
    this._events = new Map();
  }

  enable(service: Protocol.BackgroundService.ServiceName): void {
    this._events.set(service, []);
    this._backgroundServiceAgent.invoke_startObserving({ service });
  }

  setRecording(shouldRecord: boolean, service: Protocol.BackgroundService.ServiceName): void {
    this._backgroundServiceAgent.invoke_setRecording({ shouldRecord, service });
  }

  clearEvents(service: Protocol.BackgroundService.ServiceName): void {
    this._events.set(service, []);
    this._backgroundServiceAgent.invoke_clearEvents({ service });
  }

  getEvents(service: Protocol.BackgroundService.ServiceName): Protocol.BackgroundService.BackgroundServiceEvent[] {
    return this._events.get(service) || [];
  }

  recordingStateChanged({ isRecording, service }: Protocol.BackgroundService.RecordingStateChangedEvent): void {
    this.dispatchEventToListeners(Events.RecordingStateChanged, { isRecording, serviceName: service });
  }

  backgroundServiceEventReceived({ backgroundServiceEvent }: Protocol.BackgroundService.BackgroundServiceEventReceivedEvent): void {
    this._events.get(backgroundServiceEvent.service).push(backgroundServiceEvent);
    this.dispatchEventToListeners(Events.BackgroundServiceEventReceived, backgroundServiceEvent);
  }
}

SDK.SDKModel.SDKModel.register(BackgroundServiceModel, SDK.SDKModel.Capability.Browser, false);

// TODO(crbug.com/1167717): Make this a const enum again
// eslint-disable-next-line rulesdir/const_enum
export const enum Events {
  RecordingStateChanged = 'RecordingStateChanged',
  BackgroundServiceEventReceived = 'BackgroundServiceEventReceived'
}
;
