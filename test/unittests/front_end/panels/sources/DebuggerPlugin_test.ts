// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../../../../front_end/core/common/common.js';
import * as SDK from '../../../../../front_end/core/sdk/sdk.js';
import * as Protocol from '../../../../../front_end/generated/protocol.js';
import * as Bindings from '../../../../../front_end/models/bindings/bindings.js';
import * as TextUtils from '../../../../../front_end/models/text_utils/text_utils.js';
import * as Workspace from '../../../../../front_end/models/workspace/workspace.js';
import * as Sources from '../../../../../front_end/panels/sources/sources.js';
import * as CodeMirror from '../../../../../front_end/third_party/codemirror.next/codemirror.next.js';
import * as TextEditor from '../../../../../front_end/ui/components/text_editor/text_editor.js';

import type * as Platform from '../../../../../front_end/core/platform/platform.js';
import {createTarget, describeWithEnvironment} from '../../helpers/EnvironmentHelpers.js';
import {MockProtocolBackend, parseScopeChain} from '../../helpers/MockScopeChain.js';
import {describeWithMockConnection} from '../../helpers/MockConnection.js';

describeWithMockConnection('Inline variable view scope helpers', () => {
  const URL = 'file:///tmp/example.js' as Platform.DevToolsPath.UrlString;
  let target: SDK.Target.Target;
  let backend: MockProtocolBackend;

  beforeEach(() => {
    const workspace = Workspace.Workspace.WorkspaceImpl.instance();
    const targetManager = SDK.TargetManager.TargetManager.instance();
    const debuggerWorkspaceBinding = Bindings.DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance({
      forceNew: true,
      targetManager,
      workspace,
    });
    Bindings.IgnoreListManager.IgnoreListManager.instance({forceNew: true, debuggerWorkspaceBinding});
    target = createTarget();
    backend = new MockProtocolBackend();
  });

  async function toOffset(sourceMap: SDK.SourceMap.SourceMap|null, location: SDK.DebuggerModel.Location|null) {
    if (!location || !sourceMap) {
      return null;
    }
    const entry = sourceMap.findEntry(location.lineNumber, location.columnNumber);
    if (!entry || !entry.sourceURL) {
      return null;
    }
    const content =
        (await sourceMap.sourceContentProvider(entry.sourceURL, Common.ResourceType.resourceTypes.SourceMapScript)
             .requestContent())
            .content;
    if (!content) {
      return null;
    }
    const text = new TextUtils.Text.Text(content);
    return text.offsetFromPosition(entry.sourceLineNumber, entry.sourceColumnNumber);
  }

  it('can resolve single scope mappings', async () => {
    const sourceMapUrl = 'file:///tmp/example.js.min.map';
    // This example was minified with terser v5.7.0 with following command.
    // 'terser index.js -m --toplevel -o example.min.js --source-map "url=example.min.js.map,includeSources"'
    const source = `function o(o,n){console.log(o,n)}o(1,2);\n//# sourceMappingURL=${sourceMapUrl}`;
    const scopes = '          {                     }';

    // The original scopes below have to match with how the source map translates the scope, so it
    // does not align perfectly with the source language scopes. In principle, this test could only
    // assert that the tests are approximately correct; currently, we assert an exact match.
    const originalSource = 'function unminified(par1, par2) {\n  console.log(par1, par2);\n}\nunminified(1, 2);\n';
    const originalScopes = '         {                       \n                          \n }';
    const expectedOffsets = parseScopeChain(originalScopes);

    const sourceMapContent = {
      'version': 3,
      'names': ['unminified', 'par1', 'par2', 'console', 'log'],
      'sources': ['index.js'],
      'sourcesContent': [originalSource],
      'mappings': 'AAAA,SAASA,EAAWC,EAAMC,GACxBC,QAAQC,IAAIH,EAAMC,EACpB,CACAF,EAAW,EAAG',
    };
    const sourceMapJson = JSON.stringify(sourceMapContent);

    const scopeObject = backend.createSimpleRemoteObject([{name: 'o', value: 42}, {name: 'n', value: 1}]);
    const callFrame = await backend.createCallFrame(
        target, {url: URL, content: source}, scopes, {url: sourceMapUrl, content: sourceMapJson}, [scopeObject]);

    // Get source map for mapping locations to 'editor' offsets.
    const sourceMap = await callFrame.debuggerModel.sourceMapManager().sourceMapForClientPromise(callFrame.script);

    const scopeMappings = await Sources.DebuggerPlugin.computeScopeMappings(callFrame, l => toOffset(sourceMap, l));

    assert.strictEqual(scopeMappings.length, 1);
    assert.strictEqual(scopeMappings[0].scopeStart, expectedOffsets[0].startColumn);
    assert.strictEqual(scopeMappings[0].scopeEnd, expectedOffsets[0].endColumn);
    assert.strictEqual(scopeMappings[0].variableMap.get('par1')?.value, 42);
    assert.strictEqual(scopeMappings[0].variableMap.get('par2')?.value, 1);
  });

  it('can resolve nested scope mappings', async () => {
    const sourceMapUrl = 'file:///tmp/example.js.min.map';
    // This example was minified with terser v5.7.0 with following command.
    // 'terser index.js -m --toplevel -o example.min.js --source-map "url=example.min.js.map,includeSources"'
    const source =
        `function o(o){const n=console.log.bind(console);for(let c=0;c<o;c++)n(c)}o(10);\n//# sourceMappingURL=${
            sourceMapUrl}`;
    const scopes =
        '          {                                        <                   >}                          ';

    const originalSource =
        'function f(n) {\n  const c = console.log.bind(console);\n  for (let i = 0; i < n; i++) c(i);\n}\nf(10);\n';
    const originalScopes =
        '         {     \n                                      \n  <                                > }';
    const expectedOffsets = parseScopeChain(originalScopes);

    const sourceMapContent = {
      'version': 3,
      'names': ['f', 'n', 'c', 'console', 'log', 'bind', 'i'],
      'sources': ['index.js'],
      'sourcesContent': [originalSource],
      'mappings':
          'AAAA,SAASA,EAAEC,GACT,MAAMC,EAAIC,QAAQC,IAAIC,KAAKF,SAC3B,IAAK,IAAIG,EAAI,EAAGA,EAAIL,EAAGK,IAAKJ,EAAEI,EAChC,CACAN,EAAE',
    };
    const sourceMapJson = JSON.stringify(sourceMapContent);

    const functionScopeObject = backend.createSimpleRemoteObject([{name: 'o', value: 10}, {name: 'n', value: 1234}]);
    const forScopeObject = backend.createSimpleRemoteObject([{name: 'c', value: 5}]);

    const callFrame = await backend.createCallFrame(
        target, {url: URL, content: source}, scopes, {url: sourceMapUrl, content: sourceMapJson},
        [forScopeObject, functionScopeObject]);

    // Get source map for mapping locations to 'editor' offsets.
    const sourceMap = await callFrame.debuggerModel.sourceMapManager().sourceMapForClientPromise(callFrame.script);

    const scopeMappings = await Sources.DebuggerPlugin.computeScopeMappings(callFrame, l => toOffset(sourceMap, l));

    assert.strictEqual(scopeMappings.length, 2);
    assert.strictEqual(scopeMappings[0].scopeStart, expectedOffsets[0].startColumn);
    assert.strictEqual(scopeMappings[0].scopeEnd, expectedOffsets[0].endColumn);
    assert.strictEqual(scopeMappings[0].variableMap.get('i')?.value, 5);
    assert.strictEqual(scopeMappings[0].variableMap.size, 1);
    assert.strictEqual(scopeMappings[1].scopeStart, expectedOffsets[1].startColumn);
    assert.strictEqual(scopeMappings[1].scopeEnd, expectedOffsets[1].endColumn);
    assert.strictEqual(scopeMappings[1].variableMap.get('n')?.value, 10);
    assert.strictEqual(scopeMappings[1].variableMap.get('c')?.value, 1234);
    assert.strictEqual(scopeMappings[1].variableMap.size, 2);
  });
});

function makeState(doc: string, extensions: CodeMirror.Extension = []) {
  return CodeMirror.EditorState.create({
    doc,
    extensions: [
      extensions,
      TextEditor.Config.baseConfiguration(doc),
      TextEditor.Config.autocompletion,
    ],
  });
}

describeWithEnvironment('Inline variable view parser', () => {
  it('parses simple identifier', () => {
    const state = makeState('c', CodeMirror.javascript.javascriptLanguage);
    const variables = Sources.DebuggerPlugin.getVariableNamesByLine(state, 0, 1);
    assert.deepEqual(variables, [{line: 0, from: 0, id: 'c'}]);
  });

  it('parses simple function', () => {
    const code = `function f(o) {
      let a = 1;
      debugger;
    }`;
    const state = makeState(code, CodeMirror.javascript.javascriptLanguage);
    const variables = Sources.DebuggerPlugin.getVariableNamesByLine(state, 10, code.length);
    assert.deepEqual(variables, [{line: 0, from: 11, id: 'o'}, {line: 1, from: 26, id: 'a'}]);
  });

  it('parses function with nested block', () => {
    const code = `function f(o) {
      let a = 1;
      {
        let a = 2;
        debugger;
      }
    }`;
    const state = makeState(code, CodeMirror.javascript.javascriptLanguage);
    const variables = Sources.DebuggerPlugin.getVariableNamesByLine(state, 10, code.length);
    assert.deepEqual(
        variables, [{line: 0, from: 11, id: 'o'}, {line: 1, from: 26, id: 'a'}, {line: 3, from: 53, id: 'a'}]);
  });
});

describeWithEnvironment('Inline variable view scope value resolution', () => {
  it('resolves single variable in single scope', () => {
    const value42 = {type: Protocol.Runtime.RemoteObjectType.Number, value: 42} as SDK.RemoteObject.RemoteObject;
    const scopeMappings = [{scopeStart: 0, scopeEnd: 10, variableMap: new Map([['a', value42]])}];
    const variableNames = [{line: 3, from: 5, id: 'a'}];
    const valuesByLine = Sources.DebuggerPlugin.getVariableValuesByLine(scopeMappings, variableNames);

    assert.strictEqual(valuesByLine?.size, 1);
    assert.strictEqual(valuesByLine?.get(3)?.size, 1);
    assert.strictEqual(valuesByLine?.get(3)?.get('a')?.value, 42);
  });

  it('resolves shadowed variables', () => {
    const value1 = {type: Protocol.Runtime.RemoteObjectType.Number, value: 1} as SDK.RemoteObject.RemoteObject;
    const value2 = {type: Protocol.Runtime.RemoteObjectType.Number, value: 2} as SDK.RemoteObject.RemoteObject;
    const scopeMappings = [
      {scopeStart: 10, scopeEnd: 20, variableMap: new Map([['a', value1]])},
      {scopeStart: 0, scopeEnd: 30, variableMap: new Map([['a', value2]])},
    ];
    const variableNames = [
      {line: 0, from: 5, id: 'a'},    // Falls into the outer scope.
      {line: 10, from: 15, id: 'a'},  // Inner scope.
      {line: 20, from: 25, id: 'a'},  // Outer scope.
      {line: 30, from: 35, id: 'a'},  // Outside of any scope.
    ];
    const valuesByLine = Sources.DebuggerPlugin.getVariableValuesByLine(scopeMappings, variableNames);

    assert.strictEqual(valuesByLine?.size, 3);
    assert.strictEqual(valuesByLine?.get(0)?.size, 1);
    assert.strictEqual(valuesByLine?.get(0)?.get('a')?.value, 2);
    assert.strictEqual(valuesByLine?.get(10)?.size, 1);
    assert.strictEqual(valuesByLine?.get(10)?.get('a')?.value, 1);
    assert.strictEqual(valuesByLine?.get(20)?.size, 1);
    assert.strictEqual(valuesByLine?.get(20)?.get('a')?.value, 2);
  });

  it('resolves multiple variables on the same line', () => {
    const value1 = {type: Protocol.Runtime.RemoteObjectType.Number, value: 1} as SDK.RemoteObject.RemoteObject;
    const value2 = {type: Protocol.Runtime.RemoteObjectType.Number, value: 2} as SDK.RemoteObject.RemoteObject;
    const scopeMappings = [{scopeStart: 10, scopeEnd: 20, variableMap: new Map([['a', value1], ['b', value2]])}];
    const variableNames = [
      {line: 10, from: 11, id: 'a'},
      {line: 10, from: 13, id: 'b'},
      {line: 10, from: 15, id: 'a'},
    ];
    const valuesByLine = Sources.DebuggerPlugin.getVariableValuesByLine(scopeMappings, variableNames);

    assert.strictEqual(valuesByLine?.size, 1);
    assert.strictEqual(valuesByLine?.get(10)?.size, 2);
    assert.strictEqual(valuesByLine?.get(10)?.get('a')?.value, 1);
    assert.strictEqual(valuesByLine?.get(10)?.get('b')?.value, 2);
  });
});
