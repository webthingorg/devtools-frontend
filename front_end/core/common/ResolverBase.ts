// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

interface PromiseInfo<T> {
  promise: Promise<T>;
  resolve: (request: T) => void;
  reject: (error: Error) => void;
}

/**
  * A class that facilitates resolving a id to an object of type T. If the id does not yet resolve, a promise
  * is created that gets resolved once `onResolve` is called with the corresponding id.
  *
  * This class to enables clients to control the duration of the wait and the lifetime of the associated
  * promises by using the `clear` method on this class.
  */
export abstract class ResolverBase<Id, T> {
  private unresolvedids: Map<Id, PromiseInfo<T>> = new Map();

  protected abstract getForId(id: Id): T|null;
  protected abstract startListening(): void;
  protected abstract stopListening(): void;

  /**
   * Returns a promise that resolves once the `id` can be resolved to a network request.
   */
  waitFor(id: Id): Promise<T> {
    const request = this.getForId(id);
    if (!request) {
      return this.getOrCreatePromise(id);
    }
    return Promise.resolve(request);
  }

  /**
   * Resolve the `id`. Returns the network request immediatelly if it
   * is available, and otherwise waits for the request to appear and calls
   * `callback` once it is resolved.
   */
  tryGet(id: Id, callback: (t: T) => void): T|null {
    const request = this.getForId(id);
    if (!request) {
      const swallowTheError = (): void => {};
      this.getOrCreatePromise(id).catch(swallowTheError).then(request => {
        if (request) {
          callback(request);
        }
      });
      return null;
    }
    return request;
  }

  /**
   * Aborts all waiting and rejects all unresolved promises.
   */
  clear(): void {
    this.stopListening();
    for (const [id, {reject}] of this.unresolvedids.entries()) {
      reject(new Error(`NetworkRequest with ${id} never resolved.`));
    }
    this.unresolvedids.clear();
  }

  private getOrCreatePromise(id: Id): Promise<T> {
    const promiseInfo = this.unresolvedids.get(id);
    if (promiseInfo) {
      return promiseInfo.promise;
    }
    let resolve: (value: T) => void = () => {};
    let reject: (error: Error) => void = () => {};
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    this.unresolvedids.set(id, {promise, resolve, reject});
    this.startListening();
    return promise;
  }

  protected onResolve(id: Id, t: T): void {
    const promiseInfo = this.unresolvedids.get(id);
    this.unresolvedids.delete(id);
    if (this.unresolvedids.size === 0) {
      this.stopListening();
    }
    promiseInfo?.resolve(t);
  }
}
