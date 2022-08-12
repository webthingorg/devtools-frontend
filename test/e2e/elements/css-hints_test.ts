// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';

import {
  enableExperiment,
  getBrowserAndPages,
  goToResource,
} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {
  focusCSSPropertyValue,
  getPropertiesWithHints,
  waitForAndClickTreeElementWithPartialText,
  waitForElementsStyleSection,
  waitForPartialContentOfSelectedElementsNode,
  waitForStyleRule,
} from '../helpers/elements-helpers.js';

const goToResourceAndWaitForStyleSection = async (path: string) => {
  await goToResource(path);
  await waitForElementsStyleSection();
  await waitForPartialContentOfSelectedElementsNode('<body>\u200B');
};

describe('CSS hints in the Styles panel', async () => {
  it('can detect inactive CSS', async () => {
    await enableExperiment('cssAuthoringHints');

    await goToResourceAndWaitForStyleSection('elements/inactive-css-page.html');
    await waitForStyleRule('body');
    await waitForAndClickTreeElementWithPartialText('wrapper');
    await waitForStyleRule('#wrapper');

    const propertiesWithHints = await getPropertiesWithHints();
    assert.deepEqual(propertiesWithHints, ['align-content']);
  });

  it('does not show authoring hint when property value is invalid', async () => {
    await enableExperiment('cssAuthoringHints');

    await goToResourceAndWaitForStyleSection('elements/inactive-css-with-invalid-value.html');
    await waitForStyleRule('body');
    await waitForAndClickTreeElementWithPartialText('wrapper');
    await waitForStyleRule('#wrapper');

    const propertiesWithHints = await getPropertiesWithHints();
    assert.deepEqual(propertiesWithHints, []);
  });

  it('updates the hint if the styles are edited', async () => {
    const {frontend} = getBrowserAndPages();
    await enableExperiment('cssAuthoringHints');

    await goToResourceAndWaitForStyleSection('elements/inactive-css-page.html');
    await waitForStyleRule('body');
    await waitForAndClickTreeElementWithPartialText('wrapper');
    await waitForStyleRule('#wrapper');

    assert.deepEqual(await getPropertiesWithHints(), ['align-content']);

    await focusCSSPropertyValue('#wrapper', 'flex-wrap');
    await frontend.keyboard.type('wrap', {delay: 100});
    await frontend.keyboard.press('Enter');

    assert.deepEqual(await getPropertiesWithHints(), []);
  });
});
