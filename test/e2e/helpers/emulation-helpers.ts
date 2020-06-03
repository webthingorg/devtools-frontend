// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import {assert} from 'chai';
import * as puppeteer from 'puppeteer';

import {$, click, enableExperiment, getBrowserAndPages, reloadDevTools, resourcesPath, waitFor} from '../../shared/helper.js';

const DEVICE_TOOLBAR_TOGGLER_SELECTOR = '[aria-label="Toggle device toolbar"]';
const DEVICE_TOOLBAR_SELECTOR = '.device-mode-toolbar';
const DEVICE_TOOLBAR_OPTIONS_SELECTOR = '.device-mode-toolbar .device-mode-toolbar-options';
const MEDIA_QUERY_INSPECTOR_SELECTOR = '.media-inspector-view';

export const reloadDockableFrontEnd = async () => {
  await reloadDevTools({canDock: true});
};

export const openDeviceToolbar = async () => {
  const deviceToolbarToggler = await waitFor(DEVICE_TOOLBAR_TOGGLER_SELECTOR);
  const togglerARIAPressed = await deviceToolbarToggler.evaluate(element => element.getAttribute('aria-pressed'));
  const isOpen = togglerARIAPressed === 'true';
  if (isOpen) {
    return;
  }
  await click(deviceToolbarToggler);
  await waitFor(DEVICE_TOOLBAR_SELECTOR);
};

export const showMediaQueryInspector = async () => {
  const inspector = await $(MEDIA_QUERY_INSPECTOR_SELECTOR);
  const isOpen = await inspector.evaluate(element => Boolean(element));
  if (isOpen) {
    return;
  }

  await click(DEVICE_TOOLBAR_OPTIONS_SELECTOR);
  const {frontend} = getBrowserAndPages();
  await frontend.keyboard.press('ArrowDown');
  await frontend.keyboard.press('Enter');
  await waitFor(MEDIA_QUERY_INSPECTOR_SELECTOR);
};

export const startEmulationWithDualScreenFlag = async () => {
  await enableExperiment('dualScreenSupport', {canDock: true});
  const {target} = getBrowserAndPages();
  await target.goto(`${resourcesPath}/emulation/dual-screen-inspector.html`);
  await waitFor('.tabbed-pane-left-toolbar');
  await openDeviceToolbar();
};

const deviceListSelector = '.toolbar-button';
const duoSelector = '[aria-label*="Surface Duo"]';
const spanButtonSelector = '[aria-label="Toggle dual-screen mode"]';

const assertButtonDisabled = async (spanButton: puppeteer.JSHandle, expected: boolean) => {
  const isDisabled = await spanButton.evaluate((e: HTMLButtonElement) => {
    return e.disabled;
  });
  assert(isDisabled === expected);
};

// Test if span button is clickable when emulating a dual screen device.
export const testSpanForDualScreen = async () => {
  const toolbar = await $(DEVICE_TOOLBAR_SELECTOR);
  const button = await $(deviceListSelector, toolbar);
  await click(button);

  const duo = await $(duoSelector);
  await click(duo);

  // make sure the span button is clickable.
  const spanButton = await $(spanButtonSelector);
  await assertButtonDisabled(spanButton, false);
  await click(spanButton);
};

const nonDualSelector = '[aria-label*="iPad"]';
// Test if span button is clickable when emulating a non-dual-screen device.
export const testSpanForNonDualScreen = async () => {
  const toolbar = await $(DEVICE_TOOLBAR_SELECTOR);
  const button = await $(deviceListSelector, toolbar);
  await click(button);

  const nonDual = await $(nonDualSelector);
  await click(nonDual);

  // make sure the span button is disabled.
  const spanButton = await $(spanButtonSelector);
  await assertButtonDisabled(spanButton, true);
};
