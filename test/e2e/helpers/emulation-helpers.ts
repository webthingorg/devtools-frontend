// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as puppeteer from 'puppeteer';
import {waitForFunction} from '..\..\shared\helper.js';

// We duplicate some functionality of shared helpers here because emulation
// e2e tests require a different devtools frontend than other tests.
//
// Plus, puppeteer does not support using such a frontend as a page directly.
// A related issue is still open:
// https://github.com/puppeteer/puppeteer/issues/4247
// If the issue is resolved with a solution to get the devtools frontend we want,
// we may consider if we want to move the functionalities to the general helper.

const envChromeBinary = process.env['CHROME_BIN'];
const globalThis: any = global;
const deviceModeButtonSelector = 'span.toolbar-glyph.spritesheet-largeicons.largeicon-phone.icon-mask';
const contentPageElementSelector = '#inner > tbody > tr:nth-child(8) > td.label';

// puppeteer state for emulation
let target: puppeteer.Page;
let frontend: puppeteer.Page;
let browser: puppeteer.Browser;
let browserAndPagesSet: boolean = false;

// Based on methods of the same name in shared/helpers.
const collectAllElementsFromPage_ = async (frontend: puppeteer.Page, root?: puppeteer.JSHandle) => {
  await frontend.evaluate(root => {
    const container = (self as any);
    container.__elements = [];
    const collect = (root: HTMLElement|ShadowRoot) => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
      do {
        const currentNode = walker.currentNode as HTMLElement;
        if (currentNode.shadowRoot) {
          collect(currentNode.shadowRoot);
        }
        // We're only interested in actual elements that we can later use for selector
        // matching, so skip shadow roots.
        if (!(currentNode instanceof ShadowRoot)) {
          container.__elements.push(currentNode);
        }
      } while (walker.nextNode());
    };
    collect(root || document.documentElement);
  }, root || '');
};

const $_ = async (frontend: puppeteer.Page, selector: string, root?: puppeteer.JSHandle) => {
  await collectAllElementsFromPage_(frontend, root);
  try {
    const element = await frontend.evaluateHandle(selector => {
      const elements: Element[] = globalThis.__elements;
      return elements.find(element => element.matches(selector));
    }, selector);
    return element;
  } catch (error) {
    throw new Error(`Unable to find element for selector "${selector}": ${error.stack}`);
  }
};

const getElementPosition_ =
    async (frontend: puppeteer.Page, selector: string|puppeteer.JSHandle, root?: puppeteer.JSHandle) => {
  let element: puppeteer.JSHandle|null;
  if (typeof selector === 'string') {
    element = await $_(frontend, selector, root);
  } else {
    element = selector;
  }

  if (!element) {
    throw new Error(`Unable to find element with selector "${selector}"`);
  }

  const position = await element.evaluate(element => {
    if (!element) {
      return {};
    }
    // Extract the location values.
    const {left, top, width, height} = element.getBoundingClientRect();
    return {
      x: left + width * 0.5,
      y: top + height * 0.5,
    };
  });

  if (position.x === undefined || position.y === undefined) {
    throw new Error(`Unable to find element with selector "${selector}"`);
  }
  return position;
};

async function setEmulationTestHook_() {
  const opts: puppeteer.LaunchOptions = {
    devtools: true,
    executablePath: envChromeBinary,
    defaultViewport: null,
    dumpio: true,
  };
  browser = await puppeteer.launch(opts);
  // Load the target page.
  const targets = await browser.targets();
  const pageTarget = targets.filter(t => {
    return t.type() === 'page';
  })[0];
  target = await pageTarget.page();

  // This is a hack mentioned in  https://github.com/puppeteer/puppeteer/issues/4247.
  // Puppeteer may be able to address this issue.
  const devtoolsTarget = targets.filter(t => {
    return t.type() === 'other' && t.url().startsWith('devtools://');
  })[0];

  // Hack to get a page pointing to the devtools
  (devtoolsTarget as any)._targetInfo.type = 'page';
  frontend = await devtoolsTarget.page();
}

export async function getBrowserAndPages() {
  if (!browserAndPagesSet) {  // set once
    await setEmulationTestHook_();
    browserAndPagesSet = true;
  }
  return {target, frontend, browser};
}

export async function $(selector: string, root?: puppeteer.JSHandle) {
  const {frontend} = await getBrowserAndPages();
  return await $_(frontend, selector, root);
}

export const waitFor = async (selector: string, root?: puppeteer.JSHandle, maxTotalTimeout = 0) => {
  return waitForFunction(async () => {
    const element = await $(selector, root);
    if (element.asElement()) {
      return element;
    }
    return undefined;
  }, `Unable to find element with selector ${selector}`, maxTotalTimeout);
};

export const getElementPosition = async (selector: string|puppeteer.JSHandle, root?: puppeteer.JSHandle) => {
  const {frontend} = await getBrowserAndPages();
  return await getElementPosition_(frontend, selector, root);
};

export const click = async (
    selector: string|puppeteer.JSHandle,
    options?: {root?: puppeteer.JSHandle, clickOptions?: puppeteer.ClickOptions}) => {
  const {frontend} = await getBrowserAndPages();
  const clickableElement = await getElementPosition(selector, options && options.root);
  if (!clickableElement) {
    throw new Error(`Unable to locate clickable element "${selector}".`);
  }

  // Click on the button and wait for the console to load. The reason we use this method
  // rather than elementHandle.click() is because the frontend attaches the behavior to
  // a 'mousedown' event (not the 'click' event). To avoid attaching the test behavior
  // to a specific event we instead locate the button in question and ask Puppeteer to
  // click on it instead.
  await frontend.mouse.click(clickableElement.x, clickableElement.y, options && options.clickOptions);
};

export async function ToggleEmulationMode() {
  const {target, frontend} = await getBrowserAndPages();
  target.goto('chrome://version');
  await target.waitForSelector(contentPageElementSelector);
  await frontend.bringToFront();
  await waitFor(deviceModeButtonSelector);
  await click(deviceModeButtonSelector);
}
