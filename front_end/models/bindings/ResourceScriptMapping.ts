/*
 * Copyright (C) 2012 Google Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/* eslint-disable rulesdir/no_underscored_properties */

import * as Common from '../../core/common/common.js';
import * as i18n from '../../core/i18n/i18n.js';
import * as SDK from '../../core/sdk/sdk.js';
import * as Workspace from '../workspace/workspace.js';
import type * as Protocol from '../../generated/protocol.js';

import type {Breakpoint} from './BreakpointManager.js';
import {BreakpointManager} from './BreakpointManager.js';  // eslint-disable-line no-unused-vars
import {ContentProviderBasedProject} from './ContentProviderBasedProject.js';
import type {DebuggerSourceMapping, DebuggerWorkspaceBinding} from './DebuggerWorkspaceBinding.js'; // eslint-disable-line no-unused-vars
import {NetworkProject} from './NetworkProject.js';
import {metadataForURL} from './ResourceUtils.js';

const UIStrings = {
  /**
  *@description Error text displayed in the console when editing a live script fails. LiveEdit is
  *the name of the feature for editing code that is already running.
  *@example {warning} PH1
  */
  liveEditFailed: '`LiveEdit` failed: {PH1}',
  /**
  *@description Error text displayed in the console when compiling a live-edited script fails. LiveEdit is
  *the name of the feature for editing code that is already running.
  *@example {connection lost} PH1
  */
  liveEditCompileFailed: '`LiveEdit` compile failed: {PH1}',
};
const str_ = i18n.i18n.registerUIStrings('models/bindings/ResourceScriptMapping.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

export class ResourceScriptMapping implements DebuggerSourceMapping {
  _debuggerModel: SDK.DebuggerModel.DebuggerModel;
  _workspace: Workspace.Workspace.WorkspaceImpl;
  _debuggerWorkspaceBinding: DebuggerWorkspaceBinding;
  _uiSourceCodeToScriptFile: Map<Workspace.UISourceCode.UISourceCode, ResourceScriptFile>;
  _regularProject: ContentProviderBasedProject;
  _contentScriptsProject: ContentProviderBasedProject;
  _eventListeners: Common.EventTarget.EventDescriptor[];

  constructor(
      debuggerModel: SDK.DebuggerModel.DebuggerModel, workspace: Workspace.Workspace.WorkspaceImpl,
      debuggerWorkspaceBinding: DebuggerWorkspaceBinding) {
    this._debuggerModel = debuggerModel;
    this._workspace = workspace;
    this._debuggerWorkspaceBinding = debuggerWorkspaceBinding;
    this._uiSourceCodeToScriptFile = new Map();

    const target = debuggerModel.target();
    this._regularProject = new ContentProviderBasedProject(
        workspace, `js::${target.id()}`, Workspace.Workspace.projectTypes.Network, '', false /* isServiceProject */);
    this._contentScriptsProject = new ContentProviderBasedProject(
        workspace, `js:extensions:${target.id()}`, Workspace.Workspace.projectTypes.Network, '',
        false /* isServiceProject */);
    NetworkProject.setTargetForProject(this._regularProject, target);
    NetworkProject.setTargetForProject(this._contentScriptsProject, target);

    const runtimeModel = debuggerModel.runtimeModel();
    this._eventListeners = [
      this._debuggerModel.addEventListener(SDK.DebuggerModel.Events.ParsedScriptSource, this._parsedScriptSource, this),
      this._debuggerModel.addEventListener(
          SDK.DebuggerModel.Events.GlobalObjectCleared, this._globalObjectCleared, this),
      runtimeModel.addEventListener(
          SDK.RuntimeModel.Events.ExecutionContextDestroyed, this._executionContextDestroyed, this),
    ];
  }

  rawLocationToUILocation(rawLocation: SDK.DebuggerModel.Location): Workspace.UISourceCode.UILocation|null {
    const script = rawLocation.script();
    if (!script) {
      return null;
    }
    const project = script.isContentScript() ? this._contentScriptsProject : this._regularProject;
    const uiSourceCode = project.uiSourceCodeForURL(script.sourceURL);
    if (!uiSourceCode) {
      return null;
    }
    const scriptFile = this._uiSourceCodeToScriptFile.get(uiSourceCode);
    if (!scriptFile) {
      return null;
    }
    if ((scriptFile.hasDivergedFromVM() && !scriptFile.isMergingToVM()) || scriptFile.isDivergingFromVM()) {
      return null;
    }
    if (!scriptFile._scripts.includes(script)) {
      return null;
    }
    const lineNumber = rawLocation.lineNumber - (script.isInlineScriptWithSourceURL() ? script.lineOffset : 0);
    let columnNumber = rawLocation.columnNumber || 0;
    if (script.isInlineScriptWithSourceURL() && !lineNumber && columnNumber) {
      columnNumber -= script.columnOffset;
    }
    return uiSourceCode.uiLocation(lineNumber, columnNumber);
  }

  uiLocationToRawLocations(uiSourceCode: Workspace.UISourceCode.UISourceCode, lineNumber: number, columnNumber: number):
      SDK.DebuggerModel.Location[] {
    const scriptFile = this._uiSourceCodeToScriptFile.get(uiSourceCode);
    if (!scriptFile) {
      return [];
    }
    return scriptFile._scripts.map(script => {
      if (script.isInlineScriptWithSourceURL()) {
        return this._debuggerModel.createRawLocation(
            script, lineNumber + script.lineOffset, lineNumber ? columnNumber : columnNumber + script.columnOffset);
      }
      return this._debuggerModel.createRawLocation(script, lineNumber, columnNumber);
    });
  }

  _acceptsScript(script: SDK.Script.Script): boolean {
    if (!script.sourceURL || script.isLiveEdit() || (script.isInlineScript() && !script.hasSourceURL)) {
      return false;
    }
    // Filter out embedder injected content scripts.
    if (script.isContentScript() && !script.hasSourceURL) {
      const parsedURL = new Common.ParsedURL.ParsedURL(script.sourceURL);
      if (!parsedURL.isValid) {
        return false;
      }
    }
    return true;
  }

  async _parsedScriptSource(event: Common.EventTarget.EventTargetEvent): Promise<void> {
    const script = (event.data as SDK.Script.Script);
    if (!this._acceptsScript(script)) {
      return;
    }
    const originalContentProvider = script.originalContentProvider();

    const url = script.sourceURL;
    const project = script.isContentScript() ? this._contentScriptsProject : this._regularProject;

    // Remove previous UISourceCode, if any
    let uiSourceCode = project.uiSourceCodeForURL(url);
    if (uiSourceCode) {
      const scriptFile = (this._uiSourceCodeToScriptFile.get(uiSourceCode) as ResourceScriptFile);
      scriptFile._scripts.push(script);
      NetworkProject.addFrameAttribution(uiSourceCode, script.frameId);
    } else {
      // Create UISourceCode.
      uiSourceCode = project.createUISourceCode(url, originalContentProvider.contentType());
      NetworkProject.setInitialFrameAttribution(uiSourceCode, script.frameId);
      const metadata = metadataForURL(this._debuggerModel.target(), script.frameId, url);

      // Bind UISourceCode to scripts.
      const scriptFile = new ResourceScriptFile(this, uiSourceCode, [script]);
      this._uiSourceCodeToScriptFile.set(uiSourceCode, scriptFile);

      const mimeType = script.isWasm() ? 'application/wasm' : 'text/javascript';
      project.addUISourceCodeWithProvider(uiSourceCode, originalContentProvider, metadata, mimeType);
    }
    await this._debuggerWorkspaceBinding.updateLocations(script);
  }

  scriptFile(uiSourceCode: Workspace.UISourceCode.UISourceCode): ResourceScriptFile|null {
    return this._uiSourceCodeToScriptFile.get(uiSourceCode) || null;
  }

  _executionContextDestroyed(event: Common.EventTarget.EventTargetEvent): void {
    const executionContext = (event.data as SDK.RuntimeModel.ExecutionContext);
    const scripts = this._debuggerModel.scriptsForExecutionContext(executionContext);
    for (const script of scripts) {
      const project = script.isContentScript() ? this._contentScriptsProject : this._regularProject;
      const uiSourceCode = (project.uiSourceCodeForURL(script.sourceURL) as Workspace.UISourceCode.UISourceCode);
      const scriptFile = this._uiSourceCodeToScriptFile.get(uiSourceCode);
      if (scriptFile && scriptFile._scripts.includes(script)) {
        scriptFile._scripts = scriptFile._scripts.filter(s => s !== script);
        if (scriptFile._scripts.length === 0) {
          scriptFile.dispose();
          this._uiSourceCodeToScriptFile.delete(uiSourceCode);
          project.removeFile(script.sourceURL);
        } else {
          NetworkProject.removeFrameAttribution(uiSourceCode, script.frameId);
        }
        this._debuggerWorkspaceBinding.updateLocations(script);
      }
    }
  }

  _globalObjectCleared(): void {
    const scripts: SDK.Script.Script[] = [];
    for (const scriptFile of this._uiSourceCodeToScriptFile.values()) {
      scriptFile._scripts.forEach(script => scripts.push(script));
      scriptFile.dispose();
    }
    this._uiSourceCodeToScriptFile.clear();
    this._regularProject.reset();
    this._contentScriptsProject.reset();
    scripts.forEach(script => this._debuggerWorkspaceBinding.updateLocations(script));
  }

  resetForTest(): void {
    this._globalObjectCleared();
  }

  dispose(): void {
    Common.EventTarget.EventTarget.removeEventListeners(this._eventListeners);
    this._regularProject.dispose();
    this._contentScriptsProject.dispose();
  }
}

export class ResourceScriptFile extends Common.ObjectWrapper.ObjectWrapper {
  _resourceScriptMapping: ResourceScriptMapping;
  _uiSourceCode: Workspace.UISourceCode.UISourceCode;
  _scripts: SDK.Script.Script[];
  _scriptSource?: string|null;
  _isDivergingFromVM?: boolean;
  _hasDivergedFromVM?: boolean;
  _isMergingToVM?: boolean;
  constructor(
      resourceScriptMapping: ResourceScriptMapping, uiSourceCode: Workspace.UISourceCode.UISourceCode,
      scripts: SDK.Script.Script[]) {
    super();
    console.assert(scripts.length > 0);

    this._resourceScriptMapping = resourceScriptMapping;
    this._uiSourceCode = uiSourceCode;
    this._scripts = scripts;

    this._uiSourceCode.addEventListener(
        Workspace.UISourceCode.Events.WorkingCopyChanged, this._workingCopyChanged, this);
    this._uiSourceCode.addEventListener(
        Workspace.UISourceCode.Events.WorkingCopyCommitted, this._workingCopyCommitted, this);
  }

  _isDiverged(): boolean {
    if (this._uiSourceCode.isDirty()) {
      return true;
    }
    if (typeof this._scriptSource === 'undefined' || this._scriptSource === null) {
      return false;
    }
    const workingCopy = this._uiSourceCode.workingCopy();
    if (!workingCopy) {
      return false;
    }

    // Match ignoring sourceURL.
    if (!workingCopy.startsWith(this._scriptSource.trimRight())) {
      return true;
    }
    const suffix = this._uiSourceCode.workingCopy().substr(this._scriptSource.length);
    return Boolean(suffix.length) && !suffix.match(SDK.Script.sourceURLRegex);
  }

  _workingCopyChanged(_event: Common.EventTarget.EventTargetEvent): void {
    this._update();
  }

  _workingCopyCommitted(_event: Common.EventTarget.EventTargetEvent): void {
    if (this._uiSourceCode.project().canSetFileContent()) {
      return;
    }
    const debuggerModel = this._resourceScriptMapping._debuggerModel;
    const breakpoints = BreakpointManager.instance()
                            .breakpointLocationsForUISourceCode(this._uiSourceCode)
                            .map(breakpointLocation => breakpointLocation.breakpoint);
    const source = this._uiSourceCode.workingCopy();
    // TODO(bmeurer): How to make LiveEdit work when there are multiple scripts?
    debuggerModel.setScriptSource(this._scripts[0].scriptId, source, (error, exceptionDetails) => {
      this.scriptSourceWasSet(source, breakpoints, error, exceptionDetails);
    });
  }

  async scriptSourceWasSet(
      source: string, breakpoints: Breakpoint[], error: string|null,
      exceptionDetails?: Protocol.Runtime.ExceptionDetails): Promise<void> {
    if (!error && !exceptionDetails) {
      this._scriptSource = source;
    }
    await this._update();

    if (!error && !exceptionDetails) {
      // Live edit can cause breakpoints to be in the wrong position, or to be lost altogether.
      // If any breakpoints were in the pre-live edit script, they need to be re-added.
      await Promise.all(breakpoints.map(breakpoint => breakpoint.refreshInDebugger()));
      return;
    }
    if (!exceptionDetails) {
      Common.Console.Console.instance().addMessage(
          i18nString(UIStrings.liveEditFailed, {PH1: error}), Common.Console.MessageLevel.Warning);
      return;
    }
    const messageText = i18nString(UIStrings.liveEditCompileFailed, {PH1: exceptionDetails.text});
    this._uiSourceCode.addLineMessage(
        Workspace.UISourceCode.Message.Level.Error, messageText, exceptionDetails.lineNumber,
        exceptionDetails.columnNumber);
  }

  async _update(): Promise<void> {
    if (this._isDiverged() && !this._hasDivergedFromVM) {
      await this._divergeFromVM();
    } else if (!this._isDiverged() && this._hasDivergedFromVM) {
      await this._mergeToVM();
    }
  }

  async _divergeFromVM(): Promise<void> {
    this._isDivergingFromVM = true;
    await Promise.all(
        this._scripts.map(script => this._resourceScriptMapping._debuggerWorkspaceBinding.updateLocations(script)));
    delete this._isDivergingFromVM;
    this._hasDivergedFromVM = true;
    this.dispatchEventToListeners(ResourceScriptFile.Events.DidDivergeFromVM, this._uiSourceCode);
  }

  async _mergeToVM(): Promise<void> {
    delete this._hasDivergedFromVM;
    this._isMergingToVM = true;
    await Promise.all(
        this._scripts.map(script => this._resourceScriptMapping._debuggerWorkspaceBinding.updateLocations(script)));
    delete this._isMergingToVM;
    this.dispatchEventToListeners(ResourceScriptFile.Events.DidMergeToVM, this._uiSourceCode);
  }

  hasDivergedFromVM(): boolean {
    return Boolean(this._hasDivergedFromVM);
  }

  isDivergingFromVM(): boolean {
    return Boolean(this._isDivergingFromVM);
  }

  isMergingToVM(): boolean {
    return Boolean(this._isMergingToVM);
  }

  checkMapping(): void {
    if (typeof this._scriptSource !== 'undefined') {
      this._mappingCheckedForTest();
      return;
    }
    // TODO(bmeurer): How to make LiveEdit work when there are multiple scripts?
    this._scripts[0].requestContent().then(deferredContent => {
      this._scriptSource = deferredContent.content;
      this._update().then(() => this._mappingCheckedForTest());
    });
  }

  _mappingCheckedForTest(): void {
  }

  dispose(): void {
    this._uiSourceCode.removeEventListener(
        Workspace.UISourceCode.Events.WorkingCopyChanged, this._workingCopyChanged, this);
    this._uiSourceCode.removeEventListener(
        Workspace.UISourceCode.Events.WorkingCopyCommitted, this._workingCopyCommitted, this);
  }

  addSourceMapURL(sourceMapURL: string): void {
    this._scripts.forEach(script => script.debuggerModel.setSourceMapURL(script, sourceMapURL));
  }

  hasSourceMapURL(): boolean {
    return this._scripts.some(script => Boolean(script.sourceMapURL));
  }

  get uiSourceCode(): Workspace.UISourceCode.UISourceCode {
    return this._uiSourceCode;
  }
}

export namespace ResourceScriptFile {
  // TODO(crbug.com/1167717): Make this a const enum again
  // eslint-disable-next-line rulesdir/const_enum
  export enum Events {
    DidMergeToVM = 'DidMergeToVM',
    DidDivergeFromVM = 'DidDivergeFromVM',
  }
}
