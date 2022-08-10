// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as Coordinator from '../../../../../../front_end/ui/components/render_coordinator/render_coordinator.js';
import * as SourcesComponents from '../../../../../../front_end/panels/sources/components/components.js';
import * as Platform from '../../../../../../front_end/core/platform/platform.js';
import * as Common from '../../../../../../front_end/core/common/common.js';
import { assertElement, assertElements, assertShadowRoot, renderElementIntoDOM, getEventPromise } from '../../../helpers/DOMHelpers.js';
import { BreakpointStatus } from '../../../../../../front_end/panels/sources/components/BreakpointView.js';
import {assertNotNullOrUndefined} from '../../../../../../front_end/core/platform/platform.js';

const coordinator = Coordinator.RenderCoordinator.RenderCoordinator.instance();
const CODE_SNIPPET_SELECTOR = '.code-snippet';
const GROUP_NAME_SELECTOR = '[data-group-name]'
const BREAKPOINT_ITEM_SELECTOR = '.breakpoint-item';

async function renderBreakpointView() {
  const component = new SourcesComponents.BreakpointView.BreakpointView();
  renderElementIntoDOM(component);
  
  const data = {
    groups: [
      {
        url: 'https://google.com/test1.js' as Platform.DevToolsPath.UrlString,
        expanded: true,
        breakpointEntries: [
          {
            location: '234', 
            codeSnippet: 'const a = x;', 
            isHit: false, 
            status: SourcesComponents.BreakpointView.BreakpointStatus.ENABLED
          },
          {
            location: '3:3', 
            codeSnippet: 'if (x > a) {', 
            isHit: true, 
            status: SourcesComponents.BreakpointView.BreakpointStatus.DISABLED
          }
        ]
      },
      {
        url: 'https://test.com/main.js' as Platform.DevToolsPath.UrlString,
        expanded: false,
        breakpointEntries: [
          {
            location: '3', 
            codeSnippet: 'if (a == 0) {', 
            isHit: false, 
            status: SourcesComponents.BreakpointView.BreakpointStatus.ENABLED
          }
        ]
      }
    ]
  };
  component.data = data;
  await coordinator.done();
  return {component, data}
}

describe('BreakpointView', () => {
  it.only('renders breakpoint groups as opened only if expanded is set to true', async () => {
    const {component, data} = await renderBreakpointView();
    const shadowRoot = component.shadowRoot;
    assertShadowRoot(shadowRoot);
    
    const details = shadowRoot.querySelectorAll('details');
    assertElements(details, HTMLDetailsElement);
    const expandedExpected = data.groups.flatMap(group => group.expanded);
    const expandedActual = [];
    for (const detail of details.values()) {
      expandedActual.push(detail.open);
    }
    assert.deepEqual(expandedActual, expandedExpected);
  })

  it.only('renders the filenames as group names', async () => {
    const {component, data} = await renderBreakpointView();
    const shadowRoot = component.shadowRoot;
    assertShadowRoot(shadowRoot);
    
    const groupNameElements = shadowRoot.querySelectorAll(GROUP_NAME_SELECTOR);
    assertElements(groupNameElements, HTMLSpanElement);
    const urlExpected = data.groups.flatMap(group => Common.ParsedURL.ParsedURL.extractName(group.url));
    const urlActual = [];
    for (const urlElement of groupNameElements.values()) {
      urlActual.push(urlElement.textContent);
    }
    assert.deepEqual(urlActual, urlExpected);
  })

  it.only('renders the breakpoints with their checkboxes', async () => {
    const {component, data} = await renderBreakpointView();
    const shadowRoot = component.shadowRoot;
    assertShadowRoot(shadowRoot);

    const items = shadowRoot.querySelectorAll(BREAKPOINT_ITEM_SELECTOR);
    assertElements(items, HTMLDivElement);

    const breakpointEntries = data.groups.flatMap(group => group.breakpointEntries);
    assert.lengthOf(breakpointEntries, items.length);

    const itemValues = Array.from(items.values());
    for (let i = 0; i < items.length; ++i) {
      const entry = breakpointEntries[i];
      const item = itemValues[i];

      const inputElement = item.querySelector('input');
      assertNotNullOrUndefined(inputElement);
      checkCheckboxState(inputElement, entry);
    }
  })

  it.only('renders the breakpoints with their code snippet', async () => {
    const {component, data} = await renderBreakpointView();
    const shadowRoot = component.shadowRoot;
    assertShadowRoot(shadowRoot);

    const items = shadowRoot.querySelectorAll(BREAKPOINT_ITEM_SELECTOR);
    assertElements(items, HTMLDivElement);

    const breakpointEntries = data.groups.flatMap(group => group.breakpointEntries);

    assert.lengthOf(breakpointEntries, items.length);
    const itemValues = Array.from(items.values());
    for (let i = 0; i < items.length; ++i) {
      const entry = breakpointEntries[i];
      const item = itemValues[i];
      checkCodeSnippet(item, entry);
    }
  })

  it.only('triggers an event on clicking the checkbox of a breakpoint', async () => {
    const {component, data} = await renderBreakpointView();
    const shadowRoot = component.shadowRoot;
    assertShadowRoot(shadowRoot);
    
    const checkbox = shadowRoot.querySelector('input');
    assertElement(checkbox, HTMLInputElement);
    const checked = checkbox.checked;

    const eventPromise = getEventPromise<SourcesComponents.BreakpointView.CheckboxToggledEvent>(component, SourcesComponents.BreakpointView.CheckboxToggledEvent.eventName);
    checkbox.click();
    const event = await eventPromise;
    assert.strictEqual(event.data.checked, !checked);
    assert.deepEqual(event.data.item, data.groups[0].breakpointEntries[0]);
  })

  it.only('triggers an event on clicking on the snippet text', async () => {
    const {component, data} = await renderBreakpointView();
    const shadowRoot = component.shadowRoot;
    assertShadowRoot(shadowRoot);
    
    const snippet = shadowRoot.querySelector(CODE_SNIPPET_SELECTOR);
    assertElement(snippet, HTMLSpanElement);

    const eventPromise = getEventPromise<SourcesComponents.BreakpointView.BreakpointSelectedEvent>(component, SourcesComponents.BreakpointView.BreakpointSelectedEvent.eventName);
    snippet.click();
    const event = await eventPromise;
    assert.deepEqual(event.data.item, data.groups[0].breakpointEntries[0]);
  })

  it.only('triggers an event on expanding/unexpanding', async () => {
    const {component, data} = await renderBreakpointView();
    const shadowRoot = component.shadowRoot;
    assertShadowRoot(shadowRoot);
    
    const groupNameElement = shadowRoot.querySelector(GROUP_NAME_SELECTOR);
    assertElement(groupNameElement, HTMLSpanElement);

    const eventPromise = getEventPromise<SourcesComponents.BreakpointView.ExpandedStateChangedEvent>(component, SourcesComponents.BreakpointView.ExpandedStateChangedEvent.eventName);
    groupNameElement.click();
    const event = await eventPromise;
    assert.deepEqual(event.data.url, data.groups[0].url);
    assert.notStrictEqual(event.data.expanded, data.groups[0].expanded);
  })
});

function checkCodeSnippet(renderedItem: HTMLDivElement, bpItem: SourcesComponents.BreakpointView.BreakpointItem) {
  const snippetElement = renderedItem.querySelector(CODE_SNIPPET_SELECTOR);
  assertNotNullOrUndefined(snippetElement);
  assertNotNullOrUndefined(snippetElement.textContent);
  assert.strictEqual(snippetElement.textContent, bpItem.codeSnippet);
}

function checkCheckboxState(inputElement: HTMLInputElement | null, entry: SourcesComponents.BreakpointView.BreakpointItem) {
  assertElement(inputElement, HTMLInputElement);
  const checked = inputElement.checked;
  const indeterminate = inputElement.indeterminate;
  if (entry.status === SourcesComponents.BreakpointView.BreakpointStatus.INDETERMINATE) {
    assert.isTrue(indeterminate);
  } else {
    assert.isFalse(indeterminate);
    assert.strictEqual((entry.status === BreakpointStatus.ENABLED), checked);
  }
}
