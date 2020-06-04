// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../common/common.js';  // eslint-disable-line no-unused-vars
import * as UI from '../ui/ui.js';

export class WebauthnPaneImpl extends UI.Widget.VBox {
  constructor() {
    super(true);
    this.registerRequiredCSS('webauthn/webauthnPane.css');
    this.contentElement.classList.add('webauthn-pane');

    const topToolbar = new UI.Toolbar.Toolbar('webauthn-toolbar', this.contentElement);
    this._virtualAuthEnvEnabledSetting =
        Common.Settings.Settings.instance().createSetting('virtualAuthEnvEnabled', false);
    this._virtualAuthEnvEnabledSetting.addChangeListener(() => this._toggleVirtualAuthEnv());
    const enableCheckbox = new UI.Toolbar.ToolbarSettingCheckbox(
        this._virtualAuthEnvEnabledSetting, Common.UIString.UIString('Enable Virtual Authenticator Environment'),
        Common.UIString.UIString('Enable Virtual Authenticator Environment'));
    topToolbar.appendToolbarItem(enableCheckbox);
  }

  _toggleVirtualAuthEnv() {
    if (this._virtualAuthEnvEnabledSetting) {
      // Show feature
    } else {
      // Hide feature
    }
  }
}
