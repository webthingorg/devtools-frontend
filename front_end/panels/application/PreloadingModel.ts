// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as SDK from '../../core/sdk/sdk.js';
import type * as ProtocolProxyApi from '../../generated/protocol-proxy-api.js';
import type * as Protocol from '../../generated/protocol.js';

export class PreloadingModel extends SDK.SDKModel.SDKModel<EventTypes> implements
    ProtocolProxyApi.BackgroundServiceDispatcher {
  private registry: PreRegistry = new PreRegistry();

  constructor(target: SDK.Target.Target) {
    super(target);
  }

  getRegistry(): PreRegistry {
    return this.registry;
  }

  enable(): void {
    // this.events.set(service, []);
    // void this.backgroundServiceAgent.invoke_startObserving({service});
  }

  setRecording(_shouldRecord: boolean, _service: Protocol.BackgroundService.ServiceName): void {
    // void this.backgroundServiceAgent.invoke_setRecording({shouldRecord, service});
  }

  clearEvents(_service: Protocol.BackgroundService.ServiceName): void {
  }

  getEvents(_service: Protocol.BackgroundService.ServiceName): Protocol.BackgroundService.BackgroundServiceEvent[] {
    return [];
  }

  recordingStateChanged(_x: Protocol.BackgroundService.RecordingStateChangedEvent): void {
    // nthis.dispatchEventToListeners(Events.RecordingStateChanged, {isRecording, serviceName: service});
  }

  backgroundServiceEventReceived(_x: Protocol.BackgroundService.BackgroundServiceEventReceivedEvent): void {
    // this.events.get(backgroundServiceEvent.service).push(backgroundServiceEvent);
    // this.dispatchEventToListeners(Events.BackgroundServiceEventReceived, backgroundServiceEvent);
  }
}

SDK.SDKModel.SDKModel.register(PreloadingModel, {capabilities: SDK.Target.Capability.Browser, autostart: false});

// TODO(crbug.com/1167717): Make this a const enum again
// eslint-disable-next-line rulesdir/const_enum
export enum Events {
  RecordingStateChanged = 'RecordingStateChanged',
  BackgroundServiceEventReceived = 'BackgroundServiceEventReceived',
}

export type EventTypes = {
  [Events.RecordingStateChanged]: {isRecording: boolean, serviceName: Protocol.BackgroundService.ServiceName},
  [Events.BackgroundServiceEventReceived]: Protocol.BackgroundService.BackgroundServiceEvent,
};

// Id for preloading events and prerendering attempt.
export type PreId = string;

type PrerenderingAttemptId = number;

export interface PrerenderingAttempt {
  kind: 'PrerenderingAttempt';
  prerenderingAttemptId: PrerenderingAttemptId;
  timestamp: number;
  trigger: PrerenderingTrigger;
  url: string;
  status: PrerenderingStatus;
}

type PrerenderingTrigger = PrerenderingTriggerSpecRules|PrerenderingTriggerDUI|PrerenderingTriggerDSE;

interface PrerenderingTriggerSpecRules {
  kind: 'PrerenderingTriggerSpecRules';
  content: object;
}

interface PrerenderingTriggerDUI {
  kind: 'PrerenderingTriggerDUI';
}

interface PrerenderingTriggerDSE {
  kind: 'PrerenderingTriggerDSE';
}

type PrerenderingStatus = 'prerendering'|'activated'|'cancelled'|'discarded';

type PrerenderingAttemptEvent = PrerenderingAttemptEventAdd|PrerenderingAttemptEventUpdate;

interface PrerenderingAttemptEventAdd {
  kind: 'PrerenderingAttemptEventAdd';
  attempt: PrerenderingAttempt;
}

interface PrerenderingAttemptEventUpdate {
  kind: 'PrerenderingAttemptEventUpdate';
  update: PrerenderingAttempt;
}

class PreRegistry {
  private entities: Map<PreId, PrerenderingAttempt> = new Map<PreId, PrerenderingAttempt>();
  // Only used for random generation.
  // FIXME: Remove this.
  private nextPrerenderingAttemptId: number = 0;

  // Returns reference. Don't save returned values.
  getById(id: PreId): PrerenderingAttempt|null {
    return this.entities.get(id) || null;
  }

  // Returns array of pairs of id and reference. Don't save returned references.
  getAll(): [PreId, PrerenderingAttempt][] {
    return Array.from(this.entities.entries());
  }

  private preId(x: PrerenderingAttempt): PreId {
    return `${x.kind}:${x.prerenderingAttemptId}` as PreId;
  }

  applyEvent(event: PrerenderingAttemptEvent): void {
    switch (event.kind) {
      case 'PrerenderingAttemptEventAdd': {
        this.entities.set(this.preId(event.attempt), event.attempt);
        break;
      }
      case 'PrerenderingAttemptEventUpdate': {
        this.entities.set(this.preId(event.update), event.update);
        break;
      }
    }
  }

  clearNotOngoing(): void {
    for (const [id, x] of this.entities.entries()) {
      if (x.status !== 'prerendering') {
        this.entities.delete(id);
      }
    }
  }

  // Only used for random generation.
  // FIXME: Remove this.
  generateRandomEvent(): PrerenderingAttemptEvent {
    while (true) {
      switch (sample(['PrerenderingAttemptEventAdd', 'PrerenderingAttemptEventUpdate'])) {
        case 'PrerenderingAttemptEventAdd': {
          const prerenderingAttemptId = this.nextPrerenderingAttemptId;
          this.nextPrerenderingAttemptId += 1;

          return {
            kind: 'PrerenderingAttemptEventAdd',
            attempt: this.generateRandomAttempt(prerenderingAttemptId),
          };
        }
        case 'PrerenderingAttemptEventUpdate': {
          if (this.entities.size === 0) {
            continue;
          }

          const id = sample([...this.entities.keys()]);
          const entry = this.entities.get(id);
          if (entry === undefined) {
            throw new Error('unreachable');
          }

          return {
            kind: 'PrerenderingAttemptEventUpdate',
            update: this.generateRandomAttempt(entry.prerenderingAttemptId),
          };
        }
      }
    }
  }

  // Only used for random generation.
  // FIXME: Remove this.
  private generateRandomAttempt(prerenderingAttemptId: PrerenderingAttemptId): PrerenderingAttempt {
    return {
      kind: 'PrerenderingAttempt',
      prerenderingAttemptId: prerenderingAttemptId,
      timestamp: Date.now(),
      trigger: sample([
        {
          kind: 'PrerenderingTriggerSpecRules',
          content: {
            'prerender': [{'source': 'list', 'urls': ['/home', '/about']}],
            'prefetch': [{
              'source': 'list',
              'urls': ['https://en.wikipedia.org/wiki/Hamster_racing'],
              'requires': ['anonymous-client-ip-when-cross-origin'],
            }],
          },
        },
        {
          kind: 'PrerenderingTriggerDUI',
        },
        {
          kind: 'PrerenderingTriggerDSE',
        },
      ]),
      url: sample(['https://prerender2-specrules.glitch.me/timer.html', './timer.html', 'hoge']),
      status: sample(['prerendering', 'activated', 'cancelled', 'discarded']),
    };
  }

  // Only used for debugging.
  // FIXME: Remove this.
  addSpecRules(url: string): void {
    const prerenderingAttemptId = this.nextPrerenderingAttemptId;
    this.nextPrerenderingAttemptId += 1;

    const attempt: PrerenderingAttempt = {
      kind: 'PrerenderingAttempt',
      prerenderingAttemptId: prerenderingAttemptId,
      timestamp: Date.now(),
      trigger: {
        kind: 'PrerenderingTriggerSpecRules',
        content: {
          'prerender': [{'source': 'list', 'urls': [url]}],
        },
      },
      url: url,
      status: 'prerendering',
    };
    const event: PrerenderingAttemptEventAdd = {
      kind: 'PrerenderingAttemptEventAdd',
      attempt: attempt,
    };
    this.applyEvent(event);
  }
}

// Only used for random generation.
// FIXME: Remove this.
function sample<T>(xs: T[]): T {
  return xs[Math.floor(Math.random() * xs.length)];
}
