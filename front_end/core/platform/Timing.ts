// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {type Brand} from './brand.js';

export type Seconds = Brand<number, 'Seconds'>;
export type MilliSeconds = Brand<number, 'MilliSeconds'>;
export type MicroSeconds = Brand<number, 'MicroSeconds'>;

export function asSeconds(x: number): Seconds {
  return x as Seconds;
}

export function asMilliSeconds(x: number): MilliSeconds {
  return x as MilliSeconds;
}

export function asMicroSeconds(x: number): MicroSeconds {
  return x as MicroSeconds;
}

export function secondsToMilliSeconds(x: Seconds): MilliSeconds {
  return (x * 1000) as MilliSeconds;
}

export function milliSecondsToSeconds(x: MilliSeconds): Seconds {
  return (x / 1000) as Seconds;
}
