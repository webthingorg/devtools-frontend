// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {renderElementIntoDOM} from '../../../testing/DOMHelpers.js';
import {
  describeWithEnvironment,
  setupActionRegistry,
} from '../../../testing/EnvironmentHelpers.js';
import * as Coordinator from '../../../ui/components/render_coordinator/render_coordinator.js';
import * as Models from '../models/models.js';

import * as RecorderComponents from './components.js';

const coordinator = Coordinator.RenderCoordinator.RenderCoordinator.instance();

describeWithEnvironment('ReplayButton', () => {
  setupActionRegistry();

  let settings: Models.RecorderSettings.RecorderSettings;
  async function createReplayButton() {
    settings = new Models.RecorderSettings.RecorderSettings();
    const component = new RecorderComponents.ReplayButton.ReplaySection();
    component.data = {settings, replayExtensions: []};
    renderElementIntoDOM(component);
    await coordinator.done();

    return component;
  }

  afterEach(() => {
    settings.speed = Models.RecordingPlayer.PlayRecordingSpeed.Normal;
  });

  it('should change select menu title when another option is selected', async () => {
    const component = await createReplayButton();
    const selectSection = component.shadowRoot?.querySelector(
        'devtools-select-button',
    );
    const selectMenu = selectSection?.shadowRoot?.querySelector('.select-button') as HTMLElement;
    assert.strictEqual(
        selectMenu?.title,
        'Normal speed',
    );

    selectSection?.dispatchEvent(
        new RecorderComponents.SelectButton.SelectMenuSelectedEvent(
            Models.RecordingPlayer.PlayRecordingSpeed.Slow,
            ),
    );
    await coordinator.done();
    assert.strictEqual(
        selectMenu?.title,
        'Slow speed',
    );
  });

  it('should save the changed button when option is selected in select menu', async () => {
    const component = await createReplayButton();
    const selectButton = component.shadowRoot?.querySelector(
        'devtools-select-button',
    );

    selectButton?.dispatchEvent(
        new RecorderComponents.SelectButton.SelectMenuSelectedEvent(
            Models.RecordingPlayer.PlayRecordingSpeed.Slow,
            ),
    );

    assert.strictEqual(
        settings.speed,
        Models.RecordingPlayer.PlayRecordingSpeed.Slow,
    );
  });

  it('should load the saved button on initial render', async () => {
    settings.speed = Models.RecordingPlayer.PlayRecordingSpeed.Slow;

    const component = await createReplayButton();

    const selectButton = component.shadowRoot?.querySelector(
        'devtools-select-button',
    );
    assert.strictEqual(
        selectButton?.value,
        Models.RecordingPlayer.PlayRecordingSpeed.Slow,
    );
  });
});
