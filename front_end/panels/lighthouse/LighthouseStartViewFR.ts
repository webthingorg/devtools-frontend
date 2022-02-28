// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as i18n from '../../core/i18n/i18n.js';
import * as UI from '../../ui/legacy/legacy.js';
import type * as Platform from '../../core/platform/platform.js';

import {StartView} from './LighthouseStartView.js';
import {Events} from './LighthouseController.js';

const UIStrings = {
  /**
   * @description Text displayed as the title of a panel that can be used to audit a web page with Lighthouse.
   */
  generateLighthouseReport: 'Generate a Lighthouse report',
  /**
   * @description Text that refers to the Lighthouse mode
   */
  mode: 'Mode',
  /**
   * @description Text that refers to device such as a phone
   */
  device: 'Device',
  /**
   * @description Title in the Lighthouse Start View for list of categories to run during audit
   */
  categories: 'Categories',
  /**
   * @description Title in the Lighthouse Start View for list of available start plugins
   */
  plugins: 'Plugins',
  /**
   * @description Label for a button to start analyzing a page navigation with Lighthouse
   */
  analyzeNavigation: 'Analyze navigation',
  /**
   * @description Section title of a Lighthouse mode that analyzes a page navigation.
   */
  lighthouseNavigationReport: 'Lighthouse Navigation Mode',
  /**
   * @description Long-form description of a Lighthouse mode that analyzes a page navigation.
   */
  navigationLongDescription:
      'Navigation mode analyzes a single page load, exactly like the original Lighthouse reports.',
  /**
   * @description Label for a button to start analyzing the current page state with Lighthouse
   */
  analyzeSnapshot: 'Analyze snapshot',
  /**
   * @description Section title of a Lighthouse mode that analyzes the current page state.
   */
  lighthouseSnapshotReport: 'Lighthouse Snapshot Mode',
  /**
   * @description Long-form description of a Lighthouse mode that analyzes the current page state.
   */
  snapshotLongDescription:
      'Snapshot reports analyze the page in a particular state, typically after user interactions.',
  /**
   * @description Label for a button that ends a Lighthouse timespan
   */
  startTimespan: 'Start timespan',
  /**
   * @description Section title of a Lighthouse mode that analyzes user interactions over a period of time.
   */
  lighthouseTimespanReport: 'Lighthouse Timespan Mode',
  /**
   * @description Long-form description of a Lighthouse mode that analyzes user interactions over a period of time.
   */
  timespanLongDescription:
      'Timespan reports analyze an arbitrary period of time, typically containing user interactions.',
};

const str_ = i18n.i18n.registerUIStrings('panels/lighthouse/LighthouseStartViewFR.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

export class StartViewFR extends StartView {
  protected render(): void {
    super.render();
    const fragment = UI.Fragment.Fragment.build`
<div class="vbox lighthouse-start-view-fr">
  <header>
    <div class="lighthouse-logo"></div>
    <div class="lighthouse-title">${UIStrings.generateLighthouseReport}</div>
  </header>
  <form>
    <div class="lighthouse-options hbox">
      <div class="lighthouse-form-section">
        <div class="lighthouse-form-section-label">${UIStrings.device}</div>
        <div class="lighthouse-form-elements" $="device-type-form-elements"></div>
      </div>
      <div class="lighthouse-form-section">
        <div class="lighthouse-form-section-label">${i18nString(UIStrings.mode)}</div>
        <div class="lighthouse-form-elements" $="mode-form-elements"></div>
      </div>
    </div>
    <div class="lighthouse-mode-info">
      <div class="lighthouse-mode-title"></div>
      <div class="lighthouse-mode-description"></div>
      <div class="lighthouse-start-button-container hbox">${this.startButton}</div>
    </div>
    <div $="help-text" class="lighthouse-help-text hidden"></div>
    <div $="warning-text" class="lighthouse-warning-text hidden"></div>
    <div class="lighthouse-form-categories">
      <div class="lighthouse-form-section">
        <div class="lighthouse-form-section-label">${UIStrings.categories}</div>
        <div class="lighthouse-form-elements" $="categories-form-elements"></div>
      </div>
      <div class="lighthouse-form-section">
        <div class="lighthouse-form-section-label">
          <div class="lighthouse-icon-label">${UIStrings.plugins}</div>
        </div>
        <div class="lighthouse-form-elements" $="plugins-form-elements"></div>
      </div>
    </div>
  </form>
</div>
    `;

    this.helpText = fragment.$('help-text');
    this.warningText = fragment.$('warning-text');

    this.populateFormControls(fragment);

    // Populate the Lighthouse mode
    const modeFormElements = fragment.$('mode-form-elements');
    this.populateRuntimeSettingAsRadio('lighthouse.mode', i18nString(UIStrings.mode), modeFormElements);

    this.contentElement.textContent = '';
    this.contentElement.appendChild(fragment.element());
    this.updateMode();
  }

  onResize(): void {
    // Do nothing, overrides parent behavior.
  }

  updateMode(): void {
    const {mode} = this.controller.getFlags();

    let infoTitle: Platform.UIString.LocalizedString;
    let infoDescription: Platform.UIString.LocalizedString;
    let buttonLabel: Platform.UIString.LocalizedString;
    let callback: () => void;

    if (mode === 'timespan') {
      infoTitle = i18nString(UIStrings.lighthouseTimespanReport);
      infoDescription = i18nString(UIStrings.timespanLongDescription);
      buttonLabel = i18nString(UIStrings.startTimespan);
      callback = (): void => {
        this.controller.dispatchEventToListeners(
            Events.RequestLighthouseTimespanStart,
            /* keyboardInitiated */ this.startButton.matches(':focus-visible'),
        );
      };
    } else if (mode === 'snapshot') {
      infoTitle = i18nString(UIStrings.lighthouseSnapshotReport);
      infoDescription = i18nString(UIStrings.snapshotLongDescription);
      buttonLabel = i18nString(UIStrings.analyzeSnapshot);
      callback = (): void => {
        this.controller.dispatchEventToListeners(
            Events.RequestLighthouseStart,
            /* keyboardInitiated */ this.startButton.matches(':focus-visible'),
        );
      };
    } else {
      infoTitle = i18nString(UIStrings.lighthouseNavigationReport);
      infoDescription = i18nString(UIStrings.navigationLongDescription);
      buttonLabel = i18nString(UIStrings.analyzeNavigation);
      callback = (): void => {
        this.controller.dispatchEventToListeners(
            Events.RequestLighthouseStart,
            /* keyboardInitiated */ this.startButton.matches(':focus-visible'),
        );
      };
    }

    this.startButton = UI.UIUtils.createTextButton(
        buttonLabel,
        callback,
        /* className */ '',
        /* primary */ true,
    );

    const startButtonContainer = this.contentElement.querySelector('.lighthouse-start-button-container');
    if (startButtonContainer) {
      startButtonContainer.textContent = '';
      startButtonContainer.appendChild(this.startButton);
    }

    const modeTitle = this.contentElement.querySelector('.lighthouse-mode-title');
    if (modeTitle) {
      modeTitle.textContent = infoTitle;
    }

    const modDescription = this.contentElement.querySelector('.lighthouse-mode-description');
    if (modDescription) {
      modDescription.textContent = infoDescription;
    }
  }
}
