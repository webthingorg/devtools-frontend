// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {PrivateAPI} from './ExtensionAPI.js';
import {RecorderPluginManager} from './RecorderPluginManager.js';

export class RecorderExtensionEndpoint {
  private readonly port: MessagePort;
  private readonly name: string;
  private nextRequestId: number = 0;
  private pendingRequests: Map<number, {
    resolve: (arg: unknown) => void,
    reject: (error: Error) => void,
  }>;

  constructor(name: string, port: MessagePort) {
    this.name = name;
    this.port = port;
    this.port.onmessage = this.onResponse.bind(this);
    this.pendingRequests = new Map();
  }

  getName(): string {
    return this.name;
  }

  private sendRequest<ReturnType>(method: string, parameters: unknown): Promise<ReturnType> {
    return new Promise((resolve, reject) => {
      const requestId = this.nextRequestId++;
      this.pendingRequests.set(requestId, {resolve: resolve as (arg: unknown) => void, reject});
      this.port.postMessage({requestId, method, parameters});
    });
  }

  private onResponse({data}: MessageEvent<{
    requestId: number,
    result: unknown,
    error: Error|null,
  }|{
    event: string,
  }>): void {
    if ('event' in data) {
      const {event} = data;
      switch (event) {
        case PrivateAPI.RecorderExtensionPluginEvents.UnregisteredRecorderExtensionPlugin: {
          for (const {reject} of this.pendingRequests.values()) {
            reject(new Error('Recorder extension endpoint disconnected'));
          }
          this.pendingRequests.clear();
          this.port.close();
          RecorderPluginManager.instance().removePlugin(this);
          break;
        }
      }
      return;
    }
    const {requestId, result, error} = data;
    const pendingRequest = this.pendingRequests.get(requestId);
    if (!pendingRequest) {
      console.error(`No pending request ${requestId}`);
      return;
    }
    this.pendingRequests.delete(requestId);
    if (error) {
      pendingRequest.reject(new Error(error.message));
    } else {
      pendingRequest.resolve(result);
    }
  }

  /**
   * In practice, `recording` is a UserFlow[1], but we avoid defining this type on the
   * API in order to prevent dependencies between Chrome and puppeteer. Extensions
   * are responsible for working out potential compatibility issues.
   *
   * [1]: https://github.com/puppeteer/replay/blob/main/src/Schema.ts#L245
   */
  stringify(recording: Object): Promise<string> {
    return this.sendRequest(PrivateAPI.RecorderExtensionPluginCommands.Stringify, {recording});
  }
}
