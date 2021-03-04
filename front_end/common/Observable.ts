// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

type FunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends CallableFunction ? K : never;
}[keyof T];

/**
 * A type-safe base-class for observables.
 */
export class Observable<Observer> {
  private observers: Set<Partial<Observer>>;

  constructor() {
    this.observers = new Set();
  }

  /**
   * Add an observer. This method ensures that the observer implements
   * the full `Observer` interface.
   */
  addObserver(observer: Observer): void {
    this.observers.add(observer);
  }

  /**
   * Add a partial observer. A partial observer implements a subset of the
   * methods of the observer interface.
   */
  addPartialObserver(observer: Partial<Observer>): void {
    this.observers.add(observer);
  }


  removeObserver(observer: Partial<Observer>): boolean {
    return this.observers.delete(observer);
  }

  hasObserver(observer: Partial<Observer>): boolean {
    return this.observers.has(observer);
  }

  signal<F extends FunctionPropertyNames<Observer>>(method: F, ...args: Parameters<Observer[F]>): void {
    // We need to support observers that add/remove other observers.
    const observers = new Set(this.observers);
    for (const observer of observers) {
      if (this.observers.has(observer)) {
        const f: Function|undefined = observer[method];
        if (f instanceof Function) {
          f.apply(observer, args);
        }
      }
    }
  }
}
