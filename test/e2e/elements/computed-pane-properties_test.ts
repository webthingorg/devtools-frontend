// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {describe, it} from 'mocha';

import {getBrowserAndPages, resourcesPath} from '../../shared/helper.js';
import {navigateToSidePane, waitForComputedProperty, waitForElementsComputedSection} from '../helpers/elements-helpers.js';

describe('The Computed pane', async () => {
  it('can display the CSS properties of the selected element', async () => {
    const {target, frontend} = getBrowserAndPages();

    await target.goto(`${resourcesPath}/elements/simple-styled-page.html`);
    await navigateToSidePane('Computed');
    await waitForElementsComputedSection();

    // Select the H1 element by pressing down, since <body> is the default selected element.
    const onColorPropertyAppeared = waitForComputedProperty('color', 'rgb(255, 0, 102)');
    await frontend.keyboard.press('ArrowDown');
    await onColorPropertyAppeared;

    // Select the H2 element by pressing down.
    const onBackgroundPropertyAppeared = waitForComputedProperty('background-color', 'rgb(255, 215, 0)');
    await frontend.keyboard.press('ArrowDown');
    await onBackgroundPropertyAppeared;
  });
});
