// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as i18n from '../i18n/i18n.js';
import * as UI from '../ui/ui.js';

import {Events, OverviewController} from './CSSOverviewController.js';  // eslint-disable-line no-unused-vars

export const UIStrings = {
  /**
  *@description Label for the capture button in the CSS Overview Panel
  */
  captureOverview: 'Capture overview',
  /**
  *@description Title of the CSS Overview Panel
  */
  cssOverview: 'CSS Overview',
};
const str_ = i18n.i18n.registerUIStrings('css_overview/CSSOverviewStartView.js', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);
export class CSSOverviewStartView extends UI.Widget.Widget {
  /**
   * @param {!OverviewController} controller
   */
  constructor(controller) {
    super();
    this.registerRequiredCSS('css_overview/cssOverviewStartView.css', {enableLegacyPatching: false});

    this._controller = controller;
    this._render();
  }

  _render() {
    const startButton = UI.UIUtils.createTextButton(
        i18nString(UIStrings.captureOverview),
        () => this._controller.dispatchEventToListeners(Events.RequestOverviewStart), '', true /* primary */);

    this.setDefaultFocusedElement(startButton);

    const fragment = UI.Fragment.Fragment.build`
      <div class="vbox overview-start-view">
        <h1>${i18nString(UIStrings.cssOverview)}</h1>
        <div>${startButton}</div>
      </div>
    `;

    this.contentElement.appendChild(fragment.element());
    this.contentElement.style.overflow = 'auto';
  }
}
