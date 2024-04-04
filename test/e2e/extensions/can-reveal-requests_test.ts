// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';

import {waitFor} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {loadExtension} from '../helpers/extension-helpers.js';
import {waitForNetworkTab} from '../helpers/network-helpers.js';

describe('The Extension API', () => {
  it('can reveal network the network panel', async () => {
    const extension = await loadExtension('TestExtension');

    await extension.evaluate(() => window.chrome.devtools.panels.network.show());

    await waitForNetworkTab();
  });

  it('can reveal network the network panel with filters', async () => {
    const extension = await loadExtension('TestExtension');

    await extension.evaluate(() => window.chrome.devtools.panels.network.show({filter: 'foobar'}));

    await waitForNetworkTab();

    const filter = await waitFor<HTMLElement>('.filter-text-filter');
    assert.strictEqual('foobar ', await filter.evaluate(f => f.innerText));
  });
});
