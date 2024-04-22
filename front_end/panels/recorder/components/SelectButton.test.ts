// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {renderElementIntoDOM} from '../../../testing/DOMHelpers.js';
import * as Coordinator from '../../../ui/components/render_coordinator/render_coordinator.js';

import * as RecorderComponents from './components.js';

const coordinator = Coordinator.RenderCoordinator.RenderCoordinator.instance();

describe('SelectButton', () => {
  it('should emit selectbuttonclick event on button click', async () => {
    const component = new RecorderComponents.SelectButton.SelectButton();
    component.value = 'item1';
    component.items = [
      {value: 'item1', label: () => 'item1-label'},
      {value: 'item2', label: () => 'item2-label'},
    ];
    renderElementIntoDOM(component);
    await coordinator.done();
    const onceClicked = new Promise<RecorderComponents.SelectButton.SelectButtonClickEvent>(
        resolve => {
          component.addEventListener('selectbuttonclick', resolve, {
            once: true,
          });
        },
    );

    const button = component.shadowRoot?.querySelector('devtools-button');
    assert.exists(button);
    button?.click();

    const event = await onceClicked;
    assert.strictEqual(event.value, 'item1');
  });
});
