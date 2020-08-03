// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import {describe, it} from 'mocha';
import {JSHandle, Page} from 'puppeteer';

import {$, clearPermissionsOverride, getBrowserAndPages, goToResource, overridePermissions} from '../../shared/helper.js';
import {openPanelViaMoreTools} from '../helpers/settings-helpers.js';

describe('Sensors panel', () => {
  beforeEach(async () => {
    await overridePermissions(['notifications']);
  });
  afterEach(async () => {
    await clearPermissionsOverride();
  });

  it('includes UI for emulating an idle state', async () => {
    await openPanelViaMoreTools('Sensors');
    const select = await $('.idle-section select');
    const actual = await select.evaluate(node => node.textContent);

    const expected = [
      'No idle emulation',
      'User active, screen unlocked',
      'User active, screen locked',
      'User idle, screen unlocked',
      'User idle, screen locked',
    ].join('');
    assert.deepEqual(actual, expected);
  });

  it('changing idle state emulation causes change of the IdleDetector state', async () => {
    const {target} = getBrowserAndPages();

    // setup
    await goToResource('sensors/idle-detector.html');
    await openPanelViaMoreTools('Sensors');
    const select = await $('.idle-section select');

    // Wait for initial state.
    await waitForState(target, 'Idle state: active, unlocked.');

    await selectOption(select, '{"isUserActive":false,"isScreenUnlocked":false}');
    await waitForState(target, 'Idle state: idle, locked.');

    await selectOption(select, '{"isUserActive":true,"isScreenUnlocked":false}');
    await waitForState(target, 'Idle state: active, locked.');

    await selectOption(select, '{"isUserActive":true,"isScreenUnlocked":true}');
    await waitForState(target, 'Idle state: active, unlocked.');

    await selectOption(select, '{"isUserActive":false,"isScreenUnlocked":true}');
    await waitForState(target, 'Idle state: idle, unlocked.');

    await selectOption(select, 'none');
    await waitForState(target, 'Idle state: active, unlocked.');
  });

  async function selectOption(select: JSHandle<HTMLSelectElement>, value: string) {
    await select.evaluate((node, _value) => {
      node.value = _value;
      const e = document.createEvent('HTMLEvents');
      e.initEvent('change', false, true);
      node.dispatchEvent(e);
    }, value);
  }

  async function waitForState(target: Page, state: string) {
    await target.waitForFunction(_state => {
      const stateEl = document.getElementById('state');
      return _state === (stateEl ? stateEl.innerText : '');
    }, undefined, state);
  }
});
