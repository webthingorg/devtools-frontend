// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as ComponentHelpers from '../../helpers/helpers.js';
import * as SwitchControl from '../../switch_control/switch_control.js';

await ComponentHelpers.ComponentServerSetup.setup();
function switchExample({checked, disabled}: {checked: boolean, disabled: boolean}): HTMLElement {
  const example = document.createElement('div');
  example.style.marginTop = '20px';
  const explanation = document.createElement('div');
  const disabledExplanation = document.createElement('div');
  const switchControlChecked = new SwitchControl.SwitchControl.SwitchControl();
  switchControlChecked.checked = checked;
  switchControlChecked.disabled = disabled;
  explanation.textContent = `is checked? ${switchControlChecked.checked}`;
  disabledExplanation.textContent = `is disabled? ${switchControlChecked.disabled}`;
  switchControlChecked.addEventListener(SwitchControl.SwitchControl.SwitchControlChangeEvent.eventName, ev => {
    explanation.textContent = `is checked? ${ev.checked}`;
  });
  example.appendChild(switchControlChecked);
  example.appendChild(explanation);
  example.appendChild(disabledExplanation);
  return example;
}

function init(): void {
  const container = document.getElementById('container');
  if (!container) {
    return;
  }

  container.style.padding = '42px 42px';
  container.style.margin = '42px 42px';
  container.style.border = '1px solid rgb(0 0 0 / 20%)';

  // Basic
  container.appendChild(switchExample({checked: false, disabled: false}));

  // Already checked
  container.appendChild(switchExample({checked: true, disabled: false}));

  // Disabled
  container.appendChild(switchExample({checked: false, disabled: true}));

  // Disabled & checked
  container.appendChild(switchExample({checked: true, disabled: true}));
}

init();
