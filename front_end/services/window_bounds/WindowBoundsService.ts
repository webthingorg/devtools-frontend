// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Legacy from '../../ui/legacy/legacy.js';

export interface WindowBoundsService {
  getDevToolsBoundingElement(): HTMLElement;
}

export class WindowBoundsServiceImpl implements WindowBoundsService {
  getDevToolsBoundingElement(): HTMLElement {
    return Legacy.InspectorView.InspectorView.maybeGetInspectorViewInstance()?.element || document.body;
  }
}
