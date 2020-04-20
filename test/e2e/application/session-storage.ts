// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert, AssertionError} from 'chai';
import {describe, it} from 'mocha';
import * as puppeteer from 'puppeteer';

import {$$, click, getBrowserAndPages, resetPages, resourcesPath, waitFor} from '../../shared/helper.js';

const SESSION_STORAGE_SELECTOR = '[aria-label="Session Storage"]';
const DOMAIN_SELECTOR = `${SESSION_STORAGE_SELECTOR} + ol > [aria-label="http://localhost:8090"]`;

async function step(description: string, step: Function) {
  try {
    // attempt at capturing the timeout
    // const stepPromise = step();
    // const timeoutPromise = new Promise(() => {
    //   setTimeout(() => {
    //     throw new Error('Timeout Error in Step: ' + description);
    //   }, 4000);
    // });
    // return await Promise.race([timeoutPromise, stepPromise]);
    return await step();
  } catch (error) {
    if (error instanceof AssertionError) {
      if (error.message.includes('Unexpected Result in Step: ')) {
        const comp_desc = description + ' => ' + error.message.replace('Unexpected Result in Step: ', '');
        throw new AssertionError('Unexpected Result in Step: ' + comp_desc, error);
      } else {
        throw new AssertionError('Unexpected Result in Step: ' + description, error);
      }
    } else {
      if (error.message.includes('in Step: ')) {
        const steps_raised = error.message.split(':');
        error.message = steps_raised.shift() + ': ' + description + ' => ' + steps_raised;
        throw error;
      } else {
        error.message = error.message + ' in Step: ' + description;
        throw error;
      }
    }
  }
}

async function navigateToApplicationTab(target: puppeteer.Page, testName: string) {
  await target.goto(`${resourcesPath}/application/${testName}.html`);
  await click('#tab-resources');
  // Make sure the application navigation list is shown
  await waitFor('.storage-group-list-item');
}

async function doubleClickSourceTreeItem(selector: string) {
  await waitFor(selector);
  await click(selector, {clickOptions: {clickCount: 2}});
}

describe('The Application Tab', async () => {
  beforeEach(async () => {
    await resetPages();
  });

  it('shows Session Storage keys and values', async () => {
    const {target} = getBrowserAndPages();

    await step('navigate to session-storage resource and open Application tab', async () => {
      await navigateToApplicationTab(target, 'session-storage');
    });

    await step('open the domain storage', async () => {
      await doubleClickSourceTreeItem(SESSION_STORAGE_SELECTOR);
      await doubleClickSourceTreeItem(DOMAIN_SELECTOR);
    });

    await step('check that storage data values are correct', async () => {
      // Wait for Storage data-grid to show up
      await waitFor('.storage-view table');

      const dataGridNodes = await $$('.data-grid-data-grid-node');
      const dataGridRowValues = await dataGridNodes.evaluate(nodes => nodes.map((row: Element) => {
        return {
          key: row.querySelector('.key-column')!.textContent,
          value: row.querySelector('.value-column')!.textContent,
        };
      }));

      assert.deepEqual(dataGridRowValues, [
        {
          key: 'firstKey',
          value: 'firstValue',
        },
        {
          key: 'secondKey',
          value: '{"field":"complexValue","primitive":2}',
        },
        {
          key: '',
          value: '',
        },
      ]);
    });
  });

  it('shows Session Storage keys and values (but has an assertion error)', async () => {
    const {target} = getBrowserAndPages();

    await step('navigate to session-storage resource and open Application tab', async () => {
      await navigateToApplicationTab(target, 'session-storage');
    });

    await step('open the domain storage', async () => {
      await doubleClickSourceTreeItem(SESSION_STORAGE_SELECTOR);
      await doubleClickSourceTreeItem(DOMAIN_SELECTOR);
    });

    await step('check that storage data values are correct', async () => {
      // Wait for Storage data-grid to show up
      await waitFor('.storage-view table');

      const dataGridNodes = await $$('.data-grid-data-grid-node');
      const dataGridRowValues = await dataGridNodes.evaluate(nodes => nodes.map((row: Element) => {
        return {
          key: row.querySelector('.key-column')!.textContent,
          value: row.querySelector('.value-column')!.textContent,
        };
      }));

      assert.deepEqual(dataGridRowValues, [
        {
          key: 'fail',
          value: 'fail',
        },
      ]);
    });
  });

  it('shows Session Storage keys and values (but has a generic error)', async () => {
    const {target} = getBrowserAndPages();

    await step('navigate to session-storage resource and open Application tab', async () => {
      await navigateToApplicationTab(target, 'session-storage');
    });

    await step('open the domain storage', async () => {
      await doubleClickSourceTreeItem(SESSION_STORAGE_SELECTOR);
      await doubleClickSourceTreeItem(DOMAIN_SELECTOR);
    });

    await step('check that storage data values are correct', async () => {
      // Wait for Storage data-grid to show up
      await waitFor('.storage-view table');

      const dataGridNodes = await $$('.data-grid-data-grid-node');
      const dataGridRowValues = await dataGridNodes.evaluate(nodes => nodes.map((row: Element) => {
        return {
          key: row.querySelector('.key-column')!.textContent,
          value: row.querySelector('.value-column')!.textContent,
        };
      }));

      assert.deepEqual(dataGridRowValues, [
        {
          key: 'firstKey',
          value: 'firstValue',
        },
        {
          key: 'secondKey',
          value: '{"field":"complexValue","primitive":2}',
        },
        {
          key: '',
          value: '',
        },
      ]);

      throw new Error('Generic Error');
    });
  });

  it('shows Session Storage keys and values (but has a nested step)', async () => {
    const {target} = getBrowserAndPages();

    await step('navigate to session-storage resource and open Application tab', async () => {
      await navigateToApplicationTab(target, 'session-storage');
    });

    await step('open the domain storage', async () => {
      await step('double click on session storage', async () => {
        await doubleClickSourceTreeItem(SESSION_STORAGE_SELECTOR);
      });
      await step('double click on the domain', async () => {
        await doubleClickSourceTreeItem(DOMAIN_SELECTOR);
        assert.equal(1, 2);
      });
    });

    await step('check that storage data values are correct', async () => {
      // Wait for Storage data-grid to show up
      await waitFor('.storage-view table');

      const dataGridNodes = await $$('.data-grid-data-grid-node');
      const dataGridRowValues = await dataGridNodes.evaluate(nodes => nodes.map((row: Element) => {
        return {
          key: row.querySelector('.key-column')!.textContent,
          value: row.querySelector('.value-column')!.textContent,
        };
      }));

      assert.deepEqual(dataGridRowValues, [
        {
          key: 'firstKey',
          value: 'firstValue',
        },
        {
          key: 'secondKey',
          value: '{"field":"complexValue","primitive":2}',
        },
        {
          key: '',
          value: '',
        },
      ]);
    });
  });

  it('shows Session Storage keys and values (but has a timeout)', async () => {
    const {target} = getBrowserAndPages();

    await step('navigate to session-storage resource and open Application tab', async () => {
      await navigateToApplicationTab(target, 'session-storage');
    });

    await step('open the domain storage', async () => {
      await doubleClickSourceTreeItem(SESSION_STORAGE_SELECTOR);
      await doubleClickSourceTreeItem('aaaaa');
    });

    await step('check that storage data values are correct', async () => {
      // Wait for Storage data-grid to show up
      await waitFor('.storage-view table');

      const dataGridNodes = await $$('.data-grid-data-grid-node');
      const dataGridRowValues = await dataGridNodes.evaluate(nodes => nodes.map((row: Element) => {
        return {
          key: row.querySelector('.key-column')!.textContent,
          value: row.querySelector('.value-column')!.textContent,
        };
      }));

      assert.deepEqual(dataGridRowValues, [
        {
          key: 'firstKey',
          value: 'firstValue',
        },
        {
          key: 'secondKey',
          value: '{"field":"complexValue","primitive":2}',
        },
        {
          key: '',
          value: '',
        },
      ]);
    });
  });
});
