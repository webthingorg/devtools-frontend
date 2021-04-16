// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as SDK from '../../core/sdk/sdk.js';
import * as puppeteer from '../../third_party/puppeteer/puppeteer.js';

import { ClickStep, NavigationStep, Step } from "./Steps.js";

class Transport {
  private connection: SDK.Connections.ParallelConnection;
  private knownIds = new Set<number>();
  private knownTargets = new Set<string>();

  constructor(connection: SDK.Connections.ParallelConnection) {
    this.connection = connection;
  }

  send(string: string): void {
    const message = JSON.parse(string);
    this.knownIds.add(message.id);
    this.connection.sendRawMessage(string);
  }

  close(): void {
    this.connection.disconnect();
  }

  set onmessage(cb: (message: string) => void) {
    this.connection.setOnMessage((message: Object) => {
      const data = (message) as { id: number, method: string, params: any, sessionId?: string };
      if (data.id && !this.knownIds.has(data.id)) {
        return;
      }
      this.knownIds.delete(data.id);

      if (data.method === 'Target.targetCreated') {
        this.knownTargets.add(data.params.targetInfo.targetId);
      } else if (data.method === 'Target.targetInfoChanged') {
        if (!this.knownTargets.has(data.params.targetId)) {
          // This target is not known to puppeteer - skip passing information
          return;
        }
      } else if (data.method === 'Target.targetDestroyed') {
        if (!this.knownTargets.has(data.params.targetId)) {
          // This target is not known to puppeteer - skip passing information
          return;
        }
        this.knownTargets.delete(data.params.targetId);
      }
      if (!data.sessionId) {
        return;
      }
      if (data.sessionId === this.connection._sessionId) {
        delete data.sessionId;
      }
      cb(JSON.stringify(data));
    });
  }

  set onclose(cb: () => void) {
    const prev = this.connection._onDisconnect;
    this.connection.setOnDisconnect(reason => {
      if (prev) {
        prev(reason);
      }
      cb();
    });
  }
}

export class RecordingPlayer {
  recording: Step[];

  constructor(recording: Step[]) {
    this.recording = recording;
  }

  async play(): Promise<void> {
    await SDK.SDKModel.TargetManager.instance().suspendAllTargets();
    const { page, connection } = await this.getPuppeteerConnectionToCurrentPage();
    if (!page) {
      throw new Error('could not find main page!');
    }

    try {
      page.setDefaultTimeout(5000);

      for (const step of this.recording) {
        await this.step(page, step);
      }
    } catch (err) {
      console.error('ERROR', err);
    } finally {
      await connection.disconnect();
      await SDK.SDKModel.TargetManager.instance().resumeAllTargets();
    }
  }

  async step(page: puppeteer.Page, step: Step): Promise<void> {

    if (step instanceof NavigationStep) {
      console.log('NavigationStep', step.url);
      await page.goto(step.url);
    } else if (step instanceof ClickStep) {
      console.log('ClickStep', step.selector);
      await page.click(step.selector);
    } else {
      throw new Error('Unknown action: ' + step.action);
    }
  }

  private async getPuppeteerConnectionToCurrentPage(): Promise<{ page: puppeteer.Page | null, connection: SDK.Connections.ParallelConnection }> {
    const mainTarget = SDK.SDKModel.TargetManager.instance().mainTarget();
    if (!mainTarget) {
      throw new Error('Could not find main target');
    }
    const childTargetManager = mainTarget.model(SDK.ChildTargetManager.ChildTargetManager);
    if (!childTargetManager) {
      throw new Error('Could not get childTargetManager');
    }
    // Pass an empty message handler because it will be overwritten by puppeteer anyways.
    const rawConnection = await childTargetManager.createParallelConnection(() => { }) as SDK.Connections.ParallelConnection;

    const transport = new Transport(rawConnection);

    // url is an empty string in this case parallel to:
    // https://github.com/puppeteer/puppeteer/blob/f63a123ecef86693e6457b07437a96f108f3e3c5/src/common/BrowserConnector.ts#L72
    const connection = new puppeteer.Connection('', transport);
    const browser = await puppeteer.Browser.create(connection, [], false);

    // @ts-ignore
    const resourceTreeModel = mainTarget.model(SDK.ResourceTreeModel.ResourceTreeModel);
    if (!resourceTreeModel) {
      throw new Error('Could not get resource tree model');
    }
    const mainFrame = resourceTreeModel.mainFrame;

    if (!mainFrame) {
      throw new Error('Could not find main frame');
    }

    const page = await browser.pages().then(pages => pages.find(p => p.mainFrame()._id === mainFrame.id) || null);

    return { page, connection: rawConnection };
  }
}
