// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as TraceEngine from '../../models/trace/trace.js';
import {type TraceFile} from '../../models/trace/types/File.js';

import {traceJsonGenerator} from './SaveFileFormatter.js';

export class EnhancedTracesEngine {
  traceEvents: readonly TraceEngine.Types.TraceEvents.TraceEventData[];
  private scriptTov8Context: Map<string, string> = new Map<string, string>();
  private v8ContextToExecutionContextId: Map<string, number> = new Map<string, number>();

  constructor(traceEvents: readonly TraceEngine.Types.TraceEvents.TraceEventData[]) {
    this.traceEvents = traceEvents;

    // Construct mapping between script and v8 context with trace information.
    this.traceEvents.forEach(traceEvent => {
      if (!TraceEngine.Types.TraceEvents.isTraceEventTargetRundown(traceEvent)) {
        return;
      }
      const data = traceEvent.args?.data;
      if (data.isolate && data.scriptId && data.v8context) {
        this.scriptTov8Context.set(this.getScriptIdentifier(data.isolate, data.scriptId), data.v8context);
      }
    });

    // Construct mapping between v8 context and execution context id with trace information.
    this.traceEvents.forEach(traceEvent => {
      if (!TraceEngine.Types.TraceEvents.isTraceEventScriptRundown(traceEvent)) {
        return;
      }
      const data = traceEvent.args?.data;
      if (data.isolate && data.scriptId && data.executionContextId) {
        const v8Context = this.scriptTov8Context.get(this.getScriptIdentifier(data.isolate, data.scriptId));
        if (v8Context) {
          this.v8ContextToExecutionContextId.set(v8Context, data.executionContextId);
        }
      }
    });
  }

  static generateEnhancedTraces(
      targets: Target[], executionContexts: ExecutionContext[], scripts: Script[],
      enhancedTraceMetadata: EnhancedTracesMetadata,
      traceEvents: readonly TraceEngine.Types.TraceEvents.TraceEventData[],
      metadata: TraceEngine.Types.File.MetaData|null): string {
    const exportedTrace: EnhancedTraces = {
      enhancedTracesMetadata: enhancedTraceMetadata,
      targets: targets,
      executionContexts: executionContexts,
      scripts: scripts,
      payload: null,
    };
    const exportedTraceString = JSON.stringify(exportedTrace);
    const formattedTraceIter = traceJsonGenerator(traceEvents, metadata);
    let traceAsString: string = Array.from(formattedTraceIter).join('');
    // Remove "null }" and append the original performance trace
    traceAsString = exportedTraceString.slice(0, exportedTraceString.length - 5) + traceAsString + '}';

    return traceAsString;
  }

  captureTargetsFromTraces(): Target[] {
    const targets: Target[] = [];
    this.traceEvents.forEach(traceEvent => {
      if (!TraceEngine.Types.TraceEvents.isTraceEventTargetRundown(traceEvent)) {
        return;
      }
      const data = traceEvent.args.data;
      if (!targets.find(target => target.id === data.frame)) {
        // New target found
        targets.push({
          id: data.frame,
          type: data.frameType,
          isolate: data.isolate,
          pid: traceEvent.pid,
          url: data.url,
        });
      }
    });
    return targets;
  }

  captureExecutionContextFromTraces(): ExecutionContext[] {
    const executionContexts: ExecutionContext[] = [];
    this.traceEvents.forEach(traceEvent => {
      if (!TraceEngine.Types.TraceEvents.isTraceEventTargetRundown(traceEvent)) {
        return;
      }
      const data = traceEvent.args.data;

      if (!executionContexts.find(executionContext => executionContext.v8Context === data.v8context)) {
        // New ExecutionContexts found
        const executionContextId = this.v8ContextToExecutionContextId.get(data.v8context);
        if (executionContextId) {
          executionContexts.push({
            id: executionContextId,
            origin: data.origin,
            v8Context: data.v8context,
            auxData: {
              frameId: data.frame,
              isDefault: data.isDefault,
              type: data.contextType,
            },
          });
        }
      }
    });
    return executionContexts;
  }

  captureScriptFromTraces(): Script[] {
    const scripts: Script[] = [];
    const scriptToSourceText: Map<string, string|undefined> = new Map<string, string>();
    const scriptToSourceLength: Map<string, number|undefined> = new Map<string, number>();
    this.traceEvents.forEach(traceEvent => {
      if (TraceEngine.Types.TraceEvents.isTraceEventScriptRundown(traceEvent)) {
        const data = traceEvent.args.data;
        if (!data || !data.scriptId) {
          return;
        }

        if (!scripts.find(script => script.scriptId === data.scriptId && script.isolate === data.isolate)) {
          // New Script found
          scripts.push({
            scriptId: data.scriptId,
            isolate: data.isolate,
            executionContextId: data.executionContextId,
            startLine: data.startLine,
            startColumn: data.startColumn,
            endLine: data.endLine,
            endColumn: data.endColumn,
            hash: data.hash,
            isModule: data.isModule,
            url: data.url,
            hasSourceUrl: data.hasSourceUrl,
            sourceMapUrl: data.sourceMapUrl,
          });
        }
      } else if (TraceEngine.Types.TraceEvents.isTraceEventScriptRundownSource(traceEvent)) {
        const data = traceEvent.args.data;
        if (!data || !data.scriptId || !data.isolate) {
          return;
        }
        const scriptIdentifier = this.getScriptIdentifier(data.isolate, data.scriptId);
        scriptToSourceText.set(scriptIdentifier, data.sourceText);
        scriptToSourceLength.set(scriptIdentifier, data.length);
      }
    });

    scripts.forEach(script => {
      if (!script.isolate || !script.scriptId) {
        return;
      }
      const scriptIdentifier = this.getScriptIdentifier(script.isolate, script.scriptId);
      script.sourceText = scriptToSourceText.get(scriptIdentifier);
      script.length = scriptToSourceLength.get(scriptIdentifier);
    });
    return scripts;
  }

  getEnhancedTracesMetadata(): EnhancedTracesMetadata {
    return {
      version: 'beta',
    };
  }

  private getScriptIdentifier(isolate: string, scriptId: number): string {
    return isolate + '@' + scriptId;
  }
}

export interface EnhancedTracesMetadata {
  version: string;
}

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
  auxData?: ExecutionContextAuxData;
}

export interface Target {
  id: string;
  type: string;
  url: string;
  pid?: number;
  isolate?: string;
}

export interface EnhancedTraces {
  enhancedTracesMetadata: EnhancedTracesMetadata;
  targets: Target[];
  executionContexts: ExecutionContext[];
  scripts: Script[];
  payload: TraceFile|null;
}
