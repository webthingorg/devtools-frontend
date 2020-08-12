// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as UI from '../ui/ui.js';

export class FeaturePanelImpl extends UI.Widget.VBox {
  constructor() {
    super(true);
    // Optional: add a css file that will be scoped to this component
    this.registerRequiredCSS('feature/featurePanel.css');

    // this.contentElement servces as the root node for this component
    const message = document.createElement('span');
    message.innerText = 'Hello World';
    message.classList.add('message');
    this.contentElement.appendChild(message);
  }
}
