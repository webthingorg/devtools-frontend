// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';

import type {UserFlow, Selector} from '../../../front_end/models/recorder/Steps.js';

import {enableExperiment, getBrowserAndPages, getTestServerPort, goToResource} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {createNewRecording, openRecorderSubPane, openSourcesPanel} from '../helpers/sources-helpers.js';

function retrieveCodeMirrorEditorContent() {
  // @ts-ignore
  return document.querySelector('.CodeMirror').CodeMirror.getValue();
}

async function getCode() {
  const {frontend} = getBrowserAndPages();
  const textContent = await frontend.evaluate(retrieveCodeMirrorEditorContent);
  // TODO: Change to replaceAll once it's supported in Node.js.
  const replacedContent =
      textContent.replace(new RegExp(`localhost:${getTestServerPort()}`, 'g'), '<url>').replace(/\u200b/g, '').trim();
  const userFlow = JSON.parse(replacedContent);
  for (const section of userFlow.sections) {
    section.screenshot = '<screenshot>';
  }
  return userFlow;
}

async function changeNetworkConditions(condition: string) {
  const {frontend} = getBrowserAndPages();
  await frontend.waitForSelector('pierce/#tab-network');
  await frontend.click('pierce/#tab-network');
  await frontend.waitForSelector('pierce/[aria-label="Throttling"]');
  await frontend.select('pierce/[aria-label="Throttling"] select', condition);
}

const enableUntrustedEventMode = async () => {
  const {frontend} = getBrowserAndPages();
  await frontend.evaluate(() => {
    // @ts-ignore
    globalThis.Common.Settings.instance().createSetting('untrustedRecorderEvents', true);
  });
};

async function startRecording(path: string, networkCondition: string = '', untrustedEvents = false) {
  await enableExperiment('recorder');
  await goToResource(path);

  const {frontend} = getBrowserAndPages();
  if (networkCondition) {
    await changeNetworkConditions(networkCondition);
  }


  await openSourcesPanel();
  await openRecorderSubPane();
  if (untrustedEvents) {
    await enableUntrustedEventMode();
  }
  await createNewRecording('New recording');
  //   await enableCDPLogging()
  await frontend.click('aria/Record');
  await frontend.bringToFront();
  await frontend.waitForSelector('aria/Stop');
}

async function stopRecording(attempt = 0, error = new Error()) {
  // We attempt to stop the recording multiple times due to crbug/1219505.
  if (attempt >= 3) {
    throw error;
  }
  try {
    const {frontend} = getBrowserAndPages();
    await frontend.bringToFront();
    await frontend.waitForSelector('aria/Stop', {timeout: 0});
    await frontend.click('aria/Stop');
  } catch (err) {
    stopRecording(attempt + 1, err);
  }
}

async function assertOutput(expected: UserFlow) {
  const textContent = await getCode();
  assert.deepEqual(textContent, expected);
}

const viewportStep = {
  height: 720,
  width: 1280,
  type: 'viewport' as 'viewport',
};

describe('Recorder', function() {
  // The tests in this suite are particularly slow, as they perform a lot of actions
  this.timeout(0);

  it('should capture the initial page as the url of the first section', async () => {
    await startRecording('recorder/recorder.html');
    await stopRecording();
    await assertOutput({
      title: 'New Recording',
      sections: [{
        url: 'https://<url>/test/e2e/resources/recorder/recorder.html',
        screenshot: '<screenshot>',
        title: '',
        steps: [
          viewportStep,
        ],
      }],
    });
  });

  it('should capture clicks on buttons', async () => {
    await startRecording('recorder/recorder.html');

    const {target} = getBrowserAndPages();
    await target.bringToFront();
    await target.click('#test');

    await stopRecording();
    await assertOutput({
      title: 'New Recording',
      sections: [{
        url: 'https://<url>/test/e2e/resources/recorder/recorder.html',
        screenshot: '<screenshot>',
        title: '',
        steps: [
          viewportStep,
          {
            type: 'click',
            selector: 'aria/Test Button' as Selector,
            offsetX: 39,
            offsetY: 9,
            context: {
              target: 'main',
              path: [],
            },
          },
        ],
      }],
    });
  });

  it('should not capture synthetic events', async () => {
    await startRecording('recorder/recorder.html');

    const {target} = getBrowserAndPages();
    await target.bringToFront();
    await target.click('#synthetic');

    await stopRecording();
    await assertOutput({
      title: 'New Recording',
      sections: [{
        url: 'https://<url>/test/e2e/resources/recorder/recorder.html',
        screenshot: '<screenshot>',
        title: '',
        steps: [
          viewportStep,
          {
            type: 'click',
            selector: 'aria/Trigger Synthetic Event' as Selector,
            context: {
              target: 'main',
              path: [],
            },
            offsetX: 75,
            offsetY: 9,
          },
        ],
      }],
    });
  });

  it('should capture implicit form submissions', async () => {
    await startRecording('recorder/form.html');

    const {target} = getBrowserAndPages();
    await target.bringToFront();
    await target.click('#name');
    await target.type('#name', 'test');
    await target.keyboard.press('Enter');

    await stopRecording();
    await assertOutput({
      title: 'New Recording',
      sections: [{
        url: 'https://<url>/test/e2e/resources/recorder/form.html',
        screenshot: '<screenshot>',
        title: '',
        steps: [
          viewportStep,
          {
            type: 'click',
            selector: 'aria/Name:',
            context: {
              target: 'main',
              path: [],
            },
            offsetX: 77,
            offsetY: 9,
          },
          {
            type: 'change',
            selector: 'aria/Name:',
            context: {
              target: 'main',
              path: [],
            },
            value: 'test',
          },
          {
            type: 'keydown',
            context: {
              target: 'main',
              path: [],
            },
            key: 'Enter',
          },
          {
            type: 'keyup',
            context: {
              target: 'main',
              path: [],
            },
            key: 'Enter',
            condition: {
              expectedUrl: 'https://<url>/test/e2e/resources/recorder/form.html?name=test',
              type: 'waitForNavigation',
            },
          },
        ],
      }],
    });
  });

  it('should capture clicks on submit buttons inside of forms as click steps', async () => {
    await startRecording('recorder/recorder.html');

    const {target} = getBrowserAndPages();
    await target.bringToFront();
    await target.click('#form-button');

    await stopRecording();
    await assertOutput({
      title: 'New Recording',
      sections: [{
        url: 'https://<url>/test/e2e/resources/recorder/recorder.html',
        screenshot: '<screenshot>',
        title: '',
        steps: [
          viewportStep,
          {
            type: 'click',
            selector: 'aria/Form Button' as Selector,
            context: {
              target: 'main',
              path: [],
            },
            offsetX: 43,
            offsetY: 9,
          },
        ],
      }],
    });
  });

  it('should build an ARIA selector for the parent element that is interactive', async () => {
    await startRecording('recorder/recorder.html');

    const {target} = getBrowserAndPages();
    await target.bringToFront();
    await target.click('#span');

    await stopRecording();
    await assertOutput({
      title: 'New Recording',
      sections: [{
        url: 'https://<url>/test/e2e/resources/recorder/recorder.html',
        screenshot: '<screenshot>',
        title: '',
        steps: [
          viewportStep,
          {
            type: 'click',
            selector: [
              'aria/Hello World',
              'aria/[role=\"generic\"]',
            ],
            context: {
              target: 'main',
              path: [],
            },
            offsetX: 34,
            offsetY: 8,
          },
        ],
      }],
    });
  });

  it('should fall back to a css selector if an element does not have an accessible and interactive parent',
     async () => {
       await startRecording('recorder/recorder.html');

       const {target} = getBrowserAndPages();
       await target.bringToFront();
       await target.click('#span2');

       await stopRecording();
       await assertOutput({
         title: 'New Recording',
         sections: [{
           url: 'https://<url>/test/e2e/resources/recorder/recorder.html',
           screenshot: '<screenshot>',
           title: '',
           steps: [
             viewportStep,
             {
               type: 'click',
               selector: '#span2' as Selector,
               context: {
                 target: 'main',
                 path: [],
               },
               offsetX: 18,
               offsetY: 9,
             },
           ],
         }],
       });
     });

  it('should create an aria selector even if the element is within a shadow root', async () => {
    await startRecording('recorder/recorder.html');

    const {target} = getBrowserAndPages();
    await target.bringToFront();
    await target.click('pierce/#inner-span');

    await stopRecording();
    await assertOutput({
      title: 'New Recording',
      sections: [{
        url: 'https://<url>/test/e2e/resources/recorder/recorder.html',
        screenshot: '<screenshot>',
        title: '',
        steps: [
          viewportStep,
          {
            type: 'click',
            selector: [
              '#shadow-root > span',
              '#inner-span',
            ],
            context: {
              target: 'main',
              path: [],
            },
            offsetX: 59,
            offsetY: 149,
          },
        ],
      }],
    });
  });

  it('should record interactions with elements within iframes', async () => {
    await startRecording('recorder/recorder.html');

    const {target} = getBrowserAndPages();
    await target.bringToFront();
    await target.mainFrame().childFrames()[0].click('#in-iframe');
    await target.mainFrame().childFrames()[0].childFrames()[0].click('aria/Inner iframe button');

    await stopRecording();
    await assertOutput({
      title: 'New Recording',
      sections: [{
        url: 'https://<url>/test/e2e/resources/recorder/recorder.html',
        screenshot: '<screenshot>',
        title: '',
        steps: [
          viewportStep,
          {
            type: 'click',
            selector: 'aria/iframe button' as Selector,
            context: {
              target: 'main',
              path: [
                0,
              ],
            },
            offsetX: 45,
            offsetY: 9,
          },
          {
            type: 'click',
            selector: 'aria/Inner iframe button' as Selector,
            context: {
              target: 'main',
              path: [
                0,
                0,
              ],
            },
            offsetX: 62,
            offsetY: 9,
          },
        ],
      }],
    });
  });

  it('should wait for navigations in the generated scripts', async () => {
    await startRecording('recorder/recorder.html');

    const {target} = getBrowserAndPages();
    await target.bringToFront();
    const promise1 = target.waitForNavigation();
    await target.click('aria/Page 2');
    await promise1;
    await target.waitForSelector('aria/Back to Page 1');
    const promise2 = target.waitForNavigation();
    await target.click('aria/Back to Page 1');
    await promise2;

    await stopRecording();
    await assertOutput({
      title: 'New Recording',
      sections: [{
        url: 'https://<url>/test/e2e/resources/recorder/recorder.html',
        screenshot: '<screenshot>',
        title: '',
        steps: [
          viewportStep,
          {
            type: 'click',
            selector: 'aria/Page 2' as Selector,
            context: {
              target: 'main',
              path: [],
            },
            condition: {
              expectedUrl: 'https://<url>/test/e2e/resources/recorder/recorder2.html',
              type: 'waitForNavigation',
            },
            offsetX: 507,
            offsetY: 149,
          },
          {
            type: 'click',
            selector: 'aria/Back to Page 1' as Selector,
            context: {
              target: 'main',
              path: [],
            },
            condition: {
              expectedUrl: 'https://<url>/test/e2e/resources/recorder/recorder.html',
              type: 'waitForNavigation',
            },
            offsetX: 48,
            offsetY: 9,
          },
        ],
      }],
    });
  });

  it('should also record network conditions', async () => {
    await startRecording('recorder/recorder.html', 'Fast 3G');

    const {frontend, target} = getBrowserAndPages();
    await target.bringToFront();
    await target.click('#test');
    await frontend.bringToFront();
    await changeNetworkConditions('Slow 3G');
    await openSourcesPanel();
    await target.bringToFront();
    await target.click('#test');

    await stopRecording();
    await assertOutput({
      title: 'New Recording',
      sections: [{
        url: 'https://<url>/test/e2e/resources/recorder/recorder.html',
        screenshot: '<screenshot>',
        title: '',
        networkConditions: {
          i18nTitleKey: 'Fast 3G',
          download: 180000,
          latency: 562.5,
          upload: 84375,
        },
        steps: [
          viewportStep,
          {
            type: 'click',
            selector: 'aria/Test Button' as Selector,
            context: {
              target: 'main',
              path: [],
            },
            offsetX: 39,
            offsetY: 9,
          },
          {
            type: 'emulateNetworkConditions',
            conditions: {
              i18nTitleKey: 'Slow 3G',
              download: 50000,
              latency: 2000,
              upload: 50000,
            },
          },
          {
            type: 'click',
            selector: 'aria/Test Button' as Selector,
            context: {
              target: 'main',
              path: [],
            },
            offsetX: 39,
            offsetY: 9,
          },
        ],
      }],
    });
  });

  it('should capture keyboard events on inputs', async () => {
    await startRecording('recorder/input.html');

    const {target} = getBrowserAndPages();
    await target.bringToFront();
    await target.keyboard.press('Tab');
    await target.keyboard.type('1');
    await target.keyboard.press('Tab');
    await target.keyboard.type('2');
    // TODO(alexrudenko): for some reason the headless test does not flush the buffer
    // when recording is stopped.
    await target.evaluate(() => (document.querySelector('#two') as HTMLElement).blur());

    await stopRecording();
    await assertOutput({
      title: 'New Recording',
      sections: [{
        url: 'https://<url>/test/e2e/resources/recorder/input.html',
        screenshot: '<screenshot>',
        title: '',
        steps: [
          viewportStep,
          {
            context: {
              path: [],
              target: 'main',
            },
            key: 'Tab',
            type: 'keydown',
          },
          {
            context: {
              path: [],
              target: 'main',
            },
            key: 'Tab',
            type: 'keyup',
          },
          {
            context: {
              path: [],
              target: 'main',
            },
            selector: '#one',
            value: '1',
            type: 'change',
          },
          {
            context: {
              path: [],
              target: 'main',
            },
            key: 'Tab',
            type: 'keydown',
          },
          {
            context: {
              path: [],
              target: 'main',
            },
            key: 'Tab',
            type: 'keyup',
          },
          {
            context: {
              path: [],
              target: 'main',
            },
            selector: '#two',
            value: '2',
            type: 'change',
          },
        ],
      }],
    });
  });

  it('should capture navigation without change', async () => {
    await startRecording('recorder/input.html');

    const {target} = getBrowserAndPages();
    await target.bringToFront();
    await target.keyboard.press('Tab');
    await target.keyboard.down('Shift');
    await target.keyboard.press('Tab');
    await target.keyboard.up('Shift');

    await stopRecording();
    await assertOutput({
      title: 'New Recording',
      sections: [{
        url: 'https://<url>/test/e2e/resources/recorder/input.html',
        screenshot: '<screenshot>',
        title: '',
        steps: [
          viewportStep,
          {
            context: {
              path: [],
              target: 'main',
            },
            key: 'Tab',
            type: 'keydown',
          },
          {
            context: {
              path: [],
              target: 'main',
            },
            key: 'Tab',
            type: 'keyup',
          },
          {
            context: {
              path: [],
              target: 'main',
            },
            key: 'Shift',
            type: 'keydown',
          },
          {
            context: {
              path: [],
              target: 'main',
            },
            key: 'Tab',
            type: 'keydown',
          },
          {
            context: {
              path: [],
              target: 'main',
            },
            key: 'Tab',
            type: 'keyup',
          },
          {
            context: {
              path: [],
              target: 'main',
            },
            key: 'Shift',
            type: 'keyup',
          },
        ],
      }],
    });
  });

  it('should work for select elements', async () => {
    const untrustedEvents = true;
    const networkCondition = '';
    await startRecording('recorder/select.html', networkCondition, untrustedEvents);

    const {target} = getBrowserAndPages();
    await target.bringToFront();
    await target.click('#select');
    await target.select('#select', 'O2');
    // TODO(alexrudenko): for some reason the headless test does not flush the buffer
    // when recording is stopped.
    await target.evaluate(() => (document.querySelector('#select') as HTMLSelectElement).blur());

    await stopRecording();
    await assertOutput({
      title: 'New Recording',
      sections: [{
        url: 'https://<url>/test/e2e/resources/recorder/select.html',
        screenshot: '<screenshot>',
        title: '',
        steps: [
          viewportStep,
          {
            'type': 'click',
            'context': {
              'path': [],
              'target': 'main',
            },
            'selector': 'aria/Select',
            offsetX: 19,
            offsetY: 9,
          },
          {
            'type': 'change',
            'context': {
              'path': [],
              'target': 'main',
            },
            'selector': 'aria/Select',
            'value': 'O2',
          },
        ],
      }],
    });
  });

  it('should record scroll events', async () => {
    const untrustedEvents = true;
    const networkCondition = '';
    await startRecording('recorder/scroll.html', networkCondition, untrustedEvents);

    const {target} = getBrowserAndPages();
    await target.bringToFront();
    const element = await target.waitForSelector('#overflow');
    await element?.evaluate(el => {
      el.scrollTop = 40;
    });
    await target.evaluate(() => {
      window.scroll(40, 40);
    });

    await stopRecording();
    await assertOutput({
      title: 'New Recording',
      sections: [{
        url: 'https://<url>/test/e2e/resources/recorder/scroll.html',
        screenshot: '<screenshot>',
        title: '',
        steps: [
          viewportStep,
          {
            type: 'scroll',
            context: {
              path: [],
              target: 'main',
            },
            selector: '#overflow',
            x: 0,
            y: 40,
          },
          {
            type: 'scroll',
            context: {
              path: [],
              target: 'main',
            },
            x: 40,
            y: 40,
          },
        ],
      }],
    });
  });
});
