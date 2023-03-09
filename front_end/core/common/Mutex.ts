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
  #acquirers = new Set<() => void>();

  // This is FIFO.
  acquire(): Promise<ReleaseFn> {
    let resolve = (): void => {};
    let promise: Promise<void>;
    if (this.#acquirers.size === 0) {
      promise = Promise.resolve();
    } else {
      promise = new Promise<void>(res => {
        resolve = res;
      });
    }
    this.#acquirers.add(resolve);
    return promise.then(() => this.#release.bind(this, resolve));
  }

  #release(resolve: () => void): void {
    if (!this.#acquirers.delete(resolve)) {
      throw new Error('Cannot release more than once.');
    }
    resolve();
  }

  async run<T>(action: () => Promise<T>): Promise<T> {
    const release = await this.acquire();
    try {
      return await action();
    } finally {
      release();
    }
  }
}
