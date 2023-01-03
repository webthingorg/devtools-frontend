// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as IconButton from '../../../../../front_end/ui/components/icon_button/icon_button.js';
import * as UI from '../../../../../front_end/ui/legacy/legacy.js';
import {assertShadowRoot, renderElementIntoDOM, resetTestDOM} from '../../helpers/DOMHelpers.js';

const renderIcon = (data: IconButton.Icon.IconData): {shadowRoot: IconButton.Icon.Icon} => {
  const iconComponent = new IconButton.Icon.Icon();
  iconComponent.data = data;
  renderElementIntoDOM(iconComponent);
  assertShadowRoot(iconComponent.shadowRoot);
  return {shadowRoot: iconComponent};
};

describe('Icon component', () => {
  it.only('captures loading time with icon component and separate icon .svg files', async () => {
    // Measure loading time of separate icons
    const startTime = window.performance.now();
    for (let i = 0; i < 42; i++) {
      if (i < 40) {
        const smallIcon: IconButton.Icon.IconWithName = {
          iconName: 'ic_' + i,
          color: '#4c8bf5',
          width: '18px',
          height: '18px',
        };
        renderIcon(smallIcon);
        resetTestDOM();
      }
      const mediumIcon: IconButton.Icon.IconWithName = {
        iconName: 'medium_' + i,
        color: '#4c8bf5',
        width: '18px',
        height: '18px',
      };
      renderIcon(mediumIcon);
      resetTestDOM();
    }
    const loadTime = window.performance.now() - startTime;
    console.log('Separate icons loading time: ' + loadTime + ' ms');

    // Measure loading time of sprite sheet icons
    const iconNames = [
      'smallicon-bezier',
      'smallicon-checkmark',
      'smallicon-checkmark-square',
      'smallicon-checkmark-behind',
      'smallicon-command-result',
      'smallicon-contrast-ratio',
      'smallicon-cross',
      'smallicon-device',
      'smallicon-error',
      'smallicon-expand-less',
      'smallicon-expand-more',
      'smallicon-green-arrow',
      'smallicon-green-ball',
      'smallicon-info',
      'smallicon-inline-breakpoint-conditional',
      'smallicon-inline-breakpoint',
      'smallicon-no',
      'smallicon-orange-ball',
      'smallicon-red-ball',
      'smallicon-shadow',
      'smallicon-step-in',
      'smallicon-step-out',
      'smallicon-text-prompt',
      'smallicon-thick-left-arrow',
      'smallicon-thick-right-arrow',
      'smallicon-triangle-down',
      'smallicon-triangle-right',
      'smallicon-triangle-up',
      'smallicon-user-command',
      'smallicon-warning',
      'smallicon-network-product',
      'smallicon-clear-warning',
      'smallicon-clear-info',
      'smallicon-clear-error',
      'smallicon-account-circle',
      'smallicon-videoplayer-paused',
      'smallicon-videoplayer-playing',
      'smallicon-videoplayer-destroyed',
      'smallicon-issue-yellow-text',
      'smallicon-issue-blue-text',
      'mediumicon-clear-storage',
      'mediumicon-cookie',
      'mediumicon-database',
      'mediumicon-info',
      'mediumicon-manifest',
      'mediumicon-service-worker',
      'mediumicon-table',
      'mediumicon-arrow-in-circle',
      'mediumicon-file-sync',
      'mediumicon-file',
      'mediumicon-gray-cross-active',
      'mediumicon-gray-cross-hover',
      'mediumicon-red-cross-active',
      'mediumicon-red-cross-hover',
      'mediumicon-search',
      'mediumicon-replace',
      'mediumicon-account-circle',
      'mediumicon-warning-triangle',
      'mediumicon-error-circle',
      'mediumicon-info-circle',
      'mediumicon-bug',
      'mediumicon-list',
      'mediumicon-warning',
      'mediumicon-sync',
      'mediumicon-fetch',
      'mediumicon-cloud',
      'mediumicon-bell',
      'mediumicon-payment',
      'mediumicon-schedule',
      'mediumicon-frame',
      'mediumicon-frame-embedded',
      'mediumicon-frame-opened',
      'mediumicon-frame-embedded-blocked',
      'mediumicon-frame-blocked',
      'mediumicon-elements-panel',
      'mediumicon-network-panel',
      'mediumicon-sources-panel',
      'mediumicon-frame-top',
      'mediumicon-checkmark',
      'mediumicon-not-available',
      'mediumicon-warning-circle',
      'mediumicon-feedback',
    ];
    const spriteStartTime = window.performance.now();
    iconNames.forEach(name => {
      const icon = UI.Icon.Icon.create(name);
      renderElementIntoDOM(icon);
      resetTestDOM();
    });
    const spriteLoadTime = window.performance.now() - spriteStartTime;
    console.log('Sprite sheet icons loading time: ' + spriteLoadTime + ' ms');
  });
});
