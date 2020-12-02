// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

type Constructor = new (...args: any[]) => {};  // eslint-disable-line @typescript-eslint/no-explicit-any

export function Singleton<T, P extends Constructor = new () => {}>(Parent?: P) {
  let instance: T;
  const DefaultClass = class {};
  const SuperClass = Parent === undefined ? DefaultClass : Parent;

  return class extends SuperClass {
    static instance(opts: {forceNew?: boolean} = {forceNew: undefined}): T {
      const {forceNew} = opts;
      if (!instance || forceNew) {
        instance = new this() as T;
      }
      return instance;
    }
  };
}
