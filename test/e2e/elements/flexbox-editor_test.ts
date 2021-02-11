// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';

import {$$, getBrowserAndPages, goToResource, waitFor} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {getCSSPropertyInRule, waitForContentOfSelectedElementsNode, waitForCSSPropertyValue} from '../helpers/elements-helpers.js';

describe('Flexbox Editor', async function() {
  beforeEach(async function() {
    const {frontend} = getBrowserAndPages();

    await goToResource('elements/flexbox-editor.html');
    await waitForContentOfSelectedElementsNode('<body>\u200B');
    await frontend.keyboard.press('ArrowDown');
    await waitForCSSPropertyValue('#target', 'display', 'flex');
  });

  it('can be opened and flexbox styles can be edited', async () => {
    const flexboxEditorButtons = await $$('.flex-editor-button');
    assert.deepEqual(flexboxEditorButtons.length, 1);
    const flexboxEditorButton = flexboxEditorButtons[0];
    flexboxEditorButton.click();
    await waitFor('devtools-flexbox-editor');
    const directionColumnButtons = await $$('[title="Add flex-direction: column"]');
    assert.strictEqual(directionColumnButtons.length, 1);
    const directionColumnButton = directionColumnButtons[0];
    directionColumnButton.click();
    await waitForCSSPropertyValue('#target', 'flex-direction', 'column');
    directionColumnButton.click();
    await waitFor('[title="Add flex-direction: column"]');
    const property = await getCSSPropertyInRule('#target', 'flex-direction');
    assert.isUndefined(property);
  });
});
