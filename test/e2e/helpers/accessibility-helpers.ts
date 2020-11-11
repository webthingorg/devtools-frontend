// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.


import {assert} from 'chai';
import {performance} from 'perf_hooks';
import * as puppeteer from 'puppeteer';

import {goToResource} from '../../shared/helper.js';

export const loadAccessibilityPanel = async () => {
  await goToResource('elements/accessibility-pane.html');
};
