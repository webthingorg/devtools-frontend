// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

export const mod = (a: number, n: number): number => {
  return ((a % n) + n) % n;
};

export function assert<T>(
    predicate: T,
    message = 'Assertion failed!',
    ): asserts predicate {
  if (!predicate) {
    throw new Error(message);
  }
}
