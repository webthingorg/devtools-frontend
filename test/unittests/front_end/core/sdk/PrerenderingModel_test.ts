// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as SDK from '../../../../../front_end/core/sdk/sdk.js';
import * as Protocol from '../../../../../front_end/generated/protocol.js';
import {createTarget} from '../../helpers/EnvironmentHelpers.js';
import {
  describeWithMockConnection,
  dispatchEvent,
} from '../../helpers/MockConnection.js';

const {assert} = chai;

type PrerenderingAttemptId = SDK.PrerenderingModel.PrerenderingAttemptId;
type PrerenderingAttempt = SDK.PrerenderingModel.PrerenderingAttempt;
type PrerenderingAttemptEventAdd = SDK.PrerenderingModel.PrerenderingAttemptEventAdd;
type PrerenderingAttemptEventUpdate = SDK.PrerenderingModel.PrerenderingAttemptEventUpdate;

// Linter safe alternative of !.
function unwrap<T>(x: T|null|undefined): T {
  if (x === null || x === undefined) {
    throw new Error('unreachable');
  } else {
    return x;
  }
}

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
      [
        'PrerenderingAttempt:0',
        {
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
        },
      ],
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
      [
        'PrerenderingAttempt:0',
        {
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
        },
      ],
      [
        'PrerenderingAttempt:1',
        {
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
        },
      ],
    ]);

    (() => {
      const origAttempt = unwrap(registry.getById('PrerenderingAttempt:0'));
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
      [
        'PrerenderingAttempt:0',
        {
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
        },
      ],
      [
        'PrerenderingAttempt:1',
        {
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
        },
      ],
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
      const origAttempt = unwrap(registry.getById('PrerenderingAttempt:0'));
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
      [
        'PrerenderingAttempt:1',
        {
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
        },
      ],
    ]);
  });
});

describeWithMockConnection('PrerenderingModel', () => {
  before(async () => {
    SDK.ChildTargetManager.ChildTargetManager.install();
  });

  it('records activated prerendering and records cancelled prerendering', () => {
    const targetId = 'targetid' as Protocol.Target.TargetID;
    const target = createTarget({id: targetId});

    target.model(SDK.ChildTargetManager.ChildTargetManager);
    const model = target.model(SDK.PrerenderingModel.PrerenderingModel);

    if (model === null) {
      throw new Error('unreachable');
    }

    const prerenderedFrameId1 = '1';
    const preId1 = 'PrerenderingAttempt-opaque:1';

    dispatchEvent(target, 'Page.frameNavigated', {
      frame: {
        id: 'main-hoge',
        loaderId: 'foo',
        url: 'https://example.com/',
        domainAndRegistry: 'example.com',
        securityOrigin: 'https://example.com/',
        mimeType: 'text/html',
        secureContextType: Protocol.Page.SecureContextType.Secure,
        crossOriginIsolatedContextType: Protocol.Page.CrossOriginIsolatedContextType.Isolated,
        gatedAPIFeatures: [],
      },
    });
    dispatchEvent(target, 'Target.targetInfoChanged', {
      targetInfo: {
        targetId: prerenderedFrameId1,
        type: 'frame',
        subtype: 'prerender',
        url: 'https://example.com/prerendered.html',
        title: '',
        attached: true,
        canAccessOpener: true,
      },
    });
    assert.deepEqual(model.getAll(), [
      [
        preId1,
        {
          kind: 'PrerenderingAttempt',
          prerenderingAttemptId: prerenderedFrameId1,
          startedAt: unwrap(model.getById(preId1)?.startedAt),
          trigger: {
            kind: 'PrerenderingTriggerOpaque',
          },
          url: 'https://example.com/prerendered.html',
          status: 'prerendering',
        },
      ],
    ]);
    dispatchEvent(
        target,
        'Page.prerenderAttemptCompleted',
        {
          'initiatingFrameId': prerenderedFrameId1,
          'prerenderingUrl': 'https://example.com/prerendered.html',
          'finalStatus': Protocol.Page.PrerenderFinalStatus.Activated,
        },
    );
    assert.deepEqual(model.getAll(), [
      [
        preId1,
        {
          kind: 'PrerenderingAttempt',
          prerenderingAttemptId: prerenderedFrameId1,
          startedAt: unwrap(model.getById(preId1)?.startedAt),
          trigger: {
            kind: 'PrerenderingTriggerOpaque',
          },
          url: 'https://example.com/prerendered.html',
          status: 'activated',
          discardedReason: null,
        },
      ],
    ]);

    // Note that the test below fails if we split it into two tests
    // because events ResourceTreeModel.Events.PrerenderAttemptCompleted
    // and FrameManager.Events.FrameRemoved are not delivered.
    // TODO(kenoss): Investigate more and split this test.
    model.clearNotOngoing();

    const prerenderedFrameId2 = '2';
    const preId2 = 'PrerenderingAttempt-opaque:2';

    dispatchEvent(target, 'Page.frameNavigated', {
      frame: {
        id: 'main',
        loaderId: 'foo',
        url: 'https://example.com/',
        domainAndRegistry: 'example.com',
        securityOrigin: 'https://example.com/',
        mimeType: 'text/html',
        secureContextType: Protocol.Page.SecureContextType.Secure,
        crossOriginIsolatedContextType: Protocol.Page.CrossOriginIsolatedContextType.Isolated,
        gatedAPIFeatures: [],
      },
    });
    dispatchEvent(target, 'Target.targetInfoChanged', {
      targetInfo: {
        targetId: prerenderedFrameId2,
        type: 'frame',
        subtype: 'prerender',
        url: 'https://example.com/prerendered.html',
        title: '',
        attached: true,
        canAccessOpener: true,
      },
    });
    assert.deepEqual(model.getAll(), [
      [
        preId2,
        {
          kind: 'PrerenderingAttempt',
          prerenderingAttemptId: prerenderedFrameId2,
          startedAt: unwrap(model.getById(preId2)?.startedAt),
          trigger: {
            kind: 'PrerenderingTriggerOpaque',
          },
          url: 'https://example.com/prerendered.html',
          status: 'prerendering',
        },
      ],
    ]);
    dispatchEvent(
        target,
        'Page.prerenderAttemptCompleted',
        {
          'initiatingFrameId': prerenderedFrameId2,
          'prerenderingUrl': 'https://example.com/prerendered.html',
          'finalStatus': Protocol.Page.PrerenderFinalStatus.MojoBinderPolicy,
          'disallowedApiMethod': 'device.mojom.GamepadMonitor',
        },
    );
    assert.deepEqual(model.getAll(), [
      [
        preId2,
        {
          kind: 'PrerenderingAttempt',
          prerenderingAttemptId: prerenderedFrameId2,
          startedAt: unwrap(model.getById(preId2)?.startedAt),
          trigger: {
            kind: 'PrerenderingTriggerOpaque',
          },
          url: 'https://example.com/prerendered.html',
          status: 'discarded',
          discardedReason: Protocol.Page.PrerenderFinalStatus.MojoBinderPolicy,
        },
      ],
    ]);
  });
});
