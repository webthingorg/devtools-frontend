// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert, AssertionError} from 'chai';
import {describe, it} from 'mocha';

import {getBrowserAndPages} from '../../shared/helper.js';

import {doubleClickSourceTreeItem, getDataGridData, navigateToApplicationTab} from '../helpers/application-helpers.js';

const SESSION_STORAGE_SELECTOR = '[aria-label="Session Storage"]';
const DOMAIN_SELECTOR = `${SESSION_STORAGE_SELECTOR} + ol > [aria-label="http://localhost:8090"]`;

async function step(description: string, step: Function) {
  try {
    console.log(`     Running step ${description}`);
    return step();
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

describe.only('The Application Tab', async () => {
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
      const dataGridRowValues = await getDataGridData('.storage-view table', ['key', 'value']);
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
      const dataGridRowValues = await getDataGridData('.storage-view table', ['key', 'value']);
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
      const dataGridRowValues = await getDataGridData('.storage-view table', ['key', 'value']);
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
      const dataGridRowValues = await getDataGridData('.storage-view table', ['key', 'value']);
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
      // await doubleClickSourceTreeItem('aaaaa');
    });

    await step('check that storage data values are correct', async () => {
      const dataGridRowValues = await getDataGridData('.storage-view table', ['key', 'value']);
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
