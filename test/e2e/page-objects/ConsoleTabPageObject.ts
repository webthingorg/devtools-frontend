// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as puppeteer from 'puppeteer';
import {click} from '../../shared/helper.js';

export class ConsoleTabPageObject {
  target: puppeteer.Page;
  frontend: puppeteer.Page;

  constructor(target: puppeteer.Page, frontend: puppeteer.Page) {
    this.target = target;
    this.frontend = frontend;
  }

  get logLevelList() {return '[aria-label="Log level: Default levels"]';}
  get verboseLevelListItem() {return '[aria-label="Verbose, unchecked"]';}
  get loggedConsoleMessages() {return '.console-group-messages';}
  get firstMessageFromConsole() {return '.console-group-messages .source-code .console-message-text';}

  async retrieveConsoleMessages() {
    // Obtain console messages that were logged
    await this.frontend.waitForSelector(this.loggedConsoleMessages);

    // Get the first message from the console.
    return this.frontend.evaluate(firstMessageFromConsole => {
      return Array.from(document.querySelectorAll(firstMessageFromConsole))
          .map(message => message.textContent);
    }, this.firstMessageFromConsole);
  }

  async clickLogLevelList() {
    await this.frontend.waitForSelector(this.loggedConsoleMessages);
    await click(this.logLevelList);
  }

  async chooseVerboseFromLogLevelList() {
    await this.frontend.waitForSelector(this.loggedConsoleMessages);
    await click(this.verboseLevelListItem);
  }
}
