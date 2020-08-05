// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as AsyncTracing from './async-tracing.js';

export function it(name: string, callback: Mocha.Func|Mocha.AsyncFunc) {
  AsyncTracing.it(name, callback);
}

it.repeat = function(repeat: number, name: string, callback: Mocha.Func|Mocha.AsyncFunc) {
  for (let i = 0; i < repeat; i++) {
    it(name, callback);
  }
};
