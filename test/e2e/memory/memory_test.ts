// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';

import type * as puppeteer from 'puppeteer';

import {
  $$,
  $,
  assertNotNullOrUndefined,
  getBrowserAndPages,
  goToResource,
  step,
  waitFor,
  clickElement,
  waitForElementsWithTextContent,
  waitForElementWithTextContent,
  waitForFunction,
  waitForNoElementsWithTextContent,
} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {
  changeAllocationSampleViewViaDropdown,
  changeViewViaDropdown,
  findSearchResult,
  getDataGridRows,
  navigateToMemoryTab,
  setSearchFilter,
  takeAllocationProfile,
  takeAllocationTimelineProfile,
  takeHeapSnapshot,
  waitForNonEmptyHeapSnapshotData,
  waitForRetainerChain,
  waitForSearchResultNumber,
  waitUntilRetainerChainSatisfies,
} from '../helpers/memory-helpers.js';

describe('The Memory Panel', async function() {
  // These tests render large chunks of data into DevTools and filter/search
  // through it. On bots with less CPU power, these can fail because the
  // rendering takes a long time, so we allow a much larger timeout.
  if (this.timeout() !== 0) {
    this.timeout(100000);
  }

  it('Loads content', async () => {
    await goToResource('memory/default.html');
    await navigateToMemoryTab();
  });

  it('Can take several heap snapshots ', async () => {
    await goToResource('memory/default.html');
    await navigateToMemoryTab();
    await takeHeapSnapshot();
    await waitForNonEmptyHeapSnapshotData();
    await takeHeapSnapshot();
    await waitForNonEmptyHeapSnapshotData();
    const heapSnapShots = await $$('.heap-snapshot-sidebar-tree-item');
    assert.strictEqual(heapSnapShots.length, 2);
  });

  // Flaky on linux and mac.
  it.skip('[crbug.com/1377772] Shows a DOM node and its JS wrapper as a single node', async () => {
    await goToResource('memory/detached-node.html');
    await navigateToMemoryTab();
    await takeHeapSnapshot();
    await waitForNonEmptyHeapSnapshotData();
    await setSearchFilter('leaking');
    await waitForSearchResultNumber(4);
    await findSearchResult(async p => {
      const el = await p.$(':scope > td > div > .object-value-function');
      return el !== null && await el.evaluate(el => el.textContent === 'leaking()');
    });
    await waitForRetainerChain([
      'Detached V8EventListener',
      'Detached EventListener',
      'Detached InternalNode',
      'Detached InternalNode',
      'Detached HTMLDivElement',
      'Retainer',
      'Window',
    ]);
  });

  // Flaky test
  it.skipOnPlatforms(
      ['mac', 'linux'], '[crbug.com/1134602] Correctly retains the path for event listeners', async () => {
        await goToResource('memory/event-listeners.html');
        await step('taking a heap snapshot', async () => {
          await navigateToMemoryTab();
          await takeHeapSnapshot();
          await waitForNonEmptyHeapSnapshotData();
        });
        await step('searching for the event listener', async () => {
          await setSearchFilter('myEventListener');
          await waitForSearchResultNumber(4);
        });

        await step('selecting the search result that we need', async () => {
          await findSearchResult(async p => {
            const el = await p.$(':scope > td > div > .object-value-function');
            return el !== null && await el.evaluate(el => el.textContent === 'myEventListener()');
          });
        });

        await step('waiting for retainer chain', async () => {
          await waitForRetainerChain([
            'V8EventListener',
            'EventListener',
            'InternalNode',
            'InternalNode',
            'HTMLBodyElement',
            'HTMLHtmlElement',
            'HTMLDocument',
            'Window',
          ]);
        });
      });

  it('Puts all ActiveDOMObjects with pending activities into one group', async () => {
    const {frontend} = getBrowserAndPages();
    await goToResource('memory/dom-objects.html');
    await navigateToMemoryTab();
    await takeHeapSnapshot();
    await waitForNonEmptyHeapSnapshotData();
    // The test ensures that the following structure is present:
    // Pending activities
    // -> Pending activities
    //    -> InternalNode
    //       -> MediaQueryList
    //       -> MediaQueryList
    await setSearchFilter('Pending activities');
    // Here and below we have to wait until the elements are actually created
    // and visible.
    await waitForFunction(async () => {
      const pendingActivitiesSpan = await waitFor('//span[text()="Pending activities"]', undefined, undefined, 'xpath');
      const pendingActiviesRow = await waitFor('ancestor-or-self::tr', pendingActivitiesSpan, undefined, 'xpath');
      try {
        await clickElement(pendingActivitiesSpan);
      } catch {
        return false;
      }
      const res = await pendingActiviesRow.evaluate(x => x.classList.toString());
      return res.includes('selected');
    });
    await frontend.keyboard.press('ArrowRight');
    const internalNodeSpan = await waitFor(
        '//span[text()="InternalNode"][ancestor-or-self::tr[preceding-sibling::*[1][//span[text()="Pending activities"]]]]',
        undefined, undefined, 'xpath');
    const internalNodeRow = await $('ancestor-or-self::tr', internalNodeSpan, 'xpath');
    await waitForFunction(async () => {
      await clickElement(internalNodeSpan);
      const res = await internalNodeRow.evaluate(x => x.classList.toString());
      return res.includes('selected');
    });
    await frontend.keyboard.press('ArrowRight');
    await waitForFunction(async () => {
      const pendingActiviesChildren = await waitForElementsWithTextContent('MediaQueryList');
      return pendingActiviesChildren.length === 2;
    });
  });

  it('Shows the correct number of divs for a detached DOM tree correctly', async () => {
    await goToResource('memory/detached-dom-tree.html');
    await navigateToMemoryTab();
    await takeHeapSnapshot();
    await waitForNonEmptyHeapSnapshotData();
    await setSearchFilter('Detached HTMLDivElement');
    await waitForSearchResultNumber(3);
  });

  it('Shows the correct output for an attached iframe', async () => {
    await goToResource('memory/attached-iframe.html');
    await navigateToMemoryTab();
    await takeHeapSnapshot();
    await waitForNonEmptyHeapSnapshotData();
    await setSearchFilter('Retainer');
    await waitForSearchResultNumber(8);
    await findSearchResult(async p => {
      const el = await p.$(':scope > td > div > .object-value-object');
      return el !== null && await el.evaluate(el => el.textContent === 'Retainer');
    });
    // The following line checks two things: That the property 'aUniqueName'
    // in the iframe is retaining the Retainer class object, and that the
    // iframe window is not detached.
    await waitUntilRetainerChainSatisfies(
        retainerChain => retainerChain.some(
            ({propertyName, retainerClassName}) => propertyName === 'aUniqueName' && retainerClassName === 'Window'));
  });

  // Times out
  it.skip('[crbug.com/1363150] Correctly shows multiple retainer paths for an object', async () => {
    await goToResource('memory/multiple-retainers.html');
    await navigateToMemoryTab();
    await takeHeapSnapshot();
    await waitForNonEmptyHeapSnapshotData();
    await setSearchFilter('leaking');
    await waitForSearchResultNumber(4);
    await findSearchResult(async p => {
      const el = await p.$(':scope > td > div > .object-value-string');
      return el !== null && await el.evaluate(el => el.textContent === '"leaking"');
    });

    await waitForFunction(async () => {
      // Wait for all the rows of the data-grid to load.
      const retainerGridElements = await getDataGridRows('.retaining-paths-view table.data');
      return retainerGridElements.length === 9;
    });

    const sharedInLeakingElementRow = await waitForFunction(async () => {
      const results = await getDataGridRows('.retaining-paths-view table.data');
      const findPromises = await Promise.all(results.map(async e => {
        const textContent = await e.evaluate(el => el.textContent);
        // Can't search for "shared in leaking()" because the different parts are spaced with CSS.
        return textContent && textContent.startsWith('sharedinleaking()') ? e : null;
      }));
      return findPromises.find(result => result !== null);
    });

    if (!sharedInLeakingElementRow) {
      assert.fail('Could not find data-grid row with "shared in leaking()" text.');
    }

    const textOfEl = await sharedInLeakingElementRow.evaluate(e => e.textContent || '');
    // Double check we got the right element to avoid a confusing text failure
    // later down the line.
    assert.isTrue(textOfEl.startsWith('sharedinleaking()'));

    // Have to click it not in the middle as the middle can hold the link to the
    // file in the sources pane and we want to avoid clicking that.
    await clickElement(sharedInLeakingElementRow /* TODO(crbug.com/1363150): {maxPixelsFromLeft: 10} */);
    const {frontend} = getBrowserAndPages();
    // Expand the data-grid for the shared list
    await frontend.keyboard.press('ArrowRight');

    // check that we found two V8EventListener objects
    await waitForFunction(async () => {
      const pendingActiviesChildren = await waitForElementsWithTextContent('V8EventListener');
      return pendingActiviesChildren.length === 2;
    });

    // Now we want to get the two rows below the "shared in leaking()" row and assert on them.
    // Unfortunately they are not structured in the data-grid as children, despite being children in the UI
    // So the best way to get at them is to grab the two subsequent siblings of the "shared in leaking()" row.
    const nextRow = (await sharedInLeakingElementRow.evaluateHandle(e => e.nextSibling)).asElement() as
        puppeteer.ElementHandle<HTMLElement>;
    if (!nextRow) {
      assert.fail('Could not find row below "shared in leaking()" row');
    }
    const nextNextRow =
        (await nextRow.evaluateHandle(e => e.nextSibling)).asElement() as puppeteer.ElementHandle<HTMLElement>;
    if (!nextNextRow) {
      assert.fail('Could not find 2nd row below "shared in leaking()" row');
    }

    const childText = await Promise.all([nextRow, nextNextRow].map(async row => await row.evaluate(r => r.innerText)));

    assert.isTrue(childText[0].includes('inV8EventListener'));
    assert.isTrue(childText[1].includes('inEventListener'));
  });

  // Flaky test causing build failures
  it.skip('[crbug.com/1239550] Shows the correct output for a detached iframe', async () => {
    await goToResource('memory/detached-iframe.html');
    await navigateToMemoryTab();
    await takeHeapSnapshot();
    await waitForNonEmptyHeapSnapshotData();
    await setSearchFilter('Leak');
    await waitForSearchResultNumber(8);
    await waitUntilRetainerChainSatisfies(
        retainerChain => retainerChain.some(({retainerClassName}) => retainerClassName === 'Detached Window'));
  });

  it('Shows the a tooltip', async () => {
    await goToResource('memory/detached-dom-tree.html');
    await navigateToMemoryTab();
    await takeHeapSnapshot();
    await waitForNonEmptyHeapSnapshotData();
    await setSearchFilter('Detached HTMLDivElement');
    await waitForSearchResultNumber(3);
    await waitUntilRetainerChainSatisfies(retainerChain => {
      return retainerChain.length > 0 && retainerChain[0].propertyName === 'retaining_wrapper';
    });
    const rows = await getDataGridRows('.retaining-paths-view table.data');
    const propertyNameElement = await rows[0].$('span.property-name');
    assertNotNullOrUndefined(propertyNameElement);
    propertyNameElement.hover();
    const el = await waitFor('div.vbox.flex-auto.no-pointer-events');
    await waitFor('.source-code', el);
  });

  it('shows the flamechart for an allocation sample', async () => {
    await goToResource('memory/allocations.html');
    await navigateToMemoryTab();
    void takeAllocationProfile();
    void changeAllocationSampleViewViaDropdown('Chart');
    await waitFor('canvas.flame-chart-canvas');
  });

  it('shows allocations for an allocation timeline', async () => {
    await goToResource('memory/allocations.html');
    await navigateToMemoryTab();
    void takeAllocationTimelineProfile({recordStacks: true});
    await changeViewViaDropdown('Allocation');

    const header = await waitForElementWithTextContent('Live Count');
    const table = await header.evaluateHandle(node => {
      return node.closest('.data-grid');
    });
    await waitFor('.data-grid-data-grid-node', table);
  });

  it('does not show allocations perspective when stacks not recorded', async () => {
    await goToResource('memory/allocations.html');
    await navigateToMemoryTab();
    void takeAllocationTimelineProfile({recordStacks: false});
    const dropdown = await waitFor('select[aria-label="Perspective"]');
    await waitForNoElementsWithTextContent('Allocation', dropdown);
  });
});
