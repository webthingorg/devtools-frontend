// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {DistancesOverlay} from './tool_distances_impl.js';

const overlay = new DistancesOverlay(window);

window.dispatch = message => {
  overlay.dispatch(message);
};
