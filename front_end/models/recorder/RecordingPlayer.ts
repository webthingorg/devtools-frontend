// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/* eslint-disable no-console */

import * as SDK from '../../core/sdk/sdk.js';
import * as puppeteer from '../../third_party/puppeteer/puppeteer.js';
import {WaitForNavigationCondition} from './Conditions.js';
import {getPuppeteerConnection as getPuppeteerConnectionToCurrentPage} from './PuppeteerConnection.js';

import {ChangeStep, ClickStep, NavigationStep, Step, StepFrameContext, StepWithContext, SubmitStep} from './Steps.js';

export class RecordingPlayer {
  recording: Step[];

  constructor(recording: Step[]) {
    this.recording = recording;
  }

  debugTargets(): void {
    const mainTarget = SDK.SDKModel.TargetManager.instance().mainTarget();
    if (!mainTarget) {
      throw new Error('Could not find main target');
    }
    const childTargetManager = mainTarget.model(SDK.ChildTargetManager.ChildTargetManager);
    if (!childTargetManager) {
      throw new Error('Could not get childTargetManager');
    }

    function printTargets(target: SDK.SDKModel.Target, indentation: string): void {
      console.log(indentation, target.id(), target._sessionId, target.targetInfo()?.url);

      const childTargetManager = target.model(SDK.ChildTargetManager.ChildTargetManager);
      if (!childTargetManager) {
        throw new Error('Could not get childTargetManager');
      }

      const targets = childTargetManager.childTargets();
      for (const target of targets) {
        printTargets(target, indentation + '  ');
      }
    }

    printTargets(mainTarget, '');
  }

  async play(): Promise<void> {
    console.log('play');
    await SDK.SDKModel.TargetManager.instance().suspendAllTargets();

    const {page, browser} = await getPuppeteerConnectionToCurrentPage();
    if (!page) {
      throw new Error('could not find main page!');
    }

    try {
      page.setDefaultTimeout(5000);

      this.debugTargets();

      for (const step of this.recording) {
        await this.step(browser, page, step);
      }

      console.log('play done');
      this.debugTargets();

    } catch (err) {
      console.error('ERROR', err.message);
    } finally {
      console.log('play finally');
      // TODO(crbug.com/1203602)
      // Disconnect the puppeteer connection
      this.debugTargets();
      // browser.disconnect();
      console.log('play.resumeAllTargets');
      await SDK.SDKModel.TargetManager.instance().resumeAllTargets();
      console.log('play.resumeAllTargets.done');
    }
  }

  async getTargetPageFromFrameContext(browser: puppeteer.Browser, page: puppeteer.Page, context: StepFrameContext|null):
      Promise<puppeteer.Page> {
    if (!context || context.target === 'main') {
      return page;
    }

    const target = await browser.waitForTarget(t => t.url() === context.target);
    const targetPage = await target.page();

    if (!targetPage) {
      throw new Error('Could not find target page.');
    }
    return targetPage;
  }

  async getTargetPageAndFrameFromFrameContext(
      browser: puppeteer.Browser, page: puppeteer.Page,
      context: StepFrameContext|null): Promise<{targetPage: puppeteer.Page, frame: puppeteer.Frame}> {
    const targetPage = await this.getTargetPageFromFrameContext(browser, page, context);
    let frame = targetPage.mainFrame();
    if (context) {
      for (const index of context.path) {
        frame = frame.childFrames()[index];
      }
    }
    return {targetPage, frame};
  }

  async step(browser: puppeteer.Browser, page: puppeteer.Page, step: Step): Promise<void> {
    console.log('step', step);
    const {targetPage, frame} = await this.getTargetPageAndFrameFromFrameContext(
        browser, page, step instanceof StepWithContext ? step.context : null);

    let condition: Promise<unknown>|null = null;

    if (step.condition instanceof WaitForNavigationCondition) {
      condition = targetPage.waitForNavigation();
    }

    if (step instanceof NavigationStep) {
      await page.goto(step.url);
    } else if (step instanceof ClickStep) {
      const element = await frame.waitForSelector(step.selector);
      if (!element) {
        throw new Error('Could not find element: ' + step.selector);
      }
      await element.click();
    } else if (step instanceof ChangeStep) {
      const element = await frame.waitForSelector(step.selector);
      if (!element) {
        throw new Error('Could not find element: ' + step.selector);
      }
      await element.type(step.value);
    } else if (step instanceof SubmitStep) {
      const element = await frame.waitForSelector(step.selector);
      if (!element) {
        throw new Error('Could not find element: ' + step.selector);
      }
      await element.evaluate(form => (form as HTMLFormElement).submit());
    } else {
      throw new Error('Unknown action: ' + step.action);
    }

    await condition;
    console.log('step done');
  }
}
