// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as UI from '../../../front_end/ui/legacy/legacy.js';
import {$, $$, click, getBrowserAndPages, goToResource, setCheckBox, waitFor, waitForFunction} from '../../shared/helper.js';

export const getPanel = () => UI.panels.lighthouse;

export async function navigateToLighthouseTab(path: string) {
  await goToResource(path);
  await click('#tab-lighthouse');
  // Make sure the lighthouse start view is shown
  await waitFor('.lighthouse-start-view');
}

export async function isGenerateReportButtonDisabled() {
  const button = await waitFor('.lighthouse-start-view .primary-button');
  return button.evaluate(element => (element as HTMLButtonElement).disabled);
}

/**
 * @return {?Element}
 */
export function getResultsElement() {
  return getPanel().auditResultsElement;
}

/**
 * @return {?Element}
 */
export function getDialogElement() {
  return getPanel().statusView._dialog.contentElement.shadowRoot.querySelector('.lighthouse-view');
}

/**
 * @return {?Element}
 */
export function getSettingsElement() {
  return getPanel().settingsPane.element;
}

/**
 * @return {?Element}
 */
export function getRunButton() {
  const dialog = getPanel().contentElement;
  return dialog && dialog.querySelectorAll('button')[0];
}

/**
 * @return {?Element}
 */
export function getCancelButton() {
  const dialog = getDialogElement();
  return dialog && dialog.querySelectorAll('button')[0];
}

export function openStartAudit() {
  getPanel().renderStartView();
}

export function addStatusListener(onMessage: (message: string) => void) {
  TestRunner.addSniffer(Lighthouse.StatusView.prototype, 'updateStatus', onMessage, true);
}

export async function waitForResults() {
  await waitFor('.lighthouse-results-container .lh-root');
  // HOW TO GET LHR
  TestRunner.addSniffer(
      Lighthouse.LighthousePanel.prototype, 'buildReportUI', (lhr, artifacts) => resolve({lhr, artifacts}));
});
return lhr;
}

export function forcePageAuditabilityCheck() {
  getPanel().controller.recomputePageAuditability();
}

function checkboxStateLabel(checkboxContainer: UI.UIUtils.CheckboxLabel) {
  if (!checkboxContainer) {
    return 'missing';
  }

  const label = checkboxContainer.textElement.textContent;
  const checkedLabel = checkboxContainer.checkboxElement.checked ? 'x' : ' ';
  return `[${checkedLabel}] ${label}`;
}

function buttonStateLabel(button: HTMLButtonElement|undefined) {
  if (!button) {
    return 'missing';
  }

  const enabledLabel = button.disabled ? 'disabled' : 'enabled';
  const hiddenLabel = window.getComputedStyle(button).getPropertyValue('visibility');
  return `${button.textContent}: ${enabledLabel} ${hiddenLabel}`;
}

export function dumpStartAuditState() {
  TestRunner.addResult('\n========== Lighthouse Start Audit State ==========');

  const containerElement = getPanel().contentElement;
  const checkboxes = [...containerElement.querySelectorAll('.checkbox')];

  const toolbarShadowRoot = getSettingsElement().querySelector('.lighthouse-settings-pane > div').shadowRoot;
  for (const checkbox of toolbarShadowRoot.querySelectorAll('.checkbox')) {
    checkboxes.push(checkbox);
  }

  checkboxes.forEach(element => {
    TestRunner.addResult(checkboxStateLabel(element));
  });

  const helpText = containerElement.querySelector('.lighthouse-help-text');
  if (!helpText.classList.contains('hidden')) {
    TestRunner.addResult(`Help text: ${helpText.textContent}`);
  }

  TestRunner.addResult(buttonStateLabel(getRunButton()));
}
