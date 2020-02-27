// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as puppeteer from 'puppeteer';
import {click, waitFor, $} from '../../shared/helper.js';

export class NetworkTabPageObject {
  frontend: puppeteer.Page;

  get nameColumn() {return '.name-column';}
  get sizeColumn() {return '.size-column';}
  get typeColumn() {return '.type-column';}
  get lastModifiedColumn() {return '.last-modified-column';}
  get contextMenuResponseHeadersOption() {return '[aria-label="Response Headers"]';}
  get responseHeadersLastModifiedOption() {return 'div.soft-context-menu-item[aria-label^="Last-Modified"]';}
  get nameColumnItems() {return 'td.name-column';}
  get responseTab() {return '#tab-response';}
  get rawResponseEditor() {return '.CodeMirror-code';}
  get disableCacheCheckbox() {return '[aria-label="Disable cache"]';}

  constructor(frontend: puppeteer.Page) {
    this.frontend = frontend;
  }

  async enableLastModifiedColumn() {
    await click(this.nameColumn, {clickOptions: {button: 'right'}});
    await click(this.contextMenuResponseHeadersOption);
    await click(this.responseHeadersLastModifiedOption);
    await waitFor(this.lastModifiedColumn);
  }

  async retrieveColumnValues(columnSelector: string) {
    const columnValues = await this.frontend.evaluate(columnSelector => {
      return Array.from(document.querySelectorAll(columnSelector)).map(message => message.textContent);
    }, columnSelector);

    return columnValues;
  }

  async clickListItemNumberX(num: number) {
    const itemList = await this.frontend.$$(this.nameColumnItems);
    itemList[num - 1].click();
  }

  async clickResponseTab() {
    await waitFor(this.responseTab);
    await click(this.responseTab);
  }

  async retrieveRawResponseEditorContents() {
    await waitFor('.CodeMirror-code');
    const codeMirrorEditor = await $('.CodeMirror-code');
    return await codeMirrorEditor.evaluate(editor => editor.textContent);
  }

  async clickDisableCacheCheckbox() {
    await click(this.disableCacheCheckbox);
  }
}
