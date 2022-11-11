// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assertNotNullOrUndefined} from '../../../../../front_end/core/platform/platform.js';
import * as SDK from '../../../../../front_end/core/sdk/sdk.js';
import * as Protocol from '../../../../../front_end/generated/protocol.js';
import {createTarget} from '../../helpers/EnvironmentHelpers.js';
import {
  describeWithMockConnection,
  dispatchEvent,
  setMockConnectionResponseHandler,
} from '../../helpers/MockConnection.js';
import type * as SDKModule from '../../../../../front_end/core/sdk/sdk.js';

const {assert} = chai;

type PrerenderingAttemptId = SDK.PrerenderingModel.PrerenderingAttemptId;
type PrerenderingAttempt = SDK.PrerenderingModel.PrerenderingAttempt;
type PrerenderingAttemptEvent = SDK.PrerenderingModel.PrerenderingAttemptEvent;
type PrerenderingAttemptEventAdd = SDK.PrerenderingModel.PrerenderingAttemptEventAdd;
type PrerenderingAttemptEventUpdate = SDK.PrerenderingModel.PrerenderingAttemptEventUpdate;

describe('PreRegistry', () => {
  it('add and update works', () => {
    const registry = new SDK.PrerenderingModel.PreRegistry();

    assert.deepEqual(registry.getAll(), []);

    const startedAt = Date.now();

    (() => {
      const prerenderingAttemptId: PrerenderingAttemptId = '0' as PrerenderingAttemptId;
      const url = 'https://example.com/0';
      const attempt: PrerenderingAttempt = {
        kind: 'PrerenderingAttempt',
        prerenderingAttemptId: prerenderingAttemptId,
        startedAt: startedAt,
        trigger: {
          kind: 'PrerenderingTriggerSpecRules',
          rule: {
            'prerender': [{'source': 'list', 'urls': [url]}],
          },
        },
        url: url,
        status: 'prerendering',
      };
      const event: PrerenderingAttemptEventAdd = {
        kind: 'PrerenderingAttemptEventAdd',
        attempt: attempt,
      };
      registry.applyEvent(event);
    })();

    assert.deepEqual(registry.getAll(), [
      ['PrerenderingAttempt:0', {
        kind: 'PrerenderingAttempt',
        prerenderingAttemptId: '0',
        startedAt: startedAt,
        trigger: {
          kind: 'PrerenderingTriggerSpecRules',
          rule: {
            'prerender': [{'source': 'list', 'urls': ['https://example.com/0']}],
          },
        },
        url: 'https://example.com/0',
        status: 'prerendering',
      }],
    ]);

    (() => {
      const prerenderingAttemptId: PrerenderingAttemptId = '1' as PrerenderingAttemptId;
      const url = 'https://example.com/1';
      const attempt: PrerenderingAttempt = {
        kind: 'PrerenderingAttempt',
        prerenderingAttemptId: prerenderingAttemptId,
        startedAt: startedAt,
        trigger: {
          kind: 'PrerenderingTriggerSpecRules',
          rule: {
            'prerender': [{'source': 'list', 'urls': [url]}],
          },
        },
        url: url,
        status: 'prerendering',
      };
      const event: PrerenderingAttemptEventAdd = {
        kind: 'PrerenderingAttemptEventAdd',
        attempt: attempt,
      };
      registry.applyEvent(event);
    })();

    assert.deepEqual(registry.getAll(), [
      ['PrerenderingAttempt:0', {
        kind: 'PrerenderingAttempt',
        prerenderingAttemptId: '0',
        startedAt: startedAt,
        trigger: {
          kind: 'PrerenderingTriggerSpecRules',
          rule: {
            'prerender': [{'source': 'list', 'urls': ['https://example.com/0']}],
          },
        },
        url: 'https://example.com/0',
        status: 'prerendering',
      }],
      ['PrerenderingAttempt:1', {
        kind: 'PrerenderingAttempt',
        prerenderingAttemptId: '1',
        startedAt: startedAt,
        trigger: {
          kind: 'PrerenderingTriggerSpecRules',
          rule: {
            'prerender': [{'source': 'list', 'urls': ['https://example.com/1']}],
          },
        },
        url: 'https://example.com/1',
        status: 'prerendering',
      }],
    ]);

    (() => {
      const origAttempt = registry.getById('PrerenderingAttempt:0');
      if (origAttempt === null) {
        throw new Error('unreachable');
        return;
      }
      const attempt: PrerenderingAttempt = {
        ...origAttempt,
        status: 'activated',
      };
      const event: PrerenderingAttemptEventUpdate = {
        kind: 'PrerenderingAttemptEventUpdate',
        update: attempt,
      };
      registry.applyEvent(event);
    })();

    assert.deepEqual(registry.getAll(), [
      ['PrerenderingAttempt:0', {
        kind: 'PrerenderingAttempt',
        prerenderingAttemptId: '0',
        startedAt: startedAt,
        trigger: {
          kind: 'PrerenderingTriggerSpecRules',
          rule: {
            'prerender': [{'source': 'list', 'urls': ['https://example.com/0']}],
          },
        },
        url: 'https://example.com/0',
        status: 'activated',
      }],
      ['PrerenderingAttempt:1', {
        kind: 'PrerenderingAttempt',
        prerenderingAttemptId: '1',
        startedAt: startedAt,
        trigger: {
          kind: 'PrerenderingTriggerSpecRules',
          rule: {
            'prerender': [{'source': 'list', 'urls': ['https://example.com/1']}],
          },
        },
        url: 'https://example.com/1',
        status: 'prerendering',
      }],
    ]);
  });

  it('clearNotOngoing works', () => {
    const registry = new SDK.PrerenderingModel.PreRegistry();

    assert.deepEqual(registry.getAll(), []);

    const startedAt = Date.now();

    (() => {
      const prerenderingAttemptId: PrerenderingAttemptId = '0' as PrerenderingAttemptId;
      const url = 'https://example.com/0';
      const attempt: PrerenderingAttempt = {
        kind: 'PrerenderingAttempt',
        prerenderingAttemptId: prerenderingAttemptId,
        startedAt: startedAt,
        trigger: {
          kind: 'PrerenderingTriggerSpecRules',
          rule: {
            'prerender': [{'source': 'list', 'urls': [url]}],
          },
        },
        url: url,
        status: 'prerendering',
      };
      const event: PrerenderingAttemptEventAdd = {
        kind: 'PrerenderingAttemptEventAdd',
        attempt: attempt,
      };
      registry.applyEvent(event);
    })();

    (() => {
      const prerenderingAttemptId: PrerenderingAttemptId = '1' as PrerenderingAttemptId;
      const url = 'https://example.com/1';
      const attempt: PrerenderingAttempt = {
        kind: 'PrerenderingAttempt',
        prerenderingAttemptId: prerenderingAttemptId,
        startedAt: startedAt,
        trigger: {
          kind: 'PrerenderingTriggerSpecRules',
          rule: {
            'prerender': [{'source': 'list', 'urls': [url]}],
          },
        },
        url: url,
        status: 'prerendering',
      };
      const event: PrerenderingAttemptEventAdd = {
        kind: 'PrerenderingAttemptEventAdd',
        attempt: attempt,
      };
      registry.applyEvent(event);
    })();

    (() => {
      const origAttempt = registry.getById('PrerenderingAttempt:0');
      if (origAttempt === null) {
        throw new Error('unreachable');
        return;
      }
      const attempt: PrerenderingAttempt = {
        ...origAttempt,
        status: 'activated',
      };
      const event: PrerenderingAttemptEventUpdate = {
        kind: 'PrerenderingAttemptEventUpdate',
        update: attempt,
      };
      registry.applyEvent(event);
    })();

    registry.clearNotOngoing();

    assert.deepEqual(registry.getAll(), [
      ['PrerenderingAttempt:1', {
        kind: 'PrerenderingAttempt',
        prerenderingAttemptId: '1',
        startedAt: startedAt,
        trigger: {
          kind: 'PrerenderingTriggerSpecRules',
          rule: {
            'prerender': [{'source': 'list', 'urls': ['https://example.com/1']}],
          },
        },
        url: 'https://example.com/1',
        status: 'prerendering',
      }],
    ]);
  });
});

describeWithMockConnection.only('PrerenderingModel', () => {
  let SDK: typeof SDKModule;
  before(async () => {
    SDK = await import('../../../../../front_end/core/sdk/sdk.js');
  });

  let beforeGetResourceTree = Promise.resolve();

  beforeEach(async () => {
    setMockConnectionResponseHandler('Page.getResourceTree', async () => {
      await beforeGetResourceTree;
      return {
        frameTree: {
          frame: {
            id: 'main',
            loaderId: 'test',
            url: 'http://example.com',
            securityOrigin: 'http://example.com',
            mimeType: 'text/html',
          },
          resources: [],
        },
      };
    });
  });

  it('records prerenderingStatus', async () => {
    await import('../../../../../front_end/core/sdk/sdk.js');
    await import('../../../../../front_end/core/sdk/PrerenderingModel.js');

    const target = createTarget();
    const model = target.model(SDK.PrerenderingModel.PrerenderingModel);
    
    if (model === null) {
      throw new Error('unreachable');
    }

    const frameId = '0';

    dispatchEvent(target, 'Target.targetInfoChanged', {
      subtype: 'prerender',
      url: 'https://example.com/',
      targetId: frameId,
      type: 'frame',
      title: '',
      attached: true,
      canAccessOpener: true,
    });
    assert.deepEqual(model.getAll() as any, [
      ['PrerenderingAttempt:0', {
        kind: 'PrerenderingAttempt',
        prerenderingAttemptId: '0',
        // startedAt: ...,
        trigger: {
          kind: 'PrerenderingTriggerOpaque',
        },
        url: 'https://example.com/',
        status: 'prerendering',
      }],
    ]);
    // dispatchEvent(
    //     target,
    //     'Page.prerenderAttemptCompleted',
    //     {
    //       'initiatingFrameId': 'main',
    //       'prerenderingUrl': 'http://example.com/page.html',
    //       'finalStatus': Protocol.Page.PrerenderFinalStatus.TriggerDestroyed,
    //     },
    // );
    // dispatchEvent(
    //     target,
    //     'Page.prerenderAttemptCompleted',
    //     {
    //       'initiatingFrameId': 'next',
    //       'prerenderingUrl': 'http://example.com/page.html',
    //       'finalStatus': Protocol.Page.PrerenderFinalStatus.ClientCertRequested,
    //     },
    // );
    // assertNotNullOrUndefined(resourceTreeModel);
    // assertNotNullOrUndefined(resourceTreeModel.mainFrame);
    // assert.strictEqual(
    //     resourceTreeModel.mainFrame.prerenderFinalStatus, Protocol.Page.PrerenderFinalStatus.TriggerDestroyed);
    // dispatchEvent(target, 'Page.frameNavigated', frameNavigatedEvent(undefined, 'next'));
    // assertNotNullOrUndefined(resourceTreeModel);
    // assertNotNullOrUndefined(resourceTreeModel.mainFrame);
    // assert.strictEqual(
    //     resourceTreeModel.mainFrame.prerenderFinalStatus, Protocol.Page.PrerenderFinalStatus.ClientCertRequested);
  });
});
