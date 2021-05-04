// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';

import {enableExperiment, getBrowserAndPages, getResourcesPath, goToResource, waitForFunction} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {createNewRecording, openRecorderSubPane, openSourcesPanel} from '../helpers/sources-helpers.js';

function setCodeMirrorEditorContent(code: string) {
  // @ts-ignore
  const codeMirror = document.querySelector('.CodeMirror').CodeMirror;
  codeMirror.setValue(code);
}

async function setCode(code: string) {
  const {frontend} = getBrowserAndPages();
  await frontend.evaluate(setCodeMirrorEditorContent, code);

  // Commit the changes
  if (process.platform === 'darwin') {
    await frontend.keyboard.down('Meta');
    await frontend.keyboard.down('S');
    await frontend.keyboard.up('S');
    await frontend.keyboard.up('Meta');
  } else {
    await frontend.keyboard.down('Control');
    await frontend.keyboard.down('S');
    await frontend.keyboard.up('S');
    await frontend.keyboard.up('Control');
  }
}

async function setupRecorderWithScriptAndReplay(script: string): Promise<void> {
  console.log('X.1');
  await enableExperiment('recorder');
  console.log('X.2');
  await goToResource('recorder/recorder.html');
  console.log('X.3');
  const {frontend} = getBrowserAndPages();
  console.log('X.4');
  await openSourcesPanel();
  console.log('X.5');
  await openRecorderSubPane();
  console.log('X.6');
  await createNewRecording('New recording');
  console.log('X.7');
  await setCode(script);
  console.log('X.8');

  await frontend.click('pierce/[aria-label="Replay"]');
  console.log('X.9');
  // TODO: find out why this is not working:
  // document.querySelector('[aria-label="Replay"]:not([disabled])');
  await waitForFunction(async () => {
    const disabled = await frontend.$eval('pierce/[aria-label="Replay"]', e => (e as HTMLButtonElement).disabled);
    return !disabled || undefined;
  });
  console.log('X.10');
}

describe('Recorder', function() {
  // The tests in this suite are particularly slow, as they perform a lot of actions
  this.timeout(10000);

  describe('Replay', () => {
    it('should be able to replay navigation steps', async () => {
      console.log('A.1');
      const {target} = getBrowserAndPages();
      console.log('A.2');
      const promise = target.waitForNavigation();
      console.log('A.3');
      await setupRecorderWithScriptAndReplay(`[
        {
            "action": "navigate",
            "condition": null,
            "url": "${getResourcesPath()}/recorder/recorder2.html"
        }
      ]`);
      console.log('A.4');
      await promise;
      console.log('A.5');
      assert.strictEqual(target.url(), `${getResourcesPath()}/recorder/recorder2.html`);
      console.log('A.6');
    });

    it('should be able to replay click steps', async () => {
      console.log('A.1');
      const {target} = getBrowserAndPages();
      console.log('A.2');
      await setupRecorderWithScriptAndReplay(`[
        {
          "action": "click",
          "condition": {
              "expectedUrl": "${getResourcesPath()}/recorder/recorder2.html"
          },
          "context": {
              "path": [],
              "target": "main"
          },
          "selector": "a[href=\\"recorder2.html\\"]"
      }
      ]`);
      console.log('A.3');
      assert.strictEqual(target.url(), `${getResourcesPath()}/recorder/recorder2.html`);
      console.log('A.4');
    });

    it('should be able to replay change steps', async () => {
      console.log('A.1');
      const {target} = getBrowserAndPages();
      console.log('A.2');
      await setupRecorderWithScriptAndReplay(`[
        {
            "action": "change",
            "condition": null,
            "context": {
                "path": [],
                "target": "main"
            },
            "selector": "#input",
            "value": "Hello World"
        }
      ]`);
      console.log('A.3');
      const value = await target.$eval('#input', e => (e as HTMLInputElement).value);
      console.log('A.4');
      assert.strictEqual(value, 'Hello World');
      console.log('A.5');
    });
  });
});
