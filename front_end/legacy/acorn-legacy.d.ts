// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as acorn from '../third_party/acorn/package/dist/acorn.mjs';

declare global {
  namespace AcornLoose {
    type parse = typeof acorn.parse;
  }
}
