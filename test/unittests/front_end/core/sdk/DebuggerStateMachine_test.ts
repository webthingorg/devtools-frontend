// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as SDK from '../../../../../front_end/core/sdk/sdk.js';

const {assert} = chai;

function checkInvalidTransition(
    debuggerStateMachine: SDK.DebuggerStateMachine.DebuggerStateMachine,
    currentState: SDK.DebuggerStateMachine.DebuggerState, toState: SDK.DebuggerStateMachine.DebuggerState): void {
  // Invalid transition of invalid state DebuggerState.Length.
  if (toState === SDK.DebuggerStateMachine.DebuggerState.Length) {
    try {
      debuggerStateMachine.transition(toState);
    } catch (error) {
      // Expected to throw.
    }
    assert.fail('Expected code to throw an exception on invalid transition.');
  } else {
    // Invalid transition of valid state.
    assert.isFalse(debuggerStateMachine.transition(toState));
  }
}

describe('DebuggerStateMachine', () => {
  const transitionCycle = [
    SDK.DebuggerStateMachine.DebuggerState.StartingUp,
    SDK.DebuggerStateMachine.DebuggerState.Enabled,
    SDK.DebuggerStateMachine.DebuggerState.ReadyToPause,
    SDK.DebuggerStateMachine.DebuggerState.ShuttingDown,
    SDK.DebuggerStateMachine.DebuggerState.Disabled,
  ];

  it('transitions states as expected if transition is valid', () => {
    const debuggerStateMachine = new SDK.DebuggerStateMachine.DebuggerStateMachine();
    assert.deepEqual(debuggerStateMachine.state, SDK.DebuggerStateMachine.DebuggerState.Disabled);
    for (const newState of transitionCycle) {
      assert.isTrue(debuggerStateMachine.transition(newState));
      assert.deepEqual(debuggerStateMachine.state, newState);
    }
  });

  it('disallows invalid transtions', () => {
    const allStates = [
      SDK.DebuggerStateMachine.DebuggerState.Enabled,
      SDK.DebuggerStateMachine.DebuggerState.Disabled,
      SDK.DebuggerStateMachine.DebuggerState.ShuttingDown,
      SDK.DebuggerStateMachine.DebuggerState.ReadyToPause,
      SDK.DebuggerStateMachine.DebuggerState.StartingUp,
      SDK.DebuggerStateMachine.DebuggerState.Length,
    ];
    const debuggerStateMachine = new SDK.DebuggerStateMachine.DebuggerStateMachine();
    const validTransitions = new Map<SDK.DebuggerStateMachine.DebuggerState, SDK.DebuggerStateMachine.DebuggerState[]>([
      [
        SDK.DebuggerStateMachine.DebuggerState.Disabled,
        [SDK.DebuggerStateMachine.DebuggerState.Disabled, SDK.DebuggerStateMachine.DebuggerState.StartingUp],
      ],
      [
        SDK.DebuggerStateMachine.DebuggerState.StartingUp,
        [SDK.DebuggerStateMachine.DebuggerState.StartingUp, SDK.DebuggerStateMachine.DebuggerState.Enabled],
      ],
      [
        SDK.DebuggerStateMachine.DebuggerState.Enabled,
        [
          SDK.DebuggerStateMachine.DebuggerState.Enabled,
          SDK.DebuggerStateMachine.DebuggerState.ReadyToPause,
          SDK.DebuggerStateMachine.DebuggerState.ShuttingDown,
        ],
      ],
      [
        SDK.DebuggerStateMachine.DebuggerState.ReadyToPause,
        [SDK.DebuggerStateMachine.DebuggerState.ReadyToPause, SDK.DebuggerStateMachine.DebuggerState.ShuttingDown],
      ],
      [
        SDK.DebuggerStateMachine.DebuggerState.ShuttingDown,
        [SDK.DebuggerStateMachine.DebuggerState.ShuttingDown, SDK.DebuggerStateMachine.DebuggerState.Disabled],
      ],
    ]);
    for (const validNextState of transitionCycle) {
      const currentState = debuggerStateMachine.state;
      for (const toState of allStates) {
        const transitions = validTransitions.get(debuggerStateMachine.state);
        if (!transitions || transitions.indexOf(toState) === -1) {
          checkInvalidTransition(debuggerStateMachine, currentState, toState);
        }
      }
      // Double check that we have not switched states so far.
      assert.deepEqual(debuggerStateMachine.state, currentState);

      assert.isTrue(debuggerStateMachine.transition(validNextState));
      assert.deepEqual(debuggerStateMachine.state, validNextState);
    }
  });
});
