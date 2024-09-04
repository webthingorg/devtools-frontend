
// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import {TraceLoader} from '../../testing/TraceLoader.js';

import {EnhancedTracesParser} from './EnhancedTracesParser.js';
import {
  type ExecutionContext,
  type Script,
  type Target,
} from './RehydratingObject.js';

describe('EnhancedTracesHandler', () => {
  let enhancedTracesParser: EnhancedTracesParser;

  beforeEach(async function() {
    const events = await TraceLoader.rawEvents(this, 'enhanced-traces.json.gz');
    enhancedTracesParser = new EnhancedTracesParser(events);
  });

  it('captures targets from target rundown events', async function() {
    const data = enhancedTracesParser.data();
    assert.deepEqual(data.targets, [
      {
        targetId: '21D58E83A5C17916277166140F6A464B',
        type: 'page',
        isolate: '12345',
        pid: 8050,
        url: 'http://localhost:8080/index.html',
      },
      {
        targetId: '3E1717BE677B75D0536E292E00D6A34A',
        type: 'page',
        isolate: '6789',
        pid: 8051,
        url: 'http://localhost:8080/index.html',
      },
    ]);
  });

  it('captures execution context info', async function() {
    const data = enhancedTracesParser.data();
    assert.deepEqual(data.executionContexts, [
      {
        id: 1,
        origin: 'http://localhost:8080',
        v8Context: 'example context 1',
        auxData: {
          frameId: '21D58E83A5C17916277166140F6A464B',
          isDefault: true,
          type: 'type',
        },
        isolate: '12345',
      },
      {
        id: 2,
        origin: 'http://localhost:8080',
        v8Context: 'example context 2',
        auxData: {
          frameId: '21D58E83A5C17916277166140F6A464B',
          isDefault: true,
          type: 'type',
        },
        isolate: '12345',
      },
      {
        id: 1,
        origin: 'http://localhost:8080',
        v8Context: 'example context 3',
        auxData: {
          frameId: '3E1717BE677B75D0536E292E00D6A34A',
          isDefault: true,
          type: 'type',
        },
        isolate: '6789',
      },
    ]);
  });

  it('captures script info and source text', async function() {
    const data = enhancedTracesParser.data();
    assert.deepEqual(data.scripts, [
      {
        scriptId: 1,
        isolate: '12345',
        executionContextId: 1,
        startLine: 0,
        startColumn: 0,
        endLine: 1,
        endColumn: 10,
        hash: '',
        isModule: false,
        url: 'http://localhost:8080/index.html',
        hasSourceUrl: false,
        sourceMapUrl: 'http://localhost:8080/source',
        length: 13,
        sourceText: 'source text 1',
        auxData: {
          frameId: '21D58E83A5C17916277166140F6A464B',
          isDefault: true,
          type: 'type',
        },
      },
      {
        scriptId: 2,
        isolate: '12345',
        executionContextId: 2,
        startLine: 0,
        startColumn: 0,
        endLine: 1,
        endColumn: 10,
        hash: '',
        isModule: false,
        url: 'http://localhost:8080/index.html',
        hasSourceUrl: false,
        sourceMapUrl: undefined,
        length: 13,
        sourceText: 'source text 2',
        auxData: {
          frameId: '21D58E83A5C17916277166140F6A464B',
          isDefault: true,
          type: 'type',
        },
      },
      {
        scriptId: 1,
        isolate: '6789',
        executionContextId: 1,
        startLine: 0,
        startColumn: 0,
        endLine: 1,
        endColumn: 10,
        hash: '',
        isModule: false,
        url: 'http://localhost:8080/index.html',
        hasSourceUrl: false,
        sourceMapUrl: undefined,
        length: 13,
        sourceText: 'source text 3',
        auxData: {
          frameId: '3E1717BE677B75D0536E292E00D6A34A',
          isDefault: true,
          type: 'type',
        },
      },
    ]);
  });
});
// describe('EnhancedTracesParser', () => {
//   const metadata: TraceEngine.Types.File.MetaData = {
//     source: 'DevTools',
//     startTime: '1234',
//     networkThrottling: '4',
//     cpuThrottling: 1,
//     hardwareConcurrency: 1,
//   };
//   const mockTarget1: Target = {
//     targetId: 'ABCDE',
//     type: 'page',
//     isolate: '12345',
//     // v8Context: "example context 1",
//     url: 'example.com',
//     pid: 12345,
//   };
//   const mockTarget2: Target = {
//     targetId: 'FGHIJ',
//     type: 'page',
//     isolate: '6789',
//     // v8Context: "example context 3",
//     url: 'example.com',
//     pid: 6789,
//   };
//   const mockExecutionContext1: ExecutionContext = {
//     id: 1,
//     origin: 'example.com',
//     v8Context: 'example context 1',
//     auxData: {
//       frameId: 'ABCDE',
//       isDefault: true,
//       type: 'type',
//     },
//   };
//   const mockExecutionContext2: ExecutionContext = {
//     id: 2,
//     origin: 'example.com',
//     v8Context: 'example context 2',
//     auxData: {
//       frameId: 'ABCDE',
//       isDefault: true,
//       type: 'type',
//     },
//   };
//   const mockExecutionContext3: ExecutionContext = {
//     id: 1,
//     origin: 'example.com',
//     v8Context: 'example context 3',
//     auxData: {
//       frameId: 'FGHIJ',
//       isDefault: true,
//       type: 'type',
//     },
//   };
//   const mockScript1: Script = {
//     scriptId: 1,
//     isolate: '12345',
//     executionContextId: 1,
//     startLine: 0,
//     startColumn: 0,
//     endLine: 1,
//     endColumn: 10,
//     hash: '',
//     isModule: false,
//     url: 'example.com',
//     hasSourceUrl: false,
//     sourceMapUrl: undefined,
//     length: 10,
//     sourceText: 'source text 1',
//   };
//   const mockScript2: Script = {
//     scriptId: 2,
//     isolate: '12345',
//     executionContextId: 2,
//     sourceText: 'source text 2',
//   };
//   const mockScript3: Script = {
//     scriptId: 1,
//     isolate: '6789',
//     executionContextId: 1,
//     sourceText: 'source text 3',
//   };
//   function createTargetRundownTrace(
//       target: Target, executionContext: ExecutionContext,
//       script: Script): any {
//     return {
//       ...defaultTraceEvent,
//       args: {
//         data: {
//           contextType: executionContext.auxData?.type,
//           frame: executionContext.auxData?.frameId,
//           frameType: target.type,
//           isDefault: executionContext.auxData?.isDefault,
//           isolate: target.isolate,
//           origin: executionContext.origin,
//           scriptId: script.scriptId,
//           url: target.url,
//           v8context: executionContext.v8Context,
//         },
//       },
//       cat: 'disabled-by-default-devtools.target-rundown',
//       pid: TraceEngine.Types.TraceEvents.ProcessID(target.pid!),
//     };
//   }
//   function createV8SourceRundownTrace(script: Script): any {
//     return {
//       ...defaultTraceEvent,
//       args: {
//         data: {
//           endColumn: script.endColumn,
//           endLine: script.endLine,
//           executionContextId: script.executionContextId,
//           hasSourceUrl: script.hasSourceUrl,
//           hash: script.hash,
//           isModule: script.isModule,
//           isolate: script.isolate,
//           scriptId: script.scriptId,
//           sourceMapUrl: script.sourceMapUrl,
//           startColumn: script.startColumn,
//           startLine: script.startLine,
//           url: script.url,
//         },
//       },
//       cat: 'disabled-by-default-devtools.v8-source-rundown',
//     };
//   }
//   function createV8SourceTextRundownTrace(script: Script): any {
//     return {
//       ...defaultTraceEvent,
//       args: {
//         data: {
//           isolate: script.isolate,
//           scriptId: script.scriptId,
//           length: script.length,
//           sourceText: script.sourceText,
//         },
//       },
//       cat: 'disabled-by-default-devtools.v8-source-rundown-sources',
//     };
//   }

//   function createMockTrace(): any[] {
//     const result: any[] = [];
//     result.push(createTargetRundownTrace(mockTarget1, mockExecutionContext1, mockScript1));
//     result.push(createV8SourceRundownTrace(mockScript1));
//     return result;
//   }

//   it('captures correct target info', async function() {
//     const mockTrace = createMockTrace();
//     const events = await TraceLoader.rawEvents(this, 'enhanced-traces.json.gz');
//     const enhancedTraces = new EnhancedTraces.EnhancedTracesEngine(mockTrace);
//     const targets = enhancedTraces.captureTargetsFromTraces();
//     assert.strictEqual(targets.length, 1);
//     assert.strictEqual(targets[0].id, mockTarget1.id);
//     assert.strictEqual(targets[0].pid, mockTarget1.pid);
//     assert.strictEqual(targets[0].isolate, mockTarget1.isolate);
//     assert.strictEqual(targets[0].type, mockTarget1.type);
//     assert.strictEqual(targets[0].url, mockTarget1.url);
//   });
//   it('captures correct execution context info', async function() {
//     const mockTrace = createMockTrace();
//     const enhancedTraces = new EnhancedTraces.EnhancedTracesEngine(mockTrace);
//     const executionContexts = enhancedTraces.captureExecutionContextFromTraces();
//     assert.strictEqual(executionContexts.length, 1);
//     assert.strictEqual(executionContexts[0].id, mockExecutionContext1.id);
//     assert.strictEqual(executionContexts[0].origin, mockExecutionContext1.origin);
//     assert.strictEqual(executionContexts[0].v8Context, mockExecutionContext1.v8Context);
//     assert.strictEqual(executionContexts[0].auxData?.frameId, mockExecutionContext1.auxData?.frameId);
//     assert.strictEqual(executionContexts[0].auxData?.isDefault, mockExecutionContext1.auxData?.isDefault);
//     assert.strictEqual(executionContexts[0].auxData?.type, mockExecutionContext1.auxData?.type);
//     // Execution Context frame id should match its respective target's id
//     const targets = enhancedTraces.captureTargetsFromTraces();
//     assert.strictEqual(executionContexts[0].auxData?.frameId, targets[0].id);
//   });
//   it('captures correct script info', async function() {
//     const mockTrace = createMockTrace();
//     const enhancedTraces = new EnhancedTraces.EnhancedTracesEngine(mockTrace);
//     const scripts = enhancedTraces.captureScriptFromTraces();
//     assert.strictEqual(scripts.length, 1);
//     assert.strictEqual(scripts[0].scriptId, mockScript1.scriptId);
//     assert.strictEqual(scripts[0].isolate, mockScript1.isolate);
//     assert.strictEqual(scripts[0].executionContextId, mockScript1.executionContextId);
//     assert.strictEqual(scripts[0].startLine, mockScript1.startLine);
//     assert.strictEqual(scripts[0].startColumn, mockScript1.startColumn);
//     assert.strictEqual(scripts[0].endLine, mockScript1.endLine);
//     assert.strictEqual(scripts[0].endColumn, mockScript1.endColumn);
//     assert.strictEqual(scripts[0].hash, mockScript1.hash);
//     assert.strictEqual(scripts[0].isModule, mockScript1.isModule);
//     assert.strictEqual(scripts[0].url, mockScript1.url);
//     assert.strictEqual(scripts[0].hasSourceUrl, mockScript1.hasSourceUrl);
//     assert.strictEqual(scripts[0].sourceMapUrl, mockScript1.sourceMapUrl);
//     assert.strictEqual(undefined, undefined);
//   });
//   it('genreates traces with correct script source text', async function() {
//     const mockTrace = createMockTrace();
//     mockTrace.push(createV8SourceTextRundownTrace(mockScript1));
//     const enhancedTraces = new EnhancedTraces.EnhancedTracesEngine(mockTrace);
//     const scripts = enhancedTraces.captureScriptFromTraces();
//     assert.strictEqual(scripts.length, 1);
//     assert.strictEqual(scripts[0].sourceText, mockScript1.sourceText);
//     assert.strictEqual(scripts[0].length, mockScript1.length);
//   });
//   it('generates correct info with multiple targets, execution contexts and scripts', async function() {
//     const mockTrace = createMockTrace();
//     mockTrace.push(createV8SourceTextRundownTrace(mockScript1));
//     mockTrace.push(createTargetRundownTrace(mockTarget1, mockExecutionContext2, mockScript2));
//     mockTrace.push(createTargetRundownTrace(mockTarget2, mockExecutionContext3, mockScript3));
//     mockTrace.push(createV8SourceRundownTrace(mockScript2));
//     mockTrace.push(createV8SourceRundownTrace(mockScript3));
//     mockTrace.push(createV8SourceTextRundownTrace(mockScript2));
//     mockTrace.push(createV8SourceTextRundownTrace(mockScript3));
//     const enhancedTraces = new EnhancedTraces.EnhancedTracesEngine(mockTrace);
//     const targets = enhancedTraces.captureTargetsFromTraces();
//     const executionContexts = enhancedTraces.captureExecutionContextFromTraces();
//     const scripts = enhancedTraces.captureScriptFromTraces();
//     assert.strictEqual(targets.length, 2);
//     assert.strictEqual(executionContexts.length, 3);
//     assert.strictEqual(scripts.length, 3);
//     const target1 = targets.find(target => target.id === mockTarget1.id);
//     const target2 = targets.find(target => target.id === mockTarget2.id);
//     assert.strictEqual(target1?.pid, mockTarget1.pid);
//     assert.strictEqual(target2?.pid, mockTarget2.pid);
//     const executionContext1 =
//         executionContexts.find(executionContext => executionContext.v8Context === mockExecutionContext1.v8Context);
//     const executionContext2 =
//         executionContexts.find(executionContext => executionContext.v8Context === mockExecutionContext2.v8Context);
//     const executionContext3 =
//         executionContexts.find(executionContext => executionContext.v8Context === mockExecutionContext3.v8Context);
//     assert.strictEqual(executionContext1?.auxData?.frameId, mockTarget1.id);
//     assert.strictEqual(executionContext2?.auxData?.frameId, mockTarget1.id);
//     assert.strictEqual(executionContext3?.auxData?.frameId, mockTarget2.id);
//     const script1 =
//         scripts.find(script => script.scriptId === mockScript1.scriptId && script.isolate === mockScript1.isolate);
//     const script2 =
//         scripts.find(script => script.scriptId === mockScript2.scriptId && script.isolate === mockScript2.isolate);
//     const script3 =
//         scripts.find(script => script.scriptId === mockScript3.scriptId && script.isolate === mockScript3.isolate);
//     assert.strictEqual(script1?.executionContextId, mockExecutionContext1.id);
//     assert.strictEqual(script2?.executionContextId, mockExecutionContext2.id);
//     assert.strictEqual(script3?.executionContextId, mockExecutionContext3.id);
//     assert.strictEqual(script1?.sourceText, mockScript1.sourceText);
//     assert.strictEqual(script2?.sourceText, mockScript2.sourceText);
//     assert.strictEqual(script3?.sourceText, mockScript3.sourceText);
//   });
//   it('generates traces with correct format', async function() {
//     const mockTrace = createMockTrace();
//     const enhancedTraces = new EnhancedTraces.EnhancedTracesEngine(mockTrace);
//     const traceString = EnhancedTraces.EnhancedTracesEngine.generateEnhancedTraces(
//         enhancedTraces.captureTargetsFromTraces(), enhancedTraces.captureExecutionContextFromTraces(),
//         enhancedTraces.captureScriptFromTraces(), enhancedTraces.getEnhancedTracesMetaData(), mockTrace, metadata);
//     try {
//       JSON.parse(traceString);
//     } catch {
//       assert.fail('Parsing traceString as JSON failed');
//     }
//     assert.strictEqual(
//         traceString,
//         `{"metaData":{"version":"beta"},"targets":[{"id":"ABCDE","type":"page","isolate":"12345","pid":12345,"url":"example.com"}],"executionContexts":[{"id":1,"origin":"example.com","v8Context":"example context 1","auxData":{"frameId":"ABCDE","isDefault":true,"type":"type"}}],"scripts":[{"scriptId":1,"isolate":"12345","executionContextId":1,"startLine":0,"startColumn":0,"endLine":1,"endColumn":10,"hash":"","isModule":false,"url":"example.com","hasSourceUrl":false}],"payload":{"traceEvents": [
//   {"name":"process_name","tid":0,"pid":12345,"ts":0,"cat":"disabled-by-default-devtools.target-rundown","ph":"M","args":{"data":{"contextType":"type","frame":"ABCDE","frameType":"page","isDefault":true,"isolate":"12345","origin":"example.com","scriptId":1,"url":"example.com","v8context":"example context 1"}}},
//   {"name":"process_name","tid":0,"pid":0,"ts":0,"cat":"disabled-by-default-devtools.v8-source-rundown","ph":"M","args":{"data":{"endColumn":10,"endLine":1,"executionContextId":1,"hasSourceUrl":false,"hash":"","isModule":false,"isolate":"12345","scriptId":1,"startColumn":0,"startLine":0,"url":"example.com"}}}
// ],
// "metadata": {
//   "source": "DevTools",
//   "startTime": "1234",
//   "networkThrottling": "4",
//   "cpuThrottling": 1,
//   "hardwareConcurrency": 1
// }}
// }`);
//   });
// });
