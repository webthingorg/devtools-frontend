// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {waitFor} from '../../shared/helper.js';

export async function retrieveAlertString() {
  const alertElement = await waitFor('[id="ariaUtilsAlertElement"]');
  const alertString = await alertElement.evaluate(e => e.textContent);
  return alertString;
}
