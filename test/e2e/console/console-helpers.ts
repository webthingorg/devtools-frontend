// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as puppeteer from 'puppeteer';

import {waitFor, click, debuggerStatement, getBrowserAndPages, resourcesPath} from '../../shared/helper.js';

export const consoleTabSelector = '#tab-console';
export const consoleMessagesSelector = '.console-group-messages';
export const consoleFirstMessageSelector = '.console-group-messages .source-code .console-message-text';
export const logLevelsSelector = '[aria-label^="Log level: "]';
export const logLevelsVerboseOptionSelector = '[aria-label^="Verbose"]';

export async function doubleClickSourceTreeItem(selector: string) {
  await waitFor(selector);
  await click(selector, {clickOptions: {clickCount: 2}});
}

export async function obtainConsoleMessages(testName: string, callback?: (page: puppeteer.Page) => Promise<void>) {
  const {target, frontend} = getBrowserAndPages();

  // Have the target load the page.
  await target.goto(`${resourcesPath}/console/${testName}.html`);

  // Locate the button for switching to the console tab.
  await click(consoleTabSelector);
  // Obtain console messages that were logged
  await frontend.waitForSelector(consoleMessagesSelector);

  if (callback) {
    await debuggerStatement(frontend);
    await callback(frontend);
  }
  await debuggerStatement(frontend);

  // Get the first message from the console.
  return frontend.evaluate(consoleFirstMessageSelector => {
    return Array.from(document.querySelectorAll(consoleFirstMessageSelector))
        .map(message => message.textContent);
  }, consoleFirstMessageSelector);
}

export async function showVerboseMessages() {
  await click(logLevelsSelector);
  await click(logLevelsVerboseOptionSelector);
}
