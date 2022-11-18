// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as Platform from '../../../../../front_end/core/platform/platform.js';
import {assertNotNullOrUndefined} from '../../../../../front_end/core/platform/platform.js';
import * as SDK from '../../../../../front_end/core/sdk/sdk.js';

const {assert} = chai;

type PrerenderingAttemptId = SDK.PrerenderingModel.PrerenderingAttemptId;
type PrerenderingAttempt = SDK.PrerenderingModel.PrerenderingAttempt;
type PrerenderingAttemptEventAdd = SDK.PrerenderingModel.PrerenderingAttemptEventAdd;
type PrerenderingAttemptEventUpdate = SDK.PrerenderingModel.PrerenderingAttemptEventUpdate;

describe('PrerenderingRegistry', () => {
  it('add and update works', () => {
    const registry = new SDK.PrerenderingModel.PrerenderingRegistry();

    assert.deepEqual(registry.getAll(), []);

    const startedAt = Date.now();

    (() => {
      const prerenderingAttemptId: PrerenderingAttemptId = '0' as PrerenderingAttemptId;
      const url = 'https://example.com/0' as Platform.DevToolsPath.UrlString;
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
        url,
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
          url: 'https://example.com/0' as Platform.DevToolsPath.UrlString,
          status: 'prerendering',
        },
      ],
    ]);

    (() => {
      const prerenderingAttemptId: PrerenderingAttemptId = '1' as PrerenderingAttemptId;
      const url = 'https://example.com/1' as Platform.DevToolsPath.UrlString;
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
        url,
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
          url: 'https://example.com/0' as Platform.DevToolsPath.UrlString,
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
          url: 'https://example.com/1' as Platform.DevToolsPath.UrlString,
          status: 'prerendering',
        },
      ],
    ]);

    (() => {
      const origAttempt = registry.getById('PrerenderingAttempt:0');
      assertNotNullOrUndefined(origAttempt);
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
          url: 'https://example.com/0' as Platform.DevToolsPath.UrlString,
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
          url: 'https://example.com/1' as Platform.DevToolsPath.UrlString,
          status: 'prerendering',
        },
      ],
    ]);
  });

  it('clearNotOngoing works', () => {
    const registry = new SDK.PrerenderingModel.PrerenderingRegistry();

    assert.deepEqual(registry.getAll(), []);

    const startedAt = Date.now();

    (() => {
      const prerenderingAttemptId: PrerenderingAttemptId = '0' as PrerenderingAttemptId;
      const url = 'https://example.com/0' as Platform.DevToolsPath.UrlString;
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
        url,
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
      const url = 'https://example.com/1' as Platform.DevToolsPath.UrlString;
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
        url,
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
      assertNotNullOrUndefined(origAttempt);
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
          url: 'https://example.com/1' as Platform.DevToolsPath.UrlString,
          status: 'prerendering',
        },
      ],
    ]);
  });
});
