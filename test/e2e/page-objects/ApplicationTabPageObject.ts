// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as puppeteer from 'puppeteer';
import {click, waitFor, $$} from '../../shared/helper.js';


export class ApplicationTabPageObject {
  frontend: puppeteer.Page;

  constructor(frontend: puppeteer.Page) {
    this.frontend = frontend;
  }

  get sessionStorage() {return '[aria-label="Session Storage"]';}
  get domain() {return `${this.sessionStorage} + ol > [aria-label="http://localhost:8090"]`;}
  get storageDataGrid() {return '.storage-view table';}
  get dataGridNodes() {return '.data-grid-data-grid-node';}
  get keyColumn() {return '.key-column';}
  get valueColumn() {return '.value-column';}

  async openSessionStorageList() {
    await waitFor(this.sessionStorage);
    await click(this.sessionStorage, {clickOptions: {clickCount: 2}});
  }

  async openDomainList() {
    await waitFor(this.domain);
    await click(this.domain, {clickOptions: {clickCount: 2}});
  }

  async retrieveDataGridRowValues() {
    await waitFor(this.storageDataGrid);
    const dataGridNodes = await $$(this.dataGridNodes);

    const dataGridRowValues = await dataGridNodes.evaluate((nodes, keyColumn, valueColumn) => nodes.map((row: Element) => {
      return {
        key: row.querySelector(keyColumn)!.textContent,
        value: row.querySelector(valueColumn)!.textContent,
      };
    }), this.keyColumn, this.valueColumn);

    return dataGridRowValues;
  }
}
