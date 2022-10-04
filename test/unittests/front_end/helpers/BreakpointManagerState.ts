// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;
import {assertNotNullOrUndefined} from '../../../../front_end/core/platform/platform.js';
import * as Bindings from '../../../../front_end/models/bindings/bindings.js';
import * as Common from '../../../../front_end/core/common/common.js';
import * as Root from '../../../../front_end/core/root/root.js';
import * as SDK from '../../../../front_end/core/sdk/sdk.js';
import * as Workspace from '../../../../front_end/models/workspace/workspace.js';

abstract class StateObject {
  abstract instantiate(opt?: {}): void;
  abstract selfAssert(): void;
  abstract preStates: {new(): StateObject}[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: {[id: string]: any} = {};
  journey: {new(): StateObject}[] = [];

  setup() {
    this.journey.push(Object.getPrototypeOf(this).constructor);
    this.preStates.forEach(state => {
      const stateInstance = new state();
      const previousJourney = stateInstance.setup();
      stateInstance.instantiate();
      stateInstance.selfAssert();
      this.data = {...this.data, ...stateInstance.data};
      this.journey = this.journey.concat(previousJourney);
    });
    this.instantiate();
    this.selfAssert();
    return this.journey;
  }
}

export class CreateBreakpointManagerInstance extends StateObject {
  preStates: (new() => StateObject)[] = [
    CreateDebuggerWorkspaceBindingInstance,
    CreateSettingsInstance,
  ];

  instantiate() {
    this.data['breakpointManager'] = Bindings.BreakpointManager.BreakpointManager.instance({
      forceNew: true,
      targetManager: this.data['targetManager'],
      workspace: this.data['workspace'],
      debuggerWorkspaceBinding: this.data['debuggerWorkspaceBinding'],
    });
  }

  selfAssert() {
    assertNotNullOrUndefined(this.data['breakpointManager']);
  }
}

export class CreateTargetManagerInstance extends StateObject {
  preStates = [];

  instantiate() {
    this.data['targetManager'] = SDK.TargetManager.TargetManager.instance({forceNew: true});
  }

  selfAssert() {
    assertNotNullOrUndefined(this.data['targetManager']);
  }
}

export class CreateWorkspaceInstance extends StateObject {
  preStates = [];

  instantiate() {
    this.data['workspace'] = Workspace.Workspace.WorkspaceImpl.instance({forceNew: true});
  }

  selfAssert() {
    assertNotNullOrUndefined(this.data['workspace']);
  }
}

export class CreateDebuggerWorkspaceBindingInstance extends StateObject {
  preStates = [
    CreateTargetManagerInstance,
    CreateWorkspaceInstance,
    EnableWasmDWARFDebugging,
  ];

  instantiate() {
    this.data['debuggerWorkspaceBinding'] = Bindings.DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance({
      forceNew: true,
      targetManager: this.data['targetManager'],
      workspace: this.data['workspace'],
    });
  }

  selfAssert() {
    assertNotNullOrUndefined(this.data['debuggerWorkspaceBinding']);
  }
}

export class EnableWasmDWARFDebugging extends StateObject {
  preStates = [];

  instantiate() {
    Root.Runtime.experiments.clearForTest();
    Root.Runtime.experiments.register(
        'wasmDWARFDebugging', 'WebAssembly Debugging: Enable DWARF support', undefined,
        'https://developer.chrome.com/blog/wasm-debugging-2020/');
    Root.Runtime.experiments.enableExperimentsByDefault([
      'wasmDWARFDebugging',
    ]);
  }

  selfAssert() {
    assert.isTrue(Root.Runtime.experiments.isEnabled('wasmDWARFDebugging'));
  }
}

export class CreateSettingsInstance extends StateObject {
  preStates = [
    // CreateBreakpointManagerInstance,
  ];

  instantiate() {
    this.data['syncedStorage'] = new Common.Settings.SettingsStorage({});
    this.data['localStorage'] = new Common.Settings.SettingsStorage({});
    this.data['globalStorage'] = new Common.Settings.SettingsStorage({});
    this.data['settings'] = Common.Settings.Settings.instance({
      forceNew: true,
      syncedStorage: this.data['syncedStorage'],
      localStorage: this.data['localStorage'],
      globalStorage: this.data['globalStorage'],
    });
  }

  selfAssert() {
    assertNotNullOrUndefined(this.data['settings']);
  }
}
