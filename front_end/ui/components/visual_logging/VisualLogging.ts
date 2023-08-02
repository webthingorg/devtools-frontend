// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../../core/common/common.js';
import * as Platform from '../../../core/platform/platform.js';
import * as Coordinator from '../render_coordinator/render_coordinator.js';

import {reportSparseHistogram, reportUserAction} from './FakeUma.js';

const PROCESS_DOM_INTERVAL = 500;
const KEYBOARD_LOG_INTERVAL = 3000;
const MAX_EVENT_NUMBER = 500;

const domProcessingThrottler = new Common.Throttler.Throttler(PROCESS_DOM_INTERVAL);
const keyboardLogThrottler = new Common.Throttler.Throttler(KEYBOARD_LOG_INTERVAL);
const coordinator = Coordinator.RenderCoordinator.RenderCoordinator.instance();
const eventNumbers = new Map<string, number>();

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

type ContextProvider = (e: Element|Event) => number|undefined;
const contextProviders = new Map<string, ContextProvider>();

export function registerContextProvider(name: string, provider: ContextProvider) {
  if (contextProviders.has(name)) {
    throw new Error(`Context provider with the name '${name} is already registered'`);
  }
  contextProviders.set(name, provider);
}

type ParentProvider = (e: Element) => Element|undefined;
const parentProviders = new Map<string, ParentProvider>();

export function registerParentProvider(name: string, provider: ParentProvider) {
  if (parentProviders.has(name)) {
    throw new Error(`Parent provider with the name '${name} is already registered'`);
  }
  parentProviders.set(name, provider);
}

function scheduleProcessDom(): void {
  void domProcessingThrottler.schedule(() => coordinator.read('processDomForLogging', processDom));
}

let nextVeId = 0;

function processDom(): void {
  if (document.hidden) {
    return;
  }
  const startTime = performance.now();

  const visualElements = getJsLogElements();
  const visibleElements: Element[] = [];
  const viewportRect = new DOMRect(0, 0, document.body.clientWidth, document.body.clientHeight);
  for (const element of visualElements) {
    const elementMetadata = metadata.get(element) || {
      impressionLogged: false,
      processed: false,
      jslog: parseJsLog(element.getAttribute('jslog') || ''),
      veid: ++nextVeId
    };
    if (!elementMetadata.impressionLogged) {
      if (isVisible(element, viewportRect)) {
        visibleElements.push(element);
        elementMetadata.impressionLogged = true;
      }
    }
    if (!elementMetadata.processed) {
      if (elementMetadata.jslog?.track?.has('click')) {
        element.addEventListener('click', logClick, {capture: true});
      }
      const trackKeydown = elementMetadata.jslog?.track?.get('keydown');
      if (trackKeydown) {
        element.addEventListener('keydown', logKeydown(trackKeydown.split(',')), {capture: true});
      }
      elementMetadata.processed = true;
    }
    metadata.set(element, elementMetadata);
  }
  logImpressions(visibleElements);
  // console.error('processDom: ', performance.now() - startTime);
}

const MAX_INT16 = 65536;  // 65535

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
  index?: number;
  mouseButton?: number;
  context?: number;
}

const originalEvents: {name: string, number: number, events: VeEventData[]}[] = [];

// @ts-ignore
window.dumpOriginalVeEvents =
    function() {
  console.error(JSON.stringify(originalEvents));
}

function logVeEvent(name: string, events: VeEventData[]):
    void {
      let number = eventNumbers.get(name) || 0;

      originalEvents.push({name, number, events});
      reportUserAction(`${name}_${number}`);
      for (const event of events) {
        reportSparseHistogram(`${name}_${number}`, event.veid);
        for (const [metadataKey, metadataValue] of Object.entries(event)) {
          if (metadataKey === 'veid' || metadataValue === undefined)
            continue;
          console.assert(metadataValue < MAX_INT16);
          reportSparseHistogram(`${name}_${metadataKey}_${number}`, event.veid * MAX_INT16 + metadataValue);
        }
      }

      ++number;
      if (number >= MAX_EVENT_NUMBER) {
        number = 0;
      }
      eventNumbers.set(name, number);
    }

function getEffectiveContext(elementMetadata: VeMetadata, argument: Element|Event):
    number|undefined {
      if (elementMetadata.jslog.context) {
        if (typeof elementMetadata.jslog.context === 'function') {
          return elementMetadata.jslog.context(argument);
        } else {
          return elementMetadata.jslog.context;
        }
      }
      return undefined;
    }

function logImpressions(elements: Element[]):
    void {
      const events = [];
      for (const element of elements) {
        const elementMetadata = metadata.get(element);
        if (!elementMetadata) {
          continue;
        }
        const eventData: VeEventData = {veid: elementMetadata.veid, type: elementMetadata.jslog.ve};
        const parent = elementMetadata.jslog.parentProvider?.(element) ?? getParentElement(element);
        if (parent) {
          const parentMetadata = metadata.get(parent);
          if (parentMetadata) {
            eventData.parent = parentMetadata.veid;
          }
        }
        eventData.context = getEffectiveContext(elementMetadata, element);
        events.push(eventData);
      }
      if (events.length) {
        logVeEvent('DevTools_Impression', events);
      }
    }

function logClick(event: Event):
    void {
      if (!(event instanceof MouseEvent)) {
        return;
      }
      const elementMetadata = metadata.get(event.currentTarget as Element);
      if (!elementMetadata) {
        return;
      }
      const eventData: VeEventData = {veid: elementMetadata.veid, mouseButton: event.button};
      eventData.context = getEffectiveContext(elementMetadata, event);
      logVeEvent('DevTools_Click', [eventData])
    }

function logChange(event: Event):
    void {
      const elementMetadata = metadata.get(event.currentTarget as Element);
      if (!elementMetadata) {
        return;
      }
      const eventData: VeEventData = {veid: elementMetadata.veid};
      eventData.context = getEffectiveContext(elementMetadata, event);
      logVeEvent('DevTools_Change', [eventData])
    }

const logKeydown = (codes: string[]) => (event: Event) => {
  if (!(event instanceof KeyboardEvent)) {
    return;
  }
  if (codes.length && !codes.includes(event.code)) {
    return;
  }
  const elementMetadata = metadata.get(event.currentTarget as Element);
  if (!elementMetadata) {
    return;
  }
  keyboardLogThrottler.schedule(async () => {
    const eventData: VeEventData = {veid: elementMetadata.veid};
    eventData.context = getEffectiveContext(elementMetadata, event);
    logVeEvent('DevTools_Keydown', [eventData])
  });
};

interface VeMetadata {
  impressionLogged: boolean;
  processed: boolean;
  jslog: JsLog;
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

interface ParsedJsLog {
  ve: number;
  track?: Map<string, string>;
  context?: number|ContextProvider;
  parentProvider?: ParentProvider;
}

const visualElements = new Map<string, number>([
  ['ARIAAttributes', 1],
  ['FullAccessibilityTreeToggle', 2],
  ['TreeItem', 3],
  ['AccessibilityComputedProperties', 4],
  ['AccessibilityPane', 5],
  ['AccessibilitySourceOrder', 6],
  ['Toggle', 7],
  ['TrustTokensDeleteButton', 8],
  ['TrustTokensView', 9],
  ['DOMBreakpointsPane', 10],
  ['DOMBreakpoint', 11],
  ['ConsolePanel', 12],
  ['ConsoleMessage', 13],
  ['FullAccessibilityTree', 14],
  ['ElementClassesPane', 15],
  ['AddElementClassPrompt', 16],
  ['ToggleElementClasses', 17],
  ['ToggleElementStates', 18],
  ['ElementsPanel', 19],
  ['ToggleComputedStylesSidebar', 20],
  ['ElementsTreeOutline', 21],
  ['EventListenersPane', 22],
  ['Refresh', 23],
  ['FilterDropdown', 24],
  ['StylesMetricsPane', 25],
  ['ElementPropertiesPane', 26],
  ['StylePropertiesSection', 27],
  ['ShowAllStyleProperties', 28],
  ['AddStylesRule', 29],
  ['StylesSelector', 30],
  ['TreeItemExpand', 31],
  ['StylesPane', 32],
  ['FilterTextField', 33],
  ['ToggleRenderingEmulations', 34],
  ['StylePropertiesSectionSeparator', 35],
  ['JumpToSource', 36],
  ['LayoutPanelGrid', 37],
  ['GridElements', 38],
  ['LayoutPanelFlex', 39],
  ['FlexElements', 40],
  ['LayoutElement', 41],
  ['ColorSwatch', 42],
  ['JumpToElement', 43],
  ['SettingToggle', 44],
  ['SettingDropdown', 45],
  ['ToggleElementSearch', 46],
  ['ToggleDeviceMode', 47],
  ['NetworkRequest', 48],
  ['NetworkPanel', 49],
  ['TreeItem', 50],
  ['TreeItemExpand', 51],
  ['ToolbarMoreItems', 52],
  ['Toolbar', 53],
  ['ElementsBreadcrumbs', 54],
  ['ElementsBreadcrumb', 55],
  ['PanelTabHeader', 56]
]);

const contextValues = new Map<string, number>();

function resolveVe(ve: string): number {
  return visualElements.get(ve) || 0;
}

function resolveContext(context: string): number|ContextProvider {
  const contextProvider = contextProviders.get(context);
  if (contextProvider) {
    return contextProvider;
  }
  const number = parseInt(context);
  if (!isNaN(number)) {
    return number;
  }
  console.error('context: ' + context);
  return Platform.StringUtilities.hashCode(context);
}

function parseJsLog(jslog: string): ParsedJsLog {
  const components = jslog.replace(/ /g, '').split(';');
  const getComponent = (name: string) => components.filter(c => c.startsWith(name)).map(c => c.substr(name.length))[0];
  const ve = resolveVe(components[0]);
  if (ve === 0) {
    console.error('Unkown VE: ' + jslog);
  }
  const contextString = getComponent('context:');
  const context = contextString ? resolveContext(contextString) : undefined;
  const trackString = getComponent('track:');
  const track = trackString ?
      new Map<string, string>(trackString.split(',').map(t => t.split(':') as [string, string])) :
      undefined;
  const parentProvider = parentProviders.get(getComponent('parent:')) || undefined;

  return {
    ve,
    track,
    context,
    parentProvider,
  };
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

export jslog()
