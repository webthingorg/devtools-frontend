// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../../core/common/common.js';
import * as Coordinator from '../render_coordinator/render_coordinator.js';

const PROCESS_DOM_INTERVAL = 500;

const domProcessingThrottler = new Common.Throttler.Throttler(PROCESS_DOM_INTERVAL);
const coordinator = Coordinator.RenderCoordinator.RenderCoordinator.instance();

export function startLogging(): void {
  if (['interactive', 'complete'].includes(document.readyState)) {
    processDom();
  }
  document.addEventListener('load', scheduleProcessDom);
  document.addEventListener('DOMContentLoaded', scheduleProcessDom);
  document.addEventListener('visibilitychange', scheduleProcessDom);
  document.addEventListener('scroll', scheduleProcessDom);
  new MutationObserver(scheduleProcessDom).observe(document.body, {attributes: true, childList: true, subtree: true});
}

function scheduleProcessDom(): void {
  void domProcessingThrottler.schedule(() => coordinator.read('processDomForLogging', processDom));
}

let nextVeId = 0;

function processDom(): void {
  if (document.hidden) {
    return;
  }
  const visualElements = getJsLogElements();
  const visibleElements: Element[] = [];
  const viewportRect = new DOMRect(0, 0, document.body.clientWidth, document.body.clientHeight);
  for (const element of visualElements) {
    const elementMetadata = metadata.get(element) || {
      impressionLogged: false,
      processed: false,
      config: parseJsLog(element.getAttribute('jslog') || ''),
      veid: ++nextVeId,
    };
    if (!elementMetadata.impressionLogged) {
      if (isVisible(element, viewportRect)) {
        visibleElements.push(element);
        elementMetadata.impressionLogged = true;
      }
    }
    metadata.set(element, elementMetadata);
  }
  logImpressions(visibleElements);
}

function getParentElement(element: Element): Element|null {
  const parent = element.parentElement?.closest('[jslog]');
  if (parent) {
    return parent;
  }
  const root = element.getRootNode();
  if (root instanceof ShadowRoot) {
    return getParentElement(root.host);
  }
  return null;
}

interface VeEventData {
  veid: number;
  type?: number;
  parent?: number;
  context?: number;
}

function logVeEvent(_name: string, _events: VeEventData[]): void {
}

function logImpressions(elements: Element[]): void {
  const events = [];
  for (const element of elements) {
    const elementMetadata = metadata.get(element);
    if (!elementMetadata) {
      continue;
    }
    const eventData: VeEventData = {veid: elementMetadata.veid, type: elementMetadata.config.ve};
    const parent = getParentElement(element);
    if (parent) {
      const parentMetadata = metadata.get(parent);
      if (parentMetadata) {
        eventData.parent = parentMetadata.veid;
      }
    }
    eventData.context = elementMetadata.config.context;
    events.push(eventData);
  }
  if (events.length) {
    logVeEvent('DevTools_Impression', events);
  }
}

interface VeMetadata {
  impressionLogged: boolean;
  processed: boolean;
  config: VisualElementConfig;
  veid: number;
}

const metadata = new WeakMap<Element, VeMetadata>();
const observedShadowRoots = new WeakSet<ShadowRoot>();

function getJsLogElements(): Element[] {
  const renderedElements = [...document.querySelectorAll('*')];
  const visualElements: Element[] = [];
  while (renderedElements.length > 0) {
    const element = renderedElements.shift() as Element;
    if (element.getAttribute('jslog')) {
      visualElements.push(element);
    }
    if (element.shadowRoot) {
      if (!observedShadowRoots.has(element.shadowRoot)) {
        new MutationObserver(scheduleProcessDom)
            .observe(element.shadowRoot, {attributes: true, childList: true, subtree: true});
        observedShadowRoots.add(element.shadowRoot);
      }
      renderedElements.unshift.apply(renderedElements, [...element.shadowRoot.querySelectorAll('*')]);
    }
  }
  return visualElements;
}

interface VisualElementConfig {
  ve: number;
  track?: Map<string, string>;
  context?: number|ContextProvider;
  parentProvider?: ParentProvider;
}

const MIN_ELEMENT_SIZE_FOR_IMPRESSIONS = 10;

function isVisible(element: Element, viewportRect: DOMRect): boolean {
  const elementRect = element.getBoundingClientRect();
  const overlap = intersection(viewportRect, elementRect);

  if (overlap && overlap.width >= MIN_ELEMENT_SIZE_FOR_IMPRESSIONS &&
      overlap.height >= MIN_ELEMENT_SIZE_FOR_IMPRESSIONS) {
    return true;
  }

  return false;
}

function intersection(a: DOMRect, b: DOMRect): DOMRect|null {
  const x0 = Math.max(a.left, b.left);
  const x1 = Math.min(a.left + a.width, b.left + b.width);

  if (x0 <= x1) {
    const y0 = Math.max(a.top, b.top);
    const y1 = Math.min(a.top + a.height, b.top + b.height);

    if (y0 <= y1) {
      return new DOMRect(x0, y0, x1 - x0, y1 - y0);
    }
  }
  return null;
}
