// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assertNotNullOrUndefined} from '../../../../../front_end/core/platform/platform.js';
import * as IconButton from '../../../../../front_end/ui/components/icon_button/icon_button.js';
import {assertElement, assertElements, assertShadowRoot, renderElementIntoDOM} from '../../helpers/DOMHelpers.js';

const {assert} = chai;

const renderIcon = (data: IconButton.Icon.IconData): {shadowRoot: IconButton.Icon.Icon} => {
  const iconComponent = new IconButton.Icon.Icon();
  iconComponent.data = data;
  renderElementIntoDOM(iconComponent);
  assertShadowRoot(iconComponent.shadowRoot);
  return {shadowRoot: iconComponent};
};

const loadIcon = async(shadowRoot: IconButton.Icon.Icon): Promise<void> => {
  console.log(shadowRoot);
  const icon = shadowRoot.shadowRoot;  // ?.querySelector('div');
  // assertElement(icon, IconButton.Icon.Icon);
  console.log(icon?.firstElementChild);
};

describe('IconButton', () => {
  it.only('captures loading time with icon component and separate icon .svg files', async () => {
    for (let i = 0; i < 1; i++) {
      const smallIcon: IconButton.Icon.IconWithName = {
        iconName: 'ic_' + i,
        color: '#4c8bf5',
        width: '10px',
        height: '10px',
      };
      const {shadowRoot} = renderIcon(smallIcon);
      await loadIcon(shadowRoot);
    }
  });
});
