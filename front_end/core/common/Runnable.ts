// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @interface
 */
/* eslint-disable rulesdir/no_underscored_properties */

export interface Runnable {
  run(): Promise<void>;
}

type LateInitializableLoader = () => Promise<Runnable>;
export interface LateInitializableRunnableSetting {
  id: string;
  loadRunnable: LateInitializableLoader;
}

const lateInitializationRunnableIds = new Set<string>();
const registeredLateInitializationRunnables: Array<LateInitializableLoader> = [];

export function registerLateInitializationRunnable(setting: LateInitializableRunnableSetting): void {
  const {id, loadRunnable} = setting;
  if (lateInitializationRunnableIds.has(id)) {
    throw new Error(`Duplicate late Initializable runnable id '${id}'`);
  }
  lateInitializationRunnableIds.add(id);
  registeredLateInitializationRunnables.push(loadRunnable);
}

export function lateInitializationRunnables(): Array<LateInitializableLoader> {
  return registeredLateInitializationRunnables;
}

const registeredEarlyInitializationRunnables: (() => Runnable)[] = [];

export function registerEarlyInitializationRunnable(runnable: () => Runnable): void {
  registeredEarlyInitializationRunnables.push(runnable);
}

export function earlyInitializationRunnables(): (() => Runnable)[] {
  return registeredEarlyInitializationRunnables;
}
