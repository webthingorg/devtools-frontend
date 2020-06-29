// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import {describe, it} from 'mocha';
import * as puppeteer from 'puppeteer';

import {getBrowserAndPages, step} from '../../shared/helper.js';
import {deleteConsoleMessagesFilter, filterConsoleMessages, getConsoleMessages, getCurrentConsoleMessages} from '../helpers/console-helpers.js';

const CONSOLE_MESSAGE_WRAPPER = '.console-group-messages .console-message-wrapper';
type checkMessage = (element: string, index: number) => boolean;

function createUrlFilter(url: string) {
  return `-url:${url}`;
}

function collectSourceUrlsFromConsoleOutput(frontend: puppeteer.Page) {
  return frontend.evaluate(WRAPPER => {
    return Array.from(document.querySelectorAll(WRAPPER)).map(wrapper => {
      return wrapper.querySelector('.devtools-link').textContent.split(':')[0];
    });
  }, CONSOLE_MESSAGE_WRAPPER);
}

function getExpectedMessages(unfilteredMessages: string[], filter: checkMessage) {
  return unfilteredMessages.filter((element: string, index: number) => {
    // console.group() outputs are not filtered
    if (element === 'outerGroup' || element === 'innerGroup') {
      return true;
    }
    return filter(element, index);
  });
}

async function testMessageFilter(filter: string, expectedMessageFilter: checkMessage) {
  const {frontend} = getBrowserAndPages();
  let unfilteredMessages: string[];

  await step('navigate to console-filter.html and get console messages', async () => {
    unfilteredMessages = await getConsoleMessages('console-filter');
  });

  await step(`filter to only show messages containing '${filter}'`, async () => {
    await filterConsoleMessages(frontend, filter);
  });

  await step('check that messages are correctly filtered', async () => {
    const filteredMessages = await getCurrentConsoleMessages();
    const expectedMessages = getExpectedMessages(unfilteredMessages, expectedMessageFilter);
    assert.deepEqual(filteredMessages, expectedMessages);
  });
}

describe('The Console Tab', async () => {
  it('shows logged messages', async () => {
    let messages: string[];
    await step('navigate to console-filter.html and get console messages', async () => {
      messages = await getConsoleMessages('console-filter');
    });

    await step('check that all console messages appear', async () => {
      assert.deepEqual(messages, [
        '1topGroup: log1()',
        '2topGroup: log2()',
        '3topGroup: log1()',
        'outerGroup',
        '1outerGroup: log1()',
        '2outerGroup: log2()',
        'innerGroup',
        '1innerGroup: log1()',
        '2innerGroup: log2()',
        'Hello 1',
        'Hello 2',
        'end',
      ]);
    });
  });

  it('can exclude messages from a source url', async () => {
    const {frontend} = getBrowserAndPages();
    let unfilteredMessages: string[];
    let sourceUrls: string[];
    let uniqueUrls: string[];

    await step('navigate to console-filter.html and get console messages', async () => {
      unfilteredMessages = await getConsoleMessages('console-filter');
    });

    await step('collect source urls from all messages', async () => {
      sourceUrls = await collectSourceUrlsFromConsoleOutput(frontend);
    });

    await step('find unique urls', async () => {
      uniqueUrls = [...new Set(sourceUrls)];
    });

    for (const index in uniqueUrls!) {
      const urlToExclude = uniqueUrls[index];

      await step(`filter out messages from source ${urlToExclude}`, async () => {
        const filter = createUrlFilter(urlToExclude);
        await filterConsoleMessages(frontend, filter);
      });

      await step('check that messages are correctly filtered', async () => {
        const filteredMessages = await getCurrentConsoleMessages();
        const expectedMessages = getExpectedMessages(unfilteredMessages, (_, index) => {
          return sourceUrls[index] !== urlToExclude;
        });
        assert.deepEqual(filteredMessages, expectedMessages);
      });

      await step('remove filter', async () => {
        await deleteConsoleMessagesFilter(frontend);
      });
    }
  });

  it('can include messages from a given source url', async () => {
    const {frontend} = getBrowserAndPages();
    let unfilteredMessages: string[];
    let sourceUrls: string[];
    let uniqueUrls: string[];

    await step('navigate to console-filter.html and get console messages', async () => {
      unfilteredMessages = await getConsoleMessages('console-filter');
    });

    await step('collect source urls from all messages', async () => {
      sourceUrls = await collectSourceUrlsFromConsoleOutput(frontend);
    });

    await step('find unique urls', async () => {
      uniqueUrls = [...new Set(sourceUrls)];
    });

    for (const index in uniqueUrls!) {
      const urlToKeep = uniqueUrls[index];

      await step(`filter to only show messages from source ${urlToKeep}`, async () => {
        await filterConsoleMessages(frontend, urlToKeep);
      });

      await step('check that messages are correctly filtered', async () => {
        const filteredMessages = await getCurrentConsoleMessages();
        const expectedMessages = getExpectedMessages(unfilteredMessages, (_, index) => {
          return sourceUrls[index] === urlToKeep;
        });
        assert.deepEqual(filteredMessages, expectedMessages);
      });

      await step('remove filter', async () => {
        await deleteConsoleMessagesFilter(frontend);
      });
    }
  });

  it('can apply empty filter', async () => {
    const filter = '';
    const expectedMessageFilter = function(_: string, __: number) {
      return true;
    };
    await testMessageFilter(filter, expectedMessageFilter);
  });

  it('can apply text filter', async () => {
    const filter = 'outer';
    const expectedMessageFilter = function(msg: string, _: number) {
      return msg.indexOf(filter) !== -1;
    };
    await testMessageFilter(filter, expectedMessageFilter);
  });

  it('can apply regex filter', async () => {
    const filter = '/^Hello\s\d$/';
    const expectedMessageFilter = function(msg: string, _: number) {
      const regExp = new RegExp(filter);
      return regExp.test(msg);
    };
    await testMessageFilter(filter, expectedMessageFilter);
  });

  it('can apply context filter', async () => {
    const expectedMessageFilter = function(msg: string, _: number) {
      return msg.indexOf('Hello') !== -1;
    };
    await testMessageFilter('context:context', expectedMessageFilter);
  });

  it('can apply multi text filter', async () => {
    const filter = 'Group /[2-3]top/';
    const expectedMessageFilter = function(msg: string, _: number) {
      return /[2-3]top/.test(msg);
    };
    await testMessageFilter(filter, expectedMessageFilter);
  });

  it('can reset filter', async () => {
    const {frontend} = getBrowserAndPages();
    let unfilteredMessages: string[];

    await step('get unfiltered messages', async () => {
      unfilteredMessages = await getConsoleMessages('console-filter');
    });

    await step('apply message filter', async () => {
      await filterConsoleMessages(frontend, 'outer');
    });

    await step('delete message filter', async () => {
      deleteConsoleMessagesFilter(frontend);
    });

    await step('check if messages are unfiltered', async () => {
      const messages = await getCurrentConsoleMessages();
      assert.deepEqual(messages, unfilteredMessages);
    });
  });
});
