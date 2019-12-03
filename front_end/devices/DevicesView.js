// Copyright 2015 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

Devices.DevicesView = class extends UI.VBox {
  constructor() {
    super(true);

    const discoveryFooter = this.contentElement.createChild('span');
    const documentationLink = UI.XLink.create('chrome://inspect/#devices');

    discoveryFooter.style.padding = '5px';
    discoveryFooter.appendChild(UI.formatLocalized(
        'This panel has been deprecated in favor of the %s interface, which has equivalent functionality.',
        [documentationLink]));

    this.setDefaultFocusedElement(documentationLink);
  }
};
