// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {waitFor} from '../../shared/helper.js';
import type {ElementHandle} from 'puppeteer';

export async function setCustomOrientation() {
  const dropDown = await waitFor('#labelledControl6');
  await dropDown.click();
  await dropDown.type('Custom orientation');
  await dropDown.click();
}

export async function getInputFieldValue(field: ElementHandle<Element>): Promise<string> {
  return field.evaluate(input => (input as HTMLInputElement).value);
}

export async function getAlphaValue(): Promise<string> {
  const alpha = await waitFor('#labelledControl7');
  return await getInputFieldValue(alpha);
}

export async function getBetaValue(): Promise<string> {
  const beta = await waitFor('#labelledControl8');
  return await getInputFieldValue(beta);
}

export async function getGammaValue(): Promise<string> {
  const gamma = await waitFor('#labelledControl9');
  return await getInputFieldValue(gamma);
}
