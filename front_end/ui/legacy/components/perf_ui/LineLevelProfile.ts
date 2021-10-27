// Copyright 2016 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as SDK from '../../../../core/sdk/sdk.js';
import * as Bindings from '../../../../models/bindings/bindings.js';
import * as Workspace from '../../../../models/workspace/workspace.js';
import * as SourceFrame from '../source_frame/source_frame.js';
import type * as Protocol from '../../../../generated/protocol.js';

let performanceInstance: Performance;

export class Performance {
  private readonly helper: Helper;

  private constructor() {
    this.helper = new Helper(SourceFrame.SourceFrame.DecoratorType.PERFORMANCE);
  }

  static instance(opts: {
    forceNew: boolean|null,
  } = {forceNew: null}): Performance {
    const {forceNew} = opts;
    if (!performanceInstance || forceNew) {
      performanceInstance = new Performance();
    }

    return performanceInstance;
  }

  reset(): void {
    this.helper.reset();
  }

  private appendLegacyCPUProfile(profile: SDK.CPUProfileDataModel.CPUProfileDataModel): void {
    const target = profile.target();

    const nodesToGo: SDK.CPUProfileDataModel.CPUProfileNode[] = [profile.profileHead];
    const sampleDuration = (profile.profileEndTime - profile.profileStartTime) / profile.totalHitCount;
    while (nodesToGo.length) {
      const nodes: SDK.CPUProfileDataModel.CPUProfileNode[] =
          // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (nodesToGo.pop() as any).children;  // Cast to any because runtime checks assert the props.
      for (let i = 0; i < nodes.length; ++i) {
        const node = nodes[i];
        nodesToGo.push(node);
        if (!node.url || !node.positionTicks) {
          continue;
        }
        for (let j = 0; j < node.positionTicks.length; ++j) {
          const lineInfo = node.positionTicks[j];
          const line = lineInfo.line;
          const time = lineInfo.ticks * sampleDuration;
          this.helper.addLineData(target, node.url, line, time);
        }
      }
    }
  }

  appendCPUProfile(profile: SDK.CPUProfileDataModel.CPUProfileDataModel): void {
    if (!profile.lines) {
      this.appendLegacyCPUProfile(profile);
      this.helper.scheduleUpdate();
      return;
    }
    const target = profile.target();
    if (!profile.samples) {
      return;
    }

    for (let i = 1; i < profile.samples.length; ++i) {
      const line = profile.lines[i];
      if (!line) {
        continue;
      }
      const node = profile.nodeByIndex(i);
      if (!node) {
        continue;
      }
      const scriptIdOrUrl = node.scriptId || node.url;
      if (!scriptIdOrUrl) {
        continue;
      }
      const time = profile.timestamps[i] - profile.timestamps[i - 1];
      this.helper.addLineData(target, scriptIdOrUrl, line, time);
    }
    this.helper.scheduleUpdate();
  }
}

let memoryInstance: Memory;

export class Memory {
  private readonly helper: Helper;
  private constructor() {
    this.helper = new Helper(SourceFrame.SourceFrame.DecoratorType.MEMORY);
  }

  static instance(opts: {
    forceNew: boolean|null,
  } = {forceNew: null}): Memory {
    const {forceNew} = opts;
    if (!memoryInstance || forceNew) {
      memoryInstance = new Memory();
    }

    return memoryInstance;
  }

  reset(): void {
    this.helper.reset();
  }

  appendHeapProfile(profile: Protocol.HeapProfiler.SamplingHeapProfile, target: SDK.Target.Target|null): void {
    const helper = this.helper;
    processNode(profile.head);
    helper.scheduleUpdate();

    function processNode(node: Protocol.HeapProfiler.SamplingHeapProfileNode): void {
      node.children.forEach(processNode);
      if (!node.selfSize) {
        return;
      }
      const script = Number(node.callFrame.scriptId) || node.callFrame.url;
      if (!script) {
        return;
      }
      const line = node.callFrame.lineNumber + 1;
      helper.addLineData(target, script, line, node.selfSize);
    }
  }
}

export class Helper {
  private readonly type: string;
  private readonly locationPool: Bindings.LiveLocation.LiveLocationPool;
  private updateTimer: number|null;
  private lineData!: Map<SDK.Target.Target|null, Map<string|number, Map<number, number>>>;

  constructor(type: string) {
    this.type = type;
    this.locationPool = new Bindings.LiveLocation.LiveLocationPool();
    this.updateTimer = null;
    this.reset();
  }

  reset(): void {
    // The second map uses string keys for script URLs and numbers for scriptId.
    this.lineData = new Map();
    this.scheduleUpdate();
  }

  addLineData(target: SDK.Target.Target|null, scriptIdOrUrl: string|number, line: number, data: number): void {
    let targetData = this.lineData.get(target);
    if (!targetData) {
      targetData = new Map();
      this.lineData.set(target, targetData);
    }
    let scriptData = targetData.get(scriptIdOrUrl);
    if (!scriptData) {
      scriptData = new Map();
      targetData.set(scriptIdOrUrl, scriptData);
    }
    scriptData.set(line, (scriptData.get(line) || 0) + data);
  }

  scheduleUpdate(): void {
    if (this.updateTimer) {
      return;
    }
    this.updateTimer = window.setTimeout(() => {
      this.updateTimer = null;
      this.doUpdate();
    }, 0);
  }

  private doUpdate(): void {
    this.locationPool.disposeAll();
    const updated: Set<Workspace.UISourceCode.UISourceCode> = new Set;
    for (const targetToScript of this.lineData) {
      const target = (targetToScript[0] as SDK.Target.Target | null);
      const debuggerModel = target ? target.model(SDK.DebuggerModel.DebuggerModel) : null;
      const scriptToLineMap = (targetToScript[1] as Map<string|number, Map<number, number>>);
      for (const scriptToLine of scriptToLineMap) {
        const scriptIdOrUrl = (scriptToLine[0] as string | number);
        const lineToDataMap = (scriptToLine[1] as Map<number, number>);
        // debuggerModel is null when the profile is loaded from file.
        // Try to get UISourceCode by the URL in this case.
        const uiSourceCode = !debuggerModel && typeof scriptIdOrUrl === 'string' ?
            Workspace.Workspace.WorkspaceImpl.instance().uiSourceCodeForURL(scriptIdOrUrl) :
            null;
        if (uiSourceCode) {
          updated.add(uiSourceCode);
          uiSourceCode.setDecorationData(this.type, lineToDataMap);
        }
        /* FIXME-SF update for source maps, somehow?
          if (debuggerModel) {
            const rawLocation = typeof scriptIdOrUrl === 'string' ?
                debuggerModel.createRawLocationByURL(scriptIdOrUrl, line, 0) :
                debuggerModel.createRawLocationByScriptId(String(scriptIdOrUrl) as Protocol.Runtime.ScriptId, line, 0);
            if (rawLocation) {
              new Presentation(rawLocation, this.type, data, this.locationPool);
            }
          }*/
      }
    }
    for (const uiSourceCode of Workspace.Workspace.WorkspaceImpl.instance().uiSourceCodes()) {
      if (!updated.has(uiSourceCode)) {
        uiSourceCode.setDecorationData(this.type, undefined);
      }
    }
  }
}
