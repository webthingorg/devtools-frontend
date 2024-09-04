
// Copyright (c) 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
/**
 * This file is the implementation of a protocol `Connection` object
 *  which is central to the rehydrated devtools feature. The premise of
 * this feature is that the enhanced traces wil contain enough
 * information to power this class with all metadata needed. This class
 * then interacts with rehydrated devtools in a way that produces the
 * equivalent result as live debugging session.
 *
 * It's much more of a state machine than the other Connection
 * implementations, which simply interact with a network protocol in
 * one way or another.
 */
import type * as ProtocolClient from '../protocol_client/protocol_client.js';
import {
  type ExecutionContext,
  type ProtocolMessage,
  type Script,
  type ServerMessage,
  type Target,
} from './RehydratingObject.js';
export interface RehydratingConnectionInterface {
  postToFrontend: (arg: ServerMessage) => void;
}
export class RehydratingConnection implements ProtocolClient.InspectorBackend.Connection {
  onDisconnect: ((arg0: string) => void)|null = null;
  onMessage!: ((arg0: Object) => void)|null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  traceEvents: any;
  sessionMapping: Map<number, RehydratingSessionBase> = new Map();
  frontendQueue: ServerMessage[] = [];
  private static instance: RehydratingConnection|null = null;
  private constructor() {
  }
  static getRehydratingConnection(): RehydratingConnection {
    if (!this.instance) {
      this.instance = new RehydratingConnection();
    }
    return this.instance;
  }
  static groupContextsAndScriptsUnderTarget(target: Target, executionContexts: ExecutionContext[], scripts: Script[]):
      [ExecutionContext[], Script[]] {
    const filteredExecutionContexts: ExecutionContext[] = [];
    const filteredScripts: Script[] = [];
    for (const executionContext of executionContexts) {
      if (executionContext.auxData?.frameId === target.targetId) {
        filteredExecutionContexts.push(executionContext);
      }
    }
    for (const script of scripts) {
      if (script.auxData === null) {
        console.error(script + ' missing aux data');
      }
      if (script.auxData?.frameId === target.targetId) {
        filteredScripts.push(script);
      }
    }
    return [filteredExecutionContexts, filteredScripts];
  }
  async initialize(logPayload: string): Promise<void> {
    // OnMessage should've been set before initialization
    // if (!this.onMessage) {
    //   return;
    // }
    const payload = JSON.parse(logPayload);
    if (!('traceEvents' in payload)) {
      console.error('RehydratingConnection failed to initialize due to missing trace events in payload');
      return;
    }
    // Dynamic import to load `front_end/models/trace`, which contains the
    // implementation of TraceEngine and Enhanced Traces handler, to avoid
    // circular dependency.
    const tracingModuleFilePath: string = '../../models/trace/trace.js';
    const tracingModule = await import(tracingModuleFilePath);
    const traceEngine = new tracingModule.TraceModel.Model({
      EnhancedTraces: tracingModule.Handlers.ModelHandlers.EnhancedTraces,
    });
    this.traceEvents = payload.traceEvents;
    await traceEngine.parse(this.traceEvents);
    const enhancedTracesData = traceEngine.traceParsedData().EnhancedTraces;
    for (let i = 0; i < enhancedTracesData.targets.length; i++) {
      // Send Target.targetCreated after identifying targets from the enhanced traces.
      const target = enhancedTracesData.targets[i];
      this.postToFrontend({
        method: 'Target.targetCreated',
        params: {
          targetInfo: {
            targetId: target.targetId,
            type: target.type,
            title: target.url,
            url: target.url,
            attached: false,
            canAccessOpener: false,
          },
        },
      });
      let executionContexts = [];
      let scripts = [];
      [executionContexts, scripts] = RehydratingConnection.groupContextsAndScriptsUnderTarget(
          target, enhancedTracesData.executionContexts, enhancedTracesData.scripts);
      // Create new session associated to the target created and send
      // Target.attachedToTarget to frontend.
      const sessionId = i + 1;
      this.sessionMapping.set(sessionId, new RehydratingSession(sessionId, target, executionContexts, scripts, this));
    }
    // Set up default rehydrating session.
    this.sessionMapping.set(0, new RehydratingSessionBase(this));
  }
  setOnMessage(onMessage: (arg0: (Object|string)) => void): void {
    this.onMessage = onMessage;
    for (const message of this.frontendQueue) {
      this.postToFrontend(message);
    }
  }
  setOnDisconnect(onDisconnect: (arg0: string) => void): void {
    this.onDisconnect = onDisconnect;
  }
  sendRawMessage(message: string|object): void {
    if (typeof message === 'string') {
      message = JSON.parse(message);
    }
    const data = message as ProtocolMessage;
    if (this.sessionMapping) {
      if (data.sessionId) {
        const session = this.sessionMapping.get(data.sessionId);
        if (session) {
          session.handleMessage(data);
        } else {
          console.error('Invalid SessionId: ' + data.sessionId);
        }
      } else {
        this.sessionMapping.get(0)?.handleMessage(data);
      }
    }
  }
  postToFrontend(arg: ServerMessage): void {
    if (this.onMessage) {
      this.onMessage(arg);
    } else {
      this.frontendQueue.push(arg);
    }
  }
  disconnect(): Promise<void> {
    throw new Error('not implemented');
  }
}
// Default rehydrating session with default responses.
class RehydratingSessionBase {
  connection: RehydratingConnectionInterface|null = null;
  constructor(connection: RehydratingConnectionInterface) {
    this.connection = connection;
  }
  sendMessage(payload: ServerMessage): void {
    requestAnimationFrame(() => {
      if (this.connection) {
        this.connection.postToFrontend(payload);
      }
    });
  }
  handleMessage(data: ProtocolMessage): void {
    // Send default response in default session.
    this.sendMessage({
      id: data.id,
      result: {},
    });
  }
}
export class RehydratingSession extends RehydratingSessionBase {
  sessionId: number;
  target: Target;
  executionContexts: ExecutionContext[] = [];
  scripts: Script[] = [];
  constructor(
      sessionId: number, target: Target, executionContexts: ExecutionContext[], scripts: Script[],
      connection: RehydratingConnectionInterface) {
    super(connection);
    this.sessionId = sessionId;
    this.target = target;
    this.executionContexts = executionContexts;
    this.scripts = scripts;
    this.sessionAttachToTarget();
  }
  override sendMessage(payload: ServerMessage, attachSessionId: boolean = true): void {
    // Attach the session's Id to the message.
    if (this.sessionId !== 0 && attachSessionId) {
      payload.sessionId = this.sessionId;
    }
    super.sendMessage(payload);
  }
  override handleMessage(data: ProtocolMessage): void {
    switch (data.method) {
      case 'Runtime.enable':
        this.handleRuntimeEnabled(data.id);
        break;
      case 'Debugger.enable':
        this.handleDebuggerEnable(data.id);
        break;
      case 'Debugger.getScriptSource':
        if (data.params) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          this.handleDebuggerGetScriptSource(data.id, (data.params as any).scriptId);
        }
        break;
      default:
        this.sendMessage({
          id: data.id,
          result: {},
        });
        break;
    }
  }
  private sessionAttachToTarget(): void {
    this.sendMessage(
        {
          method: 'Target.attachedToTarget',
          params: {
            sessionId: this.sessionId,
            waitingForDebugger: false,
            targetInfo: {
              targetId: this.target.targetId,
              type: this.target.type,
              title: this.target.url,
              url: this.target.url,
              attached: true,
              canAccessOpener: false,
            },
          },
        },
        /* attachSessionId */ false);
  }
  private handleRuntimeEnabled(id: number): void {
    for (const executionContext of this.executionContexts) {
      executionContext.name = executionContext.origin;
      this.sendMessage({
        method: 'Runtime.executionContextCreated',
        params: {
          context: executionContext,
        },
      });
    }
    this.sendMessage({
      id: id,
      result: {},
    });
  }
  private handleDebuggerGetScriptSource(id: number, scriptId: number): void {
    if (!scriptId) {
      console.error('get script source without script id');
    }
    const script = this.scripts.find(script => script.scriptId === scriptId);
    if (!script) {
      return;
    }
    if (script.sourceText) {
      this.sendMessage({
        id,
        result: {
          scriptSource:
              this.scripts.find(script => script.scriptId === scriptId)?.sourceText || 'no source text in trace',
        },
      });
    }
  }
  private handleDebuggerEnable(id: number): void {
    for (const script of this.scripts) {
      this.sendMessage({
        method: 'Debugger.scriptParsed',
        params: {
          ...script,
        },
      });
    }
    this.sendMessage({
      id,
      result: {
        debuggerId: '2103763494745969563.7904364284425617728',
      },
    });
  }
}
