// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import {describe, it} from 'mocha';
import * as puppeteer from 'puppeteer';

import {ResourcePageObject} from '../page-objects/ResourcePageObject';
import {NetworkTabPageObject} from '../page-objects/NetworkTabPageObject';
import {HeaderPageObject} from '../page-objects/HeaderPageObject';
import {click, getBrowserAndPages, resetPages} from '../../shared/helper.js';

describe('The Network Tab', async () => {
  let target: puppeteer.Page;
  let frontend: puppeteer.Page;
  let resourcePageObject: ResourcePageObject;
  let headerPageObject: HeaderPageObject;
  let networkTabPageObject: NetworkTabPageObject;

  beforeEach(async () => {
    await resetPages();
    const world = getBrowserAndPages();
    target = world.target;
    frontend = world.frontend;
    resourcePageObject = new ResourcePageObject(target);
    headerPageObject = new HeaderPageObject(frontend);
    networkTabPageObject = new NetworkTabPageObject(frontend);
    headerPageObject.clickNetworkTab();
  });

  it('shows Last-Modified', async () => {
    await resourcePageObject.navigateTo('/network/last-modified.html');
    await networkTabPageObject.enableLastModifiedColumn();

    const lastModifiedColumnValues = await networkTabPageObject.retrieveLastModifiedColumnValues();

    assert.deepEqual(lastModifiedColumnValues, [
      `Last-Modified`,
      ``,
      `Sun, 26 Sep 2010 22:04:35 GMT`,
    ]);
  });

  it('shows the HTML response including cyrillic characters with utf-8 encoding', async () => {
    await resourcePageObject.navigateTo('/network/utf-8.rawresponse');
    await networkTabPageObject.clickListItemNumberX(1);
    await networkTabPageObject.clickResponseTab();

    const htmlRawResponse = await networkTabPageObject.retrieveRawResponseEditorContents();

    assert.equal(
        htmlRawResponse,
        `1<html><body>The following word is written using cyrillic letters and should look like "SUCCESS": SU\u0421\u0421\u0415SS.</body></html>`);
  });

  it('shows correct MimeType when resources came from HTTP cache', async () => {
    await resourcePageObject.navigateTo('/network/resources-from-cache.html');
    await networkTabPageObject.clickDisableCacheCheckbox();
    await resourcePageObject.reload();

    // Request the first two network request responses (excluding header and favicon.ico)
    const obtainNetworkRequestSize = () => frontend.evaluate(() => {
      return Array.from(document.querySelectorAll('.size-column')).slice(1, 3).map(node => node.textContent);
    });
    const obtainNetworkRequestMimeTypes = () => frontend.evaluate(() => {
      return Array.from(document.querySelectorAll('.type-column')).slice(1, 3).map(node => node.textContent);
    });
    const computeByteSize = (value: number) => {
      return `${value}\xA0B`;
    };

    assert.deepEqual(await obtainNetworkRequestSize(), [
      computeByteSize(378) + computeByteSize(258),
      computeByteSize(362) + computeByteSize(28),
    ]);
    assert.deepEqual(await obtainNetworkRequestMimeTypes(), [
      `document`,
      `script`,
    ]);

    // Allow resources from the cache again and reload the page to load from cache
    await click(`[aria-label="Disable cache"]`);
    await target.reload({waitUntil: 'networkidle2'});

    assert.deepEqual(await obtainNetworkRequestSize(), [
      computeByteSize(378) + computeByteSize(258),
      `(memory cache)${computeByteSize(28)}`,
    ]);

    assert.deepEqual(await obtainNetworkRequestMimeTypes(), [
      `document`,
      `script`,
    ]);
  });
});
