// Copyright (c) 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as puppeteer from '../../third_party/puppeteer/puppeteer.js';
import type * as Protocol from '../../generated/protocol.js';
import type * as SDK from '../../core/sdk/sdk.js';

export class Transport implements puppeteer.ConnectionTransport {
  #connection: SDK.Connections.ParallelConnectionInterface;
  #knownIds = new Set<number>();

  constructor(connection: SDK.Connections.ParallelConnectionInterface) {
    this.#connection = connection;
  }

  send(data: string): void {
    const message = JSON.parse(data);
    this.#knownIds.add(message.id);
    this.#connection.sendRawMessage(data);
  }

  close(): void {
    void this.#connection.disconnect();
  }

  set onmessage(cb: (message: string) => void) {
    this.#connection.setOnMessage((message: Object) => {
      const data = (message) as {id: number, method: string, params: unknown, sessionId?: string};
      if (data.id && !this.#knownIds.has(data.id)) {
        return;
      }
      this.#knownIds.delete(data.id);
      if (!data.sessionId) {
        return;
      }
      return cb(JSON.stringify({
        ...data,
        sessionId: data.sessionId === this.#connection.getSessionId() ? undefined : data.sessionId,
      }));
    });
  }

  set onclose(cb: () => void) {
    const prev = this.#connection.getOnDisconnect();
    this.#connection.setOnDisconnect(reason => {
      if (prev) {
        prev(reason);
      }
      if (cb) {
        cb();
      }
    });
  }
}

export class PuppeteerConnection extends puppeteer.Connection {
  override async onMessage(message: string): Promise<void> {
    const msgObj = JSON.parse(message) as {id: number, method: string, params: unknown, sessionId?: string};
    if (msgObj.sessionId && !this._sessions.has(msgObj.sessionId)) {
      return;
    }
    void super.onMessage(message);
  }
}

export function shouldAttachToTarget(mainTargetId: string, targetInfo: Protocol.Target.TargetInfo): boolean {
  // Ignore chrome extensions as we don't support them. This includes DevTools extensions.
  if (targetInfo.url.startsWith('chrome-extension://')) {
    return false;
  }
  // Allow DevTools-on-DevTools replay.
  if (targetInfo.url.startsWith('devtools://') && targetInfo.targetId === mainTargetId) {
    return true;
  }
  if (targetInfo.type !== 'page' && targetInfo.type !== 'iframe') {
    return false;
  }
  // TODO only connect to iframes that are related to the main target. This requires refactoring in Puppeteer: https://github.com/puppeteer/puppeteer/issues/3667.
  return targetInfo.targetId === mainTargetId || targetInfo.openerId === mainTargetId || targetInfo.type === 'iframe';
}

function isPageTarget(target: Protocol.Target.TargetInfo): boolean {
  // Treat DevTools targets as page targets too.
  return target.url.startsWith('devtools://') || target.type === 'page' || target.type === 'background_page' ||
      target.type === 'webview';
}

export class PuppeteerConnectionHelper {
  static async getPuppeteerConnection(
      connection: SDK.Connections.ParallelConnectionInterface,
      mainFrameId: string,
      mainTargetId: string,
      targetInfos: Protocol.Target.TargetInfo[],
      ): Promise<{
    page: puppeteer.Page | null,
    browser: puppeteer.Browser,
  }> {
    // Pass an empty message handler because it will be overwritten by puppeteer anyways.
    const transport = new Transport(connection);

    // url is an empty string in this case parallel to:
    // https://github.com/puppeteer/puppeteer/blob/f63a123ecef86693e6457b07437a96f108f3e3c5/src/common/BrowserConnector.ts#L72
    const puppeteerConnection = new PuppeteerConnection('', transport);
    const targetIdsForAutoAttachEmulation =
        targetInfos.filter(shouldAttachToTarget.bind(null, mainTargetId)).map(t => t.targetId);

    const browserPromise = puppeteer.Browser._create(
        'chrome', puppeteerConnection, [], false, undefined, undefined, undefined,
        shouldAttachToTarget.bind(null, mainTargetId), isPageTarget);

    const [, browser] = await Promise.all([
      Promise.all(targetIdsForAutoAttachEmulation.map(
          targetId => puppeteerConnection._createSession({targetId}, /* emulateAutoAttach= */ true))),
      browserPromise,
    ]);

    browser.on('targetdiscovered', (targetInfo: Protocol.Target.TargetInfo) => {
      // Pop-ups opened by the main target won't be auto-attached. Therefore,
      // we need to create a session for them explicitly. We user openedId
      // and type to classify a target as requiring a session.
      if (targetInfo.type !== 'page') {
        return;
      }
      if (targetInfo.targetId === mainTargetId) {
        return;
      }
      if (targetInfo.openerId !== mainTargetId) {
        return;
      }
      void puppeteerConnection._createSession(targetInfo, /* emulateAutoAttach= */ true);
    });

    // TODO: replace this with browser.pages() once the Puppeteer version is rolled.
    const pages =
        await Promise.all(browser.browserContexts()
                              .map(ctx => ctx.targets())
                              .flat()
                              .filter(target => target.type() === 'page' || target.url().startsWith('devtools://'))
                              .map(target => target.page()));
    const page =
        pages.filter((p): p is puppeteer.Page => p !== null).find(p => p.mainFrame()._id === mainFrameId) || null;

    return {page, browser};
  }
}
