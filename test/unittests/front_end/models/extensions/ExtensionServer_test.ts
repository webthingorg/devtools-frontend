// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Extensions from '../../../../../front_end/models/extensions/extensions.js';

const {assert} = chai;

describe('Extensions', () => {
  it('can register a recorder extension', async () => {
    const server = Extensions.ExtensionServer.ExtensionServer.instance({forceNew: true});
    const channel = new MessageChannel();
    const sharedChannel = new MessageChannel();
    server.registerRecorderExtensionEndpoint(
        {
          command: Extensions.ExtensionAPI.PrivateAPI.Commands.RegisterRecorderExtensionPlugin,
          pluginName: 'Test',
          port: channel.port1,
        },
        sharedChannel.port1);
    channel.port2.onmessage = msg => {
      // This is the handler on the extension side.
      const message = msg.data;
      assert.strictEqual(message.method, 'stringify');
      const recording = message.parameters.recording;
      channel.port2.postMessage({
        requestId: message.requestId,
        result: JSON.stringify(recording),
      });
    };
    const manager = Extensions.RecorderPluginManager.RecorderPluginManager.instance();
    const plugin = manager.plugins()[0];

    const result = await plugin.stringify({
      name: 'test',
      steps: [],
    });

    assert.strictEqual(manager.plugins().length, 1);
    assert.deepStrictEqual(result, '{"name":"test","steps":[]}');
  });
});
