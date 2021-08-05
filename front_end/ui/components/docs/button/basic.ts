// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as FrontendHelpers from '../../../../../test/unittests/front_end/helpers/EnvironmentHelpers.js';
import * as Buttons from '../../buttons/buttons.js';
import * as ComponentHelpers from '../../helpers/helpers.js';

await ComponentHelpers.ComponentServerSetup.setup();
await FrontendHelpers.initializeGlobalVars();

function appendButton(button: Buttons.Button.Button): void {
  document.querySelector('#container')?.appendChild(button);
}

// Primary
const primaryButton = new Buttons.Button.Button();
primaryButton.innerText = 'Click me';
primaryButton.onclick = () => alert('clicked');
appendButton(primaryButton);

// Secondary
const secondaryButton = new Buttons.Button.Button();
secondaryButton.innerText = 'Click me';
secondaryButton.onclick = () => alert('clicked');
secondaryButton.primary = false;
appendButton(secondaryButton);

// Icon
const iconButton = new Buttons.Button.Button();
iconButton.innerText = 'Click me';
iconButton.iconUrl =
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDZIMTFWMTEuNUg1LjVWMTIuNUgxMVYxOEgxMlYxMi41SDE3LjVWMTEuNUgxMlY2WiIgZmlsbD0iYmxhY2siLz4KPC9zdmc+Cg==';
iconButton.onclick = () => alert('clicked');
appendButton(iconButton);
