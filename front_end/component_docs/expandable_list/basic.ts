// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as FrontendHelpers from '../../../test/unittests/front_end/helpers/EnvironmentHelpers.js';

await FrontendHelpers.initializeGlobalVars();

const Resources = await import('../../resources/resources.js');

const component = new Resources.FrameDetailsView.ExpandableList();

const row1 = document.createElement('div');
row1.textContent = 'This is row 1. Click on the triangle icon to expand.';
component.appendChild(row1);

for (let rowNumber = 2; rowNumber < 11; rowNumber++) {
  const row = document.createElement('div');
  row.textContent = 'This is row ' + rowNumber;
  component.appendChild(row);
}

document.getElementById('container')?.appendChild(component);
