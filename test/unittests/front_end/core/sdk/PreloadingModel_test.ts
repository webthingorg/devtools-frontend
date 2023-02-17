// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as SDK from '../../../../../front_end/core/sdk/sdk.js';
import type * as Protocol from '../../../../../front_end/generated/protocol.js';

const {assert} = chai;

describe('RuleSetRegistry', () => {
  it('insert and delete works', () => {
    const registry = new SDK.PreloadingModel.RuleSetRegistry();

    assert.deepEqual(registry.getAll(), []);

    registry.insert({
      id: 'ruleSetId:1' as Protocol.Preload.RuleSetId,
      loaderId: 'loaderId' as Protocol.Network.LoaderId,
      sourceText: `
{
  "prefetch":[
    {
      "source": "list",
      "urls": ["/subresource.js"]
    }
  ]
}
`,
    });

    assert.deepEqual(registry.getAll(), [
      {
        id: 'ruleSetId:1',
        value: {
          id: 'ruleSetId:1' as Protocol.Preload.RuleSetId,
          loaderId: 'loaderId' as Protocol.Network.LoaderId,
          sourceText: `
{
  "prefetch":[
    {
      "source": "list",
      "urls": ["/subresource.js"]
    }
  ]
}
`,
        },
      },
    ]);

    registry.insert({
      id: 'ruleSetId:2' as Protocol.Preload.RuleSetId,
      loaderId: 'loaderId' as Protocol.Network.LoaderId,
      sourceText: `
{
  "prerender":[
    {
      "source": "list",
      "urls": ["/page.html"]
    }
  ]
}
`,
    });

    assert.deepEqual(registry.getAll(), [
      {
        id: 'ruleSetId:1',
        value: {
          id: 'ruleSetId:1' as Protocol.Preload.RuleSetId,
          loaderId: 'loaderId' as Protocol.Network.LoaderId,
          sourceText: `
{
  "prefetch":[
    {
      "source": "list",
      "urls": ["/subresource.js"]
    }
  ]
}
`,
        },
      },
      {
        id: 'ruleSetId:2',
        value: {

          id: 'ruleSetId:2' as Protocol.Preload.RuleSetId,
          loaderId: 'loaderId' as Protocol.Network.LoaderId,
          sourceText: `
{
  "prerender":[
    {
      "source": "list",
      "urls": ["/page.html"]
    }
  ]
}
`,
        },
      },
    ]);

    registry.delete('ruleSetId:1' as Protocol.Preload.RuleSetId);

    assert.deepEqual(registry.getAll(), [
      {
        id: 'ruleSetId:2',
        value: {
          id: 'ruleSetId:2' as Protocol.Preload.RuleSetId,
          loaderId: 'loaderId' as Protocol.Network.LoaderId,
          sourceText: `
{
  "prerender":[
    {
      "source": "list",
      "urls": ["/page.html"]
    }
  ]
}
`,
        },
      },
    ]);
  });

  it('clearOnMainFrameNavigation works', () => {
    const registry = new SDK.PreloadingModel.RuleSetRegistry();

    assert.deepEqual(registry.getAll(), []);

    registry.insert({
      id: 'ruleSetId:1' as Protocol.Preload.RuleSetId,
      loaderId: 'loaderId:1' as Protocol.Network.LoaderId,
      sourceText: `
{
  "prefetch":[
    {
      "source": "list",
      "urls": ["/subresource.js"]
    }
  ]
}
`,
    });

    registry.insert({
      id: 'ruleSetId:2' as Protocol.Preload.RuleSetId,
      loaderId: 'loaderId:2' as Protocol.Network.LoaderId,
      sourceText: `
{
  "prerender":[
    {
      "source": "list",
      "urls": ["/page.html"]
    }
  ]
}
`,
    });

    assert.strictEqual(registry.getAll().length, 2);

    registry.clearOnMainFrameNavigation('loaderId:2' as Protocol.Network.LoaderId);

    assert.deepEqual(registry.getAll(), [
      {
        id: 'ruleSetId:2',
        value: {
          id: 'ruleSetId:2' as Protocol.Preload.RuleSetId,
          loaderId: 'loaderId:2' as Protocol.Network.LoaderId,
          sourceText: `
{
  "prerender":[
    {
      "source": "list",
      "urls": ["/page.html"]
    }
  ]
}
`,
        },
      },
    ]);
  });
});
