// Copyright 2015 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

Devices.DevicesView = class extends UI.VBox {
  constructor() {
    super(true);

    const deprecationNotice = UI.Fragment.build
    `
      <div style="user-select: text; padding: 5px;">
        ${ls
    `This panel has been deprecated in favor of the chrome://inspect/#devices interface, which has equivalent functionality.`}
      </div>
    `;

    this.contentElement.appendChild(deprecationNotice.element());
  }
};
