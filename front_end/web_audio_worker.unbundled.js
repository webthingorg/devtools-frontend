// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import './platform/platform.js';
import './web_audio_worker/web_audio_worker.js';

// Release build has Runtime.js bundled.
if (!self.Root || !self.Root.Runtime)
  {self.importScripts('Runtime.js');}

Root.Runtime.startWorker('web_audio_worker');
