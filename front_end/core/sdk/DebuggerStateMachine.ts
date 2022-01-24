// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Platform from '../platform/platform.js';

export const enum DebuggerState {
  ShuttingDown = 0,
  Disabled = 1,
  StartingUp = 2,
  Enabled = 3,
  Length = 4,
}

export class DebuggerStateMachine {
  #state: DebuggerState;

  constructor() {
    this.#state = DebuggerState.Disabled;
  }

  get state(): DebuggerState {
    return this.#state;
  }

  transition(newState: DebuggerState): boolean {
    if (this.#validTransitions(this.#state, newState)) {
      this.#state = newState;
      return true;
    }
    return false;
  }

  #validTransitions(oldState: DebuggerState, newState: DebuggerState): boolean {
    Platform.DCHECK(() => newState !== DebuggerState.Length);
    const isTransitioningToNext = newState === (oldState + 1) % DebuggerState.Length;
    const isShuttingDown = newState === DebuggerState.ShuttingDown && oldState === DebuggerState.Enabled;
    return isTransitioningToNext || isShuttingDown;
  }
}
