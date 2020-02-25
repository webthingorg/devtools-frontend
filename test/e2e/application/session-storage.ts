// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import {describe, it} from 'mocha';
import * as puppeteer from 'puppeteer';

import {ResourcePageObject} from '../page-objects/ResourcePageObject';
import {HeaderPageObject} from '../page-objects/HeaderPageObject';
import {ApplicationTabPageObject} from '../page-objects/ApplicationTabPageObject';
import {resetPages, getBrowserAndPages} from '../../shared/helper.js';

describe('The Application Tab', async () => {
  let target: puppeteer.Page;
  let frontend: puppeteer.Page;
  let resourcePageObject: ResourcePageObject;
  let headerPageObject: HeaderPageObject;
  let applicationTabPageObject: ApplicationTabPageObject;

  beforeEach(async () => {
    await resetPages();
    const world = getBrowserAndPages();
    target = world.target;
    frontend = world.frontend;
    resourcePageObject = new ResourcePageObject(target);
    headerPageObject = new HeaderPageObject(frontend);
    applicationTabPageObject = new ApplicationTabPageObject(frontend);
  });

  it('shows Session Storage keys and values', async () => {
    await resourcePageObject.navigateTo('/application/session-storage.html');
    await headerPageObject.clickApplicationTab();

    await applicationTabPageObject.openSessionStorageList();
    await applicationTabPageObject.openDomainList();

    const dataGridRowValues = await applicationTabPageObject.retrieveDataGridRowValues();

    assert.deepEqual(dataGridRowValues, [
      {
        key: 'firstKey',
        value: 'firstValue',
      },
      {
        key: 'secondKey',
        value: `{"field":"complexValue","primitive":2}`,
      },
      {
        key: '',
        value: '',
      },
    ]);
  });
});
