// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';

import {click, goToResource, step, waitFor} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {createSelectorsForFrameFile, createSelectorsForWorkerFile, openNestedWorkerFile} from '../helpers/sources-helpers.js';

describe('The Sources Tab', async function() {
  it('displays correct sources in the even when URLs clash', async () => {
    // Load the page into the target and open the Sources panel.
    await goToResource('sources/workers-url-clash.html');
    await click('#tab-sources');

    const mainFileSelector = createSelectorsForFrameFile('top', 'test/e2e/resources/sources', 'index.js');
    const workerFileSelector =
        createSelectorsForWorkerFile('workers-url-clash.worker.js', 'test/e2e/resources/sources', 'index.js');

    for (const {name, selector} of
             [{name: 'main', selector: mainFileSelector},
              {name: 'worker', selector: workerFileSelector},
    ]) {
      await step(`Open index.js in ${name}`, async () => {
        await openNestedWorkerFile(selector);
        const editorContent = await waitFor('.cm-content');
        const editorText = await editorContent.evaluate(n => n.textContent);
        assert.strictEqual(editorText, `console.log('Hello ${name}!')`);
        await click('[aria-label="Close index.js"]');
      });
    }
  });
});
