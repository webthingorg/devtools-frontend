// Copyright (c) 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as Protocol from '../../generated/protocol.js';

import * as Rehydrating from './RehydratingConnection.js';
import {
  type RehydratingExecutionContext,
  type RehydratingScript,
  type RehydratingTarget,
  type ServerMessage,
} from './RehydratingObject.js';

const mockTarget1: RehydratingTarget = {
  targetId: 'ABCDE' as Protocol.Page.FrameId,
  type: 'page',
  isolate: '12345',
  url: 'example.com',
  pid: 12345,
};

const mockExecutionContext1: RehydratingExecutionContext = {
  id: 1 as Protocol.Runtime.ExecutionContextId,
  origin: 'example.com',
  v8Context: 'example context 1',
  auxData: {
    frameId: 'ABCDE' as Protocol.Page.FrameId,
    isDefault: true,
    type: 'type',
  },
  isolate: '12345',
};

const mockExecutionContext2: RehydratingExecutionContext = {
  id: 2 as Protocol.Runtime.ExecutionContextId,
  origin: 'example.com',
  v8Context: 'example context 2',
  auxData: {
    frameId: 'ABCDE' as Protocol.Page.FrameId,
    isDefault: true,
    type: 'type',
  },
  isolate: '12345',
};

const mockScript1: RehydratingScript = {
  scriptId: '1' as Protocol.Runtime.ScriptId,
  isolate: '12345',
  executionContextId: 1 as Protocol.Runtime.ExecutionContextId,
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
    frameId: 'ABCDE' as Protocol.Page.FrameId,
    isDefault: true,
    type: 'type',
  },
};

const mockScript2: RehydratingScript = {
  scriptId: '2' as Protocol.Runtime.ScriptId,
  isolate: '12345',
  executionContextId: 2 as Protocol.Runtime.ExecutionContextId,
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
    frameId: 'ABCDE' as Protocol.Page.FrameId,
    isDefault: true,
    type: 'type',
  },
};

describe('RehydratingSession', () => {
  const sessionId = 1;
  const messageId = 1;
  const target = mockTarget1;
  let mockRehydratingConnection: MockRehydratingConnection;
  let mockRehydratingSession: Rehydrating.RehydratingSession;
  const executionContextsForTarget1 = [mockExecutionContext1, mockExecutionContext2];
  const scriptsForTarget1 = [mockScript1, mockScript2];

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
