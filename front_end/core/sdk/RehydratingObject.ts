// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

export interface Script {
  scriptId: number;
  isolate: string;
  url: string;
  executionContextId: number;
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
  hash: string;
  isModule?: boolean;
  hasSourceUrl?: boolean;
  sourceMapUrl?: string;
  length?: number;
  sourceText?: string;
  auxData?: ExecutionContextAuxData;
}

export interface ExecutionContextAuxData {
  frameId?: string;
  isDefault?: boolean;
  type?: string;
}

export interface ExecutionContext {
  id: number;
  origin: string;
  v8Context?: string;
  name?: string;
  auxData?: ExecutionContextAuxData;
  isolate?: string;
}

export interface Target {
  targetId: string;
  type: string;
  url: string;
  pid?: number;
  isolate?: string;
}

export interface EnhancedTracesData {
  targets: Target[];
  executionContexts: ExecutionContext[];
  scripts: Script[];
}

export interface ProtocolMessage {
  id: number;
  method: string;
  sessionId?: number;
  params?: string;
}

export interface ProtocolEvent {
  method: string;
  params: object;
}

export interface ProtocolResponse {
  id: number;
}

export type ServerMessage = (ProtocolEvent|ProtocolMessage|ProtocolResponse)&{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [others: string]: any,
};

export interface Session {
  target: Target;
  executionContexts: ExecutionContext[];
  scripts: Script[];
}
