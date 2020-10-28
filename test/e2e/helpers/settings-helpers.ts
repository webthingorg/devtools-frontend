// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import {ElementHandle, JSHandle} from 'puppeteer';

import {$, $$, $$textContent, click, getBrowserAndPages, getElementPosition, selectOption, waitFor} from '../../shared/helper.js';

export const openPanelViaMoreTools = async (panelTitle: string) => {
  const {frontend} = getBrowserAndPages();

  const moreToolsSelector = '[aria-label="More tools"]';
  const contextMenuItemSelector = `.soft-context-menu-item[aria-label="${panelTitle}"]`;
  const panelSelector = `.view-container[aria-label="${panelTitle} panel"]`;

  // Head to the triple dot menu.
  await click('.toolbar-button[aria-label="Customize and control DevTools"]');

  // Hover over the “More Tools” option.
  const moreTools = await getElementPosition(moreToolsSelector);
  await frontend.mouse.move(moreTools.x, moreTools.y);

  // Choose the desired menu item and wait for the corresponding panel
  // to appear.
  await waitFor(contextMenuItemSelector);
  await click(contextMenuItemSelector);
  await waitFor(panelSelector);
};

export const openSettingsTab = async (tabTitle: string) => {
  const gearIconSelector = '.toolbar-button[aria-label="Settings"]';
  const settingsMenuSelector = `.tabbed-pane-header-tab[aria-label="${tabTitle}"]`;
  const panelSelector = `.view-container[aria-label="${tabTitle} panel"]`;

  // Click on the Settings Gear toolbar icon.
  await click(gearIconSelector);

  // Click on the Settings tab and wait for the panel to appear.
  await waitFor(settingsMenuSelector);
  await click(settingsMenuSelector);
  await waitFor(panelSelector);
};

export const togglePreferenceInSettingsTab = async (label: string) => {
  await openSettingsTab('Preferences');
  await click(`[aria-label="${label}"`);
  await click('.dialog-close-button');
};

export const selectKeyboardShortcutPreset = async (option: string) => {
  const presetSelectElement = await $('.keybinds-set-select select');
  await selectOption(presetSelectElement as JSHandle<HTMLSelectElement>, option);
};

export const shortcutListItemElement = async (shortcutText: string) => {
  const textMatches = await $$textContent(shortcutText);
  let titleElement;
  for (const matchingElement of textMatches) {
    // some actions have the same name as categories, so we have to make sure we've got the right one
    if (await matchingElement.evaluate(element => element.matches('.keybinds-action-name'))) {
      titleElement = matchingElement;
      break;
    }
  }
  const listItemElement = await (titleElement as ElementHandle).getProperty('parentElement');
  return (listItemElement as ElementHandle).asElement();
};

export const editShortcutListItem = async (shortcutText: string) => {
  const editButtonSelector = '[aria-label="Edit shortcut"]';
  const listItemElement = await shortcutListItemElement(shortcutText) as ElementHandle;

  await click(listItemElement);
  await waitFor(editButtonSelector, listItemElement);
  await click(editButtonSelector, {root: listItemElement});

  await waitFor('.keybinds-editing');
};

export const shortcutsForAction = async (shortcutText: string) => {
  const listItemElement = await shortcutListItemElement(shortcutText);
  const shortcutElements = await ((listItemElement as ElementHandle).$$('.keybinds-shortcut'));
  return Promise.all(shortcutElements.map(async element => (await element.getProperty('textContent')).jsonValue()));
};

export const shortcutInputValues = async () => {
  const shortcutInputs = await $$('.keybinds-editing input');
  if (!shortcutInputs.length) {
    assert.fail('shortcut input not found');
  }
  const shortcutValues = await Promise.all(shortcutInputs.map(async input => input.getProperty('value')));
  return Promise.all(shortcutValues.map(async value => value.jsonValue()));
};

export const clickAddShortcutLink = async () => {
  const addShortcutLinkSelector = '.keybinds-editing [role="link"]';
  await click(addShortcutLinkSelector);
};

export const clickShortcutConfirmButton = async () => {
  const confirmButtonSelector = '[aria-label="Confirm changes"]';
  await click(confirmButtonSelector);
};

export const clickShortcutResetButton = async () => {
  const resetButtonSelector = '[aria-label="Reset shortcuts for action"]';
  await click(resetButtonSelector);
};

export const clickShortcutDeleteButton = async (index: number) => {
  const deleteButtons = await $$('[aria-label="Remove shortcut"]');
  if (deleteButtons.length <= index) {
    assert.fail(`shortcut delete button #${index} not found`);
  }
  await click(deleteButtons[index]);
};
