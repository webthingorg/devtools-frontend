// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assertNotNullOrUndefined} from '../../../../../front_end/core/platform/platform.js';
import * as SDK from '../../../../../front_end/core/sdk/sdk.js';
import * as Protocol from '../../../../../front_end/generated/protocol.js';
import {createTarget} from '../../helpers/EnvironmentHelpers.js';
import {
  describeWithMockConnection,
  dispatchEvent,
} from '../../helpers/MockConnection.js';

const {assert} = chai;

describeWithMockConnection('PreloadingModel', async () => {
  it('renders grid and details', async () => {
    const target = createTarget();
    const model = target.model(SDK.PreloadingModel.PreloadingModel);
    assertNotNullOrUndefined(model);

    assert.deepEqual(model.getAllRuleSets(), []);

    dispatchEvent(target, 'Page.frameNavigated', {
      frame: {
        id: 'frameId:1',
        loaderId: 'loaderId:1' as Protocol.Network.LoaderId,
        url: 'https://example.com/',
        domainAndRegistry: 'example.com',
        securityOrigin: 'https://example.com/',
        mimeType: 'text/html',
        secureContextType: Protocol.Page.SecureContextType.Secure,
        crossOriginIsolatedContextType: Protocol.Page.CrossOriginIsolatedContextType.Isolated,
        gatedAPIFeatures: [],
      },
    });

    dispatchEvent(target, 'Preload.ruleSetUpdated', {
      ruleSet: {
        id: 'ruleSetId:1',
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
      },
    });

    assert.deepEqual(model.getAllRuleSets(), [
      {
        id: 'ruleSetId:1',
        value: {
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
        },
      },
    ]);

    dispatchEvent(target, 'Preload.ruleSetUpdated', {
      ruleSet: {
        id: 'ruleSetId:2',
        loaderId: 'loaderId:1' as Protocol.Network.LoaderId,
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
    });

    assert.deepEqual(model.getAllRuleSets(), [
      {
        id: 'ruleSetId:1',
        value: {
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
        },
      },
      {
        id: 'ruleSetId:2',
        value: {

          id: 'ruleSetId:2' as Protocol.Preload.RuleSetId,
          loaderId: 'loaderId:1' as Protocol.Network.LoaderId,
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

    dispatchEvent(target, 'Preload.ruleSetRemoved', {
      id: 'ruleSetId:1',
    });

    assert.deepEqual(model.getAllRuleSets(), [
      {
        id: 'ruleSetId:2',
        value: {
          id: 'ruleSetId:2' as Protocol.Preload.RuleSetId,
          loaderId: 'loaderId:1' as Protocol.Network.LoaderId,
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

  it('clears SpeculationRules for previous pages', async () => {
    const target = createTarget();
    const model = target.model(SDK.PreloadingModel.PreloadingModel);
    assertNotNullOrUndefined(model);

    assert.deepEqual(model.getAllRuleSets(), []);

    dispatchEvent(target, 'Page.frameNavigated', {
      frame: {
        id: 'frameId:1',
        loaderId: 'loaderId:1' as Protocol.Network.LoaderId,
        url: 'https://example.com/',
        domainAndRegistry: 'example.com',
        securityOrigin: 'https://example.com/',
        mimeType: 'text/html',
        secureContextType: Protocol.Page.SecureContextType.Secure,
        crossOriginIsolatedContextType: Protocol.Page.CrossOriginIsolatedContextType.Isolated,
        gatedAPIFeatures: [],
      },
    });

    dispatchEvent(target, 'Preload.ruleSetUpdated', {
      ruleSet: {
        id: 'ruleSetId:1',
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
      },
    });
    dispatchEvent(target, 'Preload.ruleSetUpdated', {
      ruleSet: {
        id: 'ruleSetId:2',
        loaderId: 'loaderId:2' as Protocol.Network.LoaderId,
        sourceText: `
{
  "prefetch":[
    {
      "source": "list",
      "urls": ["/style.css"]
    }
  ]
}
`,
      },
    });

    assert.strictEqual(model.getAllRuleSets().length, 2);

    dispatchEvent(target, 'Page.frameNavigated', {
      frame: {
        id: 'frameId:2',
        loaderId: 'loaderId:2' as Protocol.Network.LoaderId,
        url: 'https://example.com/',
        domainAndRegistry: 'example.com',
        securityOrigin: 'https://example.com/',
        mimeType: 'text/html',
        secureContextType: Protocol.Page.SecureContextType.Secure,
        crossOriginIsolatedContextType: Protocol.Page.CrossOriginIsolatedContextType.Isolated,
        gatedAPIFeatures: [],
      },
    });

    assert.deepEqual(model.getAllRuleSets(), [
      {
        id: 'ruleSetId:2',
        value: {
          id: 'ruleSetId:2' as Protocol.Preload.RuleSetId,
          loaderId: 'loaderId:2' as Protocol.Network.LoaderId,
          sourceText: `
{
  "prefetch":[
    {
      "source": "list",
      "urls": ["/style.css"]
    }
  ]
}
`,
        },
      },
    ]);
  });

  it('clears SpeculationRules for previous pages when prerendered page activated', async () => {
    const target = createTarget();
    const model = target.model(SDK.PreloadingModel.PreloadingModel);
    assertNotNullOrUndefined(model);

    assert.deepEqual(model.getAllRuleSets(), []);

    dispatchEvent(target, 'Page.frameNavigated', {
      frame: {
        id: 'frameId:1',
        loaderId: 'loaderId:1' as Protocol.Network.LoaderId,
        url: 'https://example.com/',
        domainAndRegistry: 'example.com',
        securityOrigin: 'https://example.com/',
        mimeType: 'text/html',
        secureContextType: Protocol.Page.SecureContextType.Secure,
        crossOriginIsolatedContextType: Protocol.Page.CrossOriginIsolatedContextType.Isolated,
        gatedAPIFeatures: [],
      },
    });

    // Assume that the first page has a speculationrules for prerendering.
    dispatchEvent(target, 'Preload.ruleSetUpdated', {
      ruleSet: {
        id: 'ruleSetId:1',
        loaderId: 'loaderId:1' as Protocol.Network.LoaderId,
        sourceText: `
{
  "prerender":[
    {
      "source": "list",
      "urls": ["/prerendered.html"]
    }
  ]
}
`,
      },
    });

    assert.strictEqual(model.getAllRuleSets().length, 1);

    // Commit of prerendering page with loaderId 'loaderId:2'.
    dispatchEvent(target, 'Page.frameNavigated', {
      frame: {
        id: 'frameId:2',
        loaderId: 'loaderId:2' as Protocol.Network.LoaderId,
        url: 'https://example.com/prerendered.html',
        domainAndRegistry: 'example.com',
        securityOrigin: 'https://example.com/',
        mimeType: 'text/html',
        secureContextType: Protocol.Page.SecureContextType.Secure,
        crossOriginIsolatedContextType: Protocol.Page.CrossOriginIsolatedContextType.Isolated,
        gatedAPIFeatures: [],
      },
    });

    // Assume that the prerendered page has a speculationrules for prerendering.
    //
    // This is not current behavior. This event is actually not emitted.
    // We put this event to check the model and race.
    //
    // TODO(https://crbug.com/1418020): Remove/update this comment.
    dispatchEvent(target, 'Preload.ruleSetUpdated', {
      ruleSet: {
        id: 'ruleSetId:2',
        loaderId: 'loaderId:2' as Protocol.Network.LoaderId,
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
    });

    // Activation with loaderId 'loaderId:2'.
    dispatchEvent(target, 'Page.prerenderAttemptCompleted', {
      'initiatingFrameId': 'frameId:1',
      'prerenderingUrl': 'https://example.com/prerendered.html',
      'finalStatus': Protocol.Page.PrerenderFinalStatus.Activated,
    });

    assert.deepEqual(model.getAllRuleSets(), [
      {
        id: 'ruleSetId:2',
        value: {
          id: 'ruleSetId:2' as Protocol.Preload.RuleSetId,
          loaderId: 'loaderId:2' as Protocol.Network.LoaderId,
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
  });
});
