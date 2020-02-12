// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {ExecutionContext, RuntimeModel} from '../../../../front_end/sdk/RuntimeModel.js';
import {Target} from '../../../../front_end/sdk/SDKModel.js';

const {assert} = chai;
const {spy} = sinon;

declare global {
  interface Window {
    Common: {settings: {}}
  }
}


describe('RuntimeModel', () => {
  it('works', async () => {
    const target: unknown = {
      registerRuntimeDispatcher: () => {},
      model: () => {},
      createRemoteObject: () => {},
    };

    interface ProperTarget extends Target {
      runtimeAgent: () => void
    }


    const invokeEvaluateSpy = spy(() => {
      return Promise.resolve({
        result: {
          objectId: 1,
        },
      });
    });

    (target as ProperTarget).runtimeAgent = () => {
      // this is _agent
      return {
        enable: () => {},
        invoke_evaluate: invokeEvaluateSpy,
        model: () => {},
      };
    };

    RuntimeModel.prototype.target = () => {
      return target as Target;
    };

    self.Common.settings = {
      moduleSetting() {
        return {
          get() {},
          addChangeListener() {},
        };
      },
    };

    const model = new RuntimeModel(target as Target);

    const executionContext = new ExecutionContext(model, 1, 'name', 'origin', true, 'frame1');

    await executionContext._evaluateGlobal(
        {
          expression: '2 + 2',
          objectGroup: 'console',
          includeCommandLineAPI: true,
          silent: false,
          returnByValue: false,
          generatePreview: false,
          throwOnSideEffect: false,
          timeout: 1000,
          disableBreaks: false,
          replMode: false,
        },
        false, false);

    assert.isTrue(invokeEvaluateSpy.calledOnce);
  });
});
