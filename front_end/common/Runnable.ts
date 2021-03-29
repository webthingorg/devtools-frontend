// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

export abstract class Runnable {
  abstract run(): Promise<void>;
}

type Callback = () => Runnable;

const registeredLateInitializationRunnables: Callback[] = [];

export function registerLateInitializationRunnable(runnable: Callback): void {
  registeredLateInitializationRunnables.push(runnable);
}

export function lateInitializationRunnables(): Callback[] {
  return registeredLateInitializationRunnables;
}

const registeredEarlyInitializationRunnables: Callback[] = [];

export function registerEarlyInitializationRunnable(runnable: Callback): void {
  registeredEarlyInitializationRunnables.push(runnable);
}

export function earlyInitializationRunnables(): Callback[] {
  return registeredEarlyInitializationRunnables;
}
