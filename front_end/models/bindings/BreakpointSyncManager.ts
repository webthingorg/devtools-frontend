// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as Common from '../../core/common/common.js';
import * as SDK from '../../core/sdk/sdk.js';
import * as Workspace from '../workspace/workspace.js';

import type {BreakpointManager} from './BreakpointManager.js';
import {DebuggerWorkspaceBinding} from './DebuggerWorkspaceBinding.js';
import {DefaultScriptMapping} from './DefaultScriptMapping.js';

let debuggerStateManagerInstance: BreakpointSyncManager;

// The BreakpointSyncManager is responsible for making sure to synchronize
// the breakpoint setting with the debugger.
// Synchronization is required on debugger start up and on instrumentation breakpoints.
export class BreakpointSyncManager implements SDK.TargetManager.SDKModelObserver<SDK.DebuggerModel.DebuggerModel> {
  #debuggerModelToAwaitedSourceUrls: Map<SDK.DebuggerModel.DebuggerModel, Set<string>>;
  #debuggerModelToCallback: Map<SDK.DebuggerModel.DebuggerModel, () => void>;
  #breakpointManager: BreakpointManager;

  private constructor(targetManager: SDK.TargetManager.TargetManager, breakpointManager: BreakpointManager) {
    this.#breakpointManager = breakpointManager;
    this.#debuggerModelToAwaitedSourceUrls = new Map();
    this.#debuggerModelToCallback = new Map();
    targetManager.observeModels(SDK.DebuggerModel.DebuggerModel, this);
    Workspace.Workspace.WorkspaceImpl.instance().addEventListener(
        Workspace.Workspace.Events.UISourceCodeAdded, this.#onUISourceCodeAdded, this);
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
    debuggerModel.addEventListener(SDK.DebuggerModel.Events.DebuggerWasEnabled, this.#onDebuggerEnabled, this);
    debuggerModel.addEventListener(
        SDK.DebuggerModel.Events.DebuggerWasDisabled, this.#onDebuggerDisabled.bind(this, debuggerModel));
    debuggerModel.addEventListener(
        SDK.DebuggerModel.Events.DebuggerPausedOnInstrumentation, this.#onInstrumentationBreakpoint, this);
  }

  modelRemoved(debuggerModel: SDK.DebuggerModel.DebuggerModel): void {
    debuggerModel.removeEventListener(SDK.DebuggerModel.Events.DebuggerWasEnabled, this.#onDebuggerEnabled, this);
    debuggerModel.removeEventListener(
        SDK.DebuggerModel.Events.DebuggerWasDisabled, this.#onDebuggerDisabled.bind(this, debuggerModel));
    this.#cleanUpAfterSyncFinished(debuggerModel);
  }
  async #onDebuggerEnabled(event: Common.EventTarget.EventTargetEvent<SDK.DebuggerModel.DebuggerModel>): Promise<void> {
    const debuggerModel = event.data;
    await this.#populateSourceFilesToWaitFor(debuggerModel);
    const missingFiles = this.#debuggerModelToAwaitedSourceUrls.get(debuggerModel);
    if (missingFiles && missingFiles.size > 0) {
      this.#debuggerModelToCallback.set(debuggerModel, () => {
        debuggerModel.breakpointsInitializedOnStartup();
      });
      this.#addSourceMapListeners(debuggerModel);
    } else {
      debuggerModel.breakpointsInitializedOnStartup();
    }
  }

  #onDebuggerDisabled(debuggerModel: SDK.DebuggerModel.DebuggerModel): void {
    this.#cleanUpAfterSyncFinished(debuggerModel);
  }

  #addSourceMapListeners(debuggerModel: SDK.DebuggerModel.DebuggerModel): void {
    debuggerModel.sourceMapManager().addEventListener(
        SDK.SourceMapManager.Events.SourceMapAttached, this.#onSourceMapAttached, this);
    debuggerModel.sourceMapManager().addEventListener(
        SDK.SourceMapManager.Events.SourceMapFailedToAttach, this.#onSourceMapFailedToAttach, this);
  }

  async #populateSourceFilesToWaitFor(debuggerModel: SDK.DebuggerModel.DebuggerModel): Promise<void> {
    // Accept regular scripts and inline scripts that are in documents.
    for (const script of debuggerModel.scripts()) {
      if (script.contentType().isScript() || script.contentType().isDocument()) {
        await this.#populateSourceFilesForScript(script);
      }
    }
  }

  async #populateSourceFilesForScript(script: SDK.Script.Script): Promise<void> {
    const debuggerModel = script.debuggerModel;
    // 1. Handle inline scripts without sourceURL comment.
    // The UISourceCode of inline scripts without sourceURLs will not be availabe
    // until a later point. Use the v8 script for setting the breakpoint.
    if (script.isInlineScript() && !script.hasSourceURL) {
      if (this.#breakpointManager.hasBreakpointsForUrl(script.sourceURL)) {
        return this.#addMissingOrSetBreakpoint(DefaultScriptMapping.createV8ScriptURL(script), debuggerModel);
      }
      return;
    }

    // 2. Handle regular scripts or inline scripts with sourceURL comment.
    if (this.#breakpointManager.hasBreakpointsForUrl(script.sourceURL)) {
      await this.#addMissingOrSetBreakpoint(script.sourceURL, debuggerModel);
    }

    // 3. Handle source maps and the original sources.
    if (script.sourceMapURL) {
      const sourceMap = debuggerModel.sourceMapManager().sourceMapForClient(script);
      if (sourceMap) {
        for (const sourceUrl of sourceMap.sourceURLs()) {
          if (this.#breakpointManager.hasBreakpointsForUrl(sourceUrl)) {
            await this.#addMissingOrSetBreakpoint(sourceUrl, debuggerModel);
          }
        }
      } else if (!debuggerModel.sourceMapManager().sourceMapForClientFailedToAttach(script)) {
        const resolvedURLs = SDK.SourceMapManager.SourceMapManager.resolveRelativeURLs(
            debuggerModel.target(), script.sourceURL, script.sourceMapURL);
        if (resolvedURLs) {
          this.#addMissingFile(debuggerModel, resolvedURLs.sourceMapURL);
        }
      }
    }
  }

  async #addMissingOrSetBreakpoint(url: string, debuggerModel: SDK.DebuggerModel.DebuggerModel): Promise<void> {
    const uiSourceCode = Workspace.Workspace.WorkspaceImpl.instance().uiSourceCodeForURL(url);
    if (!uiSourceCode) {
      this.#addMissingFile(debuggerModel, url);
    } else {
      return this.#breakpointManager.restoreBreakpointsForUrl(uiSourceCode);
    }
  }

  #addMissingFile(debuggerModel: SDK.DebuggerModel.DebuggerModel, sourceUrl: string): void {
    let missingFiles = this.#debuggerModelToAwaitedSourceUrls.get(debuggerModel);
    if (!missingFiles) {
      missingFiles = new Set();
      this.#debuggerModelToAwaitedSourceUrls.set(debuggerModel, missingFiles);
    }
    missingFiles.add(sourceUrl);
  }

  #onSourceMapFailedToAttach(event: Common.EventTarget.EventTargetEvent<{client: SDK.Script.Script}>): void {
    const script = event.data.client;
    if (script.sourceURL && script.sourceMapURL) {
      const resolvedUrls = SDK.SourceMapManager.SourceMapManager.resolveRelativeURLs(
          script.debuggerModel.target(), script.sourceURL, script.sourceMapURL);
      const missingFiles = this.#debuggerModelToAwaitedSourceUrls.get(script.debuggerModel);
      if (resolvedUrls && missingFiles && missingFiles.has(resolvedUrls.sourceMapURL)) {
        this.#removeAwaitedFile(resolvedUrls.sourceMapURL, script.debuggerModel);
      }
    }
  }

  async #onSourceMapAttached(
      event: Common.EventTarget.EventTargetEvent<{client: SDK.Script.Script, sourceMap: SDK.SourceMap.SourceMap}>):
      Promise<void> {
    const {client, sourceMap} = event.data;
    const missingFiles = this.#debuggerModelToAwaitedSourceUrls.get(client.debuggerModel);
    if (missingFiles && missingFiles.has(sourceMap.url())) {
      for (const sourceUrl of sourceMap.sourceURLs()) {
        if (this.#breakpointManager.hasBreakpointsForUrl(sourceUrl)) {
          await this.#addMissingOrSetBreakpoint(sourceUrl, client.debuggerModel);
        }
      }
      this.#removeAwaitedFile(sourceMap.url(), client.debuggerModel);
    }
  }

  async #onUISourceCodeAdded(event: Common.EventTarget.EventTargetEvent<Workspace.UISourceCode.UISourceCode>):
      Promise<void> {
    const uiSourceCode = event.data;
    await this.#breakpointManager.restoreBreakpointsForUrl(uiSourceCode);
    const scripts = DebuggerWorkspaceBinding.instance().scriptsForUISourceCode(uiSourceCode);
    for (const script of scripts) {
      const debuggerModel = script.debuggerModel;
      this.#removeAwaitedFile(uiSourceCode.url(), debuggerModel);
    }
  }

  #removeAwaitedFile(sourceUrl: string, debuggerModel: SDK.DebuggerModel.DebuggerModel): void {
    const sourceUrls = this.#debuggerModelToAwaitedSourceUrls.get(debuggerModel);
    if (sourceUrls && sourceUrls.has(sourceUrl)) {
      sourceUrls.delete(sourceUrl);
      if (sourceUrls.size === 0) {
        const callback = this.#debuggerModelToCallback.get(debuggerModel);
        this.#cleanUpAfterSyncFinished(debuggerModel);
        if (callback) {
          callback();
        }
      }
    }
  }

  async #onInstrumentationBreakpoint(
      event: Common.EventTarget
          .EventTargetEvent<{callFrame: SDK.DebuggerModel.CallFrame, callback: (shouldShowPause: boolean) => void}>):
      Promise<void> {
    const {callFrame, callback} = event.data;
    const script = callFrame.script;
    const debuggerModel = script.debuggerModel;

    await this.#populateSourceFilesForScript(script);
    const missingFiles = this.#debuggerModelToAwaitedSourceUrls.get(debuggerModel);
    if (missingFiles && missingFiles.size > 0) {
      this.#debuggerModelToCallback.set(
          debuggerModel, this.#onInstrumentationBreakpointFinished.bind(this, callback, callFrame.location()));
      if (script.sourceMapURL) {
        this.#addSourceMapListeners(debuggerModel);
      }
    } else {
      return this.#onInstrumentationBreakpointFinished(callback, callFrame.location());
    }
  }

  async #onInstrumentationBreakpointFinished(
      debuggerModelCallback: (shouldShowPause: boolean) => void, location: SDK.DebuggerModel.Location): Promise<void> {
    // Check if the hit instrumentation breakpoint is also a regular breakpoint.
    const uiLocation = await DebuggerWorkspaceBinding.instance().rawLocationToUILocation(location);
    const isAlsoRegularBreak = uiLocation ? this.#breakpointManager.findBreakpoint(uiLocation) !== null : false;
    debuggerModelCallback(isAlsoRegularBreak);
  }

  #cleanUpAfterSyncFinished(debuggerModel: SDK.DebuggerModel.DebuggerModel): void {
    debuggerModel.sourceMapManager().removeEventListener(
        SDK.SourceMapManager.Events.SourceMapAttached, this.#onSourceMapAttached, this);
    debuggerModel.sourceMapManager().removeEventListener(
        SDK.SourceMapManager.Events.SourceMapFailedToAttach, this.#onSourceMapFailedToAttach, this);

    if (this.#debuggerModelToAwaitedSourceUrls.has(debuggerModel)) {
      this.#debuggerModelToAwaitedSourceUrls.delete(debuggerModel);
    }
    if (this.#debuggerModelToCallback.has(debuggerModel)) {
      this.#debuggerModelToCallback.delete(debuggerModel);
    }
  }
}
