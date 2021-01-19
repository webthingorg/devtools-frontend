// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../common/common.js';
import * as i18n from '../i18n/i18n.js';
import * as UI from '../ui/ui.js';

export const UIStrings = {
  /**
  *@description Header text content in Framework Ignore List Settings Tab of the Settings
  */
  frameworkIgnoreList: 'Framework Ignore List',
  /**
  *@description Text in Framework Ignore List Settings Tab of the Settings
  */
  debuggerWillSkipThroughThe: 'Debugger will skip through the scripts and will not stop on exceptions thrown by them.',
  /**
  *@description Text in Framework Ignore List Settings Tab of the Settings
  */
  ignoreListContentScripts: 'Add content scripts to ignore list',
  /**
  *@description Ignore List content scripts title in Framework Ignore List Settings Tab of the Settings
  */
  ignoreListContentScriptsExtension: 'Add content scripts to ignore list (extension scripts in the page)',
  /**
  *@description Ignore List label in Framework Ignore List Settings Tab of the Settings
  */
  ignoreList: 'Ignore List',
  /**
  *@description Text to indicate something is not enabled
  */
  disabled: 'Disabled',
  /**
  *@description Placeholder text content in Framework Ignore List Settings Tab of the Settings
  */
  noIgnoreListPatterns: 'No ignore list patterns',
  /**
  *@description Text of the add pattern button in Framework Ignore List Settings Tab of the Settings
  */
  addPattern: 'Add pattern...',
  /**
  *@description Aria accessible name in Framework Ignore List Settings Tab of the Settings
  */
  addFilenamePattern: 'Add filename pattern',
  /**
  *@description Pattern title in Framework Ignore List Settings Tab of the Settings
  *@example {ad.*?} PH1
  */
  ignoreScriptsWhoseNamesMatchS: 'Ignore scripts whose names match \'{PH1}\'',
  /**
  *@description Aria accessible name in Framework Ignore List Settings Tab of the Settings
  */
  pattern: 'Pattern',
  /**
  *@description Aria accessible name in Framework Ignore List Settings Tab of the Settings
  */
  behavior: 'Behavior',
  /**
  *@description Error message in Framework Ignore List settings pane that declares pattern must not be empty
  */
  patternCannotBeEmpty: 'Pattern cannot be empty',
  /**
  *@description Error message in Framework Ignore List settings pane that declares pattern already exits
  */
  patternAlreadyExists: 'Pattern already exists',
  /**
  *@description Error message in Framework Ignore List settings pane that declares pattern must be a valid regular expression
  */
  patternMustBeAValidRegular: 'Pattern must be a valid regular expression',
};
const str_ = i18n.i18n.registerUIStrings('settings/FrameworkIgnoreListSettingsTab.js', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);


/** @type {!FrameworkIgnoreListSettingsTab} */
let frameworkIgnoreListSettingsTabInstance;

/**
 * @implements {UI.ListWidget.Delegate<Common.Settings.RegExpSettingItem>}
 */
export class FrameworkIgnoreListSettingsTab extends UI.Widget.VBox {
  /** @private */
  constructor() {
    super(true);
    this.registerRequiredCSS('settings/frameworkIgnoreListSettingsTab.css', {enableLegacyPatching: true});

    const header = this.contentElement.createChild('div', 'header');
    header.textContent = i18nString(UIStrings.frameworkIgnoreList);
    UI.ARIAUtils.markAsHeading(header, 1);
    this.contentElement.createChild('div', 'intro').textContent = i18nString(UIStrings.debuggerWillSkipThroughThe);

    const ignoreListContentScripts = this.contentElement.createChild('div', 'ignore-list-content-scripts');
    ignoreListContentScripts.appendChild(UI.SettingsUI.createSettingCheckbox(
        i18nString(UIStrings.ignoreListContentScripts),
        Common.Settings.Settings.instance().moduleSetting('skipContentScripts'), true));
    UI.Tooltip.Tooltip.install(ignoreListContentScripts, i18nString(UIStrings.ignoreListContentScriptsExtension));

    this._ignoreListLabel = i18nString(UIStrings.ignoreList);
    this._disabledLabel = i18nString(UIStrings.disabled);

    this._list = new UI.ListWidget.ListWidget(this);
    this._list.element.classList.add('ignore-list');
    this._list.registerRequiredCSS('settings/frameworkIgnoreListSettingsTab.css', {enableLegacyPatching: true});

    const placeholder = document.createElement('div');
    placeholder.classList.add('ignore-list-empty');
    placeholder.textContent = i18nString(UIStrings.noIgnoreListPatterns);
    this._list.setEmptyPlaceholder(placeholder);
    this._list.show(this.contentElement);
    const addPatternButton =
        UI.UIUtils.createTextButton(i18nString(UIStrings.addPattern), this._addButtonClicked.bind(this), 'add-button');
    UI.ARIAUtils.setAccessibleName(addPatternButton, i18nString(UIStrings.addFilenamePattern));
    this.contentElement.appendChild(addPatternButton);

    /** @type {!Common.Settings.RegExpSetting} */
    this._setting = /** @type {!Common.Settings.RegExpSetting} */ (
        Common.Settings.Settings.instance().moduleSetting('skipStackFramesPattern'));
    this._setting.addChangeListener(this._settingUpdated, this);

    this.setDefaultFocusedElement(addPatternButton);
  }

  /**
   * @param {{forceNew: ?boolean}} opts
   */
  static instance(opts = {forceNew: null}) {
    const {forceNew} = opts;
    if (!frameworkIgnoreListSettingsTabInstance || forceNew) {
      frameworkIgnoreListSettingsTabInstance = new FrameworkIgnoreListSettingsTab();
    }

    return frameworkIgnoreListSettingsTabInstance;
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
   * @param {!Common.Settings.RegExpSettingItem} item
   * @param {boolean} editable
   * @return {!Element}
   */
  renderItem(item, editable) {
    const element = document.createElement('div');
    element.classList.add('ignore-list-item');
    const pattern = element.createChild('div', 'ignore-list-pattern');
    pattern.textContent = item.pattern;
    UI.Tooltip.Tooltip.install(pattern, i18nString(UIStrings.ignoreScriptsWhoseNamesMatchS, {PH1: item.pattern}));
    element.createChild('div', 'ignore-list-separator');
    element.createChild('div', 'ignore-list-behavior').textContent =
        item.disabled ? this._disabledLabel : this._ignoreListLabel;
    if (item.disabled) {
      element.classList.add('ignore-list-disabled');
    }
    return element;
  }

  /**
   * @override
   * @param {!Common.Settings.RegExpSettingItem} item
   * @param {number} index
   */
  removeItemRequested(item, index) {
    const patterns = this._setting.getAsArray();
    patterns.splice(index, 1);
    this._setting.setAsArray(patterns);
  }

  /**
   * @override
   * @param {!Common.Settings.RegExpSettingItem} item
   * @param {!UI.ListWidget.Editor<!Common.Settings.RegExpSettingItem>} editor
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
   * @param {!Common.Settings.RegExpSettingItem} item
   * @return {!UI.ListWidget.Editor<!Common.Settings.RegExpSettingItem>}
   */
  beginEdit(item) {
    const editor = this._createEditor();
    editor.control('pattern').value = item.pattern;
    editor.control('behavior').value = item.disabled ? this._disabledLabel : this._ignoreListLabel;
    return editor;
  }

  /**
   * @return {!UI.ListWidget.Editor<!Common.Settings.RegExpSettingItem>}
   */
  _createEditor() {
    if (this._editor) {
      return this._editor;
    }

    const editor = new UI.ListWidget.Editor();
    this._editor = editor;
    const content = editor.contentElement();

    const titles = content.createChild('div', 'ignore-list-edit-row');
    titles.createChild('div', 'ignore-list-pattern').textContent = i18nString(UIStrings.pattern);
    titles.createChild('div', 'ignore-list-separator ignore-list-separator-invisible');
    titles.createChild('div', 'ignore-list-behavior').textContent = i18nString(UIStrings.behavior);

    const fields = content.createChild('div', 'ignore-list-edit-row');
    const pattern = editor.createInput('pattern', 'text', '/framework\\.js$', patternValidator.bind(this));
    UI.ARIAUtils.setAccessibleName(pattern, i18nString(UIStrings.pattern));
    fields.createChild('div', 'ignore-list-pattern').appendChild(pattern);
    fields.createChild('div', 'ignore-list-separator ignore-list-separator-invisible');
    const behavior = editor.createSelect('behavior', [this._ignoreListLabel, this._disabledLabel], behaviorValidator);
    UI.ARIAUtils.setAccessibleName(behavior, i18nString(UIStrings.behavior));
    fields.createChild('div', 'ignore-list-behavior').appendChild(behavior);

    return editor;

    /**
     * @param {!Common.Settings.RegExpSettingItem} item
     * @param {number} index
     * @param {!HTMLInputElement|!HTMLSelectElement} input
     * @this {FrameworkIgnoreListSettingsTab}
     * @return {!UI.ListWidget.ValidatorResult}
     */
    function patternValidator(item, index, input) {
      const pattern = input.value.trim();
      const patterns = this._setting.getAsArray();

      if (!pattern.length) {
        return {valid: false, errorMessage: i18nString(UIStrings.patternCannotBeEmpty)};
      }

      for (let i = 0; i < patterns.length; ++i) {
        if (i !== index && patterns[i].pattern === pattern) {
          return {valid: false, errorMessage: i18nString(UIStrings.patternAlreadyExists)};
        }
      }

      let regex;
      try {
        regex = new RegExp(pattern);
      } catch (e) {
      }
      if (!regex) {
        return {valid: false, errorMessage: i18nString(UIStrings.patternMustBeAValidRegular)};
      }
      return {valid: true, errorMessage: undefined};
    }

    /**
     * @param {!Common.Settings.RegExpSettingItem} item
     * @param {number} index
     * @param {!HTMLInputElement|!HTMLSelectElement} input
     * @return {!UI.ListWidget.ValidatorResult}
     */
    function behaviorValidator(item, index, input) {
      return {valid: true, errorMessage: undefined};
    }
  }
}
