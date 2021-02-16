// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/* eslint-disable rulesdir/no_underscored_properties */

import * as Common from '../common/common.js';
import * as ProtocolClient from '../protocol_client/protocol_client.js';  // eslint-disable-line no-unused-vars
import * as SDK from '../sdk/sdk.js';

import * as ReportRenderer from './LighthouseReporterTypes.js';  // eslint-disable-line no-unused-vars

let lastId = 1;

export class ProtocolService extends Common.ObjectWrapper.ObjectWrapper {
  _rawConnection: ProtocolClient.InspectorBackend.Connection|null;
  _backend: Promise<Worker>|null;
  _status: ((arg0: string) => void)|null;

  constructor() {
    super();
    this._rawConnection = null;
    this._backend = null;
    this._status = null;
  }

  async attach(): Promise<void> {
    await SDK.SDKModel.TargetManager.instance().suspendAllTargets();
    const mainTarget = SDK.SDKModel.TargetManager.instance().mainTarget();
    if (!mainTarget) {
      throw new Error('Unable to find main target required for LightHouse');
    }
    const childTargetManager = mainTarget.model(SDK.ChildTargetManager.ChildTargetManager);
    if (!childTargetManager) {
      throw new Error('Unable to find child target manager required for LightHouse');
    }
    this._rawConnection = await childTargetManager.createParallelConnection(message => {
      if (typeof message === 'string') {
        message = JSON.parse(message);
      }
      this._dispatchProtocolMessage(message);
    });
  }

  getLocales(): readonly string[] {
    return navigator.languages;
  }

  startLighthouse(auditURL: string, categoryIDs: string[], flags: Object): Promise<ReportRenderer.RunnerResult> {
    const locales = this.getLocales();
    return this._send('start', {url: auditURL, categoryIDs, flags, locales});
  }

  async detach(): Promise<void> {
    if (this._rawConnection) {
      await this._rawConnection.disconnect();
      this._rawConnection = null;
    }
    console.log('connection disconnected');
    await SDK.SDKModel.TargetManager.instance().resumeAllTargets();
  }

  registerStatusCallback(callback: (arg0: string) => void): void {
    this._status = callback;
  }

  _dispatchProtocolMessage(message: Object): void {
    // A message without a sessionId is the main session of the main target (call it "Main session").
    // A parallel connection and session was made that connects to the same main target (call it "Lighthouse session").
    // Messages from the "Lighthouse session" have a sessionId.
    // Without some care, there is a risk of sending the same events for the same main frame to Lighthouse–the backend
    // will create events for the "Main session" and the "Lighthouse session".
    // The workaround–only send message to Lighthouse if:
    //   * the message has a sessionId (is not for the "Main session")
    //   * the message does not have a sessionId (is for the "Main session"), but only for the Target domain
    //     (to kickstart autoAttach in LH).
    const protocolMessage = message as {
      sessionId?: string,
      method?: string,
    };
    if (protocolMessage.sessionId || (protocolMessage.method && protocolMessage.method.startsWith('Target'))) {
      this._send('dispatchProtocolMessage', {message: JSON.stringify(message)});
    }
  }

  _initWorker(): Promise<Worker> {
    this._backend = new Promise<Worker>(resolve => {
      const worker = new Worker(new URL('../lighthouse_worker.js', import.meta.url), {type: 'module'});

      worker.onmessage = event => {
        if (event.data === 'workerReady') {
          resolve(worker);
          return;
        }

        const lighthouseMessage = JSON.parse(event.data);

        if (lighthouseMessage.method === 'statusUpdate') {
          if (this._status && lighthouseMessage.params && 'message' in lighthouseMessage.params) {
            this._status(lighthouseMessage.params.message as string);
          }
        } else if (lighthouseMessage.method === 'sendProtocolMessage') {
          if (lighthouseMessage.params && 'message' in lighthouseMessage.params) {
            this._sendProtocolMessage(lighthouseMessage.params.message as string);
          }
        }
      };
    });
    return this._backend;
  }

  _sendProtocolMessage(message: string): void {
    if (this._rawConnection) {
      this._rawConnection.sendRawMessage(message);
    }
  }

  async _send(method: string, params: {[x: string]: string|string[]|Object} = {}):
      Promise<ReportRenderer.RunnerResult> {
    let worker: Worker;
    if (!this._backend) {
      worker = await this._initWorker();
    } else {
      worker = await this._backend;
    }
    console.log('Sending from frontend to worker', method, params);
    const messageId = lastId++;
    const messageResult = new Promise<ReportRenderer.RunnerResult>(resolve => {
      const workerListener = (event: MessageEvent) => {
        const lighthouseMessage = JSON.parse(event.data);

        if (lighthouseMessage.id === messageId) {
          worker.removeEventListener('message', workerListener);
          console.log(lighthouseMessage.result);
          resolve(lighthouseMessage.result);
        }
      };
      worker.addEventListener('message', workerListener);
    });
    worker.postMessage(JSON.stringify({id: messageId, method, params: {...params, id: messageId}}));

    return messageResult;
  }
}
