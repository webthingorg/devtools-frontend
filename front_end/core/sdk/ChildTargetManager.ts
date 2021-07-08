// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.


import * as Common from '../common/common.js';
import * as Host from '../host/host.js';
import type * as ProtocolClient from '../protocol_client/protocol_client.js'; // eslint-disable-line no-unused-vars
import type * as ProtocolProxyApi from '../../generated/protocol-proxy-api.js';
import type * as Protocol from '../../generated/protocol.js';

import {ParallelConnection} from './Connections.js';
import type {Target} from './Target.js';
import {Capability, Type} from './Target.js';
import {SDKModel} from './SDKModel.js';
import {Events as TargetManagerEvents, TargetManager} from './TargetManager.js';

// TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration
// eslint-disable-next-line @typescript-eslint/naming-convention
let _lastAnonymousTargetId = 0;

// TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration
// eslint-disable-next-line @typescript-eslint/naming-convention
let _attachCallback: ((arg0: {
                        target: Target,
                        waitingForDebugger: boolean,
                      }) => Promise<void>)|undefined;

export class ChildTargetManager extends SDKModel implements ProtocolProxyApi.TargetDispatcher {
  private readonly targetManager: TargetManager;
  private parentTarget: Target;
  private readonly targetAgent: ProtocolProxyApi.TargetApi;
  private readonly targetInfosInternal: Map<string, Protocol.Target.TargetInfo>;
  private readonly childTargetsInternal: Map<string, Target>;
  private readonly parallelConnections: Map<string, ProtocolClient.InspectorBackend.Connection>;
  private parentTargetId: string|null;

  constructor(parentTarget: Target) {
    super(parentTarget);
    this.targetManager = parentTarget.targetManager();
    this.parentTarget = parentTarget;
    this.targetAgent = parentTarget.targetAgent();
    this.targetInfosInternal = new Map();

    this.childTargetsInternal = new Map();

    this.parallelConnections = new Map();

    this.parentTargetId = null;

    parentTarget.registerTargetDispatcher(this);
    this.targetAgent.invoke_setAutoAttach({autoAttach: true, waitForDebuggerOnStart: true, flatten: true});

    if (!parentTarget.parentTarget() && !Host.InspectorFrontendHost.isUnderTest()) {
      this.targetAgent.invoke_setDiscoverTargets({discover: true});
      this.targetAgent.invoke_setRemoteLocations({locations: [{host: 'localhost', port: 9229}]});
    }
  }

  static install(attachCallback?: ((arg0: {
                                     target: Target,
                                     waitingForDebugger: boolean,
                                   }) => Promise<void>)): void {
    _attachCallback = attachCallback;
    SDKModel.register(ChildTargetManager, {capabilities: Capability.Target, autostart: true});
  }

  childTargets(): Target[] {
    return Array.from(this.childTargetsInternal.values());
  }

  async suspendModel(): Promise<void> {
    await this.targetAgent.invoke_setAutoAttach({autoAttach: true, waitForDebuggerOnStart: false, flatten: true});
  }

  async resumeModel(): Promise<void> {
    await this.targetAgent.invoke_setAutoAttach({autoAttach: true, waitForDebuggerOnStart: true, flatten: true});
  }

  dispose(): void {
    for (const sessionId of this.childTargetsInternal.keys()) {
      this.detachedFromTarget({sessionId, targetId: undefined});
    }
  }

  targetCreated({targetInfo}: Protocol.Target.TargetCreatedEvent): void {
    this.targetInfosInternal.set(targetInfo.targetId, targetInfo);
    this.fireAvailableTargetsChanged();
    this.dispatchEventToListeners(Events.TargetCreated, targetInfo);
  }

  targetInfoChanged({targetInfo}: Protocol.Target.TargetInfoChangedEvent): void {
    this.targetInfosInternal.set(targetInfo.targetId, targetInfo);
    const target = this.childTargetsInternal.get(targetInfo.targetId);
    if (target) {
      target.updateTargetInfo(targetInfo);
    }
    this.fireAvailableTargetsChanged();
    this.dispatchEventToListeners(Events.TargetInfoChanged, targetInfo);
  }

  targetDestroyed({targetId}: Protocol.Target.TargetDestroyedEvent): void {
    this.targetInfosInternal.delete(targetId);
    this.fireAvailableTargetsChanged();
    this.dispatchEventToListeners(Events.TargetDestroyed, targetId);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  targetCrashed({targetId, status, errorCode}: Protocol.Target.TargetCrashedEvent): void {
  }

  private fireAvailableTargetsChanged(): void {
    TargetManager.instance().dispatchEventToListeners(
        TargetManagerEvents.AvailableTargetsChanged, [...this.targetInfosInternal.values()]);
  }

  private async getParentTargetId(): Promise<string> {
    if (!this.parentTargetId) {
      this.parentTargetId = (await this.parentTarget.targetAgent().invoke_getTargetInfo({})).targetInfo.targetId;
    }
    return this.parentTargetId;
  }

  attachedToTarget({sessionId, targetInfo, waitingForDebugger}: Protocol.Target.AttachedToTargetEvent): void {
    if (this.parentTargetId === targetInfo.targetId) {
      return;
    }

    let targetName = '';
    if (targetInfo.type === 'worker' && targetInfo.title && targetInfo.title !== targetInfo.url) {
      targetName = targetInfo.title;
    } else if (targetInfo.type !== 'iframe') {
      const parsedURL = Common.ParsedURL.ParsedURL.fromString(targetInfo.url);
      targetName = parsedURL ? parsedURL.lastPathComponentWithFragment() : '#' + (++_lastAnonymousTargetId);
    }

    let type = Type.Browser;
    if (targetInfo.type === 'iframe') {
      type = Type.Frame;
    }
    // TODO(lfg): ensure proper capabilities for child pages (e.g. portals).
    else if (targetInfo.type === 'page') {
      type = Type.Frame;
    } else if (targetInfo.type === 'worker') {
      type = Type.Worker;
    } else if (targetInfo.type === 'service_worker') {
      type = Type.ServiceWorker;
    }

    const target = this.targetManager.createTarget(
        targetInfo.targetId, targetName, type, this.parentTarget, sessionId, undefined, undefined, targetInfo);
    this.childTargetsInternal.set(sessionId, target);

    if (_attachCallback) {
      _attachCallback({target, waitingForDebugger}).then(() => {
        target.runtimeAgent().invoke_runIfWaitingForDebugger();
      });
    } else {
      target.runtimeAgent().invoke_runIfWaitingForDebugger();
    }
  }

  detachedFromTarget({sessionId}: Protocol.Target.DetachedFromTargetEvent): void {
    if (this.parallelConnections.has(sessionId)) {
      this.parallelConnections.delete(sessionId);
    } else {
      const session = this.childTargetsInternal.get(sessionId);
      if (session) {
        session.dispose('target terminated');
        this.childTargetsInternal.delete(sessionId);
      }
    }
  }

  receivedMessageFromTarget({}: Protocol.Target.ReceivedMessageFromTargetEvent): void {
    // We use flatten protocol.
  }

  async createParallelConnection(onMessage: (arg0: (Object|string)) => void):
      Promise<ProtocolClient.InspectorBackend.Connection> {
    // The main Target id is actually just `main`, instead of the real targetId.
    // Get the real id (requires an async operation) so that it can be used synchronously later.
    const targetId = await this.getParentTargetId();
    const {connection, sessionId} = await this.createParallelConnectionAndSessionForTarget(this.parentTarget, targetId);
    connection.setOnMessage(onMessage);
    this.parallelConnections.set(sessionId, connection);
    return connection;
  }

  private async createParallelConnectionAndSessionForTarget(target: Target, targetId: string): Promise<{
    connection: ProtocolClient.InspectorBackend.Connection,
    sessionId: string,
  }> {
    const targetAgent = target.targetAgent();
    const targetRouter = (target.router() as ProtocolClient.InspectorBackend.SessionRouter);
    const sessionId = (await targetAgent.invoke_attachToTarget({targetId, flatten: true})).sessionId;
    const connection = new ParallelConnection(targetRouter.connection(), sessionId);
    targetRouter.registerSession(target, sessionId, connection);
    connection.setOnDisconnect(() => {
      targetRouter.unregisterSession(sessionId);
      targetAgent.invoke_detachFromTarget({sessionId});
    });
    return {connection, sessionId};
  }

  targetInfos(): Protocol.Target.TargetInfo[] {
    return Array.from(this.targetInfosInternal.values());
  }
}

// TODO(crbug.com/1167717): Make this a const enum again
// eslint-disable-next-line rulesdir/const_enum
export enum Events {
  TargetCreated = 'TargetCreated',
  TargetDestroyed = 'TargetDestroyed',
  TargetInfoChanged = 'TargetInfoChanged',
}
