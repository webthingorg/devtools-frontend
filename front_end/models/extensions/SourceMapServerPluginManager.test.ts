// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import type * as Platform from '../../core/platform/platform.js';
import {createTarget, expectConsoleLogs} from '../../testing/EnvironmentHelpers.js';
import {
  describeWithDevtoolsExtension,
} from '../../testing/ExtensionHelpers.js';
import * as Extensions from '../extensions/extensions.js';

describeWithDevtoolsExtension('SourceMapServerPluginManager', {}, context => {
  expectConsoleLogs({
    warn: ['evaluate: the main frame is not yet available'],
    error: ['Extension server error: Object not found: <top>'],
  });
  beforeEach(() => {
    createTarget().setInspectedURL('http://example.com' as Platform.DevToolsPath.UrlString);
  });

  it('can register and unregister a SourceMapServerExtensionPlugin instance', async () => {
    class SourceMapServerExtensionPluginInstance {
      async loadSourceMap(sourceMapServerRequest: object) {
        return JSON.stringify(sourceMapServerRequest);
      }
    }
    const extensionPlugin = new SourceMapServerExtensionPluginInstance();
    await context.chrome.devtools?.debugger.sourceMapServerExtensions.registerSourceMapServerPlugin(
        extensionPlugin,
        'TestSourceMapServerExtensionPlugin',
    );

    const manager = Extensions.SourceMapServerPluginManager.SourceMapServerPluginManager.instance();

    await new Promise(resolve => setTimeout(resolve, 50));
    assert.strictEqual(manager.plugins().length, 1);
    const plugin = manager.plugins()[0];
    assert.strictEqual(plugin.name, 'TestSourceMapServerExtensionPlugin');

    await context.chrome.devtools?.debugger.sourceMapServerExtensions.unregisterSourceMapServerPlugin(
        extensionPlugin,
    );

    await new Promise(resolve => setTimeout(resolve, 50));
    assert.strictEqual(manager.plugins().length, 0);
  });
});
