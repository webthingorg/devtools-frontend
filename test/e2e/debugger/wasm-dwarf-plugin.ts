// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import {describe, it} from 'mocha';

import {$, getBrowserAndPages, getElementPosition, resetPages, resourcesPath} from '../helper.js';

describe('The Wasm CXX+DWARF Debugger Plugin', async () => {
  beforeEach(async () => {
    await resetPages();
  });

  it('shows files', async () => {
    const globalThis: any = global;
    const {target, frontend} = getBrowserAndPages();

    await frontend.evaluate(() => {
      globalThis.Root.Runtime.experiments.setEnabled('wasmDWARFDebugging', true);
    });

    console.log(await frontend.evaluate(() => globalThis.Root.Runtime.experiments.isEnabled('wasmDWARFDebugging')));

    // Have the target load the page.
    await target.goto(`${resourcesPath}/wasm/global.html`);

    // Locate the button for switching to the source tab.
    const sourceTabButtonLocation = await getElementPosition('#tab-sources');
    if (!sourceTabButtonLocation) {
      assert.fail('Unable to locate sources tab button.');
    }

    // Switch to the source tab
    await frontend.mouse.click(sourceTabButtonLocation.x, sourceTabButtonLocation.y);
    console.log('foo');
    await frontend.waitForSelector('.tree-outline');

    // Get source files
    const files = await frontend.evaluate(() => {
      return document.querySelectorAll('.tree-element-title');
    });

    // Count file entries from the dwarf symbols
    let global_c_count = 0;
    files.forEach((value, key, parent) => {
      if (value.textContent == 'global.c')
        global_c_count++;
    });

    assert.equal(global_c_count, 1, 'Expected there to be exactly one source file in the wasm');
  });
});
