// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as EditDOMTestRunner from './EditDOMTestRunner.js';
import * as ElementsPanelShadowSelectionOnRefreshTestRunner from './ElementsPanelShadowSelectionOnRefreshTestRunner.js';
import * as ElementsTestRunnerModule from './ElementsTestRunner.js';
import * as SetOuterHTMLTestRunner from './SetOuterHTMLTestRunner.js';
import * as StylesUpdateLinksTestRunner from './StylesUpdateLinksTestRunner.js';

export const ElementsTestRunner = {
  ...ElementsTestRunnerModule,
  ...EditDOMTestRunner,
  ...SetOuterHTMLTestRunner,
  ...ElementsPanelShadowSelectionOnRefreshTestRunner,
  ...StylesUpdateLinksTestRunner,
};
