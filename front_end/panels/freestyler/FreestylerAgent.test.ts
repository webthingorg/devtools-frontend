// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../core/common/common.js';
import * as Host from '../../core/host/host.js';
import type * as Root from '../../core/root/root.js';
import {describeWithEnvironment} from '../../testing/EnvironmentHelpers.js';

import * as Freestyler from './FreestylerAgent.js';

const {FreestylerAgent} = Freestyler;

describeWithEnvironment('FreestylerAgent', () => {
  function mockHostConfig(modelId?: string) {
    sinon.stub(Common.Settings.Settings.instance(), 'getHostConfig').returns({
      devToolsConsoleInsights: {
        enabled: false,
        aidaTemperature: 0.2,
        aidaModelId: modelId,
      } as Root.Runtime.HostConfigConsoleInsights,
      devToolsConsoleInsightsDogfood: {
        enabled: false,
        aidaTemperature: 0.3,
        aidaModelId: modelId,
      } as Root.Runtime.HostConfigConsoleInsightsDogfood,
    });
  }
  describe('buildRequest', () => {
    beforeEach(() => {
      sinon.restore();
    });

    it('builds a request with a model id', async () => {
      mockHostConfig('test model');
      assert.deepStrictEqual(FreestylerAgent.buildRequest('test input'), {
        input: 'test input',
        client: 'CHROME_DEVTOOLS',
        preamble: undefined,
        chat_history: undefined,
        metadata: {
          disable_user_content_logging: true,
        },
        options: {
          model_id: 'test model',
          temperature: 0,
        },
      });
    });

    it('builds a request with input', async () => {
      mockHostConfig();
      assert.deepStrictEqual(FreestylerAgent.buildRequest('test input'), {
        input: 'test input',
        client: 'CHROME_DEVTOOLS',
        preamble: undefined,
        chat_history: undefined,
        metadata: {
          disable_user_content_logging: true,
        },
        options: {
          model_id: undefined,
          temperature: 0,
        },
      });
    });

    it('builds a request with input and preamble', async () => {
      mockHostConfig();
      assert.deepStrictEqual(FreestylerAgent.buildRequest('test input', 'preamble'), {
        input: 'test input',
        client: 'CHROME_DEVTOOLS',
        preamble: 'preamble',
        chat_history: undefined,
        metadata: {
          disable_user_content_logging: true,
        },
        options: {
          model_id: undefined,
          temperature: 0,
        },
      });
    });

    it('builds a request with input, preamble and chat history', async () => {
      mockHostConfig();
      assert.deepStrictEqual(
          FreestylerAgent.buildRequest(
              'test input', 'preamble',
              [
                {
                  text: 'first',
                  entity: Host.AidaClient.Entity.UNKNOWN,
                },
                {
                  text: 'second',
                  entity: Host.AidaClient.Entity.SYSTEM,
                },
                {
                  text: 'third',
                  entity: Host.AidaClient.Entity.USER,
                },
              ]),
          {
            input: 'test input',
            client: 'CHROME_DEVTOOLS',
            preamble: 'preamble',
            chat_history: [
              {
                'entity': 0,
                'text': 'first',
              },
              {
                'entity': 2,
                'text': 'second',
              },
              {
                'entity': 1,
                'text': 'third',
              },
            ],
            metadata: {
              disable_user_content_logging: true,
            },
            options: {
              model_id: undefined,
              temperature: 0,
            },
          });
    });
  });
});
