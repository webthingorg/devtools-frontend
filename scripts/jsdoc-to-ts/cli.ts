// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {transformModule, updateExtensionsAndReferences} from './jsdoc-to-ts';

(async () => {
  const module = process.argv[2];
  transformModule(module, true);
  updateExtensionsAndReferences(module);
})();
