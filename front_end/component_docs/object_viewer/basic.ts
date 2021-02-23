// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as FrontendHelpers from '../../../test/unittests/front_end/helpers/EnvironmentHelpers.js';
import * as ComponentHelpers from '../../component_helpers/component_helpers.js';
import * as Components from '../../ui/components/components.js';

await ComponentHelpers.ComponentServerSetup.setup();
await FrontendHelpers.initializeGlobalVars();

const component = new Components.ObjectViewer.ObjectViewer();
const objectToView = {
  name: 'jack',
  favourites: {
    colour: 'orange',
    fruit: 'apple',
    number: 9,
  },
  friends: [
    'Paul',
    'Tim',
    'Andres',
    ['bob'],
  ],
};
component.data = {
  object: objectToView,
};

document.getElementById('container')?.appendChild(component);
