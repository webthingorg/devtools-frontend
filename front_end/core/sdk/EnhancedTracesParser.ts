// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {
  EnhancedTracesData,
  type ExecutionContext,
  type Script,
  type Target,
} from './RehydratingObject.js';


export class EnhancedTracesParser {
  scriptRundownEvents: any[] = [];
  scriptToV8Context: Map<string, string> = new Map<string, string>();
  scriptToScriptSource: Map<string, string> = new Map<string, string>();
  largeScriptToScriptSource: Map<string, string[]> = new Map<string, string[]>();
  scriptToSourceLength: Map<string, number> = new Map<string, number>();
  targets: Target[] = [];
  executionContexts: ExecutionContext[] = [];
  scripts: Script[] = [];
  static readonly enhancedTraceVersion: number = 1;

  constructor(traceEvents: any) {
    // Sanitize event and initialzie
    if (!Array.isArray(traceEvents)) {
      console.error('Input is not an array');
    }
    try {
      this.parseEnhancedTrace(traceEvents);
    } catch (e) {
      console.error('Enhanced Traces Parsing failed due to the following error' + e);
    }
  }

  parseEnhancedTrace(traceEvents: any): void {
    for (const event of traceEvents) {
      if (this.isTargetRundownEvent(event)) {
        // Set up script to v8 context mapping
        const data = event.args?.data;
        this.scriptToV8Context.set(this.getScriptIsolateId(data.isolate, data.scriptId), data.v8context);
        // Add target
        if (!this.targets.find(target => target.targetId === data.frame)) {
          this.targets.push({
            targetId: data.frame,
            type: data.frameType,
            isolate: data.isolate,
            pid: event.pid,
            url: data.url,
          });
        }
        // Add execution context, need to put back execution context id with info from other traces
        if (!this.executionContexts.find(executionContext => executionContext.v8Context === data.v8context)) {
          this.executionContexts.push({
            id: -1,
            origin: data.origin,
            v8Context: data.v8context,
            auxData: {
              frameId: data.frame,
              isDefault: data.isDefault,
              type: data.contextType,
            },
            isolate: data.isolate,
          });
        }
      } else if (this.isScriptRundownEvent(event)) {
        this.scriptRundownEvents.push(event);
        const data = event.args.data;
        // Add script
        if (!this.scripts.find(script => script.scriptId === data.scriptId && script.isolate === data.isolate)) {
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
      } else if (this.isScriptRundownSourceEvent(event)) {
        // Set up script to source text and length mapping
        const data = event.args.data;
        const scriptIsolateId = this.getScriptIsolateId(data.isolate, data.scriptId);
        if ('splitIndex' in data && 'splitCount' in data) {
          if (!this.largeScriptToScriptSource.has(scriptIsolateId)) {
            this.largeScriptToScriptSource.set(scriptIsolateId, new Array(data.splitCount).fill('') as string[]);
          }
          const splittedSource = this.largeScriptToScriptSource.get(scriptIsolateId);
          if (splittedSource && data.sourceText) {
            splittedSource[data.splitIndex as number] = data.sourceText;
          }
        } else {
          if (data.sourceText) {
            this.scriptToScriptSource.set(scriptIsolateId, data.sourceText);
          }
          if (data.length) {
            this.scriptToSourceLength.set(scriptIsolateId, data.length);
          }
        }
      }
    }
  }

  data(): EnhancedTracesData {
    // Put back execution context id
    const v8ContextToExecutionContextId: Map<string, number> = new Map<string, number>();
    this.scriptRundownEvents.forEach(scriptRundownEvent => {
      const data = scriptRundownEvent.args.data;
      const v8Context = this.scriptToV8Context.get(this.getScriptIsolateId(data.isolate, data.scriptId));
      if (v8Context) {
        v8ContextToExecutionContextId.set(v8Context, data.executionContextId);
      }
    });
    this.executionContexts.forEach(executionContext => {
      if (executionContext.v8Context) {
        const id = v8ContextToExecutionContextId.get(executionContext.v8Context);
        if (id) {
          executionContext.id = id;
        }
      }
    });

    // Put back script source text and length
    this.scripts.forEach(script => {
      const scriptIsolateId = this.getScriptIsolateId(script.isolate, script.scriptId);
      if (this.scriptToScriptSource.has(scriptIsolateId)) {
        script.sourceText = this.scriptToScriptSource.get(scriptIsolateId);
        script.length = this.scriptToSourceLength.get(scriptIsolateId);
      } else if (this.largeScriptToScriptSource.has(scriptIsolateId)) {
        const splittedSources = this.largeScriptToScriptSource.get(scriptIsolateId);
        if (splittedSources) {
          script.sourceText = splittedSources.join('');
          script.length = script.sourceText.length;
        }
      }
      // put in the aux data
      script.auxData =
          this.executionContexts
              .find(context => context.id === script.executionContextId && context.isolate === script.isolate)
              ?.auxData;
    });
    return {
      targets: this.targets,
      executionContexts: this.executionContexts,
      scripts: this.scripts,
    };
  }

  private getScriptIsolateId(isolate: string, scriptId: number): string {
    return scriptId + '@' + isolate;
  }

  private isTargetRundownEvent(event: any): boolean {
    if (!('cat' in event) || event.cat !== 'disabled-by-default-devtools.target-rundown') {
      return false;
    }
    if (!('data' in event.args) || !event.args.data) {
      return false;
    }
    const data = event.args.data;
    return 'frame' in data && 'frameType' in data && 'url' in data && 'isolate' in data && 'v8context' in data &&
        'scriptId' in data;
  }

  private isScriptRundownEvent(event: any): boolean {
    if (!('cat' in event) || event.cat !== 'disabled-by-default-devtools.v8-source-rundown') {
      return false;
    }
    if (!('data' in event.args) || !event.args.data) {
      return false;
    }
    const data = event.args.data;
    return 'isolate' in data && 'executionContextId' in data && 'scriptId' in data && 'startLine' in data &&
        'startColumn' in data && 'endLine' in data && 'endColumn' in data && 'hash' in data && 'isModule' in data &&
        'hasSourceUrl' in data;
  }

  private isScriptRundownSourceEvent(event: any): boolean {
    if (!('cat' in event) || event.cat !== 'disabled-by-default-devtools.v8-source-rundown-sources') {
      return false;
    }
    if (!('data' in event.args) || !event.args.data) {
      return false;
    }
    const data = event.args.data;
    return 'isolate' in data && 'scriptId' in data && 'sourceText' in data;
  }
}