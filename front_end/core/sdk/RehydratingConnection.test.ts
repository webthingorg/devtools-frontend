// Copyright (c) 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Rehydrating from './RehydratingConnection.js';
import {
  type ExecutionContext,
  type Script,
  type ServerMessage,
  type Target,
} from './RehydratingObject.js';

const mockTarget1: Target = {
  targetId: 'ABCDE',
  type: 'page',
  isolate: '12345',
  url: 'example.com',
  pid: 12345,
};

const mockTarget2: Target = {
  targetId: 'FGHIJ',
  type: 'page',
  isolate: '6789',
  url: 'example.com',
  pid: 6789,

};

const mockExecutionContext1: ExecutionContext = {
  id: 1,
  origin: 'example.com',
  v8Context: 'example context 1',
  auxData: {
    frameId: 'ABCDE',
    isDefault: true,
    type: 'type',
  },
  isolate: '12345',
};

const mockExecutionContext2: ExecutionContext = {
  id: 2,
  origin: 'example.com',
  v8Context: 'example context 2',
  auxData: {
    frameId: 'ABCDE',
    isDefault: true,
    type: 'type',
  },
  isolate: '12345',
};

const mockExecutionContext3: ExecutionContext = {
  id: 1,
  origin: 'example.com',
  v8Context: 'example context 3',
  auxData: {
    frameId: 'FGHIJ',
    isDefault: true,
    type: 'type',
  },
  isolate: '6789',
};

const mockScript1: Script = {
  scriptId: 1,
  isolate: '12345',
  executionContextId: 1,
  startLine: 0,
  startColumn: 0,
  endLine: 1,
  endColumn: 10,
  hash: '',
  isModule: false,
  url: 'example.com',
  hasSourceUrl: false,
  sourceMapUrl: undefined,
  length: 10,
  sourceText: 'source text 1',
  auxData: {
    frameId: 'ABCDE',
    isDefault: true,
    type: 'type',
  },
};

const mockScript2: Script = {
  scriptId: 2,
  isolate: '12345',
  executionContextId: 2,
  startLine: 0,
  startColumn: 0,
  endLine: 1,
  endColumn: 10,
  hash: '',
  isModule: false,
  url: 'example.com',
  hasSourceUrl: false,
  sourceMapUrl: undefined,
  length: 10,
  sourceText: 'source text 2',
  auxData: {
    frameId: 'ABCDE',
    isDefault: true,
    type: 'type',
  },
};

const mockScript3: Script = {
  scriptId: 1,
  isolate: '6789',
  executionContextId: 1,
  startLine: 0,
  startColumn: 0,
  endLine: 1,
  endColumn: 10,
  hash: '',
  isModule: false,
  url: 'example.com',
  hasSourceUrl: false,
  sourceMapUrl: undefined,
  length: 10,
  sourceText: 'source text 3',
  auxData: {
    frameId: 'FGHIJ',
    isDefault: true,
    type: 'type',
  },
};

const targets: Target[] = [mockTarget1, mockTarget2];
const executionContexts: ExecutionContext[] = [mockExecutionContext1, mockExecutionContext2, mockExecutionContext3];
const scripts: Script[] = [mockScript1, mockScript2, mockScript3];

// RehydratingConnection testing
// need to test how script and context is grouped to the target
// test case 1: contexts and scripts are put into right targets
describe('RehydratingConnection', () => {
  it('groups execution contexts and scripts to the correct target', async function() {
    const [executionContextForTarget1, scriptsForTarget1] =
        Rehydrating.RehydratingConnection.groupContextsAndScriptsUnderTarget(targets[0], executionContexts, scripts);
    const [executionContextForTarget2, scriptsForTarget2] =
        Rehydrating.RehydratingConnection.groupContextsAndScriptsUnderTarget(targets[1], executionContexts, scripts);
    assert.strictEqual(executionContextForTarget1.length, 2);
    assert.strictEqual(executionContextForTarget2.length, 1);
    assert.strictEqual(scriptsForTarget1.length, 2);
    assert.strictEqual(scriptsForTarget2.length, 1);
  });
});

// RehydratingSession testing
// set up a mock post to front end to intercept and store session outgoing message to verify
// with expected output

// test case 1: during construction, attach to target is sent
// test case 2: while handling debugger enable, script parsed and result is returned
// test case 3: while handling runtime enable, execution context created and result is returned
// test case 4: while handling get script source, script is returned
describe('RehydratingSession', () => {
  const sessionId = 1;
  const messageId = 1;
  const target = targets[0];
  let mockRehydratingConnection: MockRehydratingConnection;
  let mockRehydratingSession: Rehydrating.RehydratingSession;
  const [executionContextsForTarget1, scriptsForTarget1] =
      Rehydrating.RehydratingConnection.groupContextsAndScriptsUnderTarget(targets[0], executionContexts, scripts);

  class MockRehydratingConnection implements Rehydrating.RehydratingConnectionInterface {
    messageQueue: ServerMessage[] = [];

    postToFrontend(arg: ServerMessage): void {
      this.messageQueue.push(arg);
    }

    clearMessageQueue(): void {
      this.messageQueue = [];
    }
  }

  class RehydratingSessionForTest extends Rehydrating.RehydratingSession {
    override sendMessage(payload: ServerMessage): void {
      this.connection?.postToFrontend(payload);
    }
  }

  beforeEach(() => {
    mockRehydratingConnection = new MockRehydratingConnection();
    mockRehydratingSession = new RehydratingSessionForTest(
        sessionId, target, executionContextsForTarget1, scriptsForTarget1, mockRehydratingConnection);
  });

  it('send attach to target on construction', async function() {
    const attachToTargetMessage = mockRehydratingConnection.messageQueue[0];
    assert.isNotNull(attachToTargetMessage);
    assert.strictEqual(attachToTargetMessage.method, 'Target.attachedToTarget');
    assert.strictEqual(attachToTargetMessage.params.sessionId, sessionId);
    assert.strictEqual(attachToTargetMessage.params.targetInfo.targetId, target.targetId);
  });

  it('sends script parsed and debugger id while handling debugger enable', async function() {
    mockRehydratingConnection.clearMessageQueue();
    mockRehydratingSession.handleMessage({
      id: messageId,
      method: 'Debugger.enable',
      sessionId: sessionId,
    });
    assert.strictEqual(mockRehydratingConnection.messageQueue.length, 3);
    const scriptParsedMessages = mockRehydratingConnection.messageQueue.slice(0, 2);
    const resultMessage = mockRehydratingConnection.messageQueue.slice(2);
    for (const scriptParsedMessage of scriptParsedMessages) {
      assert.strictEqual(scriptParsedMessage.method, 'Debugger.scriptParsed');
      assert.strictEqual(scriptParsedMessage.params.isolate, target.isolate);
    }
    assert.isNotNull(resultMessage[0]);
    assert.strictEqual(resultMessage[0].id, messageId);
    assert.isNotNull(resultMessage[0].result.debuggerId);
  });

  it('sends execution context created while handling runtime enable', async function() {
    mockRehydratingConnection.clearMessageQueue();
    mockRehydratingSession.handleMessage({
      id: messageId,
      method: 'Runtime.enable',
      sessionId: sessionId,
    });
    assert.strictEqual(mockRehydratingConnection.messageQueue.length, 3);
    const executionContextCreatedMessages = mockRehydratingConnection.messageQueue.slice(0, 2);
    const resultMessage = mockRehydratingConnection.messageQueue.slice(2);
    for (const executionContextCreatedMessage of executionContextCreatedMessages) {
      assert.strictEqual(executionContextCreatedMessage.method, 'Runtime.executionContextCreated');
      assert.strictEqual(executionContextCreatedMessage.params.context.auxData.frameId, target.targetId);
    }
    assert.isNotNull(resultMessage[0]);
    assert.strictEqual(resultMessage[0].id, messageId);
  });

  it('sends script source text while handling get script source', async function() {
    mockRehydratingConnection.clearMessageQueue();
    mockRehydratingSession.handleMessage({
      id: messageId,
      method: 'Debugger.getScriptSource',
      sessionId: sessionId,
      params: {
        scriptId: mockScript1.scriptId,
      },
    });
    assert.strictEqual(mockRehydratingConnection.messageQueue.length, 1);
    const scriptSourceTextMessage = mockRehydratingConnection.messageQueue[0];
    assert.isNotNull(scriptSourceTextMessage);
    assert.strictEqual(scriptSourceTextMessage.id, messageId);
    assert.strictEqual(scriptSourceTextMessage.result.scriptSource, mockScript1.sourceText);
  });
});
