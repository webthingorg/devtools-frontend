// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/* eslint-disable rulesdir/no_underscored_properties */

import * as Common from '../../core/common/common.js';
import * as SDK from '../../core/sdk/sdk.js';
import type * as ProtocolProxyApi from '../../generated/protocol-proxy-api.js';
import type * as Protocol from '../../generated/protocol.js';

import {RecordingEventHandler} from './RecordingEventHandler.js';
import {setupRecordingClient} from './RecordingClient.js';
import type {Condition, Step, StepWithCondition, UserFlow, UserFlowSection} from './Steps.js';
import {createViewportStep} from './Steps.js';
import {createEmulateNetworkConditionsStep} from './Steps.js';

const RECORDER_ISOLATED_WORLD_NAME = 'devtools_recorder';

type RecorderEvent = {
  type: 'windowOpened'|'windowClosed'|'navigation'|'bindingCalled',
  event: Common.EventTarget.EventTargetEvent,
};

export class RecordingSession extends Common.ObjectWrapper.ObjectWrapper {
  _target: SDK.Target.Target;
  _runtimeAgent: ProtocolProxyApi.RuntimeApi;
  _accessibilityAgent: ProtocolProxyApi.AccessibilityApi;
  _pageAgent: ProtocolProxyApi.PageApi;
  _targetAgent: ProtocolProxyApi.TargetApi;
  _networkManager: SDK.NetworkManager.MultitargetNetworkManager;
  _domModel: SDK.DOMModel.DOMModel;
  _resourceTreeModel: SDK.ResourceTreeModel.ResourceTreeModel;
  _runtimeModel: SDK.RuntimeModel.RuntimeModel;
  _childTargetManager: SDK.ChildTargetManager.ChildTargetManager|null;
  _eventHandlers: Map<string, RecordingEventHandler>;
  _targets: Map<string, SDK.Target.Target>;
  _newDocumentScriptIdentifiers: Map<string, string>;
  _indentation: string;
  _eventQueue: Array<RecorderEvent> = [];
  _isProcessingEvent = false;
  userFlow: UserFlow;

  constructor(target: SDK.Target.Target, indentation: string) {
    super();

    this._target = target;
    this._indentation = indentation;

    this._runtimeAgent = target.runtimeAgent();
    this._accessibilityAgent = target.accessibilityAgent();
    this._pageAgent = target.pageAgent();
    this._targetAgent = target.targetAgent();

    this._networkManager = SDK.NetworkManager.MultitargetNetworkManager.instance();
    const domModel = target.model(SDK.DOMModel.DOMModel);
    if (!domModel) {
      throw new Error('DOMModel is missing for the target: ' + target.id());
    }
    this._domModel = domModel;
    const resourceTreeModel = target.model(SDK.ResourceTreeModel.ResourceTreeModel);
    if (!resourceTreeModel) {
      throw new Error('ResourceTreeModel is missing for the target: ' + target.id());
    }
    this._resourceTreeModel = resourceTreeModel;
    const runtimeModel = target.model(SDK.RuntimeModel.RuntimeModel);
    if (!runtimeModel) {
      throw new Error('RuntimeModel is missing for the target: ' + target.id());
    }
    this._runtimeModel = runtimeModel;
    this._childTargetManager = target.model(SDK.ChildTargetManager.ChildTargetManager);

    this._target = target;
    this._eventHandlers = new Map();
    this._targets = new Map();
    this._newDocumentScriptIdentifiers = new Map();

    this.userFlow = {
      title: 'New Recording',
      sections: [],
    };
  }

  async start(): Promise<void> {
    const mainFrame = this._resourceTreeModel.mainFrame;
    if (!mainFrame) {
      throw new Error('Could not find main frame');
    }

    this._networkManager.addEventListener(
        SDK.NetworkManager.MultitargetNetworkManager.Events.ConditionsChanged, this.addNetworkConditionsChangedStep,
        this);

    const {cssVisualViewport} = await this._target.pageAgent().invoke_getLayoutMetrics();

    await this.attachToTarget(this._target);

    const networkConditions = this._networkManager.networkConditions();
    if (networkConditions !== SDK.NetworkManager.NoThrottlingConditions) {
      this.addNetworkConditionsChangedStep();
    }

    await this.appendNewSection(true);
    this.addViewportStep(cssVisualViewport);

    // Focus the target so that events can be captured without additional actions.
    await this._pageAgent.invoke_bringToFront();
  }

  async appendNewSection(includeNetworkConditions: boolean = false): Promise<void> {
    const mainFrame = this._resourceTreeModel.mainFrame;
    if (!mainFrame) {
      throw new Error('Could not find mainFrame.');
    }

    const url = mainFrame.url;
    const title = mainFrame.name;

    const {data: screenshot} = await this._pageAgent.invoke_captureScreenshot({
      captureBeyondViewport: false,
    });

    const section: UserFlowSection = {
      title,
      url,
      screenshot: 'data:image/png;base64,' + screenshot,
      steps: [],
    };

    if (includeNetworkConditions) {
      const networkConditions = this._networkManager.networkConditions();
      if (networkConditions !== SDK.NetworkManager.NoThrottlingConditions) {
        section.networkConditions = networkConditions;
      }
    }
    this.userFlow.sections.push(section);

    this.dispatchEventToListeners('recording-updated', this.userFlow);
  }

  async stop(): Promise<void> {
    for (const target of this._targets.values()) {
      await this.detachFromTarget(target);
    }
    await this.detachFromTarget(this._target);

    this._networkManager.removeEventListener(
        SDK.NetworkManager.MultitargetNetworkManager.Events.ConditionsChanged, this.addNetworkConditionsChangedStep,
        this);
  }

  addViewportStep(viewport: Protocol.Page.VisualViewport): void {
    this.appendStep(createViewportStep(viewport));
  }

  addNetworkConditionsChangedStep(): void {
    const networkConditions = this._networkManager.networkConditions();
    this.appendStep(createEmulateNetworkConditionsStep(networkConditions));
  }

  async appendStep(step: Step): Promise<Step> {
    const currentSection = this.userFlow.sections[this.userFlow.sections.length - 1];
    const lastStep = currentSection.steps[currentSection.steps.length - 1];
    // Scroll events report the absolute scroll position. Therefore, we can merge
    // subsequent scroll events.
    if (lastStep && lastStep.type === 'scroll' && step.type === 'scroll' && step.selector === lastStep.selector) {
      lastStep.x = step.x;
      lastStep.y = step.y;
    } else {
      currentSection.steps.push(step);
    }

    this.dispatchEventToListeners('recording-updated', this.userFlow);
    return step;
  }

  addConditionToStep(step: StepWithCondition, condition: Condition): void {
    step.condition = condition;
    this.dispatchEventToListeners('recording-updated', this.userFlow);
  }

  bindingCalled(event: Common.EventTarget.EventTargetEvent): void {
    this._enqueueEvent({type: 'bindingCalled', event});
  }

  bindingCalledInternal(params: {data: Protocol.Runtime.BindingCalledEvent}): void {
    if (params.data.name !== 'addStep') {
      return;
    }
    const executionContextId = params.data.executionContextId;
    let contextTarget: SDK.Target.Target|undefined;
    let frameId: string|undefined;
    for (const target of this._targets.values()) {
      const runtimeModel = target.model(SDK.RuntimeModel.RuntimeModel);
      if (runtimeModel) {
        for (const context of runtimeModel.executionContexts()) {
          if (context.id === executionContextId) {
            contextTarget = target;
            frameId = context.frameId;
          }
        }
      }
    }
    if (!contextTarget || !frameId) {
      return;
    }

    const eventHandler = this._eventHandlers.get(contextTarget.id());
    if (!eventHandler) {
      return;
    }

    eventHandler.bindingCalled(frameId, JSON.parse(params.data.payload));
  }

  async attachToTarget(target: SDK.Target.Target): Promise<void> {
    if (target.type() !== SDK.Target.Type.Frame) {
      return;
    }
    this._targets.set(target.id(), target);
    const eventHandler = new RecordingEventHandler(this, target);
    this._eventHandlers.set(target.id(), eventHandler);

    const pageAgent = target.pageAgent();

    const runtimeModel = target.model(SDK.RuntimeModel.RuntimeModel) as SDK.RuntimeModel.RuntimeModel;

    await runtimeModel.addBinding({
      name: 'addStep',
      executionContextName: RECORDER_ISOLATED_WORLD_NAME,
    });

    // Enable A11y domain to keep a11y caches alive.
    const a11yModel =
        target.model(SDK.AccessibilityModel.AccessibilityModel) as SDK.AccessibilityModel.AccessibilityModel;
    await a11yModel.resumeModel();

    runtimeModel.addEventListener(SDK.RuntimeModel.Events.BindingCalled, this.bindingCalled, this);

    // TODO(alexrudenko): maybe wire this flag up to DEBUG mode or a setting?
    const debugRecordingClient = false;
    // This setting is set during the test to work around the fact that Puppeteer cannot
    // send trusted change and input events.
    let untrustedRecorderEvents = false;
    try {
      Common.Settings.Settings.instance().settingForTest('untrustedRecorderEvents');
      untrustedRecorderEvents = true;
    } catch {
    }
    const setupEventListeners = setupRecordingClient.toString() +
        `;${setupRecordingClient.name}({getAccessibleName, getAccessibleRole}, ${debugRecordingClient}, ${
                                    untrustedRecorderEvents});`;

    const {identifier} = await pageAgent.invoke_addScriptToEvaluateOnNewDocument(
        {source: setupEventListeners, worldName: RECORDER_ISOLATED_WORLD_NAME, includeCommandLineAPI: true});
    this._newDocumentScriptIdentifiers.set(target.id(), identifier);

    await this.evaluateInAllFrames(target, setupEventListeners);

    const childTargetManager =
        target.model(SDK.ChildTargetManager.ChildTargetManager) as SDK.ChildTargetManager.ChildTargetManager;
    childTargetManager.addEventListener(SDK.ChildTargetManager.Events.TargetCreated, this.receiveWindowOpened, this);
    childTargetManager.addEventListener(SDK.ChildTargetManager.Events.TargetDestroyed, this.receiveWindowClosed, this);
    childTargetManager.addEventListener(SDK.ChildTargetManager.Events.TargetInfoChanged, this.receiveNavigation, this);
    for (const target of childTargetManager.childTargets()) {
      await this.attachToTarget(target);
    }
  }

  async detachFromTarget(target: SDK.Target.Target): Promise<void> {
    const childTargetManager = target.model(SDK.ChildTargetManager.ChildTargetManager);

    if (childTargetManager) {
      childTargetManager.removeEventListener(
          SDK.ChildTargetManager.Events.TargetCreated, this.receiveWindowOpened, this);
      childTargetManager.removeEventListener(
          SDK.ChildTargetManager.Events.TargetDestroyed, this.receiveWindowClosed, this);
      childTargetManager.removeEventListener(
          SDK.ChildTargetManager.Events.TargetInfoChanged, this.receiveNavigation, this);
    }

    // Enable A11y domain to keep a11y caches alive.
    const a11yModel = target.model(SDK.AccessibilityModel.AccessibilityModel);
    if (a11yModel) {
      await a11yModel.resumeModel();
    }

    const newDocumentScriptIdentifier = this._newDocumentScriptIdentifiers.get(target.id());
    if (newDocumentScriptIdentifier) {
      await target.pageAgent().invoke_removeScriptToEvaluateOnNewDocument({identifier: newDocumentScriptIdentifier});
    }

    await target.runtimeAgent().invoke_removeBinding({
      name: 'addStep',
    });

    const runtimeModel = target.model(SDK.RuntimeModel.RuntimeModel);

    if (runtimeModel) {
      runtimeModel.removeEventListener(SDK.RuntimeModel.Events.BindingCalled, this.bindingCalled, this);
    }

    this._eventHandlers.delete(target.id());
  }

  async evaluateInAllFrames(target: SDK.Target.Target, expression: string): Promise<void> {
    const resourceTreeModel =
        target.model(SDK.ResourceTreeModel.ResourceTreeModel) as SDK.ResourceTreeModel.ResourceTreeModel;
    const runtimeModel = target.model(SDK.RuntimeModel.RuntimeModel) as SDK.RuntimeModel.RuntimeModel;
    const executionContexts = runtimeModel.executionContexts();
    for (const frame of resourceTreeModel.frames()) {
      const executionContext = executionContexts.find(context => context.frameId === frame.id);
      if (!executionContext) {
        continue;
      }
      // Note: it would return previously created world if it exists for the frame.
      const world = await target.pageAgent().invoke_createIsolatedWorld({
        frameId: frame.id,
        worldName: RECORDER_ISOLATED_WORLD_NAME,
      });
      await target.runtimeAgent().invoke_evaluate({
        expression,
        includeCommandLineAPI: true,
        contextId: world.executionContextId,
      });
    }
  }

  receiveWindowOpened(event: Common.EventTarget.EventTargetEvent): void {
    this._enqueueEvent({type: 'windowOpened', event});
  }

  receiveWindowClosed(event: Common.EventTarget.EventTargetEvent): void {
    this._enqueueEvent({type: 'windowClosed', event});
  }

  receiveNavigation(event: Common.EventTarget.EventTargetEvent): void {
    this._enqueueEvent({type: 'navigation', event});
  }

  async _enqueueEvent(event: RecorderEvent): Promise<void> {
    this._eventQueue.push(event);
    if (this._isProcessingEvent) {
      return;
    }
    while (this._eventQueue.length) {
      this._isProcessingEvent = true;
      try {
        const item = this._eventQueue.shift();
        if (!item) {
          throw new Error('No event found in the queue');
        }
        switch (item.type) {
          case 'windowClosed':
            await this.handleWindowClosed(item.event);
            break;
          case 'windowOpened':
            await this.handleWindowOpened(item.event);
            break;
          case 'navigation':
            await this.handleNavigation(item.event);
            break;
          case 'bindingCalled':
            this.bindingCalledInternal(item.event);
            break;
        }
      } catch (err) {
        console.error('error happened while processing recording events', err);
      } finally {
        this._isProcessingEvent = false;
      }
    }
  }

  async handleWindowOpened(event: Common.EventTarget.EventTargetEvent): Promise<void> {
    if (event.data.type !== 'page') {
      return;
    }
    const executionContexts = this._runtimeModel.executionContexts();
    const executionContext = executionContexts.find(context => context.frameId === event.data.openerFrameId);
    if (!executionContext) {
      throw new Error('Could not find execution context in opened frame.');
    }

    await this._targetAgent.invoke_attachToTarget({targetId: event.data.targetId, flatten: true});
    const target = SDK.TargetManager.TargetManager.instance().targets().find(t => t.id() === event.data.targetId);

    if (!target) {
      throw new Error('Could not find target.');
    }
    await this.attachToTarget(target);
  }

  async handleWindowClosed(event: Common.EventTarget.EventTargetEvent): Promise<void> {
    const target = this._targets.get(event.data);
    if (!target) {
      return;
    }

    const targetInfo = target.targetInfo();
    if (targetInfo && targetInfo.type !== 'page') {
      return;
    }

    const eventHandler = this._eventHandlers.get(target.id());
    if (!eventHandler) {
      return;
    }
    eventHandler.targetDestroyed();
  }

  async handleNavigation(event: Common.EventTarget.EventTargetEvent): Promise<void> {
    if (event.data.type !== 'page') {
      return;
    }

    // TODO: can we get rid of _resourceTreeModel?
    const targetId = this._resourceTreeModel.mainFrame?.id === event.data.targetId ? 'main' : event.data.targetId;
    const eventHandler = this._eventHandlers.get(targetId);
    if (!eventHandler) {
      return;
    }

    eventHandler.targetInfoChanged(event.data.url);
  }


  getUserFlow(): UserFlow {
    return this.userFlow;
  }
}
