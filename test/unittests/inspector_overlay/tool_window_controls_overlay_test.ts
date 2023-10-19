// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import {
  hideElement,
  revealElement,
  createDivOfIcons,
  createHiddenToolBarRow,
} from '../../../inspector_overlay/tool_window_controls_overlay.js';

describe('tool window controls overlay test', () => {
  it('should add "hidden" class to the element', () => {
    const element = document.createElement('div');
    hideElement(element);

    assert.isTrue(element.classList.contains('hidden'), 'Expect the element to have the "hidden" class');
  });

  it('should remove "hidden" class from the element', () => {
    const element = document.createElement('div');
    element.classList.add('hidden');
    revealElement(element);

    assert.isTrue(!element.classList.contains('hidden'), 'Expect the element not to have the "hidden" class');
  });

  it('should create a div with icons', () => {
    const icons = ['icon1', 'icon2', 'icon3'];
    const toolbar = createDivOfIcons(icons);

    assert.strictEqual(
        toolbar.children.length, icons.length, 'Expect the created div to have the expected number of children');

    Array.from(toolbar.children).forEach(icon => {
      assert.isTrue(icon.classList.contains('image'), 'Expect each child to have the "image" class');
    });
  });

  it('should create a hidden toolbar row with icons', () => {
    const osType = 'windows';
    const location = 'right';
    const icons = ['icon1', 'icon2', 'icon3'];
    const toolbar = createHiddenToolBarRow(osType, location, icons);

    // Expect the created toolbar to have the expected class names
    assert.isTrue(toolbar.classList.contains('image-group'));
    assert.isTrue(toolbar.classList.contains(`image-group-${location}`));
    assert.isTrue(toolbar.classList.contains(`${osType}-${location}-image-group`));
    assert.isTrue(toolbar.classList.contains('hidden'));

    assert.strictEqual(
        toolbar.children.length, icons.length, 'Expect the created toolbar to contain the expected number of icons');
  });
});
