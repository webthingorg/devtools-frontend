// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import '../../core/dom_extension/dom_extension.js';
import '../../Images/Images.js';

import * as Root from '../../core/root/root.js';
import * as VisualLogging from '../../ui/visual_logging/visual_logging.js';

if (window.opener) {
  // @ts-ignore TypeScript doesn't know about `Emulation` on `Window`.
  const app = window.opener.Emulation.AdvancedApp.instance();
  app.deviceModeEmulationFrameLoaded(document);
  if (Root.Runtime.Runtime.queryParam('veLogging')) {
    void VisualLogging.startLogging();
  }
}
