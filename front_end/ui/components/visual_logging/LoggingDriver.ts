// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../../core/common/common.js';
import * as Coordinator from '../render_coordinator/render_coordinator.js';

import {getDomState, isVisible} from './DomState.js';
import {logImpressions} from './LoggingEvents.js';
import {getLoggingState} from './LoggingState.js';

const PROCESS_DOM_INTERVAL = 500;

const domProcessingThrottler = new Common.Throttler.Throttler(PROCESS_DOM_INTERVAL);

function observeMutations(root: Node): void {
  new MutationObserver(scheduleProcessDom).observe(root, {attributes: true, childList: true, subtree: true});
}

export function startLogging(): void {
  if (['interactive', 'complete'].includes(document.readyState)) {
    processDom();
  }
  document.addEventListener('load', scheduleProcessDom);
  document.addEventListener('DOMContentLoaded', scheduleProcessDom);
  document.addEventListener('visibilitychange', scheduleProcessDom);
  document.addEventListener('scroll', scheduleProcessDom);
  observeMutations(document.body);
}

function scheduleProcessDom(): void {
  void domProcessingThrottler.schedule(
      () => Coordinator.RenderCoordinator.RenderCoordinator.instance().read('processDomForLogging', processDom));
}

const observedShadowRoots = new WeakSet<ShadowRoot>();

function observeMutationsInShadowRoots(shadowRoots: ShadowRoot[]): void {
  for (const shadowRoot of shadowRoots) {
    if (!observedShadowRoots.has(shadowRoot)) {
      observeMutations(shadowRoot);
      observedShadowRoots.add(shadowRoot);
    }
  }
}

function processDom(): void {
  if (document.hidden) {
    return;
  }
  const {loggables, shadowRoots} = getDomState();
  const visibleElements: Element[] = [];
  const viewportRect = new DOMRect(0, 0, document.body.clientWidth, document.body.clientHeight);
  observeMutationsInShadowRoots(shadowRoots);
  for (const {element, parent} of loggables) {
    const loggingState = getLoggingState(element, parent);
    if (!loggingState.impressionLogged) {
      if (isVisible(element, viewportRect)) {
        visibleElements.push(element);
        loggingState.impressionLogged = true;
      }
    }
  }
  logImpressions(visibleElements);
}
