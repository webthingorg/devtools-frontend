// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as SourcesComponents from '../../../../../../front_end/panels/sources/components/components.js';
import * as Coordinator from '../../../../../../front_end/ui/components/render_coordinator/render_coordinator.js';
import type * as Platform from '../../../../../../front_end/core/platform/platform.js';

import {
  assertElement,
  assertElements,
  assertShadowRoot,
  renderElementIntoDOM,
  getEventPromise,
} from '../../../helpers/DOMHelpers.js';
import {describeWithEnvironment} from '../../../helpers/EnvironmentHelpers.js';
import {assertNotNullOrUndefined} from '../../../../../../front_end/core/platform/platform.js';
import * as TwoStatesCounter from '../../../../../../front_end/ui/components/two_states_counter/two_states_counter.js';

const EXPANDED_GROUPS_SELECTOR = 'details[open]';
const COLLAPSED_GROUPS_SELECTOR = 'details:not([open])';
const CODE_SNIPPET_SELECTOR = '.code-snippet';
const GROUP_NAME_SELECTOR = '.group-header-title';
const BREAKPOINT_ITEM_SELECTOR = '.breakpoint-item';
const HIT_BREAKPOINT_SELECTOR = BREAKPOINT_ITEM_SELECTOR + '.hit';
const BREAKPOINT_LOCATION_SELECTOR = '.location';
const REMOVE_FILE_BREAKPOINTS_SELECTOR = '.group-hover-actions > .remove-breakpoint-button';
const REMOVE_SINGLE_BREAKPOINT_SELECTOR = '.breakpoint-item-location-or-actions > .remove-breakpoint-button';
const EDIT_SINGLE_BREAKPOINT_SELECTOR = '.edit-breakpoint-button';
const PAUSE_ON_EXCEPTIONS_SELECTOR = '.pause-on-exceptions';
const PAUSE_ON_CAUGHT_EXCEPTIONS_SELECTOR = '.pause-on-caught-exceptions';

const coordinator = Coordinator.RenderCoordinator.RenderCoordinator.instance();

async function renderNoBreakpoints(
    {pauseOnExceptions, pauseOnCaughtExceptions}: {pauseOnExceptions: boolean, pauseOnCaughtExceptions: boolean}):
    Promise<SourcesComponents.BreakpointsView.BreakpointsView> {
  const component = new SourcesComponents.BreakpointsView.BreakpointsView();
  renderElementIntoDOM(component);

  component.data = {
    breakpointsActive: true,
    pauseOnExceptions,
    pauseOnCaughtExceptions,
    groups: [],
  };
  await coordinator.done();
  return component;
}

async function renderSingleBreakpoint(
    type: SourcesComponents.BreakpointsView.BreakpointType =
        SourcesComponents.BreakpointsView.BreakpointType.REGULAR_BREAKPOINT,
    hoverText?: string): Promise<{
  component: SourcesComponents.BreakpointsView.BreakpointsView,
  data: SourcesComponents.BreakpointsView.BreakpointsViewData,
}> {
  // Only provide a hover text if it's not a regular breakpoint.
  assert.isTrue(!hoverText || type !== SourcesComponents.BreakpointsView.BreakpointType.REGULAR_BREAKPOINT);
  const component = new SourcesComponents.BreakpointsView.BreakpointsView();
  renderElementIntoDOM(component);

  const data: SourcesComponents.BreakpointsView.BreakpointsViewData = {
    breakpointsActive: true,
    pauseOnExceptions: false,
    pauseOnCaughtExceptions: false,
    groups: [
      {
        name: 'test1.js',
        url: 'https://google.com/test1.js' as Platform.DevToolsPath.UrlString,
        editable: true,
        expanded: true,
        breakpointItems: [
          {
            location: '1',
            codeSnippet: 'const a = 0;',
            isHit: true,
            status: SourcesComponents.BreakpointsView.BreakpointStatus.ENABLED,
            type,
            hoverText,
          },
        ],
      },
    ],
  };

  component.data = data;
  await coordinator.done();
  return {component, data};
}

async function renderMultipleBreakpoints(): Promise<{
  component: SourcesComponents.BreakpointsView.BreakpointsView,
  data: SourcesComponents.BreakpointsView.BreakpointsViewData,
}> {
  const component = new SourcesComponents.BreakpointsView.BreakpointsView();
  renderElementIntoDOM(component);

  const data: SourcesComponents.BreakpointsView.BreakpointsViewData = {
    breakpointsActive: true,
    pauseOnExceptions: false,
    pauseOnCaughtExceptions: false,
    groups: [
      {
        name: 'test1.js',
        url: 'https://google.com/test1.js' as Platform.DevToolsPath.UrlString,
        editable: true,
        expanded: true,
        breakpointItems: [
          {
            type: SourcesComponents.BreakpointsView.BreakpointType.REGULAR_BREAKPOINT,
            location: '234',
            codeSnippet: 'const a = x;',
            isHit: false,
            status: SourcesComponents.BreakpointsView.BreakpointStatus.ENABLED,
          },
          {
            type: SourcesComponents.BreakpointsView.BreakpointType.REGULAR_BREAKPOINT,
            location: '3:3',
            codeSnippet: 'if (x > a) {',
            isHit: true,
            status: SourcesComponents.BreakpointsView.BreakpointStatus.DISABLED,
          },
        ],
      },
      {
        name: 'test2.js',
        url: 'https://google.com/test2.js' as Platform.DevToolsPath.UrlString,
        editable: false,
        expanded: true,
        breakpointItems: [
          {
            type: SourcesComponents.BreakpointsView.BreakpointType.REGULAR_BREAKPOINT,
            location: '11',
            codeSnippet: 'const y;',
            isHit: false,
            status: SourcesComponents.BreakpointsView.BreakpointStatus.ENABLED,
          },
        ],
      },
      {
        name: 'main.js',
        url: 'https://test.com/main.js' as Platform.DevToolsPath.UrlString,
        editable: true,
        expanded: false,
        breakpointItems: [
          {
            type: SourcesComponents.BreakpointsView.BreakpointType.REGULAR_BREAKPOINT,
            location: '3',
            codeSnippet: 'if (a == 0) {',
            isHit: false,
            status: SourcesComponents.BreakpointsView.BreakpointStatus.ENABLED,
          },
        ],
      },
    ],
  };
  component.data = data;
  await coordinator.done();
  return {component, data};
}

function extractBreakpointItems(data: SourcesComponents.BreakpointsView.BreakpointsViewData):
    SourcesComponents.BreakpointsView.BreakpointItem[] {
  const breakpointItems = data.groups.flatMap(group => group.breakpointItems);
  assert.isAbove(breakpointItems.length, 0);
  return breakpointItems;
}

function checkCodeSnippet(
    renderedBreakpointItem: HTMLDivElement, breakpointItem: SourcesComponents.BreakpointsView.BreakpointItem): void {
  const snippetElement = renderedBreakpointItem.querySelector(CODE_SNIPPET_SELECTOR);
  assertElement(snippetElement, HTMLSpanElement);
  assert.strictEqual(snippetElement.textContent, breakpointItem.codeSnippet);
}

function checkCheckboxState(
    checkbox: HTMLInputElement, breakpointItem: SourcesComponents.BreakpointsView.BreakpointItem): void {
  const checked = checkbox.checked;
  const indeterminate = checkbox.indeterminate;
  if (breakpointItem.status === SourcesComponents.BreakpointsView.BreakpointStatus.INDETERMINATE) {
    assert.isTrue(indeterminate);
  } else {
    assert.isFalse(indeterminate);
    assert.strictEqual((breakpointItem.status === SourcesComponents.BreakpointsView.BreakpointStatus.ENABLED), checked);
  }
}

function checkGroupNames(
    renderedGroupElements: Element[], breakpointGroups: SourcesComponents.BreakpointsView.BreakpointGroup[]): void {
  assert.lengthOf(renderedGroupElements, breakpointGroups.length);
  for (let i = 0; i < renderedGroupElements.length; ++i) {
    const renderedGroup = renderedGroupElements[i];
    assertElement(renderedGroup, HTMLDetailsElement);
    const titleElement = renderedGroup.querySelector(GROUP_NAME_SELECTOR);
    assertElement(titleElement, HTMLSpanElement);
    assert.strictEqual(titleElement.textContent, breakpointGroups[i].name);
  }
}

describeWithEnvironment('BreakpointsView', () => {
  it('correctly expands breakpoint groups', async () => {
    const {component, data} = await renderMultipleBreakpoints();
    assertShadowRoot(component.shadowRoot);

    const expandedGroups = data.groups.filter(group => group.expanded);
    assert.isAbove(expandedGroups.length, 0);

    const renderedExpandedGroups = Array.from(component.shadowRoot.querySelectorAll(EXPANDED_GROUPS_SELECTOR));
    assert.lengthOf(renderedExpandedGroups, expandedGroups.length);

    checkGroupNames(renderedExpandedGroups, expandedGroups);
  });

  it('correctly collapses breakpoint groups', async () => {
    const {component, data} = await renderMultipleBreakpoints();
    assertShadowRoot(component.shadowRoot);

    const collapsedGroups = data.groups.filter(group => !group.expanded);
    assert.isAbove(collapsedGroups.length, 0);

    const renderedCollapsedGroups = Array.from(component.shadowRoot.querySelectorAll(COLLAPSED_GROUPS_SELECTOR));

    checkGroupNames(renderedCollapsedGroups, collapsedGroups);
  });

  it('renders the group names', async () => {
    const {component, data} = await renderMultipleBreakpoints();
    assertShadowRoot(component.shadowRoot);

    const renderedGroupNames = component.shadowRoot.querySelectorAll(GROUP_NAME_SELECTOR);
    assertElements(renderedGroupNames, HTMLSpanElement);

    const expectedNames = data.groups.flatMap(group => group.name);
    const actualNames = [];
    for (const renderedGroupName of renderedGroupNames.values()) {
      actualNames.push(renderedGroupName.textContent);
    }
    assert.deepEqual(actualNames, expectedNames);
  });

  it('renders the breakpoints with their checkboxes', async () => {
    const {component, data} = await renderMultipleBreakpoints();
    assertShadowRoot(component.shadowRoot);

    const renderedBreakpointItems = Array.from(component.shadowRoot.querySelectorAll(BREAKPOINT_ITEM_SELECTOR));

    const breakpointItems = extractBreakpointItems(data);
    assert.lengthOf(renderedBreakpointItems, breakpointItems.length);

    for (let i = 0; i < renderedBreakpointItems.length; ++i) {
      const renderedItem = renderedBreakpointItems[i];
      assertElement(renderedItem, HTMLDivElement);

      const inputElement = renderedItem.querySelector('input');
      assertElement(inputElement, HTMLInputElement);
      checkCheckboxState(inputElement, breakpointItems[i]);
    }
  });

  it('renders breakpoints with their code snippet', async () => {
    const {component, data} = await renderMultipleBreakpoints();
    assertShadowRoot(component.shadowRoot);

    const renderedBreakpointItems = Array.from(component.shadowRoot.querySelectorAll(BREAKPOINT_ITEM_SELECTOR));

    const breakpointItems = extractBreakpointItems(data);
    assert.lengthOf(renderedBreakpointItems, breakpointItems.length);

    for (let i = 0; i < renderedBreakpointItems.length; ++i) {
      const renderedBreakpointItem = renderedBreakpointItems[i];
      assertElement(renderedBreakpointItem, HTMLDivElement);
      checkCodeSnippet(renderedBreakpointItem, breakpointItems[i]);
    }
  });

  it('renders breakpoints with their location', async () => {
    const {component, data} = await renderMultipleBreakpoints();
    assertShadowRoot(component.shadowRoot);

    const renderedBreakpointItems = Array.from(component.shadowRoot.querySelectorAll(BREAKPOINT_ITEM_SELECTOR));

    const breakpointItems = extractBreakpointItems(data);
    assert.lengthOf(renderedBreakpointItems, breakpointItems.length);

    for (let i = 0; i < renderedBreakpointItems.length; ++i) {
      const renderedBreakpointItem = renderedBreakpointItems[i];
      assertElement(renderedBreakpointItem, HTMLDivElement);

      const locationElement = renderedBreakpointItem.querySelector(BREAKPOINT_LOCATION_SELECTOR);
      assertElement(locationElement, HTMLSpanElement);

      const actualLocation = locationElement.textContent;
      const expectedLocation = breakpointItems[i].location;

      assert.strictEqual(actualLocation, expectedLocation);
    }
  });

  it('triggers an event on clicking the checkbox of a breakpoint', async () => {
    const {component, data} = await renderSingleBreakpoint();
    assertShadowRoot(component.shadowRoot);

    const renderedItem = component.shadowRoot.querySelector(BREAKPOINT_ITEM_SELECTOR);
    assertElement(renderedItem, HTMLDivElement);

    const checkbox = renderedItem.querySelector('input');
    assertElement(checkbox, HTMLInputElement);
    const checked = checkbox.checked;

    const eventPromise = getEventPromise<SourcesComponents.BreakpointsView.CheckboxToggledEvent>(
        component, SourcesComponents.BreakpointsView.CheckboxToggledEvent.eventName);
    checkbox.click();
    const event = await eventPromise;

    assert.strictEqual(event.data.checked, !checked);
    assert.deepEqual(event.data.breakpointItem, data.groups[0].breakpointItems[0]);
  });

  it('triggers an event on clicking on the snippet text', async () => {
    const {component, data} = await renderSingleBreakpoint();
    assertShadowRoot(component.shadowRoot);

    const snippet = component.shadowRoot.querySelector(CODE_SNIPPET_SELECTOR);
    assertElement(snippet, HTMLSpanElement);

    const eventPromise = getEventPromise<SourcesComponents.BreakpointsView.BreakpointSelectedEvent>(
        component, SourcesComponents.BreakpointsView.BreakpointSelectedEvent.eventName);
    snippet.click();
    const event = await eventPromise;
    assert.deepEqual(event.data.breakpointItem, data.groups[0].breakpointItems[0]);
  });

  it('triggers an event on expanding/unexpanding', async () => {
    const {component, data} = await renderSingleBreakpoint();
    assertShadowRoot(component.shadowRoot);

    const renderedGroupName = component.shadowRoot.querySelector(GROUP_NAME_SELECTOR);
    assertElement(renderedGroupName, HTMLSpanElement);

    const expandedInitialValue = data.groups[0].expanded;

    const eventPromise = getEventPromise<SourcesComponents.BreakpointsView.ExpandedStateChangedEvent>(
        component, SourcesComponents.BreakpointsView.ExpandedStateChangedEvent.eventName);
    renderedGroupName.click();
    const event = await eventPromise;

    const group = data.groups[0];
    assert.deepEqual(event.data.url, group.url);
    assert.strictEqual(event.data.expanded, group.expanded);
    assert.notStrictEqual(event.data.expanded, expandedInitialValue);
  });

  it('highlights breakpoint if it is set to be hit', async () => {
    const {component} = await renderSingleBreakpoint();
    assertShadowRoot(component.shadowRoot);

    const renderedBreakpointItem = component.shadowRoot.querySelector(HIT_BREAKPOINT_SELECTOR);
    assertElement(renderedBreakpointItem, HTMLDivElement);
  });

  it('triggers an event on removing file breakpoints', async () => {
    const {component, data} = await renderMultipleBreakpoints();
    assertShadowRoot(component.shadowRoot);

    // Dispatch a mouse over in order to show the remove button.
    component.shadowRoot.querySelector('summary')?.dispatchEvent(new Event('mouseover'));
    // Wait until the re-rendering has happened.
    await coordinator.done();

    const removeFileBreakpointsButton = component.shadowRoot.querySelector(REMOVE_FILE_BREAKPOINTS_SELECTOR);
    assertElement(removeFileBreakpointsButton, HTMLButtonElement);

    const eventPromise = getEventPromise<SourcesComponents.BreakpointsView.BreakpointsRemovedEvent>(
        component, SourcesComponents.BreakpointsView.BreakpointsRemovedEvent.eventName);
    removeFileBreakpointsButton.click();
    const event = await eventPromise;
    assert.deepStrictEqual(event.data.breakpointItems, data.groups[0].breakpointItems);
  });

  it('triggers an event on removing one breakpoint', async () => {
    const {component, data} = await renderMultipleBreakpoints();
    assertShadowRoot(component.shadowRoot);

    // Dispatch a mouse over in order to show the remove button.
    component.shadowRoot.querySelector(BREAKPOINT_ITEM_SELECTOR)?.dispatchEvent(new Event('mouseover'));
    // Wait until the re-rendering has happened.
    await coordinator.done();

    const removeFileBreakpointsButton = component.shadowRoot.querySelector(REMOVE_SINGLE_BREAKPOINT_SELECTOR);
    assertElement(removeFileBreakpointsButton, HTMLButtonElement);

    const eventPromise = getEventPromise<SourcesComponents.BreakpointsView.BreakpointsRemovedEvent>(
        component, SourcesComponents.BreakpointsView.BreakpointsRemovedEvent.eventName);
    removeFileBreakpointsButton.click();
    const event = await eventPromise;
    assert.strictEqual(event.data.breakpointItems[0], data.groups[0].breakpointItems[0]);
  });

  it('triggers an event on editing one breakpoint', async () => {
    const {component, data} = await renderMultipleBreakpoints();
    assertShadowRoot(component.shadowRoot);

    // Dispatch a mouse over in order to show the edit button.
    component.shadowRoot.querySelector(BREAKPOINT_ITEM_SELECTOR)?.dispatchEvent(new Event('mouseover'));
    // Wait until the re-rendering has happened.
    await coordinator.done();

    const removeFileBreakpointsButton = component.shadowRoot.querySelector(EDIT_SINGLE_BREAKPOINT_SELECTOR);
    assertElement(removeFileBreakpointsButton, HTMLButtonElement);

    const eventPromise = getEventPromise<SourcesComponents.BreakpointsView.BreakpointEditedEvent>(
        component, SourcesComponents.BreakpointsView.BreakpointEditedEvent.eventName);
    removeFileBreakpointsButton.click();
    const event = await eventPromise;
    assert.strictEqual(event.data.breakpointItem, data.groups[0].breakpointItems[0]);
  });

  it('only renders edit button for breakpoints in editable groups', async () => {
    const component = new SourcesComponents.BreakpointsView.BreakpointsView();
    renderElementIntoDOM(component);

    const data: SourcesComponents.BreakpointsView.BreakpointsViewData = {
      breakpointsActive: true,
      pauseOnExceptions: false,
      pauseOnCaughtExceptions: false,
      groups: [
        {
          name: 'test1.js',
          url: 'https://google.com/test1.js' as Platform.DevToolsPath.UrlString,
          editable: false,
          expanded: true,
          breakpointItems: [
            {
              location: '1',
              codeSnippet: 'const a = 0;',
              isHit: true,
              status: SourcesComponents.BreakpointsView.BreakpointStatus.ENABLED,
              type: SourcesComponents.BreakpointsView.BreakpointType.REGULAR_BREAKPOINT,
            },
          ],
        },
      ],
    };

    component.data = data;
    await coordinator.done();
    assertShadowRoot(component.shadowRoot);

    // Dispatch a mouse over in order to show the edit button.
    component.shadowRoot.querySelector(BREAKPOINT_ITEM_SELECTOR)?.dispatchEvent(new Event('mouseover'));
    // Wait until the re-rendering has happened.
    await coordinator.done();

    const removeFileBreakpointsButton = component.shadowRoot.querySelector(EDIT_SINGLE_BREAKPOINT_SELECTOR);
    assert.isNull(removeFileBreakpointsButton);
  });

  it('renders a counter of enabled/disabled breakpoints only if breakpoint group is collapsed', async () => {
    const {component, data} = await renderMultipleBreakpoints();
    assertShadowRoot(component.shadowRoot);

    const numCollapsed =
        data.groups.reduce((previousValue: number, currentValue: SourcesComponents.BreakpointsView.BreakpointGroup) => {
          return currentValue.expanded ? previousValue : previousValue + 1;
        }, 0);
    assert.isAbove(numCollapsed, 0);
    assert.isBelow(numCollapsed, data.groups.length);

    const counters = component.shadowRoot.querySelectorAll('devtools-two-states-counter');
    assertElements(counters, TwoStatesCounter.TwoStatesCounter.TwoStatesCounter);
    const computedStyles = Array.from(counters).map(counter => window.getComputedStyle(counter));

    const visibleCounters = computedStyles.filter(style => style.display !== 'none');
    assert.lengthOf(visibleCounters, numCollapsed);
  });

  describe('conditional breakpoints', () => {
    const breakpointDetails = 'x < a';

    it('are rendered', async () => {
      const {component} = await renderSingleBreakpoint(
          SourcesComponents.BreakpointsView.BreakpointType.CONDITIONAL_BREAKPOINT, breakpointDetails);
      const breakpointItem = component.shadowRoot?.querySelector(BREAKPOINT_ITEM_SELECTOR);
      assertNotNullOrUndefined(breakpointItem);
      assertElement(breakpointItem, HTMLDivElement);
      assert.isTrue(breakpointItem.classList.contains('conditional-breakpoint'));
    });

    it('show a tooltip', async () => {
      const {component} = await renderSingleBreakpoint(
          SourcesComponents.BreakpointsView.BreakpointType.CONDITIONAL_BREAKPOINT, breakpointDetails);
      const codeSnippet = component.shadowRoot?.querySelector(CODE_SNIPPET_SELECTOR);
      assertNotNullOrUndefined(codeSnippet);
      assertElement(codeSnippet, HTMLSpanElement);
      assert.strictEqual(codeSnippet.title, `Condition: ${breakpointDetails}`);
    });
  });

  describe('logpoints', () => {
    const breakpointDetails = 'x, a';

    it('are rendered', async () => {
      const {component} =
          await renderSingleBreakpoint(SourcesComponents.BreakpointsView.BreakpointType.LOGPOINT, breakpointDetails);
      const breakpointItem = component.shadowRoot?.querySelector(BREAKPOINT_ITEM_SELECTOR);
      assertNotNullOrUndefined(breakpointItem);
      assertElement(breakpointItem, HTMLDivElement);
      assert.isTrue(breakpointItem.classList.contains('logpoint'));
    });

    it('show a tooltip', async () => {
      const {component} =
          await renderSingleBreakpoint(SourcesComponents.BreakpointsView.BreakpointType.LOGPOINT, breakpointDetails);
      const codeSnippet = component.shadowRoot?.querySelector(CODE_SNIPPET_SELECTOR);
      assertNotNullOrUndefined(codeSnippet);
      assertElement(codeSnippet, HTMLSpanElement);
      assert.strictEqual(codeSnippet.title, `Logpoint: ${breakpointDetails}`);
    });
  });

  describe('pause on exceptions', () => {
    it('state is rendered correctly when disabled', async () => {
      const component = await renderNoBreakpoints({pauseOnExceptions: false, pauseOnCaughtExceptions: false});
      assertShadowRoot(component.shadowRoot);

      const pauseOnExceptionsItem = component.shadowRoot.querySelector(PAUSE_ON_EXCEPTIONS_SELECTOR);
      assertNotNullOrUndefined(pauseOnExceptionsItem);

      const pauseOnExceptionsCheckbox = pauseOnExceptionsItem.querySelector('input');
      assertNotNullOrUndefined(pauseOnExceptionsCheckbox);
      assertElement(pauseOnExceptionsCheckbox, HTMLInputElement);
      assert.isFalse(pauseOnExceptionsCheckbox.checked);

      const pauseOnCaughtExceptionsItem = component.shadowRoot?.querySelector(PAUSE_ON_CAUGHT_EXCEPTIONS_SELECTOR);
      assert.isNull(pauseOnCaughtExceptionsItem, 'Pause on caught exception toggle should not be rendered');
    });

    it('state is rendered correctly when pausing on uncaught exceptions', async () => {
      const component = await renderNoBreakpoints({pauseOnExceptions: true, pauseOnCaughtExceptions: false});
      assertShadowRoot(component.shadowRoot);

      const pauseOnExceptionsItem = component.shadowRoot.querySelector(PAUSE_ON_EXCEPTIONS_SELECTOR);
      assertNotNullOrUndefined(pauseOnExceptionsItem);

      const pauseOnExceptionsCheckbox = pauseOnExceptionsItem.querySelector('input');
      assertNotNullOrUndefined(pauseOnExceptionsCheckbox);
      assertElement(pauseOnExceptionsCheckbox, HTMLInputElement);
      assert.isTrue(pauseOnExceptionsCheckbox.checked);

      const pauseOnCaughtExceptionsItem = component.shadowRoot?.querySelector(PAUSE_ON_CAUGHT_EXCEPTIONS_SELECTOR);
      assertNotNullOrUndefined(pauseOnCaughtExceptionsItem);

      const pauseOnCaughtExceptionsCheckbox = pauseOnCaughtExceptionsItem.querySelector('input');
      assertNotNullOrUndefined(pauseOnCaughtExceptionsCheckbox);
      assertElement(pauseOnCaughtExceptionsCheckbox, HTMLInputElement);
      assert.isFalse(pauseOnCaughtExceptionsCheckbox.checked);
    });

    it('state is rendered correctly when pausing on all exceptions', async () => {
      const component = await renderNoBreakpoints({pauseOnExceptions: true, pauseOnCaughtExceptions: true});
      assertShadowRoot(component.shadowRoot);

      const pauseOnExceptionsItem = component.shadowRoot.querySelector(PAUSE_ON_EXCEPTIONS_SELECTOR);
      assertNotNullOrUndefined(pauseOnExceptionsItem);

      const pauseOnExceptionsCheckbox = pauseOnExceptionsItem.querySelector('input');
      assertNotNullOrUndefined(pauseOnExceptionsCheckbox);
      assertElement(pauseOnExceptionsCheckbox, HTMLInputElement);
      assert.isTrue(pauseOnExceptionsCheckbox.checked);

      const pauseOnCaughtExceptionsItem = component.shadowRoot?.querySelector(PAUSE_ON_CAUGHT_EXCEPTIONS_SELECTOR);
      assertNotNullOrUndefined(pauseOnCaughtExceptionsItem);

      const pauseOnCaughtExceptionsCheckbox = pauseOnCaughtExceptionsItem.querySelector('input');
      assertNotNullOrUndefined(pauseOnCaughtExceptionsCheckbox);
      assertElement(pauseOnCaughtExceptionsCheckbox, HTMLInputElement);
      assert.isTrue(pauseOnCaughtExceptionsCheckbox.checked);
    });

    it('triggers an event when disabling pausing on all exceptions', async () => {
      const component = await renderNoBreakpoints({pauseOnExceptions: true, pauseOnCaughtExceptions: false});
      assertShadowRoot(component.shadowRoot);

      const item = component.shadowRoot.querySelector(PAUSE_ON_EXCEPTIONS_SELECTOR);
      assertNotNullOrUndefined(item);

      const checkbox = item.querySelector('input');
      assertElement(checkbox, HTMLInputElement);
      const {checked} = checkbox;

      const eventPromise = getEventPromise<SourcesComponents.BreakpointsView.PauseOnExceptionsStateChangedEvent>(
          component, SourcesComponents.BreakpointsView.PauseOnExceptionsStateChangedEvent.eventName);
      checkbox.click();
      const {data} = await eventPromise;

      assert.strictEqual(data.checked, !checked);
    });

    it('triggers an event when enabling pausing on caught exceptions', async () => {
      const component = await renderNoBreakpoints({pauseOnExceptions: true, pauseOnCaughtExceptions: false});
      assertShadowRoot(component.shadowRoot);

      const item = component.shadowRoot.querySelector(PAUSE_ON_CAUGHT_EXCEPTIONS_SELECTOR);
      assertNotNullOrUndefined(item);

      const checkbox = item.querySelector('input');
      assertElement(checkbox, HTMLInputElement);
      const {checked} = checkbox;

      const eventPromise = getEventPromise<SourcesComponents.BreakpointsView.PauseOnCaughtExceptionsStateChangedEvent>(
          component, SourcesComponents.BreakpointsView.PauseOnCaughtExceptionsStateChangedEvent.eventName);
      checkbox.click();
      const {data} = await eventPromise;

      assert.strictEqual(data.checked, !checked);
    });
  });
});
