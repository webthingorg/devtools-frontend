// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as Protocol from '../../generated/protocol.js';
import type * as ProtocolProxyApi from '../../generated/protocol-proxy-api.js';

import * as SDKModel from './SDKModel.js';
import * as Target from './Target.js';

export interface WithId<I, V> {
  id: I;
  value: V;
}

// Holds preloading related information.
//
// - SpeculationRule rule sets
// - (TODO) Preloading attempts
// - (TODO) Relationship between rule sets and preloading attempts
export class PreloadingModel extends SDKModel.SDKModel<EventTypes> {
  private agent: ProtocolProxyApi.PreloadApi;
  private ruleSets: RuleSetRegistry = new RuleSetRegistry();

  constructor(target: Target.Target) {
    super(target);

    target.registerPreloadDispatcher(new PreloadDispatcher(this));
    target.registerPageDispatcher(new PageDispatcher(this));

    this.agent = target.preloadAgent();
    void this.agent.invoke_enable();
  }

  dispose(): void {
    super.dispose();

    void this.agent.invoke_disable();
  }

  // Returns reference. Don't save returned values.
  // Returned value may or may not be updated as the time grows.
  getRuleSetById(id: Protocol.Preload.RuleSetId): Protocol.Preload.RuleSet|null {
    return this.ruleSets.getById(id);
  }

  // Returns array of pairs of id and reference. Don't save returned references.
  // Returned values may or may not be updated as the time grows.
  getAllRuleSets(): WithId<Protocol.Preload.RuleSetId, Protocol.Preload.RuleSet>[] {
    return this.ruleSets.getAll();
  }

  private dispatchRuleSetsModified(): void {
    this.dispatchEventToListeners(Events.RuleSetsModified);
  }

  onFrameNavigated(event: Protocol.Page.FrameNavigatedEvent): void {
    const frame = event.frame;

    // Returns if not main frame navigation.
    if (!(frame.parentId === null || frame.parentId === undefined)) {
      return;
    }

    this.ruleSets.clearOnMainFrameNavigation(frame.loaderId);
    this.dispatchRuleSetsModified();
  }

  onRuleSetUpdated(event: Protocol.Preload.RuleSetUpdatedEvent): void {
    const ruleSet = event.ruleSet;

    if (this.ruleSets.getById(ruleSet.id)) {
      // Currently, modification of <script> has no effect and doesn't
      // emit Preload.ruleSetAdded.
      // For more details, see https://github.com/whatwg/html/issues/7986.
      throw new Error('unreachable');
    } else {
      this.ruleSets.insert(ruleSet);
      this.dispatchRuleSetsModified();
    }
  }

  onRuleSetRemoved(event: Protocol.Preload.RuleSetRemovedEvent): void {
    const id = event.id;

    this.ruleSets.delete(id);
    this.dispatchRuleSetsModified();
  }
}

SDKModel.SDKModel.register(PreloadingModel, {capabilities: Target.Capability.Target, autostart: false});

// TODO(crbug.com/1167717): Make this a const enum again
// eslint-disable-next-line rulesdir/const_enum
export enum Events {
  RuleSetsModified = 'RuleSetsModified',
}

export type EventTypes = {
  [Events.RuleSetsModified]: void,
};

class PreloadDispatcher implements ProtocolProxyApi.PreloadDispatcher {
  private model: PreloadingModel;

  constructor(model: PreloadingModel) {
    this.model = model;
  }

  ruleSetUpdated(event: Protocol.Preload.RuleSetUpdatedEvent): void {
    this.model.onRuleSetUpdated(event);
  }

  ruleSetRemoved(event: Protocol.Preload.RuleSetRemovedEvent): void {
    this.model.onRuleSetRemoved(event);
  }
}

class PageDispatcher implements ProtocolProxyApi.PageDispatcher {
  private model: PreloadingModel;

  constructor(model: PreloadingModel) {
    this.model = model;
  }

  backForwardCacheNotUsed(_: Protocol.Page.BackForwardCacheNotUsedEvent): void {
  }

  compilationCacheProduced(_: Protocol.Page.CompilationCacheProducedEvent): void {
  }

  documentOpened(_: Protocol.Page.DocumentOpenedEvent): void {
  }

  domContentEventFired(_: Protocol.Page.DomContentEventFiredEvent): void {
  }

  downloadProgress(): void {
  }

  downloadWillBegin(_: Protocol.Page.DownloadWillBeginEvent): void {
  }

  fileChooserOpened(_: Protocol.Page.FileChooserOpenedEvent): void {
  }

  frameAttached(_: Protocol.Page.FrameAttachedEvent): void {
  }

  frameDetached(_: Protocol.Page.FrameDetachedEvent): void {
  }

  frameStartedLoading(_: Protocol.Page.FrameStartedLoadingEvent): void {
  }

  frameStoppedLoading(_: Protocol.Page.FrameStoppedLoadingEvent): void {
  }

  frameRequestedNavigation(_: Protocol.Page.FrameRequestedNavigationEvent): void {
  }

  frameScheduledNavigation(_: Protocol.Page.FrameScheduledNavigationEvent): void {
  }

  frameClearedScheduledNavigation(_: Protocol.Page.FrameClearedScheduledNavigationEvent): void {
  }

  frameNavigated(event: Protocol.Page.FrameNavigatedEvent): void {
    this.model.onFrameNavigated(event);
  }

  frameResized(): void {
  }

  interstitialHidden(): void {
  }

  interstitialShown(): void {
  }

  javascriptDialogOpening(_: Protocol.Page.JavascriptDialogOpeningEvent): void {
  }

  javascriptDialogClosed(_: Protocol.Page.JavascriptDialogClosedEvent): void {
  }

  lifecycleEvent(_: Protocol.Page.LifecycleEventEvent): void {
  }

  loadEventFired(_: Protocol.Page.LoadEventFiredEvent): void {
  }

  navigatedWithinDocument(_: Protocol.Page.NavigatedWithinDocumentEvent): void {
  }

  prerenderAttemptCompleted(_: Protocol.Page.PrerenderAttemptCompletedEvent): void {
  }

  prefetchStatusUpdated(_: Protocol.Page.PrefetchStatusUpdatedEvent): void {
  }

  screencastFrame(_: Protocol.Page.ScreencastFrameEvent): void {
  }

  screencastVisibilityChanged(_: Protocol.Page.ScreencastVisibilityChangedEvent): void {
  }

  windowOpen(_: Protocol.Page.WindowOpenEvent): void {
  }
}

// export only for testing.
export class RuleSetRegistry {
  private map: Map<Protocol.Preload.RuleSetId, Protocol.Preload.RuleSet> =
      new Map<Protocol.Preload.RuleSetId, Protocol.Preload.RuleSet>();

  // Returns reference. Don't save returned values.
  // Returned values may or may not be updated as the time grows.
  getById(id: Protocol.Preload.RuleSetId): Protocol.Preload.RuleSet|null {
    return this.map.get(id) || null;
  }

  // Returns reference. Don't save returned values.
  // Returned values may or may not be updated as the time grows.
  getAll(): WithId<Protocol.Preload.RuleSetId, Protocol.Preload.RuleSet>[] {
    return Array.from(this.map.entries()).map(([id, value]) => ({id, value}));
  }

  insert(ruleSet: Protocol.Preload.RuleSet): void {
    if (this.map.get(ruleSet.id)) {
      throw new Error(`cannot insert, already exists: id = ${ruleSet.id}`);
    }

    this.map.set(ruleSet.id, ruleSet);
  }

  delete(id: Protocol.Preload.RuleSetId): void {
    this.map.delete(id);
  }

  // Clear all except for rule sets with given loader id (for race).
  clearOnMainFrameNavigation(loaderId: Protocol.Network.LoaderId): void {
    for (const ruleSet of this.map.values()) {
      if (ruleSet.loaderId !== loaderId) {
        this.map.delete(ruleSet.id);
      }
    }
  }
}
