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
  // `containerText` and `containerId` are simple strings that can change over time.
  // As such we need to implement  them as accessors and forward the "real thing" from
  // SetOuterHTMLTestRunner instead of a copy at "spread time".
  get containerText() {
    return SetOuterHTMLTestRunner.containerText;
  },
  get containerId() {
    return SetOuterHTMLTestRunner.containerId;
  },
};
