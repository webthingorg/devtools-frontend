// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {SinonSpy} from 'sinon';

const {assert} = chai;

// eslint-disable-next-line rulesdir/es_modules_import
import {getSelector} from '../../../../front_end/recorder/RecordingClient.js';

describe.only('RecordingClient', () => {
  describe('getSelector', () => {
    it('should return an id selector if the element has an id', async () => {
      const button = document.createElement('button');
      button.id = 'test-id';
      document.body.append(button);

      const selector = await getSelector(button);
      assert.strictEqual(selector, '#test-id');
    });

    it('should return an id selector if the element has an id', async () => {
      const button = document.createElement('button');
      button.id = 'test-id';
      document.body.append(button);

      const selector = await getSelector(button);
      assert.strictEqual(selector, '#test-id');
    });

    it('should return an aria selector if it\'s available', async () => {
      const button = document.createElement('button');
      button.innerText = 'Hello World';
      document.body.append(button);

      const selector = await getSelector(button);
      assert.strictEqual(selector, 'aria/Hello World');
    });
  });

  describe('Recording of events', () => {
    let addStep: SinonSpy<[string], void>;
    let addStepPromise: Promise<string>;

    beforeEach(async () => {
      addStepPromise = new Promise<string>((resolve: (_: string) => void) => {
        window.addStep = addStep = sinon.spy((step: string): void => {
          resolve(step);
        });
      });

      await import('../../../../front_end/recorder/RecordingClient.js');
    });

    it('should listen for click events', async () => {
      const button = document.createElement('button');
      document.body.append(button);
      button.click();

      await addStepPromise;
      assert.strictEqual(addStep.callCount, 1);
    });

    it('should listen for click events', async () => {
      const button = document.createElement('button');
      document.body.append(button);
      button.click();
      await addStepPromise;
      assert.strictEqual(addStep.callCount, 1);
    });

    it('should capture events even if an event handler prevents it', async () => {
      const button = document.createElement('button');
      button.onclick = (e: Event) => {
        e.stopImmediatePropagation();
      };
      document.body.append(button);
      button.click();
      await addStepPromise;
      assert.strictEqual(addStep.callCount, 1);
    });

    it('should stop the propagation of the event', async () => {
      const onclick = sinon.spy();
      const button = document.createElement('button');
      button.onclick = onclick;
      document.body.append(button);
      button.click();
      await addStepPromise;
      assert.strictEqual(onclick.callCount, 0);
      assert.strictEqual(addStep.callCount, 1);
    });
  });
});
