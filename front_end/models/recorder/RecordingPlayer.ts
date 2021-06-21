// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../core/common/common.js';
import * as SDK from '../../core/sdk/sdk.js';
import type * as puppeteer from '../../third_party/puppeteer/puppeteer.js';
import {getPuppeteerConnection as getPuppeteerConnectionToCurrentPage} from './PuppeteerConnection.js';

import type {Step, UserFlow, Selector} from './Steps.js';
import {assertAllStepTypesAreHandled} from './Steps.js';

export const enum Events {
  Done = 'Done',
  Step = 'Step',
  Error = 'Error',
}

export class RecordingPlayer extends Common.ObjectWrapper.ObjectWrapper {
  userFlow: UserFlow;

  constructor(userFlow: UserFlow) {
    super();
    this.userFlow = userFlow;
  }

  async play(): Promise<void> {
    await SDK.TargetManager.TargetManager.instance().suspendAllTargets();

    const {page, browser} = await getPuppeteerConnectionToCurrentPage();
    if (!page) {
      throw new Error('could not find main page!');
    }

    try {
      page.setDefaultTimeout(5000);
      let isFirstSection = true;

      for (const section of this.userFlow.sections) {
        if (isFirstSection) {
          await page.goto(section.url);
          isFirstSection = false;
        }

        for (const step of section.steps) {
          await this.step(browser, page, step);
        }
      }
    } catch (err) {
      this.dispatchEventToListeners(Events.Error, err);
      console.error('ERROR', err.message);
    } finally {
      const pages = await browser.pages();
      for (const page of pages) {
        // @ts-ignore
        const client = page._client;
        await client.send('Network.disable');
        await client.send('Page.disable');
        await client.send('Log.disable');
        await client.send('Performance.disable');
        await client.send('Runtime.disable');
      }
      browser.disconnect();
      await SDK.TargetManager.TargetManager.instance().resumeAllTargets();

      this.dispatchEventToListeners(Events.Done);
    }
  }

  async getTargetPage(browser: puppeteer.Browser, page: puppeteer.Page, step: Step): Promise<puppeteer.Page> {
    if (!('context' in step) || step.context.target === 'main') {
      return page;
    }

    const target = await browser.waitForTarget(t => t.url() === step.context.target);
    const targetPage = await target.page();

    if (!targetPage) {
      throw new Error('Could not find target page.');
    }
    return targetPage;
  }

  async getTargetPageAndFrame(browser: puppeteer.Browser, page: puppeteer.Page, step: Step):
      Promise<{targetPage: puppeteer.Page, frame: puppeteer.Frame}> {
    const targetPage = await this.getTargetPage(browser, page, step);
    let frame = targetPage.mainFrame();
    if ('context' in step) {
      for (const index of step.context.path) {
        frame = frame.childFrames()[index];
      }
    }
    return {targetPage, frame};
  }

  async step(browser: puppeteer.Browser, page: puppeteer.Page, step: Step): Promise<void> {
    this.dispatchEventToListeners(Events.Step, step);

    const {targetPage, frame} = await this.getTargetPageAndFrame(browser, page, step);

    let condition: Promise<unknown>|null = null;

    if ('condition' in step && step.condition && step.condition.type === 'waitForNavigation') {
      condition = targetPage.waitForNavigation();
    }

    switch (step.type) {
      case 'click': {
        const element = await waitForSelector(step.selector, frame);
        if (!element) {
          throw new Error('Could not find element: ' + step.selector);
        }
        const {offsetLeft, offsetTop} = await element.evaluate(el => {
          const borderTop = parseFloat(getComputedStyle(el).getPropertyValue('border-top-width'));
          const borderLeft = parseFloat(getComputedStyle(el).getPropertyValue('border-left-width'));
          return {
            offsetTop: (el as HTMLElement).offsetTop + borderTop,
            offsetLeft: (el as HTMLElement).offsetLeft + borderLeft,
          };
        });
        await page.mouse.click(offsetLeft + step.offsetX, offsetTop + step.offsetY);
      } break;
      case 'emulateNetworkConditions': {
        await page.emulateNetworkConditions(step.conditions);
      } break;
      case 'keydown': {
        await page.keyboard.down(step.key);
        await page.waitForTimeout(100);
      } break;
      case 'keyup': {
        await page.keyboard.up(step.key);
        await page.waitForTimeout(100);
      } break;
      case 'close': {
        await page.close();
      } break;
      case 'change': {
        const element = await waitForSelector(step.selector, frame);
        if (!element) {
          throw new Error('Could not find element: ' + step.selector);
        }
        await element.focus();
        await element.type(step.value);
      } break;
      case 'viewport': {
        await targetPage.setViewport({
          width: step.width,
          height: step.height,
        });
        break;
      }
      case 'scroll': {
        if (step.selector) {
          const element = await waitForSelector(step.selector, frame);
          if (!element) {
            throw new Error('Could not find element: ' + step.selector);
          }
          await element.evaluate((e, x, y) => {
            e.scrollTop = y;
            e.scrollLeft = x;
          }, step.x, step.y);
        } else {
          await targetPage.evaluate((x, y) => {
            window.scroll(x, y);
          }, step.x, step.y);
        }
        break;
      }
      default:
        assertAllStepTypesAreHandled(step);
    }

    await condition;
  }
}

async function waitForSelector(selector: Selector, frame: puppeteer.Frame): Promise<puppeteer.ElementHandle> {
  if (selector instanceof Array) {
    let element = null;
    for (const part of selector) {
      if (!element) {
        element = await frame.waitForSelector(part);
      } else {
        element = await element.$(part);
      }
      if (!element) {
        throw new Error('Could not find element: ' + part);
      }
      element = (await element.evaluateHandle(el => el.shadowRoot ? el.shadowRoot : el)).asElement();
    }
    if (!element) {
      throw new Error('Could not find element: ' + selector.join('|'));
    }
    return element;
  }
  const element = await frame.waitForSelector(selector);
  if (!element) {
    throw new Error('Could not find element: ' + selector);
  }
  return element;
}
