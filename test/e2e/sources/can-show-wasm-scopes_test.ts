// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import {describe, it} from 'mocha';

import {$$, click, getBrowserAndPages, waitFor} from '../../shared/helper.js';
import {addBreakpointForLine, openFileInEditor, openFileInSourcesPanel, RESUME_BUTTON} from '../helpers/sources-helpers.js';

describe('Source Tab', async () => {
  beforeEach(async function() {
    const {target, frontend} = getBrowserAndPages();
    await openFileInSourcesPanel(target, 'wasm/scopes.html');
    await openFileInEditor(target, 'scopes.wasm');
    await addBreakpointForLine(frontend, 16);
  });

  it('shows the module, local, and stack scope while pausing', async () => {
    const {target} = getBrowserAndPages();
    const scriptEvaluation = target.evaluate('main(42);');
    await waitFor('.paused-status');

    const scopeElements = await $$('.scope-chain-sidebar-pane-section-title');
    const scopeTitles = await scopeElements.evaluate(nodes => nodes.map((n: HTMLElement) => n.textContent));
    assert.deepEqual(scopeTitles, ['Module', 'Local', 'Stack']);

    await click(RESUME_BUTTON);
    await scriptEvaluation;
  });

  it('correctly shows local scope content.', async () => {
    const {target} = getBrowserAndPages();
    const scriptEvaluation = target.evaluate('main(42);');
    await waitFor('.paused-status');

    const localScopeSelector = '[aria-label="Local"]';
    const valueSelector = `${localScopeSelector} + ol .name-and-value`;

    const localValues = await (await $$(valueSelector)).evaluate(nodes => nodes.map((n: HTMLElement) => n.textContent));
    assert.deepEqual(localValues, ['locals: {i32: 42, i64_var: 9221120237041090, f32_var: 5.5, f64_var: 2.23e-11}']);

    await click(RESUME_BUTTON);
    await scriptEvaluation;
  });
});
