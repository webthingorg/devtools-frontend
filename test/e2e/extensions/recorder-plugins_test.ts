// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';

import {
  getBrowserAndPages,
} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {getResourcesPathWithDevToolsHostname, loadExtension} from '../helpers/extension-helpers.js';

describe('RecorderExtension', () => {
  it('can load an extension', async () => {
    const {frontend} = getBrowserAndPages();
    await loadExtension(
        'TestExtension', `${getResourcesPathWithDevToolsHostname()}/extensions/recorder_extension.html`);

    // Reaching out into the RecorderPluginManager through a dynamic import since there is no
    // UI part for the recorder extensions.
    const result = await frontend.evaluate(`
      import('/front_end/models/extensions/extensions.js').then(async (extensions) => {
        const manager = extensions.RecorderPluginManager.RecorderPluginManager.instance();
        return {
          length: manager.plugins().length,
          stringified: await manager.plugins()[0].stringify({
            name: 'test',
            steps: [],
          })
        }
      });
    `);
    assert.deepStrictEqual(result, {length: 1, stringified: '{"name":"test","steps":[]}'});
  });
});
