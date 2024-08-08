// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Platform from '../../core/platform/platform.js';
import {assertNotNullOrUndefined} from '../../core/platform/platform.js';

import {type Loggable} from './Loggable.js';
import {type LoggingConfig, VisualElements} from './LoggingConfig.js';
import {pendingWorkComplete} from './LoggingDriver.js';
import {getLoggingState, type LoggingState} from './LoggingState.js';

let veDebuggingEnabled = false;
let debugPopover: HTMLElement|null = null;
const nonDomDebugElements = new WeakMap<Loggable, HTMLElement>();

function setVeDebuggingEnabled(enabled: boolean): void {
  veDebuggingEnabled = enabled;
  if (enabled && !debugPopover) {
    debugPopover = document.createElement('div');
    debugPopover.classList.add('ve-debug');
    debugPopover.style.position = 'absolute';
    debugPopover.style.bottom = '100px';
    debugPopover.style.left = '100px';
    debugPopover.style.background = 'black';
    debugPopover.style.color = 'white';
    debugPopover.style.zIndex = '100000';
    document.body.appendChild(debugPopover);
  }
}

// @ts-ignore
globalThis.setVeDebuggingEnabled = setVeDebuggingEnabled;

export function processForDebugging(loggable: Loggable): void {
  const loggingState = getLoggingState(loggable);
  if (!veDebuggingEnabled || !loggingState || loggingState.processedForDebugging) {
    return;
  }
  if (loggable instanceof Element) {
    processElementForDebugging(loggable, loggingState);
  } else {
    processNonDomLoggableForDebugging(loggable, loggingState);
  }
}

function showDebugPopover(content: string): void {
  if (!debugPopover) {
    return;
  }
  debugPopover.style.display = 'block';
  debugPopover.innerHTML = content;
}

function processElementForDebugging(element: Element, loggingState: LoggingState): void {
  if (element.tagName === 'OPTION') {
    if (loggingState.parent?.selectOpen && debugPopover) {
      debugPopover.innerHTML += '<br>' + debugString(loggingState.config);
      loggingState.processedForDebugging = true;
    }
  } else {
    (element as HTMLElement).style.outline = 'solid 1px red';
    element.addEventListener('mouseenter', () => {
      assertNotNullOrUndefined(debugPopover);
      const pathToRoot = [loggingState];
      let ancestor = loggingState.parent;
      while (ancestor) {
        pathToRoot.push(ancestor);
        ancestor = ancestor.parent;
      }
      showDebugPopover(pathToRoot.map(s => debugString(s.config)).join('<br>'));
    }, {capture: true});
    element.addEventListener('mouseleave', () => {
      assertNotNullOrUndefined(debugPopover);
      debugPopover.style.display = 'none';
    }, {capture: true});
    loggingState.processedForDebugging = true;
  }
}

type EventType = 'Click'|'Drag'|'Hover'|'Change'|'KeyDown'|'Resize';
export function processEventForDebugging(
    event: EventType, state: LoggingState|null, extraInfo?: EventAttributes): void {
  const format = localStorage.getItem('veDebugLoggingEnabled');
  if (!format) {
    return;
  }

  switch (format) {
    case DebugLoggingFormat.Intuitive:
      processEventForIntuitiveDebugging(event, state, extraInfo);
      break;
    case DebugLoggingFormat.Test:
      processEventForTestDebugging(event, state, extraInfo);
      break;
    case DebugLoggingFormat.AdHocAnalysis:
      processEventForAdHocAnalysisDebugging(event, state, extraInfo);
      break;
  }
}

export function processEventForIntuitiveDebugging(
    event: EventType, state: LoggingState|null, extraInfo?: EventAttributes): void {
  const entry: IntuitiveLogEntry = {
    event,
    ve: state ? VisualElements[state?.config.ve] : undefined,
    veid: state?.veid,
    context: state?.config.context,
    time: Date.now() - sessionStartTime,
    ...extraInfo,
  };
  deleteUndefinedFields(entry);
  maybeLogDebugEvent(entry);
}

export function processEventForTestDebugging(
    event: EventType, state: LoggingState|null, _extraInfo?: EventAttributes): void {
  lastImpressionLogEntry = null;
  maybeLogDebugEvent({interaction: `${event}: ${veTestKeys.get(state?.veid || 0) || ''}`});
  if (pendingExpectedEvents) {
    checkVeEvents(pendingExpectedEvents);
  }
}

export function processEventForAdHocAnalysisDebugging(
    event: EventType, state: LoggingState|null, extraInfo?: EventAttributes): void {
  const ve = state ? adHocAnalysisEntries.get(state.veid) : null;
  if (ve) {
    const interaction: AdHocAnalysisInteraction = {time: Date.now() - sessionStartTime, type: event, ...extraInfo};
    deleteUndefinedFields(interaction);
    ve.interactions.push(interaction);
  }
}

function deleteUndefinedFields<T>(entry: T): void {
  for (const stringKey in entry) {
    const key = stringKey as keyof T;
    if (typeof entry[key] === 'undefined') {
      delete entry[key];
    }
  }
}

export type EventAttributes = {
  context?: string,
  width?: number,
  height?: number,
  mouseButton?: number,
  doubleClick?: boolean,
};

type VisualElementAttributes = {
  ve: string,
  veid: number,
  context?: string,
  width?: number,
  height?: number,
};

type IntuitiveLogEntry = {
  event?: EventType|'Impression'|'SessionStart',
  children?: IntuitiveLogEntry[],
  parent?: number,
  time?: number,
}&Partial<VisualElementAttributes>;

type AdHocAnalysisVisualElement = VisualElementAttributes&{
  parent?: AdHocAnalysisVisualElement,
};

type AdHocAnalysisInteraction = {
  type: EventType,
  time: number,
}&EventAttributes;

type AdHocAnalysisLogEntry = AdHocAnalysisVisualElement&{
  time: number,
  interactions: AdHocAnalysisInteraction[],
};

type TestLogEntry = {
  impressions: string[],
}|{
  interaction: string,
};

export function processImpressionsForDebugging(states: LoggingState[]): void {
  const format = localStorage.getItem('veDebugLoggingEnabled');
  switch (format) {
    case DebugLoggingFormat.Intuitive:
      processImpressionsForIntuitiveDebugLog(states);
      break;
    case DebugLoggingFormat.Test:
      processImpressionsForTestDebugLog(states);
      break;
    case DebugLoggingFormat.AdHocAnalysis:
      processImpressionsForAdHocAnalysisDebugLog(states);
      break;
    default:
  }
}

function processImpressionsForIntuitiveDebugLog(states: LoggingState[]): void {
  const impressions = new Map<number, IntuitiveLogEntry>();
  for (const state of states) {
    const entry: IntuitiveLogEntry = {
      event: 'Impression',
      ve: VisualElements[state.config.ve],
      context: state?.config.context,
      width: state.size.width,
      height: state.size.height,
      veid: state.veid,
    };
    deleteUndefinedFields(entry);

    impressions.set(state.veid, entry);
    if (!state.parent || !impressions.has(state.parent?.veid)) {
      entry.parent = state.parent?.veid;
    } else {
      const parent = impressions.get(state.parent?.veid) as IntuitiveLogEntry;
      parent.children = parent.children || [];
      parent.children.push(entry);
    }
  }

  const entries = [...impressions.values()].filter(i => 'parent' in i);
  if (entries.length === 1) {
    entries[0].time = Date.now() - sessionStartTime;
    maybeLogDebugEvent(entries[0]);
  } else {
    maybeLogDebugEvent({event: 'Impression', children: entries, time: Date.now() - sessionStartTime});
  }
}

const veTestKeys = new Map<number, string>();
let lastImpressionLogEntry: {impressions: string[]}|null = null;

function processImpressionsForTestDebugLog(states: LoggingState[]): void {
  if (!lastImpressionLogEntry) {
    lastImpressionLogEntry = {impressions: []};
    veDebugEventsLog.push(lastImpressionLogEntry);
  }
  for (const state of states) {
    let key = '';
    if (state.parent) {
      key = (veTestKeys.get(state.parent.veid) || '<UNKNOWN>') + ' > ';
    }
    key += VisualElements[state.config.ve];
    if (state.config.context) {
      key += ': ' + state.config.context;
    }
    veTestKeys.set(state.veid, key);
    lastImpressionLogEntry.impressions.push(key);
  }
  if (pendingExpectedEvents) {
    checkVeEvents(pendingExpectedEvents);
  }
}

const adHocAnalysisEntries = new Map<number, AdHocAnalysisLogEntry>();

function processImpressionsForAdHocAnalysisDebugLog(states: LoggingState[]): void {
  for (const state of states) {
    const buildVe = (state: LoggingState): AdHocAnalysisVisualElement => {
      const ve: AdHocAnalysisVisualElement = {
        ve: VisualElements[state.config.ve],
        veid: state.veid,
        width: state.size?.width,
        height: state.size?.height,
        context: state.config.context,
      };
      deleteUndefinedFields(ve);
      if (state.parent) {
        ve.parent = buildVe(state.parent);
      }
      return ve;
    };
    const entry = {...buildVe(state), interactions: [], time: Date.now() - sessionStartTime};
    adHocAnalysisEntries.set(state.veid, entry);
    maybeLogDebugEvent(entry);
  }
}

function processNonDomLoggableForDebugging(loggable: Loggable, loggingState: LoggingState): void {
  let debugElement = nonDomDebugElements.get(loggable);
  if (!debugElement) {
    debugElement = document.createElement('div');
    debugElement.classList.add('ve-debug');
    debugElement.style.background = 'black';
    debugElement.style.color = 'white';
    debugElement.style.zIndex = '100000';
    debugElement.textContent = debugString(loggingState.config);
    nonDomDebugElements.set(loggable, debugElement);
    setTimeout(() => {
      if (!loggingState.size?.width || !loggingState.size?.height) {
        debugElement?.parentElement?.removeChild(debugElement);
        nonDomDebugElements.delete(loggable);
      }
    }, 10000);
  }
  const parentDebugElement =
      parent instanceof HTMLElement ? parent : nonDomDebugElements.get(parent as Loggable) || debugPopover;
  assertNotNullOrUndefined(parentDebugElement);
  if (!parentDebugElement.classList.contains('ve-debug')) {
    debugElement.style.position = 'absolute';
    parentDebugElement.insertBefore(debugElement, parentDebugElement.firstChild);
  } else {
    debugElement.style.marginLeft = '10px';
    parentDebugElement.appendChild(debugElement);
  }
}

export function debugString(config: LoggingConfig): string {
  const components = [VisualElements[config.ve]];
  if (config.context) {
    components.push(`context: ${config.context}`);
  }
  if (config.parent) {
    components.push(`parent: ${config.parent}`);
  }
  if (config.track) {
    components.push(`track: ${
        Object.entries(config.track)
            .map(([key, value]) => `${key}${typeof value === 'string' ? `: ${value}` : ''}`)
            .join(', ')}`);
  }
  return components.join('; ');
}

const veDebugEventsLog: (IntuitiveLogEntry|AdHocAnalysisLogEntry|TestLogEntry)[] = [];

function maybeLogDebugEvent(entry: IntuitiveLogEntry|AdHocAnalysisLogEntry|TestLogEntry): void {
  const format = localStorage.getItem('veDebugLoggingEnabled');
  if (!format) {
    return;
  }
  veDebugEventsLog.push(entry);
  if (format === DebugLoggingFormat.Intuitive) {
    // eslint-disable-next-line no-console
    console.info('VE Debug:', entry);
  }
}

export enum DebugLoggingFormat {
  Intuitive = 'Intuitive',
  Test = 'Test',
  AdHocAnalysis = 'AdHocAnalysis',
}

export function setVeDebugLoggingEnabled(enabled: boolean, format = DebugLoggingFormat.Intuitive): void {
  if (enabled) {
    localStorage.setItem('veDebugLoggingEnabled', format);
  } else {
    localStorage.removeItem('veDebugLoggingEnabled');
  }
}

function findVeDebugImpression(veid: number, includeAncestorChain?: boolean): IntuitiveLogEntry|undefined {
  const findImpression = (entry: IntuitiveLogEntry): IntuitiveLogEntry|undefined => {
    if (entry.event === 'Impression' && entry.veid === veid) {
      return entry;
    }
    let i = 0;
    for (const childEntry of entry.children || []) {
      const matchingEntry = findImpression(childEntry);
      if (matchingEntry) {
        if (includeAncestorChain) {
          const children = [];
          children[i] = matchingEntry;
          return {...entry, children};
        }
        return matchingEntry;
      }
      ++i;
    }
    return undefined;
  };
  return findImpression({children: veDebugEventsLog as IntuitiveLogEntry[]});
}

function fieldValuesForSql<T>(
    obj: T,
    fields: {strings: readonly(keyof T)[], numerics: readonly(keyof T)[], booleans: readonly(keyof T)[]}): string {
  return [
    ...fields.strings.map(f => obj[f] ? `"${obj[f]}"` : '$NullString'),
    ...fields.numerics.map(f => obj[f] ?? 'null'),
    ...fields.booleans.map(f => obj[f] ?? '$NullBool'),
  ].join(', ');
}

function exportAdHocAnalysisLogForSql(): void {
  const VE_FIELDS = {
    strings: ['ve', 'context'] as const,
    numerics: ['veid', 'width', 'height'] as const,
    booleans: [] as const,
  };
  const INTERACTION_FIELDS = {
    strings: ['type', 'context'] as const,
    numerics: ['width', 'height', 'mouseButton', 'time'] as const,
    booleans: ['width', 'height', 'mouseButton', 'time'] as const,
  };

  const fieldsDefsForSql = (fields: string[]): string => fields.map((f, i) => `$${i + 1} as ${f}`).join(', ');

  const veForSql = (e: AdHocAnalysisVisualElement): string =>
      `$VeFields(${fieldValuesForSql(e, VE_FIELDS)}, ${e.parent ? `STRUCT(${veForSql(e.parent)})` : null})`;

  const interactionForSql = (i: AdHocAnalysisInteraction): string =>
      `$Interaction(${fieldValuesForSql(i, INTERACTION_FIELDS)})`;

  const entryForSql = (e: AdHocAnalysisLogEntry): string =>
      `$Entry(${veForSql(e)}, ([${e.interactions.map(interactionForSql).join(', ')}]), ${e.time})`;

  const entries = veDebugEventsLog as AdHocAnalysisLogEntry[];

  // eslint-disable-next-line no-console
  console.log(`
DEFINE MACRO NullString CAST(null AS STRING);
DEFINE MACRO NullBool CAST(null AS BOOL);
DEFINE MACRO VeFields ${fieldsDefsForSql([
    ...VE_FIELDS.strings,
    ...VE_FIELDS.numerics,
    'parent',
  ])};
DEFINE MACRO Interaction STRUCT(${
      fieldsDefsForSql([
        ...INTERACTION_FIELDS.strings,
        ...INTERACTION_FIELDS.numerics,
        ...INTERACTION_FIELDS.booleans,
      ])});
DEFINE MACRO Entry STRUCT($1, $2 AS interactions, $3 AS time);

// This fake entry put first fixes nested struct fiels names being lost
DEFINE MACRO FakeVeFields $VeFields("", $NullString, 0, 0, 0, $1);
DEFINE MACRO FakeVe STRUCT($FakeVeFields($1));
DEFINE MACRO FakeEntry $Entry($FakeVeFields($FakeVe($FakeVe($FakeVe($FakeVe($FakeVe($FakeVe($FakeVe(null)))))))), ([]), 0);

WITH
  processed_logs AS (
      SELECT * FROM UNNEST([
        $FakeEntry,
        ${entries.map(entryForSql).join(', \n')}
      ])
    )



SELECT * FROM processed_logs;`);
}

type StateFlowNode = {
  type: 'Session',
  children: StateFlowNode[],
}|({type: 'Impression', children: StateFlowNode[], time: number}&AdHocAnalysisVisualElement)|AdHocAnalysisInteraction;

type StateFlowMutation = (AdHocAnalysisLogEntry|(AdHocAnalysisInteraction&{veid: number}));

function getStateFlowMutations(): StateFlowMutation[] {
  const mutations: StateFlowMutation[] = [];
  for (const entry of (veDebugEventsLog as AdHocAnalysisLogEntry[])) {
    mutations.push(entry);
    const veid = entry.veid;
    for (const interaction of entry.interactions) {
      mutations.push({...interaction, veid});
    }
  }
  mutations.sort((e1, e2) => e1.time - e2.time);
  return mutations;
}

class StateFlowElementsByArea {
  #data = new Map<number, AdHocAnalysisVisualElement>();

  add(e: AdHocAnalysisVisualElement): void {
    this.#data.set(e.veid, e);
  }

  get(veid: number): AdHocAnalysisVisualElement|undefined {
    return this.#data.get(veid);
  }

  getArea(e: AdHocAnalysisVisualElement): number {
    let area = (e.width || 0) * (e.height || 0);
    const parent = e.parent ? this.#data.get(e.parent?.veid) : null;
    if (!parent) {
      return area;
    }
    const parentArea = this.getArea(parent);
    if (area > parentArea) {
      area = parentArea;
    }
    return area;
  }

  get data(): readonly AdHocAnalysisVisualElement[] {
    return [...this.#data.values()].filter(e => this.getArea(e)).sort((e1, e2) => this.getArea(e2) - this.getArea(e1));
  }
}

function updateStateFlowTree(
    rootNode: StateFlowNode, elements: StateFlowElementsByArea, time: number,
    interactions: AdHocAnalysisInteraction[]): void {
  let node = rootNode;
  for (const element of elements.data) {
    if (!('children' in node)) {
      return;
    }
    let nextNode = node.children[node.children.length - 1];
    const nextNodeId = nextNode?.type === 'Impression' ? nextNode.veid : null;
    if (nextNodeId !== element.veid) {
      node.children.push(...interactions);
      interactions.length = 0;
      nextNode = {type: 'Impression', ve: element.ve, veid: element.veid, context: element.context, time, children: []};
      node.children.push(nextNode);
    }
    node = nextNode;
  }
}

function normalizeNode(node: StateFlowNode): void {
  if (node.type !== 'Impression') {
    return;
  }
  while (node.children.length === 1) {
    if (node.children[0].type === 'Impression') {
      node.children = node.children[0].children;
    }
  }
  for (const child of node.children) {
    normalizeNode(child);
  }
}

function buildStateFlow(): StateFlowNode {
  const mutations = getStateFlowMutations();
  const elements = new StateFlowElementsByArea();
  const rootNode: StateFlowNode = {type: 'Session', children: []};

  let time = mutations[0].time;
  const interactions: AdHocAnalysisInteraction[] = [];
  for (const mutation of mutations) {
    if (mutation.time > time + 1000) {
      updateStateFlowTree(rootNode, elements, time, interactions);
      interactions.length = 0;
    }
    if (!('type' in mutation)) {
      elements.add(mutation);
    } else if (mutation.type === 'Resize') {
      const element = elements.get(mutation.veid);
      if (!element) {
        continue;
      }
      const oldArea = elements.getArea(element);
      element.width = mutation.width;
      element.height = mutation.height;
      if (elements.getArea(element) !== 0 && oldArea !== 0) {
        interactions.push(mutation);
      }
    } else {
      interactions.push(mutation);
    }
    time = mutation.time;
  }
  updateStateFlowTree(rootNode, elements, time, interactions);

  normalizeNode(rootNode);
  return rootNode;
}

let sessionStartTime: number = Date.now();

export function processStartLoggingForDebugging(): void {
  sessionStartTime = Date.now();
  if (localStorage.getItem('veDebugLoggingEnabled') === DebugLoggingFormat.Intuitive) {
    maybeLogDebugEvent({event: 'SessionStart'});
  }
}

async function getVeDebugEventsLog(): Promise<(IntuitiveLogEntry | AdHocAnalysisLogEntry | TestLogEntry)[]> {
  await pendingWorkComplete();
  lastImpressionLogEntry = null;
  return veDebugEventsLog;
}
// Compares the 'actual' log entry against the 'expected'. The difference of 0
// indicates that events match. Positive values, maximum 1.0, means no match,
// higher values represent larger difference.
// For impressions events to match, all expected impressions need to be present
// in the actual event. Unexected impressions in the actual event are ignored.
// Interaction events need to match exactly.
function compareVeEvents(actual: TestLogEntry, expected: TestLogEntry): {difference: number, description?: string} {
  if ('interaction' in expected && 'interaction' in actual) {
    if (expected.interaction !== actual.interaction) {
      return {
        difference: editDistance(expected.interaction, actual.interaction) /
            Math.max(expected.interaction.length, actual.interaction.length),
        description: `Missing VE interaction: ${expected.interaction}, got: ${actual.interaction}`,
      };
    }
    return {difference: 0};
  }
  if ('impressions' in expected && 'impressions' in actual) {
    const actualSet = new Set(actual.impressions);
    const expectedSet = new Set(expected.impressions);
    const missing = [...expectedSet].filter(k => !actualSet.has(k));

    if (missing.length) {
      return {
        difference: missing.length / expected.impressions.length,
        // description: 'Missing VE impressions:\n' + formatImpressions(missing),
      };
    }
    return {difference: 0};
  }
  return {
    difference: 1,
    // description: 'interaction' in expected ? 'Missing VE interaction:\n' + expected.interaction :
    //                                          'Missing VE impressions:\n' + formatImpressions(expected.impressions),
  };
}

let pendingExpectedEvents: TestLogEntry[]|null = null;
let missingExpectedEvents: TestLogEntry[]|null = null;
let pendingExpectVeEventsResult = Platform.PromiseUtilities.promiseWithResolvers<void>();
let pendingRejectionTimeout: number|null = null;

function formatImpressions(impressions: string[]): string[] {
  const result: string[] = [];
  let lastImpression = '';
  for (const impression of impressions.sort()) {
    if (impression === lastImpression) {
      continue;
    }
    while (!impression.startsWith(lastImpression)) {
      lastImpression = lastImpression.substr(0, lastImpression.lastIndexOf(' > '));
    }
    result.push(' '.repeat(lastImpression.length) + impression.substr(lastImpression.length));
    lastImpression = impression;
  }
  return result.join('\n');
}

// Verifies that VE events contains all the expected events in given order.
// Unexpected VE events are ignored.
export async function expectVeEvents(expectedEvents: TestLogEntry[]): Promise<void> {
  // console.error('expectVeEvents 0', typeof expectedEvents);
  if (pendingExpectedEvents) {
    throw new Error('Already await for VE events');
  }
  // console.error('expectVeEvents 1');
  pendingExpectedEvents = expectedEvents;
  pendingExpectVeEventsResult = Platform.PromiseUtilities.promiseWithResolvers<void>();
  // console.error('expectVeEvents 2');
  checkVeEvents(pendingExpectedEvents);
  // console.error('expectVeEvents 3');
  pendingRejectionTimeout = setTimeout(() => {
    if (missingExpectedEvents) {
      const actualEventsString = (veDebugEventsLog as TestLogEntry[])
                                     .map(e => 'interaction' in e ? e.interaction : formatImpressions(e.impressions))
                                     .join('\n');
      pendingExpectVeEventsResult.reject(new Error(
          'Missing VE Events: ' +
          missingExpectedEvents.map(e => 'interaction' in e ? e.interaction : formatImpressions(e.impressions))
              .join('\n') +
          '\nActual events:\n' + actualEventsString));
    }
  }, 5000);
  // console.error('expectVeEvents 4');
  return pendingExpectVeEventsResult.promise;
}

function checkVeEvents(expectedEvents: TestLogEntry[]): void {
  // console.error('checkVeEvents 0' , typeof expectedEvents);
  const actualEvents = [...veDebugEventsLog] as TestLogEntry[];
  // const actualEventsString =
  //     actualEvents.map(e => 'interaction' in e ? e.interaction : formatImpressions(e.impressions)).join('\n');
  const unmatchedEvents: TestLogEntry[] = [];
  for (let i = 0; i < expectedEvents.length; ++i) {
    // console.error('checkVeEvents 1');
    const expectedEvent = expectedEvents[i];
    while (true) {
      // console.error('checkVeEvents 2');
      if (actualEvents.length <= i) {
        missingExpectedEvents = expectedEvents.slice(i);
        return;
      }
      // console.error('checkVeEvents 3');
      const error = compareVeEvents(actualEvents[i], expectedEvent);
      if (error.difference) {
        unmatchedEvents.push(actualEvents[i]);
        actualEvents.splice(i, 1);
      } else {
        break;
      }
    }
  }
  // console.error('checkVeEvents 4');
  // veDebugEventsLog.splice(0, Infinity, ...unmatchedEvents);
  pendingExpectedEvents = null;
  if (pendingRejectionTimeout) {
    clearTimeout(pendingRejectionTimeout);
    pendingRejectionTimeout = null;
  }
  pendingExpectVeEventsResult.resolve();
}

//
// Computes the Levenshtein edit distance between two strings.
function editDistance(a: string, b: string): number {
  const v0: number[] = [];
  const v1: number[] = [];
  if (a === b) {
    return 0;
  }
  if (!a.length || !b.length) {
    return Math.max(a.length, b.length);
  }
  for (let i = 0; i < b.length + 1; i++) {
    v0[i] = i;
  }
  for (let i = 0; i < a.length; i++) {
    v1[0] = i + 1;
    for (let j = 0; j < b.length; j++) {
      const cost = Number(a[i] !== b[j]);
      v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
    }
    for (let j = 0; j < v0.length; j++) {
      v0[j] = v1[j];
    }
  }
  return v1[b.length];
}

// @ts-ignore
globalThis.setVeDebugLoggingEnabled = setVeDebugLoggingEnabled;
// @ts-ignore
globalThis.veDebugEventsLog = veDebugEventsLog;
// @ts-ignore
globalThis.findVeDebugImpression = findVeDebugImpression;
// @ts-ignore
globalThis.exportAdHocAnalysisLogForSql = exportAdHocAnalysisLogForSql;
// @ts-ignore
globalThis.buildStateFlow = buildStateFlow;
// @ts-ignore
globalThis.getVeDebugEventsLog = getVeDebugEventsLog;
// @ts-ignore
globalThis.expectVeEvents = expectVeEvents;
