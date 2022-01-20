// Copyright (c) 2016 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Root from '../../core/root/root.js';
import * as puppeteer from '../../third_party/puppeteer/puppeteer.js';
import type * as Protocol from '../../generated/protocol.js';

let mainTargetId: string|undefined;
let mainFrameId: string|undefined;
let mainSessionId: string|undefined;

function disableLoggingForTest(): void {
  console.log = (): void => undefined;  // eslint-disable-line no-console
}

/**
 * Any message that comes back from Lighthouse has to go via a so-called "port".
 * This class holds the relevant callbacks that Lighthouse provides and that
 * can be called in the onmessage callback of the worker, so that the frontend
 * can communicate to Lighthouse. Lighthouse itself communicates to the frontend
 * via status updates defined below.
 */
class LighthousePort {
  onMessage?: (message: string) => void;
  onClose?: () => void;
  on(eventName: string, callback: (arg?: string) => void): void {
    if (eventName === 'message') {
      this.onMessage = callback;
    } else if (eventName === 'close') {
      this.onClose = callback;
    }
  }

  send(message: string): void {
    notifyFrontendViaWorkerMessage('sendProtocolMessage', {message});
  }
  close(): void {
  }
}

class Transport implements puppeteer.ConnectionTransport {
  onMessageInternal?: (message: string) => void;

  onclose?: () => void;

  knownIds = new Set<number>();

  // Puppeteer doesn't know about the session we establish in LighthouseProtocolService.
  // If we encounter that session id, replace it with undefined so puppeteer can respond.
  set onmessage(cb: ((message: string) => void) | undefined) {
    if (!cb) {
      this.onMessageInternal = undefined;
    } else {
      this.onMessageInternal = (message: string): void => {
        const data = JSON.parse(message) as {id: number, method: string, params: unknown, sessionId?: string};
        if (data.id && !this.knownIds.has(data.id)) {
          return;
        }
        this.knownIds.delete(data.id);
        if (!data.sessionId) {
          return;
        }
        data.sessionId = data.sessionId === mainSessionId ? undefined : data.sessionId;
        message = JSON.stringify(data);
        cb(message);
      };
    }
  }
  get onmessage(): ((message: string) => void) | undefined {
    return this.onMessageInternal;
  }

  send(message: string): void {
    const data = JSON.parse(message);
    this.knownIds.add(data.id);
    data.sessionId = data.sessionId === undefined ? mainSessionId : data.sessionId;
    message = JSON.stringify(data);
    notifyFrontendViaWorkerMessage('sendProtocolMessage', {message});
  }
  close(): void {
  }
}

const port = new LighthousePort();
const transport = new Transport();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function start(params: any): Promise<unknown> {
  if (Root.Runtime.Runtime.queryParam('isUnderTest')) {
    disableLoggingForTest();
    params.flags.maxWaitForLoad = 2 * 1000;
  }

  // @ts-expect-error https://github.com/GoogleChrome/lighthouse/issues/11628
  self.listenForStatus(message => {
    notifyFrontendViaWorkerMessage('statusUpdate', {message: message[1]});
  });

  try {
    const locale = await fetchLocaleData(params.locales);
    const flags = params.flags;
    flags.logLevel = flags.logLevel || 'info';
    flags.channel = 'devtools';
    flags.locale = locale;

    // @ts-ignore https://github.com/GoogleChrome/lighthouse/issues/11628
    // const connection = self.setUpWorkerConnection(port);
    // @ts-expect-error https://github.com/GoogleChrome/lighthouse/issues/11628
    const config = self.createConfig(params.categoryIDs, flags.emulatedFormFactor);
    const url = params.url;
    const page = await getPuppeteerConnection();

    // @ts-ignore https://github.com/GoogleChrome/lighthouse/issues/11628
    // return await self.runLighthouse(url, flags, config, connection);
    return await self.lhNavigation({
      url,
      config,
      page,
    });
  } catch (err) {
    console.error(err);
    return ({
      fatal: true,
      message: err.message,
      stack: err.stack,
    });
  }
}

/**
 * Finds a locale supported by Lighthouse from the user's system locales.
 * If no matching locale is found, or if fetching locale data fails, this function returns nothing
 * and Lighthouse will use `en-US` by default.
 */
async function fetchLocaleData(locales: string[]): Promise<string|void> {
  // @ts-expect-error https://github.com/GoogleChrome/lighthouse/issues/11628
  const locale = self.lookupLocale(locales);

  // If the locale is en-US, no need to fetch locale data.
  if (locale === 'en-US' || locale === 'en') {
    return;
  }

  // Try to load the locale data.
  try {
    const remoteBase = Root.Runtime.getRemoteBase();
    let localeUrl: string;
    if (remoteBase && remoteBase.base) {
      localeUrl = `${remoteBase.base}third_party/lighthouse/locales/${locale}.json`;
    } else {
      localeUrl = new URL(`../../third_party/lighthouse/locales/${locale}.json`, import.meta.url).toString();
    }

    const timeoutPromise = new Promise<string>(
        (resolve, reject) => setTimeout(() => reject(new Error('timed out fetching locale')), 5000));
    const localeData = await Promise.race([timeoutPromise, fetch(localeUrl).then(result => result.json())]);
    // @ts-expect-error https://github.com/GoogleChrome/lighthouse/issues/11628
    self.registerLocaleData(locale, localeData);
    return locale;
  } catch (err) {
    console.error(err);
  }

  return;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function notifyFrontendViaWorkerMessage(method: string, params: any): void {
  self.postMessage(JSON.stringify({method, params}));
}

self.onmessage = async(event: MessageEvent): Promise<void> => {
  const messageFromFrontend = JSON.parse(event.data);
  if (messageFromFrontend.method === 'start') {
    const result = await start(messageFromFrontend.params);
    self.postMessage(JSON.stringify({id: messageFromFrontend.id, result}));
  } else if (messageFromFrontend.method === 'dispatchProtocolMessage') {
    transport.onmessage?.(messageFromFrontend.params.message);
    port.onMessage?.(messageFromFrontend.params.message);
  } else if (messageFromFrontend.method === 'info') {
    mainTargetId = messageFromFrontend.params.mainTargetId;
    mainFrameId = messageFromFrontend.params.mainFrameId;
    mainSessionId = messageFromFrontend.params.mainSessionId;
  } else {
    throw new Error(`Unknown event: ${event.data}`);
  }
};

export class PuppeteerConnection extends puppeteer.Connection {
  // Overriding Puppeteer's API here.
  // eslint-disable-next-line rulesdir/no_underscored_properties
  async _onMessage(message: string): Promise<void> {
    const msgObj = JSON.parse(message) as {id: number, method: string, params: unknown, sessionId?: string};
    if (msgObj.sessionId && !this._sessions.has(msgObj.sessionId)) {
      return;
    }
    void super._onMessage(message);
  }
}

async function getPuppeteerConnection(): Promise<puppeteer.Page|null> {
  if (!mainFrameId || !mainTargetId) {
    throw new Error('Could not identify target for Lighthouse');
  }
  // url is an empty string in this case parallel to:
  // https://github.com/puppeteer/puppeteer/blob/f63a123ecef86693e6457b07437a96f108f3e3c5/src/common/BrowserConnector.ts#L72
  const connection = new PuppeteerConnection('', transport);
  const browser = await puppeteer.Browser.create(
    connection, [], false, undefined, undefined, undefined,
    (targetInfo: Protocol.Target.TargetInfo) => {
      if (targetInfo.type !== 'page' && targetInfo.type !== 'iframe') {
        return false;
      }
      return targetInfo.targetId === mainTargetId ||
        targetInfo.openerId === mainTargetId ||
        targetInfo.type === 'iframe';
    },
  );
  return await browser.pages().then(pages => pages.find(p => p.mainFrame()._id === mainFrameId) || null);
}

// Make lighthouse and traceviewer happy.
// @ts-ignore https://github.com/GoogleChrome/lighthouse/issues/11628
globalThis.global = self;
// @ts-expect-error https://github.com/GoogleChrome/lighthouse/issues/11628
globalThis.global.isVinn = true;
// @ts-expect-error https://github.com/GoogleChrome/lighthouse/issues/11628
globalThis.global.document = {};
// @ts-expect-error https://github.com/GoogleChrome/lighthouse/issues/11628
globalThis.global.document.documentElement = {};
// @ts-expect-error https://github.com/GoogleChrome/lighthouse/issues/11628
globalThis.global.document.documentElement.style = {
  WebkitAppearance: 'WebkitAppearance',
};
