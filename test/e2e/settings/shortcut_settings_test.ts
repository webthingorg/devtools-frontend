// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';

import {enableExperiment, getBrowserAndPages, waitFor, waitForElementWithTextContent, waitForNone} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {getSelectedItemText, QUICK_OPEN_SELECTOR} from '../helpers/quick_open-helpers.js';
import {clickAddShortcutLink, clickShortcutConfirmButton, clickShortcutDeleteButton, clickShortcutResetButton, editShortcutListItem, openSettingsTab, selectKeyboardShortcutPreset, shortcutInputValues, shortcutsForAction} from '../helpers/settings-helpers.js';

describe('Shortcuts Settings tab', async () => {
  it('should update when the shortcuts preset is changed ', async () => {
    await openSettingsTab('Shortcuts');
    await selectKeyboardShortcutPreset('vsCode');

    // wait for a shortcut that vsCode has but the default preset does not
    await waitForElementWithTextContent('CtrlKCtrlS');

    const shortcutsShortcuts = await shortcutsForAction('Shortcuts');
    const settingsShortcuts = await shortcutsForAction('Settings');
    const pauseShortcuts = await shortcutsForAction('Pause script execution');
    assert.deepStrictEqual(shortcutsShortcuts, ['CtrlKCtrlS']);
    assert.deepStrictEqual(settingsShortcuts, ['Shift?', 'Ctrl,']);
    assert.deepStrictEqual(pauseShortcuts, ['Ctrl\\', 'F5', 'ShiftF5']);
  });

  it('should apply new shortcuts when the preset is changed', async () => {
    const {frontend} = getBrowserAndPages();
    await openSettingsTab('Shortcuts');
    await selectKeyboardShortcutPreset('vsCode');

    // wait for a shortcut that vsCode has but the default preset does not
    await waitForElementWithTextContent('CtrlKCtrlS');

    // close the settings dialog
    await frontend.keyboard.press('Escape');

    // use a newly-enabled shortcut to open the command menu
    await frontend.keyboard.press('F1');
    await waitFor(QUICK_OPEN_SELECTOR);

    // make sure the command menu reflects the new shortcuts
    await frontend.keyboard.type('Shortcuts');
    const shortcutsItemText = await getSelectedItemText();

    assert.strictEqual(shortcutsItemText, 'SettingsShortcutsCtrl + K Ctrl + S');
  });

  it('should allow users to open the shortcut editor and view the current shortcut', async () => {
    await enableExperiment('keyboardShortcutEditor');

    await openSettingsTab('Shortcuts');
    await editShortcutListItem('Show Console');

    const shortcutInputsText = await shortcutInputValues();
    assert.deepStrictEqual(shortcutInputsText, ['Ctrl + `']);
  });

  it('should allow users to open the shortcut editor and change and add shortcuts', async () => {
    const {frontend} = getBrowserAndPages();
    await enableExperiment('keyboardShortcutEditor');

    await openSettingsTab('Shortcuts');
    await editShortcutListItem('Show Console');

    await frontend.keyboard.down('Control');
    await frontend.keyboard.press('1');
    await frontend.keyboard.up('Control');

    await clickAddShortcutLink();
    await waitFor('.keybinds-editing .keybinds-shortcut:nth-child(4)');
    await frontend.keyboard.down('Control');
    await frontend.keyboard.press('2');
    await frontend.keyboard.up('Control');

    const shortcutInputsText = await shortcutInputValues();
    assert.deepStrictEqual(shortcutInputsText, ['Ctrl + 1', 'Ctrl + 2']);
    await clickShortcutConfirmButton();
    await waitForNone('.keybinds-editing');

    const shortcuts = await shortcutsForAction('Show Console');
    assert.deepStrictEqual(shortcuts, ['Ctrl1', 'Ctrl2']);
  });

  it('should allow users to open the shortcut editor and delete and reset shortcuts', async () => {
    const {frontend} = getBrowserAndPages();
    await enableExperiment('keyboardShortcutEditor');

    await openSettingsTab('Shortcuts');
    await editShortcutListItem('Show Console');

    await frontend.keyboard.down('Control');
    await frontend.keyboard.press('1');
    await frontend.keyboard.up('Control');

    await clickAddShortcutLink();
    await waitFor('.keybinds-editing .keybinds-shortcut:nth-child(4)');
    await frontend.keyboard.down('Control');
    await frontend.keyboard.press('2');
    await frontend.keyboard.up('Control');

    const shortcutInputsText = await shortcutInputValues();
    assert.deepStrictEqual(shortcutInputsText, ['Ctrl + 1', 'Ctrl + 2']);

    await clickShortcutDeleteButton(0);
    await waitForNone('.keybinds-editing .keybinds-shortcut:nth-child(4)');
    const shortcutInputTextAfterDeletion = await shortcutInputValues();
    assert.deepStrictEqual(shortcutInputTextAfterDeletion, ['Ctrl + 2']);

    await clickShortcutResetButton();
    const shortcutInputTextAfterReset = await shortcutInputValues();
    assert.deepStrictEqual(shortcutInputTextAfterReset, ['Ctrl + `']);

    await clickShortcutConfirmButton();
    await waitForNone('.keybinds-editing');

    const shortcuts = await shortcutsForAction('Show Console');
    assert.deepStrictEqual(shortcuts, ['Ctrl`']);
  });
});
