// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as puppeteer from 'puppeteer';
import {click, debuggerStatement} from '../../shared/helper.js';

export class ConsoleTabPageObject {
  target: puppeteer.Page;
  frontend: puppeteer.Page;

  constructor(target: puppeteer.Page, frontend: puppeteer.Page) {
    this.target = target;
    this.frontend = frontend;
  }

  get tabConsole() {return '#tab-console'}
  get defaultLevel() {return '[aria-label="Log level: Default levels"]'}
  get verboseLevel() {return '[aria-label="Verbose, unchecked"]'}
  get loggedConsoleMessages() {return '.console-group-messages'}
  get firstMessageFromConsole() {return '.console-group-messages .source-code .console-message-text'}

  async retrieveConsoleMessages(callback?: (page: puppeteer.Page) => Promise<void>) {
    // Locate the button for switching to the console tab.
    await click(this.tabConsole);
    // Obtain console messages that were logged
    await this.frontend.waitForSelector(this.loggedConsoleMessages);

    if (callback) {
      await debuggerStatement(this.frontend);
      await callback(this.frontend);
    }
    await debuggerStatement(this.frontend);

    // Get the first message from the console.
    return this.frontend.evaluate((firstMessageFromConsole) => {
      return Array.from(document.querySelectorAll(firstMessageFromConsole))
          .map(message => message.textContent);
    }, this.firstMessageFromConsole);
  }
}
