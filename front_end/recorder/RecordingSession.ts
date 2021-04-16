// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/* eslint-disable rulesdir/no_underscored_properties */

import * as Common from '../core/common/common.js';
import * as SDK from '../core/sdk/sdk.js';
import type * as Workspace from '../models/workspace/workspace.js';
import { Recording, Step } from './Recording.js';
import { setupRecordingClient } from './RecordingClient.js';
import { RecordingEventHandler } from './RecordingEventHandler.js';
import { RecordingScriptWriter } from './RecordingScriptWriter.js';
import { EmulateNetworkConditions, NavigationStep } from './Steps.js';

const DOM_BREAKPOINTS = new Set<string>(['Mouse:click', 'Control:change', 'Control:submit']);

declare global {
  interface Window {
    addStep(step: string): void;
  }
}

export class RecordingUpdatedEvent extends Event {
  data: { recording: Recording };

  constructor(recording: Recording) {
    super('recording-updated', {});
    this.data = { recording };
  }
}

export class RecordingSession extends EventTarget implements ProtocolProxyApi.RuntimeDispatcher,
  ProtocolProxyApi.PageDispatcher,
  ProtocolProxyApi.TargetDispatcher {
  private target: SDK.SDKModel.Target;
  private pageAgent: ProtocolProxyApi.PageApi;
  private scriptIdentifier!: Protocol.Page.ScriptIdentifier;
  private runtimeAgent: ProtocolProxyApi.RuntimeApi;
  private frameByExecutionId: Map<number, string>;
  private currentRecording!: Recording;
  private recordingContextIdByFrame: Map<string, number>;
  private mainTargetId: string;
  private mainExecutionContextId!: number;

  constructor(target: SDK.SDKModel.Target) {
    super();

    this.target = target;
    this.pageAgent = target.pageAgent();
    this.runtimeAgent = target.runtimeAgent();
    this.target.registerRuntimeDispatcher(this);
    this.target.registerPageDispatcher(this);
    this.target.registerTargetDispatcher(this);

    this.mainTargetId = this.target.targetInfo()?.targetId || '';

    this.frameByExecutionId = new Map();
    this.recordingContextIdByFrame = new Map();
  }

  async start(): Promise<void> {
    const { identifier } = await this.pageAgent.invoke_addScriptToEvaluateOnNewDocument({
      source: setupRecordingClient.toString() + ';setupRecordingClient();',
      worldName: 'recorder',
    });
    this.scriptIdentifier = identifier;

    await this.runtimeAgent.invoke_addBinding({
      name: 'addStep',
      executionContextName: 'recorder',
    });
    await this.pageAgent.invoke_reload({});

    this.currentRecording = {
      title: 'New Recording',
      description: '',
      sections: [],
    };
    this.dispatchEvent(new RecordingUpdatedEvent(this.currentRecording));
  }

  async stop(): Promise<void> {
    await this.pageAgent.invoke_removeScriptToEvaluateOnNewDocument({ identifier: this.scriptIdentifier });
    await this.runtimeAgent.invoke_removeBinding({ name: 'addStep' });
  }

  async appendStep(step: Step, executionContextId: number): Promise<void> {
    const i = this.currentRecording.sections.length - 1;
    this.currentRecording.sections[i].steps.push(step);
    this.dispatchEvent(new RecordingUpdatedEvent(this.currentRecording));

    if (step.type === 'click') {
      await this.runtimeAgent.invoke_evaluate({
        expression: `((selector) => {
          window._isReplaying = true;
          const element = document.querySelector(selector);
          element.click();
          window._isReplaying = false;
        })(${JSON.stringify(step.selector)})`,
        userGesture: true,
        contextId: executionContextId,
      });
    }
  }

  bindingCalled(params: Protocol.Runtime.BindingCalledEvent): void {
    // const frame = this.frameByExecutionId.get(params.executionContextId);
    const step = JSON.parse(params.payload) as Step;
    this.appendStep(step, params.executionContextId);
  }

  executionContextCreated(params: Protocol.Runtime.ExecutionContextCreatedEvent): void {
    console.log('executionContextCreated', params.context);
    this.frameByExecutionId.set(params.context.id, params.context.auxData.frameId);
    if (params.context.name === 'recorder') {
      this.recordingContextIdByFrame.set(params.context.auxData.frameId, params.context.id);
      this.mainExecutionContextId = params.context.id;
    }
  }

  executionContextDestroyed(params: Protocol.Runtime.ExecutionContextDestroyedEvent): void {
    this.frameByExecutionId.delete(params.executionContextId);
  }

  executionContextsCleared(): void {
    this.frameByExecutionId.clear();
  }

  frameStoppedLoading(params: Protocol.Page.FrameStoppedLoadingEvent): void {
    console.log('frameStoppedLoading', params);
  }

  async loadEventFired(params: Protocol.Page.LoadEventFiredEvent): Promise<void> {
    console.log('loadEventFired', params);

    const result = await this.runtimeAgent.invoke_evaluate({
      expression: 'document.title',
      contextId: this.mainExecutionContextId,
    });

    const section = this.currentRecording.sections[this.currentRecording.sections.length - 1];
    section.title = result.result.value;
    this.dispatchEvent(new RecordingUpdatedEvent(this.currentRecording));

    const { data } = await this.pageAgent.invoke_captureScreenshot({});
    section.screenshot = 'data:image/png;base64, ' + data;
    this.dispatchEvent(new RecordingUpdatedEvent(this.currentRecording));
  }

  async targetInfoChanged(params: Protocol.Target.TargetInfoChangedEvent): Promise<void> {
    console.log('targetInfoChanged', params);
    const section = {
      title: 'New Section',
      url: params.targetInfo.url,
      screenshot: '',
      steps: [],
    };

    this.currentRecording.sections.push(section);
    this.dispatchEvent(new RecordingUpdatedEvent(this.currentRecording));
  }

  consoleAPICalled(params: Protocol.Runtime.ConsoleAPICalledEvent): void {
  }
  exceptionRevoked(params: Protocol.Runtime.ExceptionRevokedEvent): void {
  }
  exceptionThrown(params: Protocol.Runtime.ExceptionThrownEvent): void {
  }
  inspectRequested(params: Protocol.Runtime.InspectRequestedEvent): void {
  }

  domContentEventFired(params: Protocol.Page.DomContentEventFiredEvent): void {
  }
  fileChooserOpened(params: Protocol.Page.FileChooserOpenedEvent): void {
  }
  frameAttached(params: Protocol.Page.FrameAttachedEvent): void {
  }
  frameClearedScheduledNavigation(params: Protocol.Page.FrameClearedScheduledNavigationEvent): void {
  }
  frameDetached(params: Protocol.Page.FrameDetachedEvent): void {
  }
  frameNavigated(params: Protocol.Page.FrameNavigatedEvent): void {
  }
  documentOpened(params: Protocol.Page.DocumentOpenedEvent): void {
  }
  frameResized(): void {
  }
  frameRequestedNavigation(params: Protocol.Page.FrameRequestedNavigationEvent): void {
  }
  frameScheduledNavigation(params: Protocol.Page.FrameScheduledNavigationEvent): void {
  }
  frameStartedLoading(params: Protocol.Page.FrameStartedLoadingEvent): void {
  }
  downloadWillBegin(params: Protocol.Page.DownloadWillBeginEvent): void {
  }
  downloadProgress(params: Protocol.Page.DownloadProgressEvent): void {
  }
  interstitialHidden(): void {
  }
  interstitialShown(): void {
  }
  javascriptDialogClosed(params: Protocol.Page.JavascriptDialogClosedEvent): void {
  }
  javascriptDialogOpening(params: Protocol.Page.JavascriptDialogOpeningEvent): void {
  }
  lifecycleEvent(params: Protocol.Page.LifecycleEventEvent): void {
  }
  navigatedWithinDocument(params: Protocol.Page.NavigatedWithinDocumentEvent): void {
  }
  screencastFrame(params: Protocol.Page.ScreencastFrameEvent): void {
  }
  screencastVisibilityChanged(params: Protocol.Page.ScreencastVisibilityChangedEvent): void {
  }
  windowOpen(params: Protocol.Page.WindowOpenEvent): void {
  }
  compilationCacheProduced(params: Protocol.Page.CompilationCacheProducedEvent): void {
  }

  attachedToTarget(params: Protocol.Target.AttachedToTargetEvent): void {
  }
  detachedFromTarget(params: Protocol.Target.DetachedFromTargetEvent): void {
  }
  receivedMessageFromTarget(params: Protocol.Target.ReceivedMessageFromTargetEvent): void {
  }
  targetCreated(params: Protocol.Target.TargetCreatedEvent): void {
  }
  targetDestroyed(params: Protocol.Target.TargetDestroyedEvent): void {
  }
  targetCrashed(params: Protocol.Target.TargetCrashedEvent): void {
  }
}
