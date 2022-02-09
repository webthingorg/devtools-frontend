// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import * as Bindings from '../../../../../front_end/models/bindings/bindings.js';
import * as Persistence from '../../../../../front_end/models/persistence/persistence.js';
import * as Root from '../../../../../front_end/core/root/root.js';
import * as SDK from '../../../../../front_end/core/sdk/sdk.js';
import * as Workspace from '../../../../../front_end/models/workspace/workspace.js';
import {describeWithMockConnection} from '../../helpers/MockConnection.js';
import {initializeGlobalVars, deinitializeGlobalVars, createTarget} from '../../helpers/EnvironmentHelpers.js';

async function setUpEnvironment() {
  const workspace = Workspace.Workspace.WorkspaceImpl.instance();
  const forceNew = true;
  const targetManager = SDK.TargetManager.TargetManager.instance();
  const debuggerWorkspaceBinding =
      Bindings.DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance({forceNew, targetManager, workspace});
  const breakpointManager = Bindings.BreakpointManager.BreakpointManager.instance(
      {forceNew: true, targetManager, workspace, debuggerWorkspaceBinding});
  Persistence.Persistence.PersistenceImpl.instance({forceNew: true, workspace, breakpointManager});
  const networkPersistenceManager =
      Persistence.NetworkPersistenceManager.NetworkPersistenceManager.instance({forceNew: true, workspace});
  return {networkPersistenceManager};
}

async function setUpHeaderOverrides() {
  createTarget();
  const {networkPersistenceManager} = await setUpEnvironment();
  const uiSourceCodeMap = new Map<string, Workspace.UISourceCode.UISourceCode>();
  const fileSystem = {
    fileSystemPath: () => 'file:///path/to/overrides',
    fileSystemBaseURL: 'file:///path/to/overrides/',
    uiSourceCodeForURL: (url: string): Workspace.UISourceCode.UISourceCode | null => uiSourceCodeMap.get(url) || null,
  } as unknown as Persistence.FileSystemWorkspaceBinding.FileSystem;
  const globalHeaders = `
  [
    {
      "applyTo": "*",
      "headers": {
        "age":"overridden"
      }
    }
  ]
  `;
  const exampleHeaders = `
  [
    {
      "applyTo": "index.html",
      "headers": {
        "index-only":"only added to index.html"
      }
    },
    {
      "applyTo": "*.css",
      "headers": {
        "css-only":"only added to css files"
      }
    },
    {
      "applyTo": "path/to/*.js",
      "headers": {
        "another-header":"only added to specific path"
      }
    }
  ]
  `;
  const exampleSourceCode = {
    requestContent: () => {
      return Promise.resolve({content: exampleHeaders});
    },
    url: () => 'file:///path/to/overrides/www.example.com/.headers',
    project: () => fileSystem,
    name: () => '.headers',
  } as unknown as Workspace.UISourceCode.UISourceCode;
  const globalSourceCode = {
    requestContent: () => {
      return Promise.resolve({content: globalHeaders});
    },
    url: () => 'file:///path/to/overrides/.headers',
    project: () => fileSystem,
    name: () => '.headers',
  } as unknown as Workspace.UISourceCode.UISourceCode;
  const uiSourceCodeArray = [exampleSourceCode, globalSourceCode];
  uiSourceCodeMap.set(exampleSourceCode.url(), exampleSourceCode);
  uiSourceCodeMap.set(globalSourceCode.url(), globalSourceCode);
  const mockProject = {
    uiSourceCodes: () => uiSourceCodeArray,
    id: () => 'file:///path/to/overrides',
  } as unknown as Workspace.Workspace.Project;
  await networkPersistenceManager.setProject(mockProject);
  SDK.NetworkManager.MultitargetNetworkManager.instance().setInterceptionHandlerForPatterns = async () => {};
  await networkPersistenceManager.updateInterceptionPatternsForTests();
  return {networkPersistenceManager};
}

describeWithMockConnection('NetworkPersistenceManager', () => {
  beforeEach(() => {
    Root.Runtime.experiments.register(Root.Runtime.ExperimentName.HEADER_OVERRIDES, '');
    Root.Runtime.experiments.enableForTest(Root.Runtime.ExperimentName.HEADER_OVERRIDES);
  });

  it('merges request headers with override without overlap', async () => {
    const {networkPersistenceManager} = await setUpHeaderOverrides();
    const interceptedRequest = {
      request: {
        url: 'https://www.example.com/',
      },
      responseHeaders: [
        {name: 'server', value: 'DevTools mock server'},
      ],
    } as SDK.NetworkManager.InterceptedRequest;
    const expected = [
      {name: 'server', value: 'DevTools mock server'},
      {name: 'age', value: 'overridden'},
      {name: 'index-only', value: 'only added to index.html'},
    ];
    assert.deepEqual(await networkPersistenceManager.handleHeaderInterception(interceptedRequest), expected);
  });

  it('merges request headers with override with overlap', async () => {
    const {networkPersistenceManager} = await setUpHeaderOverrides();
    const interceptedRequest = {
      request: {
        url: 'https://www.example.com/index.html',
      },
      responseHeaders: [
        {name: 'server', value: 'DevTools mock server'},
        {name: 'age', value: '1'},
      ],
    } as SDK.NetworkManager.InterceptedRequest;
    const expected = [
      {name: 'server', value: 'DevTools mock server'},
      {name: 'age', value: 'overridden'},
      {name: 'index-only', value: 'only added to index.html'},
    ];
    assert.deepEqual(await networkPersistenceManager.handleHeaderInterception(interceptedRequest), expected);
  });

  it('merges request headers with override with file type wildcard', async () => {
    const {networkPersistenceManager} = await setUpHeaderOverrides();
    const interceptedRequest = {
      request: {
        url: 'https://www.example.com/styles.css',
      },
      responseHeaders: [
        {name: 'server', value: 'DevTools mock server'},
        {name: 'age', value: '1'},
      ],
    } as SDK.NetworkManager.InterceptedRequest;
    const expected = [
      {name: 'server', value: 'DevTools mock server'},
      {name: 'age', value: 'overridden'},
      {name: 'css-only', value: 'only added to css files'},
    ];
    assert.deepEqual(await networkPersistenceManager.handleHeaderInterception(interceptedRequest), expected);
  });

  it('merges request headers with override with specific path', async () => {
    const {networkPersistenceManager} = await setUpHeaderOverrides();
    const interceptedRequest = {
      request: {
        url: 'https://www.example.com/path/to/script.js',
      },
      responseHeaders: [
        {name: 'server', value: 'DevTools mock server'},
        {name: 'age', value: '1'},
      ],
    } as SDK.NetworkManager.InterceptedRequest;
    const expected = [
      {name: 'server', value: 'DevTools mock server'},
      {name: 'age', value: 'overridden'},
      {name: 'another-header', value: 'only added to specific path'},
    ];
    assert.deepEqual(await networkPersistenceManager.handleHeaderInterception(interceptedRequest), expected);
  });

  it('merges request headers only when domain matches', async () => {
    const {networkPersistenceManager} = await setUpHeaderOverrides();
    const interceptedRequest = {
      request: {
        url: 'https://www.web.dev/index.html',
      },
      responseHeaders: [
        {name: 'server', value: 'DevTools mock server'},
      ],
    } as SDK.NetworkManager.InterceptedRequest;
    const expected = [
      {name: 'server', value: 'DevTools mock server'},
      {name: 'age', value: 'overridden'},
    ];
    assert.deepEqual(await networkPersistenceManager.handleHeaderInterception(interceptedRequest), expected);
  });
});

describe('NetworkPersistenceManager', () => {
  before(async () => {
    await initializeGlobalVars();
  });
  after(async () => {
    await deinitializeGlobalVars();
  });

  it('escapes patterns to be used in RegExes', () => {
    assert.strictEqual(Persistence.NetworkPersistenceManager.escapeRegex('www.example.com/'), 'www\\.example\\.com/');
    assert.strictEqual(
        Persistence.NetworkPersistenceManager.escapeRegex('www.example.com/index.html'),
        'www\\.example\\.com/index\\.html');
    assert.strictEqual(
        Persistence.NetworkPersistenceManager.escapeRegex('www.example.com/*'), 'www\\.example\\.com/.*');
    assert.strictEqual(
        Persistence.NetworkPersistenceManager.escapeRegex('www.example.com/*.js'), 'www\\.example\\.com/.*\\.js');
    assert.strictEqual(
        Persistence.NetworkPersistenceManager.escapeRegex('www.example.com/file([{with-special$_^chars}])'),
        'www\\.example\\.com/file\\(\\[\\{with\\-special\\$_\\^chars\\}\\]\\)');
    assert.strictEqual(
        Persistence.NetworkPersistenceManager.escapeRegex('www.example.com/page.html?foo=bar'),
        'www\\.example\\.com/page\\.html\\?foo=bar');
    assert.strictEqual(
        Persistence.NetworkPersistenceManager.escapeRegex('www.example.com/*?foo=bar'),
        'www\\.example\\.com/.*\\?foo=bar');
  });

  it('detects when the tail of a path matches with a default index file', () => {
    assert.isTrue(Persistence.NetworkPersistenceManager.indexMatchesTail('index.html'));
    assert.isTrue(Persistence.NetworkPersistenceManager.indexMatchesTail('index.htm'));
    assert.isTrue(Persistence.NetworkPersistenceManager.indexMatchesTail('index.php'));
    assert.isFalse(Persistence.NetworkPersistenceManager.indexMatchesTail('index.ht'));
    assert.isTrue(Persistence.NetworkPersistenceManager.indexMatchesTail('*.html'));
    assert.isTrue(Persistence.NetworkPersistenceManager.indexMatchesTail('*.htm'));
    assert.isTrue(Persistence.NetworkPersistenceManager.indexMatchesTail('path/*.html'));
    assert.isFalse(Persistence.NetworkPersistenceManager.indexMatchesTail('foo*.html'));
    assert.isFalse(Persistence.NetworkPersistenceManager.indexMatchesTail('a*'));
    assert.isTrue(Persistence.NetworkPersistenceManager.indexMatchesTail('a/*'));
  });

  it('merges headers which do not overlap', async () => {
    const {networkPersistenceManager} = await setUpEnvironment();
    const baseHeaders = [{
      name: 'age',
      value: '0',
    }];
    const overrideHeaders = {
      'accept-ranges': 'bytes',
    };
    const merged = [
      {name: 'age', value: '0'},
      {name: 'accept-ranges', value: 'bytes'},
    ];
    assert.deepEqual(networkPersistenceManager.mergeHeaders(baseHeaders, overrideHeaders), merged);
  });

  it('merges headers which overlap', async () => {
    const {networkPersistenceManager} = await setUpEnvironment();
    const baseHeaders = [{
      name: 'age',
      value: '0',
    }];
    const overrideHeaders = {
      'accept-ranges': 'bytes',
      'age': '1',
    };
    const merged = [
      {name: 'age', value: '1'},
      {name: 'accept-ranges', value: 'bytes'},
    ];
    assert.deepEqual(networkPersistenceManager.mergeHeaders(baseHeaders, overrideHeaders), merged);
  });

  it('generates header patterns', async () => {
    const {networkPersistenceManager} = await setUpEnvironment();
    const headers = `
    [
      {
        "applyTo": "*",
        "headers": {
          "age":"0"
        }
      },
      {
        "applyTo": "page.html",
        "headers": {
          "age":"1"
        }
      },
      {
        "applyTo": "index.html",
        "headers": {
          "age":"2"
        }
      },
      {
        "applyTo": "nested/path/*.js",
        "headers": {
          "age":"3"
        }
      },
      {
        "applyTo": "*/path/*.js",
        "headers": {
          "age":"4"
        }
      }
    ]
    `;
    const fileSystem = {
      fileSystemPath: () => 'file:///path/to/overrides',
      fileSystemBaseURL: 'file:///path/to/overrides/',
    } as unknown as Persistence.FileSystemWorkspaceBinding.FileSystem;
    const uiSourceCode = {
      requestContent: () => {
        return Promise.resolve({content: headers});
      },
      url: () => 'file:///path/to/overrides/www.example.com/.headers',
      project: () => fileSystem,
    } as unknown as Workspace.UISourceCode.UISourceCode;

    const expectedPatterns = [
      'http?://www.example.com/*',
      'http?://www.example.com/page.html',
      'http?://www.example.com/index.html',
      'http?://www.example.com/',
      'http?://www.example.com/nested/path/*.js',
      'http?://www.example.com/*/path/*.js',
    ];
    const returnedPatterns = await networkPersistenceManager.generateHeaderPatterns(uiSourceCode);
    assert.deepEqual(Array.from(returnedPatterns).sort(), expectedPatterns.sort());

    const expectedMapping = [
      {
        applyTo: /^https?:\/\/www\.example\.com\/(.*)?$/.toString(),
        headers: {age: '0'},
      },
      {
        applyTo: /^https?:\/\/www\.example\.com\/page\.html$/.toString(),
        headers: {age: '1'},
      },
      {
        applyTo: /^https?:\/\/www\.example\.com\/(index\.html)?$/.toString(),
        headers: {age: '2'},
      },
      {
        applyTo: /^https?:\/\/www\.example\.com\/nested\/path\/.*\.js$/.toString(),
        headers: {age: '3'},
      },
      {
        applyTo: /^https?:\/\/www\.example\.com\/.*\/path\/.*\.js$/.toString(),
        headers: {age: '4'},
      },
    ];

    const overridesMap = networkPersistenceManager.getOverridesForTests();
    assert.strictEqual(overridesMap.size, 1);
    overridesMap.forEach((headerOverrides, path) => {
      const actualMapping = headerOverrides.map(headerOverride => {
        return {
          applyTo: headerOverride.applyToRegex.toString(),
          headers: headerOverride.headers,
        };
      });
      assert.strictEqual(path, 'www.example.com/');
      assert.deepEqual(actualMapping, expectedMapping);
    });
  });
});
