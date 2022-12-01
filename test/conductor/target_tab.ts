// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {type Page, type Browser} from 'puppeteer-core';

// eslint-disable-next-line rulesdir/es_modules_import
import {type Target as InternalTarget} from 'puppeteer-core/lib/esm/puppeteer/common/Target.js';

import {loadEmptyPageAndWaitForContent} from './frontend_tab.js';

/**
 * Wrapper class around `puppeteer.Page` that helps with setting up and
 * managing a tab that can be inspected by the DevTools frontend.
 */
export class TargetTab {
  private constructor(readonly page: Page) {
  }

  static async create(browser: Browser): Promise<TargetTab> {
    const page = await browser.newPage();
    await loadEmptyPageAndWaitForContent(page);
    return new TargetTab(page);
  }

  async reset(): Promise<void> {
    await loadEmptyPageAndWaitForContent(this.page);
  }

  targetId(): string {
    // TODO(crbug.com/1297458): Replace private property access with public getter once available in puppeteer.
    return (this.page.target() as unknown as InternalTarget)._targetId;
  }
}
