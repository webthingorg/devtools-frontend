// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../../core/common/common.js';
import * as Coordinator from '../render_coordinator/render_coordinator.js';

const IMPRESSION_LOG_INTERVAL = 500;

const throttler = new Common.Throttler.Throttler(IMPRESSION_LOG_INTERVAL);
const coordinator = Coordinator.RenderCoordinator.RenderCoordinator.instance();

let startTime: number;

export function startLogging(): void {
  startTime = Date.now();
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
  void throttler.schedule(() => coordinator.read('processDomForLogging', processDom));
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
    const jslog = parseJsLog(element.getAttribute('jslog') || '');
    if (!jslog) {
      continue;
    }
    const elementMetadata = metadata.get(element) || {impressionLogged: false, processed: false, jslog, id: ++nextVeId};
    if (isVisible(element, viewportRect) && !elementMetadata.impressionLogged) {
      visibleElements.push(element);
      elementMetadata.impressionLogged = true;
    }
    if (!elementMetadata.processed) {
      if (jslog.track.includes('click')) {
        element.addEventListener('click', logClick);
      }
    }
    elementMetadata.processed = true;
    metadata.set(element, elementMetadata);
  }
  logImpressions(visibleElements);
}

function reportSparseHistogram(name: string, value: number): void {
  console.error('reportSparseHistogram', name, value);
}

const MAX_INT16 = 65535;

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

function logImpressions(elements: Element[]): void {
  const time = Math.min(Math.floor((Date.now() - startTime) / 1000), MAX_INT16);
  for (const element of elements) {
    const elementMetadata = metadata.get(element);
    if (!elementMetadata) {
      continue;
    }
    console.assert(elementMetadata.id < MAX_INT16 && elementMetadata.ve < MAX_INT16);
    reportSparseHistogram('DevTools_Impression', time * MAX_INT16 + elementMetadata.ve);
    reportSparseHistogram('DevTools_VeType', elementMetadata.id * MAX_INT16 + elementMetadata.id);
    const parent = getParentElement(element);
    if (parent) {
      const parentMetadata = metadata.get(parent);
      if (parentMetadata) {
        console.assert(parentMetadata.id < MAX_INT16);
        reportSparseHistogram('DevTools_VeParent', elementMetadata.id * MAX_INT16 + parentMetadata.id);
      }
    }
  }
}

function logClick(event: Event): void {
  const elementMetadata = metadata.get(event.currentTarget as Element);
  if (!elementMetadata) {
    return;
  }
  const time = Math.min(Math.floor((Date.now() - startTime) / 1000), MAX_INT16);
  console.assert(elementMetadata.id < MAX_INT16);
  reportSparseHistogram('DevTools_Click', time * MAX_INT16 + elementMetadata.id);
}

interface VeMetadata {
  impressionLogged: boolean;
  processed: boolean;
  jslog: JsLog;
  id: number;
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

interface JsLog {
  ve: number;
  track: string[];
}

function resolveVe(ve: string): number {
  switch (ve) {
    case 'ElementsPanel':
      return 1;
    case 'ConsolePanel':
      return 2;
    case 'NetworkPanel':
      return 3;
    case 'DomNode':
      return 4;
    case 'ConsoleMessage':
      return 5;
    case 'NetworkRequest':
      return 6;
    case 'TrustTokensView':
      return 7;
    case 'TrustTokensDeleteButton':
      return 8;
    default:
      return 0;
  }
}

function parseJsLog(jslog: string): JsLog|null {
  const components = jslog.split(';');
  const ve = resolveVe(components[0]);
  if (!ve) {
    return null;
  }
  return {ve, track: components.filter(c => c.startsWith('track:')).map(c => c.substr('track:'.length))};
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
