// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assertNotNullOrUndefined} from '../../../../front_end/core/platform/platform.js';
import * as SDK from '../../../../front_end/core/sdk/sdk.js';
import * as Bindings from '../../../../front_end/models/bindings/bindings.js';
import * as Workspace from '../../../../front_end/models/workspace/workspace.js';

abstract class StateObject {
  abstract selfAssert(): void;
  abstract instantiate(): void;
  preStates: {new(): StateObject}[] = [];
  roadMap: {new(): StateObject}[] = [];
  preStatesMap: Map<{new(): StateObject}, StateObject> = new Map();
  opts: {}|undefined;

  constructor(opts?: {}) {
    this.opts = opts;
    this.preStates.forEach(preState => {
      if (this.roadMap.includes(preState)) {
        return;
      }
      this.preStatesMap.set(preState, new preState());
      this.preStatesMap.get(preState)?.selfAssert();
      this.preStatesMap.get(preState)?.roadMap.forEach(state => {
        this.roadMap.push(state);
      });
    });
    this.instantiate();
    this.selfAssert();
  }

  isRoot(): Boolean {
    return Boolean(this.preStates);
  }
}

export class CreateBreakpointManagerInstance extends StateObject {
  preStates = [
    CreateTargetManagerInstance,
    CreateWorkspaceInstance,
    CreateDebuggerWorkspaceBindingInstance,
  ];
  breakpointManager: Bindings.BreakpointManager.BreakpointManager|undefined;

  instantiate() {
    this.breakpointManager = Bindings.BreakpointManager.BreakpointManager.instance();
  }

  selfAssert(): void {
    assertNotNullOrUndefined(this.breakpointManager);
  }
}

export class CreateTargetManagerInstance extends StateObject {
  preStates = [];
  targetManager: SDK.TargetManager.TargetManager|undefined;

  instantiate() {
    this.targetManager = SDK.TargetManager.TargetManager.instance();
  }

  selfAssert(): void {
    assertNotNullOrUndefined(this.targetManager);
  }
}

export class CreateWorkspaceInstance extends StateObject {
  preStates = [];
  workspace: Workspace.Workspace.WorkspaceImpl|undefined;

  instantiate() {
    this.workspace = Workspace.Workspace.WorkspaceImpl.instance();
  }

  selfAssert(): void {
    assertNotNullOrUndefined(this.workspace);
  }
}

export class CreateDebuggerWorkspaceBindingInstance extends StateObject {
  preStates = [];
  debuggerWorkspaceBinding: Bindings.DebuggerWorkspaceBinding.DebuggerWorkspaceBinding|undefined;

  instantiate() {
    this.debuggerWorkspaceBinding = Bindings.DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance();
  }

  selfAssert(): void {
    assertNotNullOrUndefined(this.debuggerWorkspaceBinding);
  }
}
