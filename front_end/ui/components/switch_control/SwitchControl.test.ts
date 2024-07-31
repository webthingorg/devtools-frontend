// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {renderElementIntoDOM} from '../../../testing/DOMHelpers.js';

// eslint-disable-next-line rulesdir/es_modules_import
import * as SwitchControl from './switch_control.js';

describe('SwitchControl', () => {
  it('should checked property reflect the current value for whether the Switch is checked or not', () => {
    const component = new SwitchControl.SwitchControl.SwitchControl();
    component.checked = false;
    renderElementIntoDOM(component);

    const checkbox = component.shadowRoot?.querySelector('input')!;

    assert.isFalse(checkbox.checked);
    component.checked = true;
    assert.isTrue(checkbox.checked);
  });

  it('should emit SwitchControlChangeEvent whenever the checkbox inside is changed', async () => {
    const component = new SwitchControl.SwitchControl.SwitchControl();
    const eventPromise = new Promise<SwitchControl.SwitchControl.SwitchControlChangeEvent>(resolve => {
      component.addEventListener(SwitchControl.SwitchControl.SwitchControlChangeEvent.eventName, ev => {
        resolve(ev);
      });
    });
    renderElementIntoDOM(component);

    const checkbox = component.shadowRoot?.querySelector('input')!;
    checkbox.checked = false;
    checkbox.click();

    const event = await eventPromise;
    assert.isTrue(event.checked);
  });
});
