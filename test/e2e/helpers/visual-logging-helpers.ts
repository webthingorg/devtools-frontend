// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert, AssertionError, config} from 'chai';
import {getBrowserAndPages} from '../../conductor/puppeteer-state.js';
import {renderCoordinatorQueueEmpty} from '../../shared/helper.js';

config.truncateThreshold = 0;

export type VeEvent = {
  event: string;
  ve?: string;
  context?: string;
  children?: VeEvent[];
  optional?: boolean;
  veid?: number;
  parent?:number;
  path?:string;
};

function joinPath(path:string|undefined, key:string ) {
  return path ? path + ' > ' + key : key;
}

export function cleanVeEvents(entries: VeEvent[], events: VeEvent[], path = '', veidToPath = new Map<number, string>) {
  for (const entry of entries) {
    if (entry.event === 'Impression') {
      if (entry.ve && entry.veid) {
        const result: VeEvent = {event: 'Impression', ve: entry.ve};
        if (entry.context) {
          result.context = entry.context;
        }
        // let effectivePath = path;
        // if (!effectivePath.length && entry.parent) {
        //   effectivePath = veidToPath.get(entry.parent) || '';
        //   result.path = effectivePath;
        // }
        const key = veEventKey(result, path || veidToPath.get(entry.parent || 0));
        veidToPath.set(entry.veid, key);
        if (entry.children) {
          result.children = [];
          cleanVeEvents(entry.children, result.children, key, veidToPath);
        }
        events.push(result);
      } else if (entry.children) {
        const result: VeEvent = {event: 'Impression', children: []};
        result.children = [];
        events.push(result);
        cleanVeEvents(entry.children, result.children, path, veidToPath);
      }
    }
    else if (['Click', 'Change'].includes(entry.event) && entry.veid) {
      const result: VeEvent = {event: entry.event, ve: veidToPath.get(entry.veid) as string};
      if (entry.context) {
        result.context = entry.context;
      }
      events.push(result);
    }
  }
}

function serializeVeEvent(entry: VeEvent): string {
  const params = [`'${entry.ve}'`];
  if (entry.context && entry.event === 'Impression') {
    params.push(`'${entry.context}'`);
  }
  if (entry.children) {
    if (params.length < 2) {
      params.push('undefined');
    }
    params.push(`[${entry.children.map(e => serializeVeEvent(e)).sort().join(', ')}]`);

  }
  return `ve${entry.event}(${params.join(', ')})`;
}

function veEventKey(e: VeEvent, path?: string): string {
  // console.error('veEventKey 1', JSON.stringify(e));
  if (e.event === 'Impression') {
    if (!e.ve) {
      return 'GROUP';
    }
  // console.error('veEventKey 2');
    path ||= e.path;
  // console.error('veEventKey 3');
    return (e.optional ? '?' : '') + joinPath(path, e.ve + (e.context ? ': ' + e.context : ''));
  }
  // console.error('veEventKey 4');
  return e.event + ': ' + e.ve;
}

function collectAllKeys (events: VeEvent[], output: Map<string, boolean>, path?: string)  {
  for (const event of events) {
    const key = veEventKey(event, path);
    output.set(key, Boolean(event.optional));
    if (event.children) {
      collectAllKeys(event.children, output, key);
    }
  }
}

type TestLogEntry = {
  impressions: string[]
}|{
  interaction: string
};

function editDistance(a:string, b:string) {
  const v0:number[] = [];
  const v1:number[] = [];

  if (a == b) {
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
      const cost = Number(a[i] != b[j]);
      v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
    }

    for (let j = 0; j < v0.length; j++) {
      v0[j] = v1[j];
    }
  }

  return v1[b.length];
};

const formatKeys = (keys: string[]) => {
  const result: string[] = [];
  let lastKey = '';
  for (const key of keys.sort()) {
    // result.push(key);
    while (!key.startsWith(lastKey)) {
      lastKey = lastKey.substr(0, lastKey.lastIndexOf(' > '));
    }
    result.push(' '.repeat(lastKey.length) + key.substr(lastKey.length));
    lastKey = key;
  }
  return result.join('\n');
};

function compareVeEvents(actual: TestLogEntry, expected: TestLogEntry): {difference: number, description?: string} {
  if ('interaction' in expected && 'interaction' in actual) {
    if (expected.interaction !== actual.interaction) {
      return {
        difference: editDistance(expected.interaction, actual.interaction) /
            Math.max(expected.interaction.length, actual.interaction.length),
        description: `Missing VE interaction: ${expected.interaction}, got: ${actual.interaction}`
      };
    }
    return {difference: 0};
  } else if ('impressions' in expected && 'impressions' in actual) {
    const actualSet = new Set(actual.impressions);
    const expectedSet = new Set(actual.impressions);
    const missing = [...expectedSet.values()].filter(k => !actualSet.has(k));

    if (missing.length) {
      return {
        difference: missing.length / expected.impressions.length,
        description: 'Missing VE events:\n' + formatKeys(missing)
      };
    }
    return {difference: 0};
  } else {
    return {difference: 1};
  }
}

function compareVeEvents_3(actual: VeEvent, expected: VeEvent): string|undefined {
  // console.error('compareVeEvents 1');
  const expectedKey = veEventKey(expected);
  // console.error('compareVeEvents 2');
  const actualKey = veEventKey(actual);
  // console.error('compareVeEvents 3');
  if (!expectedKey.startsWith(actualKey)) {
    return 'Missing VE event: \n' + expectedKey;
  }
  // console.error('compareVeEvents 4');
  const actualKeys = new Map<string, boolean>();
  collectAllKeys(actual.children || [], actualKeys, actualKey);
  // console.error('compareVeEvents 5');
  const expectedKeys = new Map<string, boolean>();
  collectAllKeys(expected.children || [], expectedKeys, expectedKey);
  const missingKeys = [...expectedKeys.keys()].filter(k => k[0] !== '?' && !actualKeys.has(k));
  // console.error('compareVeEvents 6');
  const unexpectedKeys = [...actualKeys.keys()].filter(k => k.startsWith(expectedKey) && !expectedKeys.has(k) && ![...expectedKeys.keys()].some(ek => ('?' + k).startsWith(ek)));

  // console.error('compareVeEvents 7');
  const formatKeys = (keys:string[]) => {
    const result:string[] = [];
    let lastKey = '';
    for (const key of keys.sort()) {
      result.push(key);
      // while (!key.startsWith(lastKey)) {
      //   lastKey = lastKey.substr(0, lastKey.lastIndexOf(' > '));
      // }
      // result.push(' '.repeat(lastKey.length) + key.substr(lastKey.length));
      // lastKey = key;
    }
    return result.join('\n');
  };
  // console.error('compareVeEvents 8');

  // if (unexpectedKeys.length) {
  //   if (!missingKeys.length) {
  //     return '\nUnexpected VE events:' + '\n' + formatKeys(unexpectedKeys) + '\n' + 'Expected:\n' + formatKeys([...expectedKeys.keys()]);
  //   }
  //   return '\nUnexpected VE events:' + '\n' + formatKeys(unexpectedKeys) + (missingKeys.length ? '\n\nMissing:\n' + formatKeys(missingKeys): '') + '\nActual:\n' + formatKeys([...actualKeys.keys()]);
  // }
  // console.error('compareVeEvents 9');
  if (missingKeys.length) {
    return '\nMissing VE events:' + '\n' + formatKeys(missingKeys); // + '\n' + 'Actual events: \n' + JSON.stringify(actual) + formatKeys([...actualKeys.keys()]) ;
  }
  // console.error('compareVeEvents 10');
  return undefined;
}

function compareVeEvents_2(actual: VeEvent[], expected: VeEvent[]): string|undefined {
  const actualKeys = new Map<string, boolean>();
  collectAllKeys(actual, actualKeys);
  const expectedKeys = new Map<string, boolean>();
  collectAllKeys(expected, expectedKeys);
  const missingKeys = [...expectedKeys.keys()].filter(k => !actualKeys.get(k));
  const unexpectedKeys = [...actualKeys.keys()].filter(k => !expectedKeys.has(k) && !expectedKeys.has('?' + k));

  const formatKeys = (keys:string[]) => {
    const result:string[] = [];
    let lastKey = '';
    for (const key of keys.sort()) {
      while (!key.startsWith(lastKey)) {
        lastKey = lastKey.substr(0, lastKey.lastIndexOf(' > '));
      }
      result.push(' '.repeat(lastKey.length) + key.substr(lastKey.length));
      lastKey = key;
    }
    return result.join('\n');
  };

  if (unexpectedKeys.length) {
    if (!missingKeys.length) {
      return '\nUnexpected VE events:' + '\n' + formatKeys(unexpectedKeys) + '\n';
    }
    return '\nUnexpected VE events:' + '\n' + formatKeys(unexpectedKeys) + (missingKeys.length ? '\n\nMissing\n:' + formatKeys(missingKeys): '') + '\n';
  }
  if (missingKeys.length) {
    return '\nMissing VE events:' + '\n' + formatKeys(missingKeys) + '\n';
  }
  return undefined;
}

function compareVeEvents_(actual: VeEvent[], expected: VeEvent[], path = ''): string|undefined {
  const children = (e?: VeEvent) => e?.children || [];
  const keyedActual =
      new Map(actual.map(e => [veEventKey(e), e] as const).sort((e1, e2) => children(e1[1]).length - children(e2[1]).length));
  const keyedExpected = new Map(expected.map(e => [veEventKey(e), e]));
  const missingKeys = [...keyedExpected.keys()].filter(k => !keyedActual.has(k) && !keyedExpected.get(k)?.optional);
  const unexpectedKeys = [...keyedActual.keys()].filter(k => !keyedExpected.has(k));
  if (unexpectedKeys.length) {
    if (!missingKeys.length) {
      return '\nUnexpected VE events at ' + path + '\n' + unexpectedKeys.join('\n') + '\n';
    }
    return '\nUnexpected VE events at ' + path + '\n' + unexpectedKeys.join('\n') + (missingKeys.length ? '\n\nMissing\n:' + missingKeys.join('\n'): '') + '\n';
  }
  if (missingKeys.length) {
    return '\nMissing VE events at ' + path + '\n' + missingKeys.join('\n') + '\n';
  }

  for (const [key, expectedEvent] of keyedExpected.entries()) {
    if (expectedEvent.optional) {
      continue;
    }
    const result =
        compareVeEvents_(children(keyedActual.get(key)), children(expectedEvent), path ? path + ' > ' + key : key);
    if (result) {
      return result;
    }
  }

  return undefined;
}

export function veClick(ve: string): TestLogEntry {
  return {interaction: `Click: ${ve}`};
}

export function veChange(ve: string): TestLogEntry {
  return {interaction: `Change: ${ve}`};
}

export function veImpression(ve: string, context?: string, childrenOrOptions?: {impressions: string[]}[]|{optional?:boolean}): {impressions: string[]} {
  let key = ve;
  if (context) {
    key += ': ' + context;
  }
  const result = {impressions: [key]};
  if (childrenOrOptions instanceof Array) {
    for (const child of childrenOrOptions) {
      for (const impression of child.impressions) {
        result.impressions.push(key + ' > ' + impression);
      }
    }
  } else if (childrenOrOptions?.optional){
    // result.optional = true;
  }
  return result;
}

function veImpressionForTabHeader(panel: string, options?: {closable: boolean}) {
  if (options?.closable) {
    return veImpression('PanelTabHeader', panel, [veImpression('Close')]);
  }
  return veImpression('PanelTabHeader', panel);
}

export function veImpressionForMainToolbar(options?: {
  selectedPanel?: string,
  expectClosedPanels?: string[],
  dockable? : boolean,
}) {
  const regularPanels =
      ['elements', 'console', 'sources', 'network', 'timeline', 'heap-profiler']
  if (!options?.dockable) {
    regularPanels.push('resources', 'lighthouse');
  }

  const closablePanels = options?.dockable ? [] : ['security', 'chrome-recorder'].filter(p => !options?.expectClosedPanels?.includes(p));
  if (options?.selectedPanel && !regularPanels.includes(options?.selectedPanel)) {
    closablePanels.push(options.selectedPanel);
  }

  const dockableItems = options?.dockable ? [
    veImpression('DropDown', 'more-tabs'),
    veImpression('Toggle', 'emulation.toggle-device-mode'),
    veImpression('Close'),
  ]: [];

  return veImpression('Toolbar', 'main', [
    ...regularPanels.map(panel => veImpressionForTabHeader(panel)),
    ...closablePanels.map(panel => veImpressionForTabHeader(panel, {closable: true})),
    veImpression('Toggle', 'elements.toggle-element-search'),
    veImpression('Action', 'settings.show'),
    veImpression('DropDown', 'main-menu'),
    veImpression('Counter', 'issue', {optional: true}),
    veImpression('Counter', 'console', {optional: true}),
    ...dockableItems
  ]);
}

export function veImpressionForElementsPanel(options?: {dockable?: boolean}) {
  return veImpression('Panel', 'elements', [
    veImpression('Toolbar', 'sidebar', [
      veImpression('DropDown', 'more-tabs'),
      veImpressionForTabHeader('styles'),
      veImpressionForTabHeader('computed'),
      veImpressionForTabHeader('elements.layout'),
      veImpressionForTabHeader('elements.event-listeners'),
      ...(options?.dockable ? ['elements.dom-breakpoints', 'elements.dom-properties'] : []).map(panel => veImpressionForTabHeader(panel)),
    ]),
    veImpression('ElementsBreadcrumbs', undefined, [veImpression('Item'), veImpression('Item')]),
    veImpression('Tree', 'elements', [
      veImpression('TreeItem'),
      veImpression('TreeItem', undefined, [veImpression('Value', 'tag-name'), veImpression('Expand')]),
      veImpression('TreeItem', undefined, [veImpression('Value', 'tag-name')]),
      veImpression('TreeItem', undefined, [veImpression('Value', 'tag-name')]),
      veImpression('TreeItem', undefined, [veImpression('Value', 'tag-name', {optional: true}), veImpression('Expand', undefined, {optional: true})]),
    ]),
    veImpression('Pane', 'styles', [
      veImpression('Section', 'style-properties', [veImpression('CSSRuleHeader', 'selector')]),
      veImpression('Section', 'style-properties', [
        veImpression('Action', 'elements.new-style-rule'),
        veImpression('CSSRuleHeader', 'selector'),
        veImpression('Tree', undefined, [
          veImpression('TreeItem', 'display', [veImpression('Toggle'), veImpression('Key'), veImpression('Value')]),
          veImpression('TreeItem', 'margin', [
            veImpression('Toggle'),
            veImpression('Key'),
            veImpression('Expand'),
            veImpression('Value'),
            veImpression('Expand'),
          ]),
        ]),
      ]),
      veImpression('ToggleSubpane', 'element-states'),
      veImpression('ToggleSubpane', 'elements-classes'),
      veImpression('Action', 'elements.new-style-rule'),
      veImpression('DropDown', 'rendering-emulations'),
      veImpression('ToggleSubpane', 'computed-styles'),
      veImpression('TextField'),
    ]),
  ]);
}

export function veImpressionForDrawerToolbar(options?: {
  selectedPanel?: string,
}) {
  const closeablePanels = options?.selectedPanel ? [options?.selectedPanel] : [];
  return veImpression('Toolbar', 'drawer', [
    veImpressionForTabHeader('console'),
    ...closeablePanels.map(panel => veImpressionForTabHeader(panel, {closable: true})),
    veImpression('DropDown', 'more-tabs'),
    veImpression('Close'),
  ]);
}

<<<<<<< HEAD
export async function expectVeImpressions(expectedImpressions: string[]) {
  const {frontend} = getBrowserAndPages();
  const actualEvents =
      // @ts-ignore
      await frontend.evaluate(async () => (await globalThis.getVeDebugEventsLog()) as unknown as TestLogEntry[]);
  const actualImpressionEvent = actualEvents.findLast(event => 'impressions' in event);
  const actualImpressions =
      actualImpressionEvent && 'impressions' in actualImpressionEvent ? actualImpressionEvent.impressions : null;
  if (!actualImpressions) {
    assert.fail('Missing VE impressions:\n' + formatImpressions(expectedImpressions));
  }

  const {match, description} = compareVeImpressions(actualImpressions, expectedImpressions);
  assert.isTrue(
      match,
      description + '\nAll VE Events:\n' +
          actualEvents.map(e => 'impressions' in e ? formatImpressions(e.impressions) : e.interaction).join('\n\n'));
}

export async function expectVeEvents(events: VeEvent[]) {
=======
function traversePath(event: VeEvent, path: string):VeEvent|undefined {
  // console.error('traversePath(', path, ')');
  // if (path === 'Panel: console > Item: console-message') 
  // console.error('traversePath(', JSON.stringify(event), ', ', path, ')');
  const key = veEventKey(event);
  if (!path.startsWith(key)) {
    // if (path === 'Panel: console > Item: console-message') 
    // console.error('!path.startsWith(key)');
    return undefined;
  }
  path = path.substr(key.length + ' > '.length);
  if (!path.length) {
    // if (path === 'Panel: console > Item: console-message') 
    // console.error('!path');
    return event;
  }
  for (const child of event.children || []) {
    const result = traversePath(child, path);
    if (result) {
      // if (path === 'Panel: console > Item: console-message') 
      // console.error('return result');
      return result;
    }
  }
  // if (path === 'Panel: console > Item: console-message') 
  // console.error('return undefined');
  return undefined;
}

export async function expectVeEvents(expectedEvents: TestLogEntry[]) {
  // console.error('expectVeEvents: ', JSON.stringify(expectedEvents));
    let group:{impressions:string[]}|null = null;
    for (let i = 0; i < expectedEvents.length; ++i) {
      const expectedEvent = expectedEvents[i];
      if ('interaction' in expectedEvent) {
        // console.error('see interaction ', i);
        group = null;
      }

      if ('impressions' in expectedEvent) {
        // console.error('see impressions ', i);
        if (!group) {
          group = expectedEvent;
          // console.error('defined the group');
        } else {
          group.impressions.push(...expectedEvent.impressions);
          expectedEvents.splice(i, 1);
          --i;
          // console.error('appended to the group ', JSON.stringify(expectedEvents));
        }
      }
    }

  // console.error('expectVeEvents 1');
>>>>>>> 85f9fa9e93 (Everything working)
  await renderCoordinatorQueueEmpty();
  // console.error('expectVeEvents 2');

  const {frontend} = getBrowserAndPages();
  // const actualEvents: TestLogEntry[] = [];
  // console.error('expectVeEvents 3');
  // @ts-ignore
  const actualEvents = await frontend.evaluate(async () => (await globalThis.getVeDebugEventsLog()) as unknown as TestLogEntry[]);
  const originalActualEvents = JSON.stringify(actualEvents);
  // console.error(JSON.stringify(actual));
  // console.error('expectVeEvents 4');
  // cleanVeEvents(rawEvents, actualEvents);
  // console.error(veEvents.map(serializeVeEvent).join('\n\n'));
  // console.error('expectVeEvents ', JSON.stringify(expectedEvents), ' actual ', JSON.stringify(actualEvents));
  let bestError: {difference: number, description?: string}|null = null;
  for (let i = 0; i < expectedEvents.length; ++i) {
    const expectedEvent = expectedEvents[i];
    // const expectedKey = veEventKey(expectedEvents[i]);
    // console.error('Expected: ', JSON.stringify(expectedEvent));
    while (true) {
      if (actualEvents.length <= i) {
        bestError ||= {
          difference: 1,
          description: 'interaction' in expectedEvent ?
              'Missing VE interaction:\n' + expectedEvent.interaction :
              'Missing VE impressions:\n' + formatKeys(expectedEvent.impressions)
        };
        // console.error('expectVeEvents 5.5');
        assert.fail( bestError.description);
        // assert.fail(JSON.stringify(bestError) +  bestError.description + '\nActual VE events: \n' + originalActualEvents);
  // console.error('expectVeEvents 6');
      }
      // console.error('Actual: ', JSON.stringify(actualEvents[i]));
  // console.error('expectVeEvents 7', JSON.stringify(actualEvents));
      const error = compareVeEvents(actualEvents[i], expectedEvent);
      // console.error('expectVeEvents 8');
      if (error.difference) {
        // console.error('No match');
      // if (expectedKey.startsWith(veEventKey(actualEvents[i]))) {
      //     console.error(error);
      //   }
        actualEvents.splice(i, 1);
        if (error.difference <= (bestError?.difference || 1)) {
          bestError = error;
        }
      } else {
        // console.error('match');
        break;
      }
  // console.error('expectVeEvents 9');
    }
  }
  // console.error(JSON.stringify(veEvents));
  // if(actualevents.length > expectedevents.length) {
  //   actualevents.length = expectedevents.length;
  // }
  // console.error('Actual events:', JSON.stringify(actualEvents));
  // console.error('Expected events:', JSON.stringify(expectedEvents));
  // const mismatch = compareVeEvents(actualEvents, expectedEvents);
  // if (mismatch) {
    // await new Promise(resolve=>{});
  // }
  // if (mismatch) {
  //   console.error(JSON.stringify(rawEvents));
  // }
  // assert.notExists(mismatch, mismatch);
  // assert.deepStrictEqual(veEvents, events, JSON.stringify(veEvents) + '\nvs\n' + JSON.stringify(events));
  // console.error('expectVeEvents 10');
}
