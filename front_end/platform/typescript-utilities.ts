// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * This is useful to keep TypeScript happy in a test - if you have a value
 * that's potentially `null` you can use this function to assert that it isn't,
 * and satisfy TypeScript that the value is present.
 */
export function assertNotNull<T>(val: T): asserts val is NonNullable<T> {
  if (val === null) {
    throw new Error(`Expected given value to not be null but it was: ${val}`);
  }
}

// A constructor type can only be specified with `any`
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T = {}> = new (...args: any[]) => T;

// We need to use the type inference of TypeScript to deduce what the return
// type of this function is. Therefore, we can't specify the type ourselves.
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function singleton<TBase extends Constructor>(baseClass: TBase) {
  let instance: InstanceType<TBase>;
  return class extends baseClass {
    static instance(opts: {forceNew?: boolean} = {forceNew: undefined}): InstanceType<TBase> {
      const {forceNew} = opts;
      if (!instance || forceNew) {
        instance = new this() as InstanceType<TBase>;
      }

      return instance;
    }
  };
}
