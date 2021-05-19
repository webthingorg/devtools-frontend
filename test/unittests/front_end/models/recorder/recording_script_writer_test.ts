// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import * as Recorder from '../../../../../front_end/models/recorder/recorder.js';

describe('Recorder', () => {
  describe('RecordingScriptWriter', () => {
    it('should respect the given indentation', () => {
      const writer = new Recorder.RecordingScriptWriter.RecordingScriptWriter('  ', {
        title: 'Test Recording',
        sections: [{
          title: 'First Section',
          url: 'https://localhost/',
          screenshot: '',
          steps: [{
            type: 'click',
            target: 'main',
            path: [],
            selector: 'aria/Test' as Recorder.Recording.Selector,
          }],
        }],
      });
      assert.deepEqual(writer.getScript(), `const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  {
    const targetPage = page;
    let frame = targetPage.mainFrame();
    const element = await frame.waitForSelector("aria/Test");
    await element.click();
  }

  await browser.close();
})();
`);
    });
  });
});
