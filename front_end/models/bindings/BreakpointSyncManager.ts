// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as Platform from '../../core/platform/platform.js';

import * as SDK from '../../core/sdk/sdk.js';
import * as Workspace from '../workspace/workspace.js';

import type {BreakpointManager} from './BreakpointManager.js';
import {DefaultScriptMapping} from './DefaultScriptMapping.js';

let debuggerStateManagerInstance: BreakpointSyncManager;

// The BreakpointSyncManager is responsible for making sure to synchronize
// the breakpoint setting with the debugger.
// Synchronization is required on debugger start up and on instrumentation breakpoints.
export class BreakpointSyncManager implements SDK.TargetManager.SDKModelObserver<SDK.DebuggerModel.DebuggerModel> {
  #breakpointManager: BreakpointManager;

  private constructor(targetManager: SDK.TargetManager.TargetManager, breakpointManager: BreakpointManager) {
    this.#breakpointManager = breakpointManager;
    targetManager.observeModels(SDK.DebuggerModel.DebuggerModel, this);
  }

  static instance(opts: {
    forceNew: boolean|null,
    breakpointManager: BreakpointManager|null,
    targetManager: SDK.TargetManager.TargetManager|null,
  } = {forceNew: null, targetManager: null, breakpointManager: null}): BreakpointSyncManager {
    if (!debuggerStateManagerInstance || opts.forceNew) {
      if (!opts.targetManager || !opts.breakpointManager) {
        throw new Error('Unable to create BreakpointSyncManager: undefined target and breakpoint manager.');
      }
      debuggerStateManagerInstance = new BreakpointSyncManager(opts.targetManager, opts.breakpointManager);
    }
    return debuggerStateManagerInstance;
  }

  modelAdded(debuggerModel: SDK.DebuggerModel.DebuggerModel): void {
    debuggerModel.setSynchronizeBreakpointsCallback(this.onSynchronizeBreakpointsForScript.bind(this));
  }

  modelRemoved(): void {
  }

  async setBreakpointsForScript(script: SDK.Script.Script): Promise<void> {
    const debuggerModel = script.debuggerModel;
    if (this.#breakpointManager.hasBreakpointsForUrl(script.sourceURL)) {
      // Handle inline scripts without sourceURL comment separately:
      // The UISourceCode of inline scripts without sourceURLs will not be availabe
      // until a later point. Use the v8 script for setting the breakpoint.
      const isInlineScriptWithoutSourceURL = script.isInlineScript() && !script.hasSourceURL;
      const sourceURL =
          isInlineScriptWithoutSourceURL ? DefaultScriptMapping.createV8ScriptURL(script) : script.sourceURL;
      const uiSourceCode = await this.getUiSourceCode(sourceURL);
      await this.#breakpointManager.restoreBreakpointsForUrl(uiSourceCode);
    }

    // Handle source maps and the original sources.
    if (script.sourceMapURL) {
      const sourceMap = await debuggerModel.sourceMapManager().sourceMapForClientPromise(script);
      if (sourceMap) {
        for (const sourceURL of sourceMap.sourceURLs()) {
          if (this.#breakpointManager.hasBreakpointsForUrl(sourceURL)) {
            const uiSourceCode = await this.getUiSourceCode(sourceURL);
            await this.#breakpointManager.restoreBreakpointsForUrl(uiSourceCode);
          }
        }
      }
    }
  }

  getUiSourceCode(url: string): Promise<Workspace.UISourceCode.UISourceCode> {
    const uiSourceCode = Workspace.Workspace.WorkspaceImpl.instance().uiSourceCodeForURL(url);
    if (uiSourceCode) {
      return Promise.resolve(uiSourceCode);
    }
    return new Promise(resolve => {
      const descriptor = Workspace.Workspace.WorkspaceImpl.instance().addEventListener(
          Workspace.Workspace.Events.UISourceCodeAdded, event => {
            const uiSourceCode = event.data;
            if (uiSourceCode.url() === url) {
              Workspace.Workspace.WorkspaceImpl.instance().removeEventListener(
                  Workspace.Workspace.Events.UISourceCodeAdded, descriptor.listener);
              resolve(uiSourceCode);
            }
          });
    });
  }

  async onSynchronizeBreakpointsForScript(scripts: SDK.Script.Script[]): Promise<void> {
    if (scripts.length === 0) {
      return;
    }
    const debuggerModel = scripts[0].debuggerModel;
    Platform.DCHECK(() => scripts.every(script => script.debuggerModel === debuggerModel));

    // Accept regular scripts and inline scripts that are in documents.
    for (const script of scripts) {
      if (script.contentType().isScript() || script.contentType().isDocument()) {
        await this.setBreakpointsForScript(script);
      }
    }
  }
}
