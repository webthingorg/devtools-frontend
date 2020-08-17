// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {waitFor} from '../../shared/helper.js';

export const LAYERS_TAB_SELECTOR = '#tab-layers';

export async function getCurrentUrl() {
  const element = await waitFor('[test-current-url]');
  return element.evaluate(e => e.getAttribute('test-current-url'));
}
