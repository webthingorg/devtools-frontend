// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as TraceEngine from '../../models/trace/trace.js';

import {traceJsonGenerator} from './SaveFileFormatter.js';

type ScriptIdentifier = [string, number];

export class EnhancedTracesEngine {
  traceEvents: readonly TraceEngine.Types.TraceEvents.TraceEventData[];
  metadata: TraceEngine.Types.File.MetaData|null;
  targets: Target[] = [];
  executionContexts: ExecutionContext[] = [];
  scripts: Script[] = [];
  private scriptTov8Context: Map<ScriptIdentifier, string> = new Map<ScriptIdentifier, string>();
  private v8ContextToExecutionContextId: Map<string, number> = new Map<string, number>();

  constructor(
      traceEvents: readonly TraceEngine.Types.TraceEvents.TraceEventData[],
      metadata: TraceEngine.Types.File.MetaData|null) {
    this.traceEvents = traceEvents;
    this.metadata = metadata;
    this.traceEvents.forEach(traceEvent => {
      if (traceEvent.cat === 'disabled-by-default-devtools.target-rundown') {
        const data = traceEvent.args?.data;
        if (!data) {
          return;
        }
        if (data.isolate && data.scriptId && data.v8context) {
          this.scriptTov8Context.set([data.isolate, data.scriptId], data.v8context);
        }
      }
    });

    this.traceEvents.forEach(traceEvent => {
      if (traceEvent.cat === 'disabled-by-default-devtools.v8-source-rundown') {
        const data = traceEvent.args?.data;
        if (!data) {
          return;
        }
        if (data.isolate && data.scriptId && data.executionContextId) {
          const v8Context = this.scriptTov8Context.get([data.isolate, data.scriptId]);
          if (v8Context) {
            this.v8ContextToExecutionContextId.set(v8Context, data.executionContextId);
          }
        }
      }
    });
  }

  generateEnhancedTraces(): string {
    this.captureTargetsFromTraces();
    this.captureExecutionContextFromTraces();
    this.captureScriptFromTraces();
    const enhancedTraceMetaData = this.getEnhancedTracesMetaData();
    const exportedTrace: EnhancedTraces = {
      metaData: enhancedTraceMetaData,
      targets: this.targets,
      executionContexts: this.executionContexts,
      scripts: this.scripts,
      payload: '',
    };
    const exportedTraceString = JSON.stringify(exportedTrace);
    const formattedTraceIter = traceJsonGenerator(this.traceEvents, this.metadata);
    let traceAsString: string = Array.from(formattedTraceIter).join('');
    traceAsString = exportedTraceString.slice(0, exportedTraceString.length - 3) + traceAsString + '}';
    return traceAsString;
  }

  private captureTargetsFromTraces(): void {
    this.traceEvents.forEach(traceEvent => {
      if (traceEvent.cat === 'disabled-by-default-devtools.target-rundown') {
        const data = traceEvent.args?.data;
        if (!data || !data.frame) {
          return;
        }

        if (!this.targets.find(target => target.id === data.frame)) {
          // New target found
          this.targets.push({
            id: data.frame,
            type: data.frameType,
            isolate: data.isolate,
            v8Context: data.v8context,
            pid: traceEvent.pid,
            url: data.url,
          });
        }
      }
    });
  }

  private captureExecutionContextFromTraces(): void {
    this.traceEvents.forEach(traceEvent => {
      if (traceEvent.cat === 'disabled-by-default-devtools.target-rundown') {
        const data = traceEvent.args?.data;
        if (!data || !data.v8context) {
          return;
        }

        if (!this.executionContexts.find(executionContext => executionContext.v8Context === data.v8context)) {
          // New ExecutionContexts found
          const executionContextId = this.v8ContextToExecutionContextId.get(data.v8context);
          this.executionContexts.push({
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
  }

  private captureScriptFromTraces(): void {
    const scriptToSourceText: Map<ScriptIdentifier, string|undefined> = new Map<ScriptIdentifier, string>();
    const scriptToSourceLength: Map<ScriptIdentifier, number|undefined> = new Map<ScriptIdentifier, number>();
    this.traceEvents.forEach(traceEvent => {
      if (traceEvent.cat === 'disabled-by-default-devtools.v8-source-rundown') {
        const data = traceEvent.args?.data;
        if (!data || !data.scriptId) {
          return;
        }

        if (!this.scripts.find(script => script.scriptId === data.scriptId)) {
          // New Script found
          this.scripts.push({
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
      } else if (traceEvent.cat === 'disabled-by-default-devtools.v8-source-rundown') {
        const data = traceEvent.args?.data;
        if (!data || !data.scriptId || !data.isolate) {
          return;
        }
        scriptToSourceText.set([data.isolate, data.scriptId], data.sourceText);
        scriptToSourceLength.set([data.isolate, data.scriptId], data.length);
      }
    });

    this.scripts.forEach(script => {
      if (!script.isolate || !script.scriptId) {
        return;
      }
      const scriptIdentifier: ScriptIdentifier = [script.isolate, script.scriptId];
      script.sourceText = scriptToSourceText.get(scriptIdentifier);
      script.length = scriptToSourceLength.get(scriptIdentifier);
    });
  }

  private getEnhancedTracesMetaData(): MetaData {
    return {
      version: 'beta',
    };
  }
}

export interface MetaData {
  version: string;
}

export interface Script {
  scriptId?: number;
  isolate?: string;
  executionContextId?: number;
  startLine?: number;
  startColumn?: number;
  endLine?: number;
  endColumn?: number;
  hash?: string;
  isModule?: boolean;
  url?: string;
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
  id?: number;
  origin?: string;
  v8Context?: string;
  auxData?: ExecutionContextAuxData;
}

export interface Target {
  id?: string;
  type?: string;
  isolate?: string;
  v8Context?: string;
  url?: string;
  pid?: number;
}

export interface EnhancedTraces {
  metaData: MetaData;
  targets: Target[];
  executionContexts: ExecutionContext[];
  scripts: Script[];
  payload: string;
}
