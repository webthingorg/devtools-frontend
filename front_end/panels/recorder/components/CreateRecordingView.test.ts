// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import * as Components from './components.js';
import * as Models from '../models/models.js';
import {
  describeWithEnvironment,
  setupActionRegistry,
} from '../../../../test/unittests/front_end/helpers/EnvironmentHelpers.js';
import {renderElementIntoDOM} from '../../../../test/unittests/front_end/helpers/DOMHelpers.js';

interface KarmaConfig {
  config: {
    mocha: {
      grep: string,
    },
  };
}

describeWithEnvironment('CreateRecordingView', () => {
  setupActionRegistry();

  function flakyOnDemand() {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const {grep} = ((globalThis as unknown as {__karma__: KarmaConfig}).__karma__).config.mocha;
    assert.isDefined(grep);
  }

  function createView() {
    const view = new Components.CreateRecordingView.CreateRecordingView();
    view.data = {
      recorderSettings: new Models.RecorderSettings.RecorderSettings(),
    };
    renderElementIntoDOM(view, {
      allowMultipleChildren: true,
    });
    return view;
  }

  it('should render create recording view', async () => {
    const view = createView();
    const input = view.shadowRoot?.querySelector(
                      '#user-flow-name',
                      ) as HTMLInputElement;
    assert.ok(input);
    const button = view.shadowRoot?.querySelector(
                       'devtools-control-button',
                       ) as Components.ControlButton.ControlButton;
    assert.ok(button);
    const onceClicked = new Promise<Components.CreateRecordingView.RecordingStartedEvent>(
        resolve => {
          view.addEventListener('recordingstarted', resolve, {once: true});
        },
    );
    input.value = 'Test';
    button.dispatchEvent(new Event('click'));
    const event = await onceClicked;
    assert.deepEqual(event.name, 'Test');
    flakyOnDemand();
  });

  it('should dispatch recordingcancelled event on the close button click', async () => {
    const view = createView();
    const onceClicked = new Promise<Components.CreateRecordingView.RecordingCancelledEvent>(
        resolve => {
          view.addEventListener('recordingcancelled', resolve, {once: true});
        },
    );
    const closeButton = view.shadowRoot?.querySelector(
                            '[title="Cancel recording"]',
                            ) as HTMLButtonElement;

    closeButton.dispatchEvent(new Event('click'));
    const event = await onceClicked;
    assert.instanceOf(
        event,
        Components.CreateRecordingView.RecordingCancelledEvent,
    );
  });

  it('should generate a default name', async () => {
    const view = createView();
    const input = view.shadowRoot?.querySelector(
                      '#user-flow-name',
                      ) as HTMLInputElement;
    assert.isAtLeast(input.value.length, 'Recording'.length);
    flakyOnDemand();
  });

  it('should remember the most recent selector attribute', async () => {
    let view = createView();
    let input = view.shadowRoot?.querySelector(
                    '#selector-attribute',
                    ) as HTMLInputElement;
    assert.ok(input);
    const button = view.shadowRoot?.querySelector(
                       'devtools-control-button',
                       ) as Components.ControlButton.ControlButton;
    assert.ok(button);
    const onceClicked = new Promise<Components.CreateRecordingView.RecordingStartedEvent>(
        resolve => {
          view.addEventListener('recordingstarted', resolve, {once: true});
        },
    );
    input.value = 'data-custom-attribute';
    button.dispatchEvent(new Event('click'));
    await onceClicked;

    view = createView();
    input = view.shadowRoot?.querySelector(
                '#selector-attribute',
                ) as HTMLInputElement;
    assert.ok(input);
    assert.strictEqual(input.value, 'data-custom-attribute');
  });

  it('should remember recorded selector types', async () => {
    let view = createView();

    let checkboxes = view.shadowRoot?.querySelectorAll(
                         '.selector-type input[type=checkbox]',
                         ) as NodeListOf<HTMLInputElement>;
    assert.strictEqual(checkboxes.length, 5);
    const button = view.shadowRoot?.querySelector(
                       'devtools-control-button',
                       ) as Components.ControlButton.ControlButton;
    assert.ok(button);
    const onceClicked = new Promise<Components.CreateRecordingView.RecordingStartedEvent>(
        resolve => {
          view.addEventListener('recordingstarted', resolve, {once: true});
        },
    );
    checkboxes[0].checked = false;
    button.dispatchEvent(new Event('click'));
    const event = await onceClicked;

    assert.deepStrictEqual(event.selectorTypesToRecord, [
      'aria',
      'text',
      'xpath',
      'pierce',
    ]);

    view = createView();
    checkboxes = view.shadowRoot?.querySelectorAll(
                     '.selector-type input[type=checkbox]',
                     ) as NodeListOf<HTMLInputElement>;
    assert.strictEqual(checkboxes.length, 5);
    assert.isFalse(checkboxes[0].checked);
    assert.isTrue(checkboxes[1].checked);
    assert.isTrue(checkboxes[2].checked);
    assert.isTrue(checkboxes[3].checked);
    assert.isTrue(checkboxes[4].checked);
  });
});
