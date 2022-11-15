// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Protocol from '../../generated/protocol.js';

import * as ChildTargetManager from './ChildTargetManager.js';
import * as FrameManager from './FrameManager.js';
import * as ResourceTreeModel from './ResourceTreeModel.js';
import * as SDKModel from './SDKModel.js';
import * as Target from './Target.js';
import * as TargetManager from './TargetManager.js';

// Holds prerendering information of given target.
//
// Note: In first implementation of Preloading Status Panel, we utilize
// TargetInfo to detect beginning of prerendering. See the discussion in
// https://chromium-review.googlesource.com/c/chromium/src/+/3875947/comment/595dd0d3_bb2cb92f/
// TODO(kenoss): Add a relevant CDP event for prerendering.
export class PrerenderingModel extends SDKModel.SDKModel<EventTypes> {
  private registry: PreRegistry = new PreRegistry();

  constructor(target: Target.Target) {
    super(target);

    TargetManager.TargetManager.instance().addModelListener(
        ChildTargetManager.ChildTargetManager, ChildTargetManager.Events.TargetInfoChanged,
        event => this.onTargetInfoChanged(event.data), this);

    const frameManager = FrameManager.FrameManager.instance();
    frameManager.addEventListener(
        FrameManager.Events.FrameAddedToTarget, event => this.onFrameAddedToTarget(event.data.frame), this);
    frameManager.addEventListener(
        FrameManager.Events.FrameRemoved, event => this.onFrameRemoved(event.data.frameId), this);
  }

  getRegistry(): PreRegistry {
    return this.registry;
  }

  // Returns reference. Don't save returned values.
  getById(id: PreId): PrerenderingAttempt|null {
    return this.registry.getById(id);
  }

  // Returns array of pairs of id and reference. Don't save returned references.
  getAll(): [PreId, PrerenderingAttempt][] {
    return this.registry.getAll();
  }

  clearNotOngoing(): void {
    this.registry.clearNotOngoing();
    this.dispatchPrerenderingAttemptsRemoved();
  }

  private dispatchPrerenderingAttemptStarted(): void {
    this.dispatchEventToListeners(Events.PrerenderingAttemptStarted);
  }

  private dispatchPrerenderingAttemptUpdated(): void {
    this.dispatchEventToListeners(Events.PrerenderingAttemptUpdated);
  }

  private dispatchPrerenderingAttemptsRemoved(): void {
    this.dispatchEventToListeners(Events.PrerenderingAttemptsRemoved);
  }

  private onTargetInfoChanged(targetInfo: Protocol.Target.TargetInfo): void {
    if (targetInfo.subtype !== 'prerender') {
      return;
    }

    // Ad-hoc filtering. Ignore the active page.
    if (targetInfo.url === '') {
      return;
    }

    // Non trivial assumption
    // We assume that targetId is the same to frameId for targetInfo
    // with subtype === 'prerender'.
    const frameId = (targetInfo.targetId as string) as Protocol.Page.FrameId;

    // Ad-hoc filtering.
    if (this.registry.existOpaquePrerendering(targetInfo.url)) {
      return;
    }

    this.registry.addOpaquePrerendering(frameId, targetInfo.url);

    this.dispatchPrerenderingAttemptStarted();
  }

  private onFrameAddedToTarget(frame: ResourceTreeModel.ResourceTreeFrame): void {
    frame.resourceTreeModel().addEventListener(
        ResourceTreeModel.Events.PrerenderAttemptCompleted, event => this.onPrerenderAttemptCompleted(event.data),
        this);
  }

  private onFrameRemoved(frameId: Protocol.Page.FrameId): void {
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
    // but PrerenderingModel.onPrerenderAttemptCompleted can only observe
    // the former event because PrerenderingModel is not registered as an
    // observer of the latter ResourceTreeModel.
    //
    // To mitigate confusion, we modify ongoing prerendering attempt as
    // status = "discarded" and discardedReason = "Unknown" when the
    // frame is removed.
    this.registry.discardOngoingPrerenderingAttemptForFrameAsUnknown(frameId);

    this.dispatchPrerenderingAttemptUpdated();
  }

  private onPrerenderAttemptCompleted(event: Protocol.Page.PrerenderAttemptCompletedEvent): void {
    this.registry.updateOpaquePrerenderingAttempt(event);

    this.dispatchPrerenderingAttemptUpdated();
  }
}

SDKModel.SDKModel.register(PrerenderingModel, {capabilities: Target.Capability.Target, autostart: false});

// TODO(crbug.com/1167717): Make this a const enum again
// eslint-disable-next-line rulesdir/const_enum
export enum Events {
  PrerenderingAttemptStarted = 'PrerenderingAttemptStarted',
  PrerenderingAttemptUpdated = 'PrerenderingAttemptUpdated',
  PrerenderingAttemptsRemoved = 'PrerenderingAttemtsRemoved',
}

export type EventTypes = {
  [Events.PrerenderingAttemptStarted]: void,
  [Events.PrerenderingAttemptUpdated]: void,
  [Events.PrerenderingAttemptsRemoved]: void,
};

// Id for preloading events and prerendering attempt.
export type PreId = string;

export type PrerenderingAttemptId = string;

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
  rule: object;
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

export type PrerenderingStatus = 'prerendering'|'activated'|'cancelled'|'discarded';

export type PrerenderingAttemptEvent = PrerenderingAttemptEventAdd|PrerenderingAttemptEventUpdate;

export interface PrerenderingAttemptEventAdd {
  kind: 'PrerenderingAttemptEventAdd';
  attempt: PrerenderingAttempt;
}

export interface PrerenderingAttemptEventUpdate {
  kind: 'PrerenderingAttemptEventUpdate';
  update: PrerenderingAttempt;
}

// export only for testing.
export class PreRegistry {
  private entities: Map<PreId, PrerenderingAttempt> = new Map<PreId, PrerenderingAttempt>();
  // HACK: See the comments in onFrameRemoved.
  // TODO(kenoss): Add a relevant CDP events and remove this.
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

  // TODO(kenoss): Make this private.
  applyEvent(event: PrerenderingAttemptEvent): void {
    switch (event.kind) {
      case 'PrerenderingAttemptEventAdd': {
        this.entities.set(this.preId(event.attempt), event.attempt);
        break;
      }
      case 'PrerenderingAttemptEventUpdate': {
        this.entities.set(this.preId(event.update), event.update);

        const x = event.update;
        if (x.status !== 'prerendering') {
          if (this.opaqueUrlToPreId.get(x.url)) {
            this.opaqueUrlToPreId.delete(x.url);
          }
        }

        break;
      }
    }
  }

  // Clear not ongoing prerendering attempts.
  clearNotOngoing(): void {
    for (const [id, x] of this.entities.entries()) {
      if (x.status !== 'prerendering') {
        this.entities.delete(id);
      }
    }
  }

  existOpaquePrerendering(url: string): boolean {
    return this.opaqueUrlToPreId.get(url) !== undefined;
  }

  // Initial support of detecting prerendering start
  // TODO: Make CDP changes correctly.
  addOpaquePrerendering(frameId: Protocol.Page.FrameId, url: string): void {
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
    const id = this.opaqueUrlToPreId.get(event.prerenderingUrl);

    if (id === undefined) {
      return;
    }

    const origAttempt = this.entities.get(id);

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
    const eventInternal: PrerenderingAttemptEventUpdate = {
      kind: 'PrerenderingAttemptEventUpdate',
      update: attempt,
    };
    this.applyEvent(eventInternal);
  }

  // Ad-hoc mitigation. See the comment of caller.
  discardOngoingPrerenderingAttemptForFrameAsUnknown(frameId: Protocol.Page.FrameId): void {
    const id = this.makePreIdOfPrerendering(frameId);
    const origAttempt = this.entities.get(id);

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
    const event: PrerenderingAttemptEventUpdate = {
      kind: 'PrerenderingAttemptEventUpdate',
      update: attempt,
    };
    this.applyEvent(event);

    this.opaqueUrlToPreId.delete(attempt.url);
  }
}
