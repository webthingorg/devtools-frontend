// Copyright 2020 The Chromium Authors. All rights reserved.
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
  await frontend.keyboard.down('Meta');
  await frontend.keyboard.down('S');
  await frontend.keyboard.up('S');
  await frontend.keyboard.up('Meta');
}

describe('Recorder', function() {
  // The tests in this suite are particularly slow, as they perform a lot of actions
  this.timeout(0);

  describe('Replay', () => {
    it('should be able to replay navigation steps', async () => {
      await enableExperiment('recorder');

      const {target, frontend} = getBrowserAndPages();

      await openSourcesPanel();
      await openRecorderSubPane();
      await createNewRecording('New recording');
      await setCode(`[
        {
            "action": "navigate",
            "condition": null,
            "url": "${getResourcesPath()}/recorder/recorder.html"
        }
      ]`);

      await frontend.click('pierce/[aria-label="Replay"]');
      // TODO: find out why this is not working:
      // document.querySelector('[aria-label="Replay"]:not([disabled])');
      await waitForFunction(async () => {
        const disabled = await frontend.$eval('pierce/[aria-label="Replay"]', e => (e as HTMLButtonElement).disabled);
        return !disabled || undefined;
      });
      assert.strictEqual(target.url(), `${getResourcesPath()}/recorder/recorder.html`);
    });

    it('should be able to replay click steps', async () => {
      await enableExperiment('protocolMonitor');
      await enableExperiment('recorder');
      await goToResource('recorder/recorder.html');

      const {target, frontend} = getBrowserAndPages();

      await openSourcesPanel();
      await openRecorderSubPane();
      await createNewRecording('New recording');
      await setCode(`[
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

      await frontend.click('pierce/[aria-label="Replay"]');
      await target.bringToFront();
      // TODO: find out why this is not working:
      // document.querySelector('[aria-label="Replay"]:not([disabled])');
      await waitForFunction(async () => {
        await frontend.bringToFront();
        const disabled = await frontend.$eval('pierce/[aria-label="Replay"]', e => (e as HTMLButtonElement).disabled);
        await target.bringToFront();
        return !disabled || undefined;
      });
      assert.strictEqual(target.url(), `${getResourcesPath()}/recorder/recorder2.html`);
    });
  });
});
