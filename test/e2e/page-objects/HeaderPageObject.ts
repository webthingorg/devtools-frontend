// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as puppeteer from 'puppeteer';
import {click} from '../../shared/helper.js';

export class HeaderPageObject {
  frontend: puppeteer.Page;

  constructor(frontend: puppeteer.Page) {
    this.frontend = frontend;
  }

  get elementsTab() {return '#tab-elements';}
  get consoleTab() {return '#tab-console';}
  get sourcesTab() {return '#tab-sources';}
  get networkTab() {return '#tab-network';}
  get performanceTab() {return '#tab-timeline';}
  get memoryTab() {return '#tab-heap_profiler';}
  get applicationTab() {return '#tab-resources';}
  get securityTab() {return '#tab-security';}
  get auditsTab() {return '#tab-audits';}

  async clickConsoleTab() {
    await click(this.consoleTab);
  }

  async clickNetworkTab() {
    await click(this.networkTab);
  }
}
