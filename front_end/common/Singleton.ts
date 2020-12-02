// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

export function Singleton<T = unknown>() {
  let instance: T;
  return class {
    static instance(opts: {forceNew?: boolean} = {forceNew: undefined}): T {
      const {forceNew} = opts;
      if (!instance || forceNew) {
        instance = new this() as T;
      }
      return instance;
    }
  };
}
