// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import {describe, it} from 'mocha';

import {$, click, getConsoleMessages, getBrowserAndPages, getElementPosition, resetPages, resourcesPath} from '../../shared/helper.js';

function patchFrontendPlugins(frontend) {
  return frontend.evaluate(() => {
    class MockLanguagePlugin {
      handleScript(script) {
        return script.sourceMapURL.startsWith('wasm://');
      }

      async addRawModule(rawModuleId, symbols, rawModule) {
        return ['mock.c'];
      }

      /* async */ sourceLocationToRawLocation(sourceLocation) {
        return null;
      }

      /* async */ rawLocationToSourceLocation(rawLocation) {
        return null;
      }

      async listVariablesInScope(rawLocation) {
        return null;
      }

      async evaluateVariable(name, location) {
        return null;
      }

      dispose() {
      }
    }

    const bindings = globalThis.Bindings.debuggerWorkspaceBinding;
    const models = Array.from(bindings._debuggerModelToData.keys());
    for (const debuggerModel of models) {
      const pluginManager = bindings.getLanguagePluginManager(debuggerModel);
      pluginManager.clearPlugins();
      pluginManager.addPlugin(new MockLanguagePlugin());
    }
  });
}

describe('The Wasm CXX+DWARF Debugger Plugin', async () => {
  beforeEach(async () => {
    await resetPages('wasmDWARFDebugging');
    const {frontend} = getBrowserAndPages();
    await patchFrontendPlugins(frontend);
  });

  it('shows files', async () => {
    const {target, frontend} = getBrowserAndPages();

    // Have the target load the page.
    await target.goto(`${resourcesPath}/wasm/global.html`);

    // Browse to the sources tab
    await click('#tab-sources');

    const navpane = await frontend.waitForSelector('.navigator-tabbed-pane div[aria-label="Page panel"] div.vbox');
    const tree = (await $('.tree-outline', navpane)).asElement();
    const treeEntries = await tree.$$eval('span.tree-element-title', nodes => nodes.map(n => n.innerHTML));

    // Count tree entries from the dwarf symbols
    let filenameCount = 0;
    treeEntries.forEach((value, key, parent) => {
      if (value.endsWith('mock.c')) {
        filenameCount++;
      }
    });

    assert.equal(filenameCount, 1, 'Expected there to be exactly one source file in the wasm module.');
  });
});
