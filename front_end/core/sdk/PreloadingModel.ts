// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as Common from '../common/common.js';
import type * as Platform from '../platform/platform.js';
import type * as Protocol from '../../generated/protocol.js';
import type * as ProtocolProxyApi from '../../generated/protocol-proxy-api.js';

import * as SDKModel from './SDKModel.js';
import * as Target from './Target.js';
import * as TargetManager from './TargetManager.js';
import * as ResourceTreeModel from './ResourceTreeModel.js';

export interface WithId<I, V> {
  id: I;
  value: V;
}

// Holds preloading related information.
//
// - SpeculationRule rule sets
// - Preloading attempts
// - (TODO) Relationship between rule sets and preloading attempts
export class PreloadingModel extends SDKModel.SDKModel<EventTypes> implements TargetManager.Observer {
  private ruleSets: RuleSetRegistry = new RuleSetRegistry();
  private preloadingAttempts: PreloadingAttemptRegistry = new PreloadingAttemptRegistry();
  // See the comment in onMainFrameNavigated.
  // TODO(https://crbug.com/1317959): Remove this.
  private prerenderingUrlToLoaderId: Map<Platform.DevToolsPath.UrlString, Protocol.Network.LoaderId> =
      new Map<Platform.DevToolsPath.UrlString, Protocol.Network.LoaderId>();

  constructor(target: Target.Target) {
    console.log('PreloadingModel: ctor', target);
    super(target);

    TargetManager.TargetManager.instance().observeTargets(this);
    TargetManager.TargetManager.instance().addModelListener(
        ResourceTreeModel.ResourceTreeModel, ResourceTreeModel.Events.MainFrameNavigated, this.onMainFrameNavigated,
        this);
    TargetManager.TargetManager.instance().addModelListener(
        ResourceTreeModel.ResourceTreeModel, ResourceTreeModel.Events.PrerenderAttemptCompleted,
        this.onPrerenderAttemptCompleted, this);
  }

  targetAdded(target: Target.Target): void {
    target.registerPreloadDispatcher(new PreloadDispatcher(this));
    target.registerPageDispatcher(new PageDispatcher(this));

    void target.preloadAgent().invoke_enable();
  }

  targetRemoved(_target: Target.Target): void {
  }

  private onTargetCreated(target: Target.Target): void {
    target.registerPreloadDispatcher(new PreloadDispatcher(this));
    target.registerPageDispatcher(new PageDispatcher(this));

    void target.preloadAgent().invoke_enable();
  }

  dispose(): void {
    const error = new Error('dtor');
    console.log('PreloadingModel: dtor', error.stack);
    super.dispose();

    TargetManager.TargetManager.instance().removeModelListener(
        ResourceTreeModel.ResourceTreeModel, ResourceTreeModel.Events.MainFrameNavigated, this.onMainFrameNavigated,
        this);
    TargetManager.TargetManager.instance().removeModelListener(
        ResourceTreeModel.ResourceTreeModel, ResourceTreeModel.Events.PrerenderAttemptCompleted,
        this.onPrerenderAttemptCompleted, this);

    // void this.agent.invoke_disable();
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

  // Returns reference. Don't save returned values.
  // Returned value may or may not be updated as the time grows.
  getPreloadingAttemptById(id: PreloadingAttemptId): PreloadingAttempt|null {
    return this.preloadingAttempts.getById(id);
  }

  // Returns array of pairs of id and reference. Don't save returned references.
  // Returned values may or may not be updated as the time grows.
  getAllPreloadingAttempts(): WithId<PreloadingAttemptId, PreloadingAttempt>[] {
    return this.preloadingAttempts.getAll();
  }

  private onMainFrameNavigated(event: Common.EventTarget.EventTargetEvent<ResourceTreeModel.ResourceTreeFrame>): void {
    const frame = event.data;

    // Note that at this timing ResourceTreeFrame.loaderId is ensured to
    // be non empty and Protocol.Network.LoaderId because it is filled
    // by ResourceTreeFrame.navigate.
    const loaderId = frame.loaderId as Protocol.Network.LoaderId;

    // Note that commit and activation differ for prerendered page, and
    // currently, Page.frameNavigated event is emitted for
    // DocumentLoader::WillCommitNavigation. So, roughly speaking,
    // this method is called when SpeculationRules for prerendering
    // added, and not called when the prerendered page is activated.
    // For short-term, we mitigate this by simulating
    // Page.frameNavigated for prerendered pages by using
    // Page.prerenderAttemptCompleted. Note that this is far from
    // perfect and may cause race.
    //
    // TODO(https://crbug.com/1317959): Rely on Page.frameNavigated and
    // remove this.
    const targetInfo = frame.resourceTreeModel().target().targetInfo();

    if (targetInfo === undefined) {
      return;
    }

    if (targetInfo.subtype === 'prerender') {
      this.prerenderingUrlToLoaderId.set(frame.url as Platform.DevToolsPath.UrlString, loaderId);

      return;
    }

    this.ruleSets.clearOnMainFrameNavigation(loaderId);
    this.dispatchEventToListeners(Events.RuleSetsModified);

    this.prerenderingUrlToLoaderId.clear();
  }

  private onPrerenderAttemptCompleted(
      event: Common.EventTarget.EventTargetEvent<Protocol.Page.PrerenderAttemptCompletedEvent>): void {
    const inner = event.data;

    // See the comment in onMainFrameNavigated.
    const loaderId = this.prerenderingUrlToLoaderId.get(inner.prerenderingUrl as Platform.DevToolsPath.UrlString);
    if (loaderId !== undefined) {
      this.ruleSets.clearOnMainFrameNavigation(loaderId);
      this.dispatchEventToListeners(Events.RuleSetsModified);
    }

    this.prerenderingUrlToLoaderId.clear();
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
      this.dispatchEventToListeners(Events.RuleSetsModified);
    }
  }

  onRuleSetRemoved(event: Protocol.Preload.RuleSetRemovedEvent): void {
    const id = event.id;

    this.ruleSets.delete(id);
    this.dispatchEventToListeners(Events.RuleSetsModified);
  }

  onPrefetchStatusUpdated(event: Protocol.Page.PrefetchStatusUpdatedEvent): void {
    // Currently, prefetch/prerenderStatusUpdated events don't have PreloadingAttemptKey.
    // Temporarily, we fill this gap by fake key.
    //
    // TODO(https://crbug.com/1317959): Correct this.
    const attempt = {
      key: {
        loaderId: 'fakeLoaderId' as Protocol.Network.LoaderId,
        action: SpeculationAction.Prefetch,
        url: event.prefetchUrl as Platform.DevToolsPath.UrlString,
        targetHint: null,
      },
      status: event.status,
    };
    this.preloadingAttempts.upsert(attempt);
    this.dispatchEventToListeners(Events.RuleSetsModified);
  }

  onPrerenderStatusUpdated(event: Protocol.Page.PrerenderStatusUpdatedEvent): void {
    // Currently, prefetch/prerenderStatusUpdated events don't have PreloadingAttemptKey.
    // Temporarily, we fill this gap by fake key.
    //
    // TODO(https://crbug.com/1317959): Correct this.
    const attempt = {
      key: {
        loaderId: 'fakeLoaderId' as Protocol.Network.LoaderId,
        action: SpeculationAction.Prerender,
        url: event.prerenderingUrl as Platform.DevToolsPath.UrlString,
        targetHint: null,
      },
      status: event.status,
    };
    this.preloadingAttempts.upsert(attempt);
    this.dispatchEventToListeners(Events.RuleSetsModified);
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

// TODO(https://crbug.com/1384419): Remove this once events moved to
// Preload domains.
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

  frameNavigated(_: Protocol.Page.FrameNavigatedEvent): void {
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

  prefetchStatusUpdated(event: Protocol.Page.PrefetchStatusUpdatedEvent): void {
    this.model.onPrefetchStatusUpdated(event);
  }

  prerenderAttemptCompleted(_: Protocol.Page.PrerenderAttemptCompletedEvent): void {
  }

  prerenderStatusUpdated(event: Protocol.Page.PrerenderStatusUpdatedEvent): void {
    this.model.onPrerenderStatusUpdated(event);
  }

  screencastFrame(_: Protocol.Page.ScreencastFrameEvent): void {
  }

  screencastVisibilityChanged(_: Protocol.Page.ScreencastVisibilityChangedEvent): void {
  }

  windowOpen(_: Protocol.Page.WindowOpenEvent): void {
  }
}

class RuleSetRegistry {
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

// TODO(https://crbug.com/1317959): Use types Protocol.Preload.* once backend CL lands.
// TODO(crbug.com/1167717): Make this a const enum again
// eslint-disable-next-line rulesdir/const_enum
export enum SpeculationAction {
  Prefetch = 'Prefetch',
  Prerender = 'Prerender',
}

// TODO(crbug.com/1167717): Make this a const enum again
// eslint-disable-next-line rulesdir/const_enum
export enum SpeculationTargetHint {
  Blank = 'Blank',
  Self = 'Self',
}

export interface PreloadingAttemptKey {
  loaderId: Protocol.Network.LoaderId;
  action: SpeculationAction;
  url: Platform.DevToolsPath.UrlString;
  targetHint: SpeculationTargetHint|null;
}

export type PreloadingAttemptId = string;

export interface PreloadingAttempt {
  key: PreloadingAttemptKey;
  status: Protocol.Page.PreloadingStatus;
}

function makePreloadingAttemptId(key: PreloadingAttemptKey): PreloadingAttemptId {
  let action;
  switch (key.action) {
    case SpeculationAction.Prefetch:
      action = 'Prefetch';
      break;
    case SpeculationAction.Prerender:
      action = 'Prerender';
      break;
  }

  let targetHint;
  switch (key.targetHint) {
    case null:
      targetHint = 'null';
      break;
    case SpeculationTargetHint.Blank:
      targetHint = 'Blank';
      break;
    case SpeculationTargetHint.Self:
      targetHint = 'Self';
      break;
  }

  return `${key.loaderId}:${action}:${key.url}:${targetHint}`;
}

class PreloadingAttemptRegistry {
  private map: Map<PreloadingAttemptId, PreloadingAttempt> = new Map<PreloadingAttemptId, PreloadingAttempt>();

  // Returns reference. Don't save returned values.
  // Returned values may or may not be updated as the time grows.
  getById(id: PreloadingAttemptId): PreloadingAttempt|null {
    return this.map.get(id) || null;
  }

  // Returns reference. Don't save returned values.
  // Returned values may or may not be updated as the time grows.
  getAll(): WithId<PreloadingAttemptId, PreloadingAttempt>[] {
    return Array.from(this.map.entries()).map(([id, value]) => ({id, value}));
  }

  upsert(attempt: PreloadingAttempt): void {
    const id = makePreloadingAttemptId(attempt.key);

    this.map.set(id, attempt);
  }
}
