// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import type {Chrome} from '../../../extension-api/ExtensionAPI.js';
import {loadExtension} from '../helpers/extension-helpers.js';
import * as Sources from '../helpers/sources-helpers.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {getBrowserAndPages, getResourcesPath} from '../../shared/helper.js';

describe('The Extension API', async () => {
  it('can open wasm resources with offset', async () => {
    const {target} = getBrowserAndPages();
    await target.goto(`${getResourcesPath()}/sources/wasm/scopes.html`);

    const extensions = await loadExtension('TestExtension');
    assert.deepEqual(extensions.length, 1);
    const extension = extensions[0];

    const resource = `${getResourcesPath()}/sources/wasm/scopes.wasm`;

    await extension.waitForFunction(async (resource: string) => {
      const resources =
          await new Promise<Chrome.DevTools.Resource[]>(r => window.chrome.devtools.inspectedWindow.getResources(r));
      return resources.find(r => r.url === resource);
    }, undefined, resource);

    // Accepts a wasm offset as column
    await extension.evaluate(resource => window.chrome.devtools.panels.openResource(resource, 0, 0x4b), resource);
    await Sources.waitForHighlightedLine(0x4b);

    // Selects the right wasm line on an inexact match
    await extension.evaluate(resource => window.chrome.devtools.panels.openResource(resource, 0, 0x4e), resource);
    await Sources.waitForHighlightedLine(0x4d);

    // Accepts a missing columnNumber
    await extension.evaluate(resource => window.chrome.devtools.panels.openResource(resource, 0), resource);
    await Sources.waitForHighlightedLine(0);

    // Accepts a wasm offset as column and a callback
    {
      const r = await extension.evaluate(
          resource => new Promise(r => window.chrome.devtools.panels.openResource(resource, 0, 0x4b, () => r(1))),
          resource);
      assert.deepEqual(r, 1);
    }
    await Sources.waitForHighlightedLine(0x4b);

    // Is backwards compatible: accepts a callback with a missing columnNumber
    {
      const r = await extension.evaluate(
          // @ts-expect-error Legacy API
          resource => new Promise(r => window.chrome.devtools.panels.openResource(resource, 0, () => r(1))), resource);
      assert.deepEqual(r, 1);
    }
    await Sources.waitForHighlightedLine(0);
  });
});
