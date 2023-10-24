// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// @ts-nocheck This file is not checked by TypeScript as it has a lot of legacy code.
import * as Root from '../../core/root/root.js';
import * as SDK from '../../core/sdk/sdk.js';
import * as Trace from '../../models/trace/trace.js';

import * as TestRunnerModule from './TestRunner.js';

export const TestRunner = {
  ...TestRunnerModule,
};

// Extension tests currently require 'TestRunner' to be available
// on globalThis.
self.TestRunner ??= TestRunner;

/**
 * @param {!SDK.Target.Target} target
 */
function _setupTestHelpers(target) {
  TestRunner.BrowserAgent = target.browserAgent();
  TestRunner.CSSAgent = target.cssAgent();
  TestRunner.DeviceOrientationAgent = target.deviceOrientationAgent();
  TestRunner.DOMAgent = target.domAgent();
  TestRunner.DOMDebuggerAgent = target.domdebuggerAgent();
  TestRunner.DebuggerAgent = target.debuggerAgent();
  TestRunner.EmulationAgent = target.emulationAgent();
  TestRunner.HeapProfilerAgent = target.heapProfilerAgent();
  TestRunner.InputAgent = target.inputAgent();
  TestRunner.InspectorAgent = target.inspectorAgent();
  TestRunner.NetworkAgent = target.networkAgent();
  TestRunner.OverlayAgent = target.overlayAgent();
  TestRunner.PageAgent = target.pageAgent();
  TestRunner.ProfilerAgent = target.profilerAgent();
  TestRunner.RuntimeAgent = target.runtimeAgent();
  TestRunner.TargetAgent = target.targetAgent();

  TestRunner.networkManager = target.model(SDK.NetworkManager.NetworkManager);
  TestRunner.securityOriginManager = target.model(SDK.SecurityOriginManager.SecurityOriginManager);
  TestRunner.storageKeyManager = target.model(SDK.StorageKeyManager.StorageKeyManager);
  TestRunner.resourceTreeModel = target.model(SDK.ResourceTreeModel.ResourceTreeModel);
  TestRunner.debuggerModel = target.model(SDK.DebuggerModel.DebuggerModel);
  TestRunner.runtimeModel = target.model(SDK.RuntimeModel.RuntimeModel);
  TestRunner.domModel = target.model(SDK.DOMModel.DOMModel);
  TestRunner.domDebuggerModel = target.model(SDK.DOMDebuggerModel.DOMDebuggerModel);
  TestRunner.cssModel = target.model(SDK.CSSModel.CSSModel);
  TestRunner.cpuProfilerModel = target.model(SDK.CPUProfilerModel.CPUProfilerModel);
  TestRunner.overlayModel = target.model(SDK.OverlayModel.OverlayModel);
  TestRunner.serviceWorkerManager = target.model(SDK.ServiceWorkerManager.ServiceWorkerManager);
  TestRunner.tracingManager = target.model(Trace.TracingManager.TracingManager);
  TestRunner.mainTarget = target;
}

export async function _executeTestScript() {
  const testScriptURL = /** @type {string} */ (Root.Runtime.Runtime.queryParam('test'));
  if (TestRunner.isDebugTest()) {
    /* eslint-disable no-console */
    TestRunner.setInnerResult(console.log);
    TestRunner.setInnerCompleteTest(() => console.log('Test completed'));
    /* eslint-enable no-console */

    // Auto-start unit tests
    self.test = async function() {
      await import(testScriptURL);
    };
    return;
  }

  try {
    await import(testScriptURL);
  } catch (err) {
    TestRunner.addResult('TEST ENDED EARLY DUE TO UNCAUGHT ERROR:');
    TestRunner.addResult(err && err.stack || err);
    TestRunner.addResult('=== DO NOT COMMIT THIS INTO -expected.txt ===');
    TestRunner.completeTest();
  }
}

/** @type {boolean} */
let _startedTest = false;

/**
 * @implements {SDK.TargetManager.Observer}
 */
export class _TestObserver {
  /**
   * @param {!SDK.Target.Target} target
   * @override
   */
  targetAdded(target) {
    if (target.id() === 'main' && target.type() === 'frame' ||
        target.parentTarget()?.type() === 'tab' && target.type() === 'frame' && !target.targetInfo()?.subtype?.length) {
      _setupTestHelpers(target);
      if (_startedTest) {
        return;
      }
      _startedTest = true;
      TestRunner
          .loadHTML(`
        <head>
          <base href="${TestRunner.url()}">
        </head>
        <body>
        </body>
      `).then(() => _executeTestScript());
    }
  }

  /**
   * @param {!SDK.Target.Target} target
   * @override
   */
  targetRemoved(target) {
  }
}

SDK.TargetManager.TargetManager.instance().observeTargets(new _TestObserver());
