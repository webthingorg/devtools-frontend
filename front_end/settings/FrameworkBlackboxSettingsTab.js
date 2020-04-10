// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../common/common.js';
import * as UI from '../ui/ui.js';

export const UIStrings = {
  /**
  *@description Header text content in Framework Blackbox Settings Tab of the Settings
  */
  IDS_DEVTOOLS_331f303e56b067dd84abf94c3bd349c4: 'Framework Blackboxing',
  /**
  *@description Text in Framework Blackbox Settings Tab of the Settings
  */
  IDS_DEVTOOLS_d2ef7dcdede23820e315ca1c3425ba4f:
      'Debugger will skip through the scripts and will not stop on exceptions thrown by them.',
  /**
  *@description Text in Framework Blackbox Settings Tab of the Settings
  */
  IDS_DEVTOOLS_ffebb5ad32e2b253aa418b8d7a70028e: 'Blackbox content scripts',
  /**
  *@description Blackbox content scripts title in Framework Blackbox Settings Tab of the Settings
  */
  IDS_DEVTOOLS_c745d3ac390f120535d734cd14e2f6aa: 'Blackbox content scripts (extension scripts in the page)',
  /**
  *@description Blackbox label in Framework Blackbox Settings Tab of the Settings
  */
  IDS_DEVTOOLS_2cce43a6505a5d1bdf7ea98bf7fd1bc8: 'Blackbox',
  /**
  *@description Text to indicate something is not enabled
  */
  IDS_DEVTOOLS_b9f5c797ebbf55adccdd8539a65a0241: 'Disabled',
  /**
  *@description Placeholder text content in Framework Blackbox Settings Tab of the Settings
  */
  IDS_DEVTOOLS_ae25bc3ceebf44be4b59d0ade0e53f0b: 'No blackboxed patterns',
  /**
  *@description Text of the add pattern button in Framework Blackbox Settings Tab of the Settings
  */
  IDS_DEVTOOLS_b791f463c10f80e87e887e1f863f6209: 'Add pattern...',
  /**
  *@description Pattern title in Framework Blackbox Settings Tab of the Settings
  *@example {ad.*?} PH1
  */
  IDS_DEVTOOLS_4a3aaf1edf15288e9ff3994088e2277a: 'Blackbox scripts whose names match \'{PH1}\'',
  /**
  *@description Aria accessible name in Framework Blackbox Settings Tab of the Settings
  */
  IDS_DEVTOOLS_57391192dfa1f247ad015a0fe2eca48e: 'Pattern',
  /**
  *@description Aria accessible name in Framework Blackbox Settings Tab of the Settings
  */
  IDS_DEVTOOLS_b39a035a995fc6597c8eb942210d1527: 'Behavior',
  /**
  *@description Error message in Framework Blackbox settings pane that declares pattern must not be empty
  */
  IDS_DEVTOOLS_34fbf59db640eda5a3c07d59333f1d18: 'Pattern cannot be empty',
  /**
  *@description Error message in Framework Blackbox settings pane that declares pattern already exits
  */
  IDS_DEVTOOLS_dd08f9d5ae3e9ba421754fd31db1a44a: 'Pattern already exists',
  /**
  *@description Error message in Framework Blackbox settings pane that declares pattern must be a valid regular expression
  */
  IDS_DEVTOOLS_87ae3156c118350d6b13cdebc37485e9: 'Pattern must be a valid regular expression',
};
const str_ = Common.i18n.registerUIStrings('settings/FrameworkBlackboxSettingsTab.js', UIStrings);

/**
 * @implements {UI.ListWidget.Delegate}
 * @unrestricted
 */
export class FrameworkBlackboxSettingsTab extends UI.Widget.VBox {
  constructor() {
    super(true);
    this.registerRequiredCSS('settings/frameworkBlackboxSettingsTab.css');

    const header = this.contentElement.createChild('div', 'header');
    header.textContent = Common.i18n.getLocalizedString(str_, UIStrings.IDS_DEVTOOLS_331f303e56b067dd84abf94c3bd349c4);
    UI.ARIAUtils.markAsHeading(header, 1);
    this.contentElement.createChild('div', 'intro').textContent =
        Common.i18n.getLocalizedString(str_, UIStrings.IDS_DEVTOOLS_d2ef7dcdede23820e315ca1c3425ba4f);

    const blackboxContentScripts = this.contentElement.createChild('div', 'blackbox-content-scripts');
    blackboxContentScripts.appendChild(UI.SettingsUI.createSettingCheckbox(
        Common.i18n.getLocalizedString(str_, UIStrings.IDS_DEVTOOLS_ffebb5ad32e2b253aa418b8d7a70028e),
        Common.Settings.Settings.instance().moduleSetting('skipContentScripts'), true));
    blackboxContentScripts.title =
        Common.i18n.getLocalizedString(str_, UIStrings.IDS_DEVTOOLS_c745d3ac390f120535d734cd14e2f6aa);

    this._blackboxLabel = Common.i18n.getLocalizedString(str_, UIStrings.IDS_DEVTOOLS_2cce43a6505a5d1bdf7ea98bf7fd1bc8);
    this._disabledLabel = Common.i18n.getLocalizedString(str_, UIStrings.IDS_DEVTOOLS_b9f5c797ebbf55adccdd8539a65a0241);

    this._list = new UI.ListWidget.ListWidget(this);
    this._list.element.classList.add('blackbox-list');
    this._list.registerRequiredCSS('settings/frameworkBlackboxSettingsTab.css');

    const placeholder = createElementWithClass('div', 'blackbox-list-empty');
    placeholder.textContent =
        Common.i18n.getLocalizedString(str_, UIStrings.IDS_DEVTOOLS_ae25bc3ceebf44be4b59d0ade0e53f0b);
    this._list.setEmptyPlaceholder(placeholder);
    this._list.show(this.contentElement);
    const addPatternButton = UI.UIUtils.createTextButton(
        Common.i18n.getLocalizedString(str_, UIStrings.IDS_DEVTOOLS_b791f463c10f80e87e887e1f863f6209),
        this._addButtonClicked.bind(this), 'add-button');
    this.contentElement.appendChild(addPatternButton);

    this._setting = Common.Settings.Settings.instance().moduleSetting('skipStackFramesPattern');
    this._setting.addChangeListener(this._settingUpdated, this);

    this.setDefaultFocusedElement(addPatternButton);
  }

  /**
   * @override
   */
  wasShown() {
    super.wasShown();
    this._settingUpdated();
  }

  _settingUpdated() {
    this._list.clear();
    const patterns = this._setting.getAsArray();
    for (let i = 0; i < patterns.length; ++i) {
      this._list.appendItem(patterns[i], true);
    }
  }

  _addButtonClicked() {
    this._list.addNewItem(this._setting.getAsArray().length, {pattern: '', disabled: false});
  }

  /**
   * @override
   * @param {*} item
   * @param {boolean} editable
   * @return {!Element}
   */
  renderItem(item, editable) {
    const element = createElementWithClass('div', 'blackbox-list-item');
    const pattern = element.createChild('div', 'blackbox-pattern');
    pattern.textContent = item.pattern;
    pattern.title = Common.i18n.getLocalizedString(
        str_, UIStrings.IDS_DEVTOOLS_4a3aaf1edf15288e9ff3994088e2277a, {PH1: item.pattern});
    element.createChild('div', 'blackbox-separator');
    element.createChild('div', 'blackbox-behavior').textContent =
        item.disabled ? this._disabledLabel : this._blackboxLabel;
    if (item.disabled) {
      element.classList.add('blackbox-disabled');
    }
    return element;
  }

  /**
   * @override
   * @param {*} item
   * @param {number} index
   */
  removeItemRequested(item, index) {
    const patterns = this._setting.getAsArray();
    patterns.splice(index, 1);
    this._setting.setAsArray(patterns);
  }

  /**
   * @override
   * @param {*} item
   * @param {!UI.ListWidget.Editor} editor
   * @param {boolean} isNew
   */
  commitEdit(item, editor, isNew) {
    item.pattern = editor.control('pattern').value.trim();
    item.disabled = editor.control('behavior').value === this._disabledLabel;

    const list = this._setting.getAsArray();
    if (isNew) {
      list.push(item);
    }
    this._setting.setAsArray(list);
  }

  /**
   * @override
   * @param {*} item
   * @return {!UI.ListWidget.Editor}
   */
  beginEdit(item) {
    const editor = this._createEditor();
    editor.control('pattern').value = item.pattern;
    editor.control('behavior').value = item.disabled ? this._disabledLabel : this._blackboxLabel;
    return editor;
  }

  /**
   * @return {!UI.ListWidget.Editor}
   */
  _createEditor() {
    if (this._editor) {
      return this._editor;
    }

    const editor = new UI.ListWidget.Editor();
    this._editor = editor;
    const content = editor.contentElement();

    const titles = content.createChild('div', 'blackbox-edit-row');
    titles.createChild('div', 'blackbox-pattern').textContent =
        Common.i18n.getLocalizedString(str_, UIStrings.IDS_DEVTOOLS_57391192dfa1f247ad015a0fe2eca48e);
    titles.createChild('div', 'blackbox-separator blackbox-separator-invisible');
    titles.createChild('div', 'blackbox-behavior').textContent =
        Common.i18n.getLocalizedString(str_, UIStrings.IDS_DEVTOOLS_b39a035a995fc6597c8eb942210d1527);

    const fields = content.createChild('div', 'blackbox-edit-row');
    const pattern = editor.createInput('pattern', 'text', '/framework\\.js$', patternValidator.bind(this));
    UI.ARIAUtils.setAccessibleName(
        pattern, Common.i18n.getLocalizedString(str_, UIStrings.IDS_DEVTOOLS_57391192dfa1f247ad015a0fe2eca48e));
    fields.createChild('div', 'blackbox-pattern').appendChild(pattern);
    fields.createChild('div', 'blackbox-separator blackbox-separator-invisible');
    const behavior = editor.createSelect('behavior', [this._blackboxLabel, this._disabledLabel], behaviorValidator);
    UI.ARIAUtils.setAccessibleName(
        behavior, Common.i18n.getLocalizedString(str_, UIStrings.IDS_DEVTOOLS_b39a035a995fc6597c8eb942210d1527));
    fields.createChild('div', 'blackbox-behavior').appendChild(behavior);

    return editor;

    /**
     * @param {*} item
     * @param {number} index
     * @param {!HTMLInputElement|!HTMLSelectElement} input
     * @this {FrameworkBlackboxSettingsTab}
     * @return {!UI.ListWidget.ValidatorResult}
     */
    function patternValidator(item, index, input) {
      const pattern = input.value.trim();
      const patterns = this._setting.getAsArray();

      if (!pattern.length) {
        return {
          valid: false,
          errorMessage: Common.i18n.getLocalizedString(str_, UIStrings.IDS_DEVTOOLS_34fbf59db640eda5a3c07d59333f1d18)
        };
      }

      for (let i = 0; i < patterns.length; ++i) {
        if (i !== index && patterns[i].pattern === pattern) {
          return {
            valid: false,
            errorMessage: Common.i18n.getLocalizedString(str_, UIStrings.IDS_DEVTOOLS_dd08f9d5ae3e9ba421754fd31db1a44a)
          };
        }
      }

      let regex;
      try {
        regex = new RegExp(pattern);
      } catch (e) {
      }
      if (!regex) {
        return {
          valid: false,
          errorMessage: Common.i18n.getLocalizedString(str_, UIStrings.IDS_DEVTOOLS_87ae3156c118350d6b13cdebc37485e9)
        };
      }
      return {valid: true};
    }

    /**
     * @param {*} item
     * @param {number} index
     * @param {!HTMLInputElement|!HTMLSelectElement} input
     * @return {!UI.ListWidget.ValidatorResult}
     */
    function behaviorValidator(item, index, input) {
      return {valid: true};
    }
  }
}
