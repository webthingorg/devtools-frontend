// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import {describe, it} from 'mocha';
import * as puppeteer from 'puppeteer';

import {$$, click, debuggerStatement, getBrowserAndPages, resetPages, resourcesPath, waitFor} from '../../shared/helper.js';

// TODO: Remove once Chromium updates its version of Node.js to 12+.
const globalThis: any = global;


describe('The Wasm CXX+DWARF Debugger Plugin', async () => {
  before(async () => {
    await resetPages('wasmDWARFDebugging');
    const {frontend} = getBrowserAndPages();
    await frontend.evaluate(() => {
      /* eslint-disable @typescript-eslint/no-unused-vars */
      globalThis.MockLanguagePluginBase = class {
        handleScript(script: any) {
          return script.sourceMapURL.startsWith('wasm://');
        }
        async addRawModule(rawModuleId: any, symbols: any, rawModule: any) {
          return [];
        }

        /* async */ sourceLocationToRawLocation(sourceLocation: any) {
          return null;
        }

        /* async */ rawLocationToSourceLocation(rawLocation: any) {
          return null;
        }

        async listVariablesInScope(rawLocation: any) {
          return null;
        }

        async evaluateVariable(name: any, location: any) {
          return null;
        }

        dispose() {
        }
      };
      /* eslint-enable @typescript-eslint/no-unused-vars */

      globalThis.installMockPlugin = function(plugin: any) {
        const bindings = globalThis.Bindings.debuggerWorkspaceBinding;
        const models = Array.from(bindings._debuggerModelToData.keys());
        for (const debuggerModel of models) {
          const pluginManager = bindings.getLanguagePluginManager(debuggerModel);
          pluginManager.clearPlugins();
          pluginManager.addPlugin(plugin);
        }
      };
    });
  });

  // Test whether source files provided by the plugin show up in the nav pane
  it('shows all source files ', async () => {
    const {target, frontend} = getBrowserAndPages();
    await frontend.evaluate(() => {
      class SingleFilePlugin extends globalThis.MockLanguagePluginBase {
        async addRawModule(
            rawModuleId: any, symbols: any, rawModule: any) {  // eslint-disable-line @typescript-eslint/no-unused-vars
          return ['mock.c'];
        }
      }
      globalThis.installMockPlugin(new SingleFilePlugin());
    });

    // Have the target load the page.
    await target.goto(`${resourcesPath}/wasm/global.html`);

    // Browse to the sources tab
    await click('#tab-sources');

    // Wait for the navigator panel to appear
    await waitFor('.navigator-file-tree-item');


    const treeEntries = await $$('.navigator-file-tree-item .tree-element-title');

    const treeElements = await treeEntries.getProperties();
    await debuggerStatement(frontend);

    const fileNames =
        await Promise.all(Array.from(treeElements.values()).map(async (element: puppeteer.JSHandle<Element>) => {
          const theElement = element.asElement();
          if (theElement) {
            const textContent = await theElement.getProperty('textContent');
            return textContent.jsonValue();
          }
        }));

    assert.deepEqual(fileNames, [
      'global.html',
      'global.wasm',
      'mock.c',
    ]);
  });
});
