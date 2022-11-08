// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as SDK from '../../core/sdk/sdk.js';
import type * as ProtocolProxyApi from '../../generated/protocol-proxy-api.js';
import * as Protocol from '../../generated/protocol.js';
import * as Common from '../../core/common/common.js';

export class PreloadingModel extends SDK.SDKModel.SDKModel<EventTypes> {
  private registry: PreRegistry = new PreRegistry();

  constructor(target: SDK.Target.Target) {
    super(target);

    SDK.TargetManager.TargetManager.instance().addModelListener(
        SDK.ChildTargetManager.ChildTargetManager, SDK.ChildTargetManager.Events.TargetInfoChanged,
        event => this.onTargetInfoChanged(event.data), this);

    const frameManager = SDK.FrameManager.FrameManager.instance();
    frameManager.addEventListener(
        SDK.FrameManager.Events.FrameAddedToTarget, event => this.onFrameAddedToTarget(event.data.frame), this);
    frameManager.addEventListener(
        SDK.FrameManager.Events.FrameRemoved, event => this.onFrameRemoved(event.data.frameId), this);
  }

  getRegistry(): PreRegistry {
    return this.registry;
  }

  private dispatchPrerenderingAttemptStarted(): void {
    this.dispatchEventToListeners(Events.PrerenderingAttemptStarted, {});
  }

  private dispatchPrerenderingAttemptUpdated(): void {
    this.dispatchEventToListeners(Events.PrerenderingAttemptUpdated, {});
  }

  private onTargetInfoChanged(targetInfo: Protocol.Target.TargetInfo): void {
    if (targetInfo.subtype !== 'prerender') {
      return;
    }

    // Currently, TargetInfo are send for all sub pages. Ignore the active page.
    if (targetInfo.url === '') {
      return;
    }

    const frameId = (targetInfo.targetId as string) as Protocol.Page.FrameId;

    // Ad-hoc filtering.
    // TODO(kenoss): Add a correct CDP event.
    if (this.registry.existOpaquePrerendering(targetInfo.url)) {
      return;
    }

    console.log('targetInfo:', targetInfo);

    this.registry.addOpaquePrerendering(frameId, targetInfo.url);

    this.dispatchPrerenderingAttemptStarted();
  }

  private onFrameAddedToTarget(frame: SDK.ResourceTreeModel.ResourceTreeFrame): void {
    console.log('onFrameAddedToTarget: frame = ', frame);

    frame.resourceTreeModel().addEventListener(
        SDK.ResourceTreeModel.Events.PrerenderAttemptCompleted, event => this.onPrerenderAttemptCompleted(event.data),
        this);
  }

  private onFrameRemoved(frameId: Protocol.Page.FrameId): void {
    console.log('onFrameRemoved:', frameId);

    // Events PrerenderAttemptCompleted for discard missing.
    //
    // Consider the following case (https://prerender2-specrules.glitch.me/):
    //
    // 1. A page has following speculation rules.
    // <script type="speculationrules">
    //   {
    //     "prerender":[
    //       {
    //         "source": "list",
    //         "urls": ["/timer.html"]
    //       }
    //     ]
    //   }
    // </script>
    // <script type="speculationrules">
    //   {
    //     "prerender":[
    //       {
    //         "source": "list",
    //         "urls": ["/timer.html?target_hint=blank"],
    //         "target_hint": "_blank"
    //       }
    //     ]
    //   }
    // </script>
    //
    // 2. The page navigated to /timer.html.
    //
    // Then, ResourceTreeModel.onPrerenderAttemptCompleted has two
    // events with finalStatus === "Activated" and "TriggerDestroyed",
    // but PreloadingModel.onPrerenderAttemptCompleted can only observe
    // the former event because PreloadingModel is not registered as an
    // observer of the latter ResourceTreeModel.
    //
    // To mitigate confusion, we modify ongoing prerendering attempt as
    // status = "discarded" and discardedReason = "Unknown" when the
    // frame is removed.
    this.registry.discardOngoingPrerenderingAttemptForFrameAsUnknown(frameId);

    this.dispatchPrerenderingAttemptUpdated();
  }

  private onPrerenderAttemptCompleted(event: Protocol.Page.PrerenderAttemptCompletedEvent): void {
    console.log('onPrerenderAttemptCompleted: Protocol.Page.PrerenderAttemptCompletedEvent = ', event);

    this.registry.updateOpaquePrerenderingAttempt(event);

    this.dispatchPrerenderingAttemptUpdated();
  }
}

SDK.SDKModel.SDKModel.register(PreloadingModel, {capabilities: SDK.Target.Capability.Browser, autostart: false});

// TODO(crbug.com/1167717): Make this a const enum again
// eslint-disable-next-line rulesdir/const_enum
export enum Events {
  PrerenderingAttemptStarted = 'PrerenderingAttemptStarted',
  PrerenderingAttemptUpdated = 'PrerenderingAttemptUpdated',
}

export type EventTypes = {
  [Events.PrerenderingAttemptStarted]: {},
  [Events.PrerenderingAttemptUpdated]: {},
};

// Id for preloading events and prerendering attempt.
export type PreId = string;

type PrerenderingAttemptId = string;

export interface PrerenderingAttempt {
  kind: 'PrerenderingAttempt';
  prerenderingAttemptId: PrerenderingAttemptId;
  startedAt: number;
  trigger: PrerenderingTrigger;
  url: string;
  status: PrerenderingStatus;
  discardedReason?: Protocol.Page.PrerenderFinalStatus|null|'Unknown';
}

type PrerenderingTrigger =
    PrerenderingTriggerSpecRules|PrerenderingTriggerDUI|PrerenderingTriggerDSE|PrerenderingTriggerOpaque;

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

interface PrerenderingTriggerOpaque {
  kind: 'PrerenderingTriggerOpaque';
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
  // HACK: See the comments in onFrameRemoved.
  // TODO(kenoss): Add correct CDP events and remove this.
  private opaqueUrlToPreId: Map<string, PreId> = new Map<string, PreId>();

  // Returns reference. Don't save returned values.
  getById(id: PreId): PrerenderingAttempt|null {
    return this.entities.get(id) || null;
  }

  // Returns array of pairs of id and reference. Don't save returned references.
  getAll(): [PreId, PrerenderingAttempt][] {
    return Array.from(this.entities.entries());
  }

  private preId(x: PrerenderingAttempt): PreId {
    if (x.trigger.kind === 'PrerenderingTriggerOpaque') {
      return `PrerenderingAttempt-opaque:${x.prerenderingAttemptId}` as PreId;
    }
    return `${x.kind}:${x.prerenderingAttemptId}` as PreId;
  }

  private makePreIdOfPrerendering(frameId: Protocol.Page.FrameId): PreId {
    return `PrerenderingAttempt-opaque:${frameId}` as PreId;
  }

  // makePreIdForOpaquePrerendering(url: string): PreId {
  //   return `prerendering-opaque:${url}`;
  // }

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
          const prerenderingAttemptId = this.nextPrerenderingAttemptId.toString(10);
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
      startedAt: Date.now(),
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
    const prerenderingAttemptId = this.nextPrerenderingAttemptId.toString(10);
    this.nextPrerenderingAttemptId += 1;

    const attempt: PrerenderingAttempt = {
      kind: 'PrerenderingAttempt',
      prerenderingAttemptId: prerenderingAttemptId,
      startedAt: Date.now(),
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

  existOpaquePrerendering(url: string): boolean {
    return this.opaqueUrlToPreId.get(url) !== undefined;
  }

  // Initial support of detecting prerendering start
  // TODO: Make CDP changes correctly.
  addOpaquePrerendering(frameId: Protocol.Page.FrameId, url: string): void {
    console.log('addOpaquePrerendering: this.opaqueUrlToPreId', this.opaqueUrlToPreId);
    if (this.opaqueUrlToPreId.get(url) !== undefined) {
      throw new Error('Precondition violation');
    }

    const prerenderingAttemptId: PrerenderingAttemptId = frameId as PrerenderingAttemptId;
    const attempt: PrerenderingAttempt = {
      kind: 'PrerenderingAttempt',
      prerenderingAttemptId: prerenderingAttemptId,
      startedAt: Date.now(),
      trigger: {
        kind: 'PrerenderingTriggerOpaque',
      },
      url: url,
      status: 'prerendering',
    };
    const event: PrerenderingAttemptEventAdd = {
      kind: 'PrerenderingAttemptEventAdd',
      attempt: attempt,
    };
    this.applyEvent(event);

    const id = this.makePreIdOfPrerendering(frameId);
    this.opaqueUrlToPreId.set(url, id);
  }

  updateOpaquePrerenderingAttempt(event: Protocol.Page.PrerenderAttemptCompletedEvent): void {
    console.log('updateOpaquePrerenderingAttempt: this.opaqueUrlToPreId', this.opaqueUrlToPreId, event);
    const id = this.opaqueUrlToPreId.get(event.prerenderingUrl);
    if (id === undefined) {
      return;
    }
    const origAttempt = this.entities.get(id);
    console.log(origAttempt);

    if (origAttempt === undefined) {
      return;
    }

    if (origAttempt.kind !== 'PrerenderingAttempt') {
      throw new Error('unreachable');
    }

    const [status, discardedReason] = ((): [PrerenderingStatus, Protocol.Page.PrerenderFinalStatus|null] => {
      const getDiscardedReason =
          (event: Protocol.Page.PrerenderAttemptCompletedEvent): Protocol.Page.PrerenderFinalStatus|null => {
            switch (event.finalStatus) {
              case Protocol.Page.PrerenderFinalStatus.Activated:
                throw new Error('unreachable');
              case Protocol.Page.PrerenderFinalStatus.Destroyed:
                return null;
              default:
                return event.finalStatus;
            }
          };

      switch (event.finalStatus) {
        case 'Activated':
          return ['activated', null];
        default:
          return ['discarded', getDiscardedReason(event)];
      }
    })();
    const attempt: PrerenderingAttempt = {
      kind: 'PrerenderingAttempt',
      prerenderingAttemptId: origAttempt.prerenderingAttemptId,
      startedAt: origAttempt.startedAt,
      trigger: origAttempt.trigger,
      url: origAttempt.url,
      status: status,
      discardedReason: discardedReason,
    };
    const event_: PrerenderingAttemptEventUpdate = {
      kind: 'PrerenderingAttemptEventUpdate',
      update: attempt,
    };
    this.applyEvent(event_);

    // this.opaqueUrlToPreId.delete(attempt.url);
  }

  // Ad-hoc mitigation. See the comment of caller.
  discardOngoingPrerenderingAttemptForFrameAsUnknown(frameId: Protocol.Page.FrameId) {
    const id = this.makePreIdOfPrerendering(frameId);
    const origAttempt = this.entities.get(id);
    console.log(
        'discardOngoingPrerenderingAttemptForFrameAsUnknown: this.opaqueUrlToPreId', this.opaqueUrlToPreId, frameId, id,
        origAttempt);

    if (origAttempt === undefined) {
      return;
    }

    if (origAttempt.kind !== 'PrerenderingAttempt') {
      throw new Error('unreachable');
    }

    // This path shouldn't be hit. See the comment of caller.
    // Returns without modification in that case.
    if (origAttempt.status !== 'prerendering') {
      return;
    }

    const [status, discardedReason]: [PrerenderingStatus, Protocol.Page.PrerenderFinalStatus|null|'Unknown'] =
        ['discarded', 'Unknown'];
    const attempt: PrerenderingAttempt = {
      kind: 'PrerenderingAttempt',
      prerenderingAttemptId: origAttempt.prerenderingAttemptId,
      startedAt: origAttempt.startedAt,
      trigger: origAttempt.trigger,
      url: origAttempt.url,
      status: status,
      discardedReason: discardedReason,
    };
    const event_: PrerenderingAttemptEventUpdate = {
      kind: 'PrerenderingAttemptEventUpdate',
      update: attempt,
    };
    this.applyEvent(event_);

    this.opaqueUrlToPreId.delete(attempt.url);
  }
}

// Only used for random generation.
// FIXME: Remove this.
function sample<T>(xs: T[]): T {
  return xs[Math.floor(Math.random() * xs.length)];
}
