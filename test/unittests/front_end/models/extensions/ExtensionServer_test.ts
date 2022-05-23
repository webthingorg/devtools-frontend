// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Extensions from '../../../../../front_end/models/extensions/extensions.js';

const {assert} = chai;

describe('Extensions', () => {
  it('can register a recorder extension', async () => {
    const server = Extensions.ExtensionServer.ExtensionServer.instance({forceNew: true});
    const extensionDescriptor = {
      startPage: 'blank.html',
      name: 'TestExtension',
      exposeExperimentalAPIs: true,
    };
    server.addExtensionForTest(extensionDescriptor, window.location.origin);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chrome: any = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).chrome = chrome;

    self.injectedExtensionAPI(extensionDescriptor, 'main', 'dark', [], () => {}, 1, window);

    class RecorderPlugin {
      async stringify(recording: object) {
        return JSON.stringify(recording);
      }
    }
    await chrome.devtools.recorderServices.registerRecorderExtensionPlugin(new RecorderPlugin(), 'Test');

    const manager = Extensions.RecorderPluginManager.RecorderPluginManager.instance();
    assert.strictEqual(manager.plugins().length, 1);
    const plugin = manager.plugins()[0];

    const result = await plugin.stringify({
      name: 'test',
      steps: [],
    });

    assert.strictEqual(manager.plugins().length, 1);
    assert.deepStrictEqual(result, '{"name":"test","steps":[]}');
  });
});
