// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

export class ManualPromise {
  instance: Promise<void>;
  resolveFn!: Function;
  constructor() {
    this.instance = new Promise(resolve => {
      this.resolveFn = resolve;
    });
  }

  wait() {
    return this.instance;
  }

  resolve() {
    this.resolveFn();
  }

  reset() {
    this.instance = new Promise(resolve => {
      this.resolveFn = resolve;
    });
  }
}
