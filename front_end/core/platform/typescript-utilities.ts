// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * This is useful to keep TypeScript happy in a test - if you have a value
 * that's potentially `null` you can use this function to assert that it isn't,
 * and satisfy TypeScript that the value is present.
 */
export function assertNotNullOrUndefined<T>(val: T): asserts val is NonNullable<T> {
  if (val === null || val === undefined) {
    throw new Error(`Expected given value to not be null/undefined but it was: ${val}`);
  }
}

/**
 * This is useful to check on the type-level that the unhandled cases of
 * a switch are exactly `T` (where T is usually a union type of enum values).
 * @param caseVariable
 */
export function assertUnhandled<T>(_caseVariable: T): T {
  return _caseVariable;
}

/**
 * Turns a Union type (a | b) into an Intersection type (a & b).
 * This is a helper type to implement the "NoUnion" guard.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IntersectionFromUnion<T> = (T extends any ? (arg: T) => void : never) extends((arg: infer U) => void) ? U : never;

/**
 * When writing generic code it may be desired to disallow Union types from
 * being passed. This type can be used in those cases.
 *
 *   function foo<T>(argument: NoUnion<T>) {...}
 *
 * Would result in a compile error for foo<a|b>(...); invocations as `argument`
 * would be typed as `never`.
 */
export type NoUnion<T> = [T] extends [IntersectionFromUnion<T>] ? T : never;
