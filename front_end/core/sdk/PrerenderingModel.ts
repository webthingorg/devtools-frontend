// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Protocol from '../../generated/protocol.js';

// PrerenderingRegistry is aimed to be used in PrerenderingModel.
// TODO(https://crbug.com/1384419): Add PrerenderingModel.

// Id for preloading events and prerendering attempt.
export type PreloadingId = string;

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
export class PrerenderingRegistry {
  private entities: Map<PreloadingId, PrerenderingAttempt> = new Map<PreloadingId, PrerenderingAttempt>();
  // Hack:
  // Curretly, PrerenderAttemptCompleted event doesn't have information
  // to identify corresponding attempt. To mitigate this, we utilize the
  // fact that attempts are activated/cancelled if navigated out. So,
  // in many cases, we can identify an ongoing attempt by URL.
  // TODO(https://crbug.com/1384419): Consider to add a relevant CDP
  // event for prerendering.
  private opaqueUrlToPreId: Map<string, PreloadingId> = new Map<string, PreloadingId>();

  // Returns reference. Don't save returned values.
  getById(id: PreloadingId): PrerenderingAttempt|null {
    return this.entities.get(id) || null;
  }

  // Returns array of pairs of id and reference. Don't save returned references.
  getAll(): [PreloadingId, PrerenderingAttempt][] {
    return Array.from(this.entities.entries());
  }

  private preId(x: PrerenderingAttempt): PreloadingId {
    if (x.trigger.kind === 'PrerenderingTriggerOpaque') {
      return `PrerenderingAttempt-opaque:${x.prerenderingAttemptId}` as PreloadingId;
    }
    return `${x.kind}:${x.prerenderingAttemptId}` as PreloadingId;
  }

  private makePreIdOfPrerendering(frameId: Protocol.Page.FrameId): PreloadingId {
    return `PrerenderingAttempt-opaque:${frameId}` as PreloadingId;
  }

  // TODO(https://crbug.com/1384419): Make this private.
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

  // Initial support of detecting prerendering start
  // TODO: Make CDP changes correctly.
  maybeAddOpaquePrerendering(frameId: Protocol.Page.FrameId, url: string): void {
    // Ad-hoc filtering
    //
    // If a page has SpeculationRules and browser navigated out to a not
    // related page, current Chrome throws PrerenderAttemptCompleted
    // event and then TargetInfoChanged event. This filtering prevents
    // adding a new prerendering attempt by the latter TargetInfoChanged.
    if (this.entities.get(this.makePreIdOfPrerendering(frameId)) !== undefined) {
      return;
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
}
