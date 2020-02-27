// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as puppeteer from 'puppeteer';

export class ResourcePageObject {
  target: puppeteer.Page;
  resourcesPath: String;

  constructor(target: puppeteer.Page) {
    this.resourcesPath = 'http://localhost:8090/test/e2e/resources';
    this.target = target;
  }

  async navigateTo(targetPage: String) {
    await this.target.goto(`${this.resourcesPath}${targetPage}`, {waitUntil: 'networkidle2'});
  }

  async reload() {
    await this.target.reload({waitUntil: 'networkidle2'});
  }
}
