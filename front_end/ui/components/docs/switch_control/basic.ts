// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as ComponentHelpers from '../../helpers/helpers.js';
import * as SwitchControl from '../../switch_control/switch_control.js';

await ComponentHelpers.ComponentServerSetup.setup();
function init(): void {
  const container = document.getElementById('container');
  if (!container) {
    return;
  }

  container.style.padding = '42px 42px';
  container.style.margin = '42px 42px';
  container.style.border = '1px solid rgb(0 0 0 / 20%)';

  // Basic
  const basicExample = document.createElement('div');
  const explanation = document.createElement('div');
  const switchControl = new SwitchControl.SwitchControl.SwitchControl();
  explanation.textContent = `is checked? ${switchControl.checked}`;
  switchControl.addEventListener(SwitchControl.SwitchControl.SwitchControlChangeEvent.eventName, ev => {
    explanation.textContent = `is checked? ${ev.checked}`;
  });
  basicExample.appendChild(switchControl);
  basicExample.appendChild(explanation);
  container.appendChild(basicExample);

  // Already checked
  const checkedExample = document.createElement('div');
  checkedExample.style.marginTop = '40px';
  const explanationChecked = document.createElement('div');
  const switchControlChecked = new SwitchControl.SwitchControl.SwitchControl();
  switchControlChecked.checked = true;
  explanationChecked.textContent = `is checked? ${switchControlChecked.checked}`;
  switchControlChecked.addEventListener(SwitchControl.SwitchControl.SwitchControlChangeEvent.eventName, ev => {
    explanationChecked.textContent = `is checked? ${ev.checked}`;
  });
  checkedExample.appendChild(switchControlChecked);
  checkedExample.appendChild(explanationChecked);
  container.appendChild(checkedExample);
}

init();
