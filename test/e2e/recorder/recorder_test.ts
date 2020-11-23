// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';

import {enableExperiment, getBrowserAndPages, getHostedModeServerPort, goToResource, waitForFunction} from '../../shared/helper.js';
import {createNewRecording, openRecorderSubPane, openSourcesPanel} from '../helpers/sources-helpers.js';

function retrieveCodeMirrorEditorContent() {
  // @ts-ignore
  return Array.from(document.querySelectorAll('.CodeMirror-line'), l => l.textContent).join('\n').trim();
}

async function getCode() {
  const {frontend} = getBrowserAndPages();
  const textContent = await frontend.evaluate(retrieveCodeMirrorEditorContent);
  // TODO: Change to replaceAll once it's supported in Node.js.
  return textContent.replace(new RegExp(`localhost:${getHostedModeServerPort()}`, 'g'), '<url>').replace(/\u200b/g, '');
}

async function waitForScriptToChange(previousScript: string) {
  return waitForFunction(async () => {
    const currentScript = await getCode();
    return previousScript !== currentScript ? currentScript : undefined;
  });
}

describe('Recorder', () => {
  it('should connect to the browser via DevTools own connection', async () => {
    await enableExperiment('recorder');
    await goToResource('recorder/recorder.html');

    const {frontend, target} = getBrowserAndPages();

    await openSourcesPanel();
    await openRecorderSubPane();
    await createNewRecording('New recording');

    let currentScript = '';
    // Record
    await frontend.click('aria/Record');
    await frontend.waitForSelector('aria/Stop');
    currentScript = await waitForScriptToChange(currentScript);
    await target.bringToFront();
    await target.click('#test');
    currentScript = await waitForScriptToChange(currentScript);
    await target.click('#form-button');
    currentScript = await waitForScriptToChange(currentScript);
    await target.click('#span');
    currentScript = await waitForScriptToChange(currentScript);
    await target.click('#span2');
    currentScript = await waitForScriptToChange(currentScript);
    await target.type('#input', 'test');
    await target.keyboard.press('Enter');
    currentScript = await waitForScriptToChange(currentScript);
    await target.click('pierce/#inner-span');
    currentScript = await waitForScriptToChange(currentScript);
    await frontend.bringToFront();
    await frontend.click('aria/Stop');
    await waitForScriptToChange(currentScript);
    const textContent = await getCode();

    assert.strictEqual(textContent, `const puppeteer = require('puppeteer')

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto("https://<url>/test/e2e/resources/recorder/recorder.html");
    await page.click("aria/Test Button");
    await page.submit("html > body > div > form.form1");
    await page.click("aria/Hello World");
    await page.click("span#span2");
    await page.type("aria/Input", "test");
    await page.click("aria/Hello World");
})();

`);
  });
});
