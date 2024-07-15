// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {flushRealConnectionSuits} from './RealConnection.js';
import {TestCapture} from './test_selection.js';

flushRealConnectionSuits();

/* eslint-disable-next-line @typescript-eslint/naming-convention */
declare let __karma__: {config: {testSelections: [string, number[]][]}};

function asUrl(path: string) {
  const url = new URL(path, document.location.origin);
  url.search = '';
  return url;
}

TestCapture.instance().skipUnselectedTests(
    new Map(__karma__.config.testSelections?.map(([value, locations]) => [asUrl(value).href, locations])));
