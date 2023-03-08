// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

type ReleaseFn = () => void;

/**
 * Use Mutex class to coordinate local concurrent operations.
 * Once `acquire` promise resolves, you hold the lock and must
 * call `release` function returned by `acquire` to release the
 * lock. Failing to `release` the lock may lead to deadlocks.
 */
export class Mutex {
  #locked = false;
  #acquirers: Array<() => void> = [];

  // This is FIFO.
  async acquire(): Promise<ReleaseFn> {
    if (!this.#locked) {
      this.#locked = true;
      return this.#release.bind(this);
    }
    let resolve!: () => void;
    const promise = new Promise<void>(res => {
      resolve = res;
    });
    this.#acquirers.push(resolve);
    await promise;
    return this.#release.bind(this);
  }

  #release(): void {
    const resolve = this.#acquirers.shift();
    if (!resolve) {
      this.#locked = false;
      return;
    }
    resolve();
  }

  async run<T>(action: () => Promise<T>): Promise<T> {
    try {
      await this.acquire();
      return await action();
    } finally {
      this.#release();
    }
  }
}
