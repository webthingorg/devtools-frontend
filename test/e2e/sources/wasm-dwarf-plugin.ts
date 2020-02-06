// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import {describe, it} from 'mocha';
import * as puppeteer from 'puppeteer';

import {$$, click, debuggerStatement, getBrowserAndPages, resetPages, resourcesPath, waitFor} from '../../shared/helper.js';

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

    // Wait for the navigation panel to show up
    await waitFor('.navigator-file-tree-item');

    await debuggerStatement(frontend);

    const treeEntries = await $$('.navigator-file-tree-item .tree-element-title');

    const treeElements = await treeEntries.getProperties();
    await debuggerStatement(frontend);

    const fileNames =
        await Promise.all(Array.from(treeElements.values()).map(async (element: puppeteer.JSHandle<Element>) => {
          const textContent = await element.asElement().getProperty('textContent')

          return textContent.jsonValue();
        }));

    assert.deepEqual(fileNames, [
      `global.html`,
      `global.wasm`,
      `mock.c`,
    ]);
  });
});
