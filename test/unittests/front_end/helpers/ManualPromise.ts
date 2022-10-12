// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * Creates a waitable object that will be resolved after the `resolve` is called.
 *
 * Use case is you want to wait for an event firing from a DOM element in the test.
 * How you use is, you register the event handler and resolve the promise after the event is fired.
 * ```
 * const waitForClick = new ManualPromise();
 * element.addEventListener('click', () => {
 *  waitForClick.resolve();
 * });
 * await waitForClick.wait(); // Waits until the `click` event is fired.
 * ```
 *
 * How you can use this to wait for multiple events is, you can reset the promise after the event
 * is fired.
 * ```
 * const waitForClick = new ManualPromise();
 * element.addEventListener('click', () => {
 *     waitForClick.resolve();
 *     waitForClick.reset();
 * });
 * await waitForClick.wait(); // Waits until the first click
 * await waitForClick.wait(); // Waits until the second click
 */
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
