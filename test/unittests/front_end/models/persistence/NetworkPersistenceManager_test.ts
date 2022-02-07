// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import * as Bindings from '../../../../../front_end/models/bindings/bindings.js';
import * as Persistence from '../../../../../front_end/models/persistence/persistence.js';
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
  const mockProject = {
    uiSourceCodes: () => [],
    id: () => 'file:///path/to/overrides',
  } as unknown as Workspace.Workspace.Project;
  await networkPersistenceManager.setProject(mockProject);
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
  } as unknown as Workspace.UISourceCode.UISourceCode;
  const globalSourceCode = {
    requestContent: () => {
      return Promise.resolve({content: globalHeaders});
    },
    url: () => 'file:///path/to/overrides/.headers',
    project: () => fileSystem,
  } as unknown as Workspace.UISourceCode.UISourceCode;

  const uiSourceCodeMap = new Map<string, Workspace.UISourceCode.UISourceCode>();
  uiSourceCodeMap.set(exampleSourceCode.url(), exampleSourceCode);
  uiSourceCodeMap.set(globalSourceCode.url(), globalSourceCode);

  const fileSystem = {
    fileSystemPath: () => 'file:///path/to/overrides',
    fileSystemBaseURL: 'file:///path/to/overrides/',
    uiSourceCodeForURL: (url: string): Workspace.UISourceCode.UISourceCode | null => uiSourceCodeMap.get(url) || null,
  } as unknown as Persistence.FileSystemWorkspaceBinding.FileSystem;

  return {networkPersistenceManager, fileSystem};
}

describeWithMockConnection('NetworkPersistenceManager', () => {
  it('splits URLs into segments', async () => {
    createTarget();
    const {networkPersistenceManager} = await setUpEnvironment();
    const mockProject = {
      uiSourceCodes: () => [],
      id: () => 'file:///path/to/overrides',
    } as unknown as Workspace.Workspace.Project;
    await networkPersistenceManager.setProject(mockProject);
    assert.deepEqual(
        networkPersistenceManager.splitUrlIntoSegments('https://www.example.com/index.html'), ['', 'www.example.com']);
    assert.deepEqual(
        networkPersistenceManager.splitUrlIntoSegments('http://www.example.com/this/is/a/path/index.html'),
        ['', 'www.example.com', 'this', 'is', 'a', 'path']);
    assert.deepEqual(
        networkPersistenceManager.splitUrlIntoSegments('http://www.example.com/this/is/a/path/'),
        ['', 'www.example.com', 'this', 'is', 'a', 'path']);
    assert.deepEqual(
        networkPersistenceManager.splitUrlIntoSegments('http://www.example.com/this/is/a/path'),
        ['', 'www.example.com', 'this', 'is', 'a']);
    assert.deepEqual(
        networkPersistenceManager.splitUrlIntoSegments('http://www.example.com/this/is/a/path/index.html?foo=bar'),
        ['', 'www.example.com', 'this', 'is', 'a', 'path']);
    assert.deepEqual(
        networkPersistenceManager.splitUrlIntoSegments('http://www.example.com/this/is/a/path/?foo=bar'),
        ['', 'www.example.com', 'this', 'is', 'a', 'path']);
  });

  it('merges request headers with override without overlap', async () => {
    const {networkPersistenceManager, fileSystem} = await setUpHeaderOverrides();
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
    assert.deepEqual(
        await networkPersistenceManager.handleHeaderInterception(interceptedRequest, fileSystem), expected);
  });

  it('merges request headers with override with overlap', async () => {
    const {networkPersistenceManager, fileSystem} = await setUpHeaderOverrides();
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
    assert.deepEqual(
        await networkPersistenceManager.handleHeaderInterception(interceptedRequest, fileSystem), expected);
  });

  it('merges request headers with override with overlap', async () => {
    const {networkPersistenceManager, fileSystem} = await setUpHeaderOverrides();
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
    assert.deepEqual(
        await networkPersistenceManager.handleHeaderInterception(interceptedRequest, fileSystem), expected);
  });

  it('merges request headers with override with overlap', async () => {
    const {networkPersistenceManager, fileSystem} = await setUpHeaderOverrides();
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
    assert.deepEqual(
        await networkPersistenceManager.handleHeaderInterception(interceptedRequest, fileSystem), expected);
  });

  it('merges request headers only when domain matches', async () => {
    const {networkPersistenceManager, fileSystem} = await setUpHeaderOverrides();
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
    assert.deepEqual(
        await networkPersistenceManager.handleHeaderInterception(interceptedRequest, fileSystem), expected);
  });
});

describe('NetworkPersistenceManager', () => {
  before(async () => {
    await initializeGlobalVars();
  });
  after(async () => {
    await deinitializeGlobalVars();
  });

  it('determines whether a URL matches a pattern', async () => {
    const {networkPersistenceManager} = await setUpEnvironment();
    assert.isTrue(networkPersistenceManager.doesUrlMatchPattern('www.example.com/', 'www.example.com/*'));
    assert.isTrue(networkPersistenceManager.doesUrlMatchPattern('www.example.com/index.html', 'www.example.com/*'));
    assert.isTrue(
        networkPersistenceManager.doesUrlMatchPattern('www.example.com/index.html', 'www.example.com/index.html'));
    assert.isTrue(networkPersistenceManager.doesUrlMatchPattern('www.example.com/file', 'www.example.com/*'));
    assert.isFalse(networkPersistenceManager.doesUrlMatchPattern('www.example.com/file', 'www.example.com/file/*'));
    assert.isTrue(networkPersistenceManager.doesUrlMatchPattern('www.example.com/path/', 'www.example.com/*'));
    assert.isTrue(networkPersistenceManager.doesUrlMatchPattern('www.example.com/path/', 'www.example.com/path/*'));
    assert.isTrue(networkPersistenceManager.doesUrlMatchPattern('www.example.com/styles.css', 'www.example.com/*.css'));
    assert.isTrue(
        networkPersistenceManager.doesUrlMatchPattern('www.example.com/path/styles.css', 'www.example.com/*.css'));
    assert.isTrue(networkPersistenceManager.doesUrlMatchPattern(
        'www.example.com/some/long/path/index.html', 'www.example.com/*/index.html'));
    assert.isTrue(networkPersistenceManager.doesUrlMatchPattern(
        'www.example.com/file([{with-special$_^chars}])', 'www.example.com/file([{with-special$_^chars}])'));
    assert.isTrue(networkPersistenceManager.doesUrlMatchPattern(
        'www.example.com/page.html?foo=bar', 'www.example.com/*?foo=bar'));
    assert.isTrue(networkPersistenceManager.doesUrlMatchPattern(
        'www.example.com/page.html?foo=bar', 'www.example.com/page.html?foo=bar'));
    assert.isTrue(networkPersistenceManager.doesUrlMatchPattern('www.example.com/', 'www.example.com/*.html'));
    assert.isFalse(networkPersistenceManager.doesUrlMatchPattern('www.example.com', 'www.example.com/*.html'));
    assert.isFalse(networkPersistenceManager.doesUrlMatchPattern('www.example.com', 'www.example.com/*'));
    assert.isTrue(
        networkPersistenceManager.doesUrlMatchPattern('www.example.com/?source=test', 'www.example.com/*.html*'));
    assert.isFalse(
        networkPersistenceManager.doesUrlMatchPattern('www.example.com?source=test', 'www.example.com/*.html*'));
    assert.isFalse(networkPersistenceManager.doesUrlMatchPattern('www.example.com/index.html', 'www.example.com/'));
    assert.isFalse(networkPersistenceManager.doesUrlMatchPattern('www.example.com/styles.css', 'www.example.com/*.js'));
    assert.isFalse(
        networkPersistenceManager.doesUrlMatchPattern('www.example.com/path.html', 'www.example.com/path/*'));
    assert.isFalse(networkPersistenceManager.doesUrlMatchPattern(
        'www.example.com/index/page.html', 'www.example.com/*/index.html'));
    assert.isFalse(networkPersistenceManager.doesUrlMatchPattern(
        'www.example.com/file([{with-special$_^chars}])', 'www.example.com/file([{with-special_^chars}])'));
    assert.isFalse(networkPersistenceManager.doesUrlMatchPattern(
        'www.example.com/page.html?foo=bar', 'www.example.com/page.html'));
    assert.isFalse(
        networkPersistenceManager.doesUrlMatchPattern('www.example.com/page.html?foo=bar', 'www.example.com/*.html'));
    assert.isTrue(
        networkPersistenceManager.doesUrlMatchPattern('www.example.com/page.html?foo=bar', 'www.example.com/*.html*'));
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
    const uiSourceCode = {
      requestContent: () => {
        return Promise.resolve({content: headers});
      },
      url: () => 'file:///path/to/overrides/www.example.com/.headers',
    } as unknown as Workspace.UISourceCode.UISourceCode;
    const expectedPatterns = [
      'http?://www.example.com/*',
      'http?://www.example.com/page.html',
      'http?://www.example.com/index.html',
      'http?://www.example.com/',
      'http?://www.example.com/nested/path/*.js',
      'http?://www.example.com/*/path/*.js',
    ];
    const returnedPatterns =
        await networkPersistenceManager.generateHeaderPatterns(uiSourceCode, 'http?://www.example.com/.headers');
    assert.deepEqual(Array.from(returnedPatterns).sort(), expectedPatterns.sort());
  });
});
