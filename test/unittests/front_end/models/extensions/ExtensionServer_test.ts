// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as Platform from '../../../../../front_end/core/platform/platform.js';
import * as SDK from '../../../../../front_end/core/sdk/sdk.js';
import * as Extensions from '../../../../../front_end/models/extensions/extensions.js';

const {assert} = chai;

<<<<<<< HEAD   (5022d7 [M108-LTS] Add url pattern parsing for extensions)
import {describeWithDummyExtension} from './helpers.js';
=======
import {describeWithDevtoolsExtension} from './helpers.js';
import {type Chrome} from '../../../../../extension-api/ExtensionAPI.js';
import {createTarget} from '../../helpers/EnvironmentHelpers.js';
import {describeWithMockConnection} from '../../helpers/MockConnection.js';
>>>>>>> CHANGE (2d19bc Apply runtime_blocked_hosts and runtime_allowed_hosts for ex)

<<<<<<< HEAD   (5022d7 [M108-LTS] Add url pattern parsing for extensions)
describeWithDummyExtension('Extensions', context => {
  it('can register a recorder extension', async () => {
=======
describeWithDevtoolsExtension('Extensions', {}, context => {
  it('can register a recorder extension for export', async () => {
>>>>>>> CHANGE (2d19bc Apply runtime_blocked_hosts and runtime_allowed_hosts for ex)
    class RecorderPlugin {
      async stringify(recording: object) {
        return JSON.stringify(recording);
      }
      async stringifyStep(step: object) {
        return JSON.stringify(step);
      }
    }
    await context.chrome.devtools?.recorder.registerRecorderExtensionPlugin(
        new RecorderPlugin(), 'Test', 'text/javascript');

    const manager = Extensions.RecorderPluginManager.RecorderPluginManager.instance();
    assert.strictEqual(manager.plugins().length, 1);
    const plugin = manager.plugins()[0];

    const result = await plugin.stringify({
      name: 'test',
      steps: [],
    });

    const stepResult = await plugin.stringifyStep({
      type: 'scroll',
    });

    assert.strictEqual(manager.plugins().length, 1);
    assert.strictEqual(manager.plugins()[0].getMediaType(), 'text/javascript');
    assert.strictEqual(manager.plugins()[0].getName(), 'Test');
    assert.deepStrictEqual(result, '{"name":"test","steps":[]}');
    assert.deepStrictEqual(stepResult, '{"type":"scroll"}');
  });
});

const hostsPolicy = {
  runtimeAllowedHosts: ['http://example.com'],
  runtimeBlockedHosts: ['http://example.com', 'http://web.dev'],
};

describeWithMockConnection('Extensions', () => {
  describeWithDevtoolsExtension('Runtime hosts policy', {hostsPolicy}, context => {
    it('blocks API calls on blocked hosts', async () => {
      const target = createTarget({type: SDK.Target.Type.Frame});

      {
        const result = await new Promise<object>(cb => context.chrome.devtools?.network.getHAR(cb));
        assert.strictEqual('isError' in result && result.isError, true);
      }

      target.setInspectedURL('http://web.dev' as Platform.DevToolsPath.UrlString);
      {
        const result = await new Promise<object>(cb => context.chrome.devtools?.network.getHAR(cb));
        assert.strictEqual('isError' in result && result.isError, true);
      }
    });

    it('allows API calls on allowlisted hosts', async () => {
      const target = createTarget({type: SDK.Target.Type.Frame});
      target.setInspectedURL('http://example.com' as Platform.DevToolsPath.UrlString);
      {
        const result = await new Promise<object>(cb => context.chrome.devtools?.network.getHAR(cb));
        // eslint-disable-next-line rulesdir/compare_arrays_with_assert_deepequal
        assert.doesNotHaveAnyKeys(result, ['isError']);
      }
    });

    it('allows API calls on non-blocked hosts', async () => {
      const target = createTarget({type: SDK.Target.Type.Frame});
      target.setInspectedURL('http://example.com2' as Platform.DevToolsPath.UrlString);
      {
        const result = await new Promise<object>(cb => context.chrome.devtools?.network.getHAR(cb));
        // eslint-disable-next-line rulesdir/compare_arrays_with_assert_deepequal
        assert.doesNotHaveAnyKeys(result, ['isError']);
      }
    });
  });
});

describe('ExtensionServer', () => {
  it('can correctly expand resource paths', async () => {
    // Ideally this would be a chrome-extension://, but that doesn't work with URL in chrome headless.
    const extensionOrigin = 'chrome://abcdef' as Platform.DevToolsPath.UrlString;
    const almostOrigin = `${extensionOrigin}/` as Platform.DevToolsPath.UrlString;
    const expectation = `${extensionOrigin}/foo` as Platform.DevToolsPath.UrlString;
    assert.strictEqual(
        undefined,
        Extensions.ExtensionServer.ExtensionServer.expandResourcePath(extensionOrigin, 'http://example.com/foo'));
    assert.strictEqual(
        expectation, Extensions.ExtensionServer.ExtensionServer.expandResourcePath(extensionOrigin, expectation));
    assert.strictEqual(
        expectation, Extensions.ExtensionServer.ExtensionServer.expandResourcePath(extensionOrigin, '/foo'));
    assert.strictEqual(
        expectation, Extensions.ExtensionServer.ExtensionServer.expandResourcePath(extensionOrigin, 'foo'));

    assert.strictEqual(
        undefined,
        Extensions.ExtensionServer.ExtensionServer.expandResourcePath(almostOrigin, 'http://example.com/foo'));
    assert.strictEqual(
        expectation, Extensions.ExtensionServer.ExtensionServer.expandResourcePath(almostOrigin, expectation));
    assert.strictEqual(
        expectation, Extensions.ExtensionServer.ExtensionServer.expandResourcePath(almostOrigin, '/foo'));
    assert.strictEqual(expectation, Extensions.ExtensionServer.ExtensionServer.expandResourcePath(almostOrigin, 'foo'));
  });
});
