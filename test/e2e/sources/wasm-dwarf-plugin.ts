// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import {describe, it} from 'mocha';

import {$, getBrowserAndPages, getElementPosition, resetPages, resourcesPath} from '../../shared/helper.js';

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

    // Locate the button for switching to the source tab.
    const sourceTabButtonLocation = await getElementPosition('#tab-sources');
    if (!sourceTabButtonLocation) {
      assert.fail('Unable to locate sources tab button.');
    }

    // Switch to the source tab
    await frontend.mouse.click(sourceTabButtonLocation.x, sourceTabButtonLocation.y);
    const navpane = await frontend.waitForSelector('.navigator-tabbed-pane div[aria-label="Page panel"] div.vbox');
    const tree = (await $('.tree-outline', navpane)).asElement();
    const tree_entries = await tree.$$eval('span.tree-element-title', nodes => nodes.map(n => n.innerHTML));

    // Count tree entries from the dwarf symbols
    let global_c_count = 0;
    tree_entries.forEach((value, key, parent) => {
      if (value.endsWith('mock.c')) {
        global_c_count++;
      }
    });

    assert.equal(global_c_count, 1, 'Expected there to be exactly one source file in the wasm module.');
  });
});
