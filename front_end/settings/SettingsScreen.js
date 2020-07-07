/*
 * Copyright (C) 2013 Google Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import * as Common from '../common/common.js';
import * as Components from '../components/components.js';
import * as Host from '../host/host.js';
import * as TextUtils from '../text_utils/text_utils.js';
import * as UI from '../ui/ui.js';

/**
 * @implements {UI.View.ViewLocationResolver}
 * @unrestricted
 */
export class SettingsScreen extends UI.Widget.VBox {
  constructor() {
    super(true);
    this.registerRequiredCSS('settings/settingsScreen.css');

    this.contentElement.classList.add('settings-window-main');
    this.contentElement.classList.add('vbox');

    const settingsLabelElement = createElement('div');
    const settingsTitleElement =
        UI.Utils.createShadowRootWithCoreStyles(settingsLabelElement, 'settings/settingsScreen.css')
            .createChild('div', 'settings-window-title');

    UI.ARIAUtils.markAsHeading(settingsTitleElement, 1);
    settingsTitleElement.textContent = ls`Settings`;

    this._tabbedLocation = UI.ViewManager.ViewManager.instance().createTabbedLocation(
        () => SettingsScreen._revealSettingsScreen(), 'settings-view');
    const tabbedPane = this._tabbedLocation.tabbedPane();
    tabbedPane.leftToolbar().appendToolbarItem(new UI.Toolbar.ToolbarItem(settingsLabelElement));
    tabbedPane.setShrinkableTabs(false);
    tabbedPane.makeVerticalTabLayout();

    if (Root.Runtime.experiments.isEnabled('settingsSearch')) {
      const settingsSearchElement = createElement('div');
      const settingsSearchRoot =
          UI.Utils.createShadowRootWithCoreStyles(settingsSearchElement, 'settings/settingsScreen.css');

      this.settingsSearchInput = UI.UIUtils.createInput('settings-search-input');
      this.settingsSearchInput.addEventListener('input', this._search.bind(this));
      this.settingsSearchInput.placeholder = 'Search';
      settingsSearchRoot.appendChild(this.settingsSearchInput);

      tabbedPane.leftToolbar().element.insertAdjacentElement('afterend', settingsSearchElement);
    }

    if (!Root.Runtime.experiments.isEnabled('customKeyboardShortcuts')) {
      const shortcutsView = new UI.View.SimpleView(ls`Shortcuts`);
      self.UI.shortcutsScreen.createShortcutsTabView().show(shortcutsView.element);
      this._tabbedLocation.appendView(shortcutsView);
    }
    tabbedPane.show(this.contentElement);
    tabbedPane.selectTab('preferences');
    tabbedPane.addEventListener(UI.TabbedPane.Events.TabInvoked, this._tabInvoked, this);
    this._reportTabOnReveal = false;
  }

  /**
   * @return {!SettingsScreen}
   */
  static _revealSettingsScreen() {
    /** @type {!SettingsScreen} */
    const settingsScreen = self.runtime.sharedInstance(SettingsScreen);
    if (settingsScreen.isShowing()) {
      return settingsScreen;
    }

    settingsScreen._reportTabOnReveal = true;
    const dialog = new UI.Dialog.Dialog();
    dialog.contentElement.tabIndex = -1;
    dialog.addCloseButton();
    dialog.setOutsideClickCallback(() => {});
    dialog.setPointerEventsBehavior(UI.GlassPane.PointerEventsBehavior.PierceGlassPane);
    dialog.setOutsideTabIndexBehavior(UI.Dialog.OutsideTabIndexBehavior.PreserveMainViewTabIndex);
    settingsScreen.show(dialog.contentElement);
    dialog.show();

    return settingsScreen;
  }

  /**
   * @param {{name: (string|undefined), focusSearchBox: (boolean|undefined)}=} options
   */
  static async _showSettingsScreen(options = {}) {
    const {name, focusSearchBox} = options;
    const settingsScreen = SettingsScreen._revealSettingsScreen();

    settingsScreen._selectTab(name || 'preferences');
    const tabbedPane = settingsScreen._tabbedLocation.tabbedPane();
    await tabbedPane.waitForTabElementUpdate();
    if (focusSearchBox) {
      if (Root.Runtime.experiments.isEnabled('settingsSearch')) {
        settingsScreen.settingsSearchInput.focus();
      } else {
        tabbedPane.focusSelectedTabHeader();
      }
    } else {
      tabbedPane.focus();
    }
  }

  /**
   * @override
   * @param {string} locationName
   * @return {?UI.View.ViewLocation}
   */
  resolveLocation(locationName) {
    return this._tabbedLocation;
  }

  /**
   * @param {string} name
   */
  _selectTab(name) {
    this._tabbedLocation.tabbedPane().selectTab(name, /* userGesture */ true);
  }

  /**
   * @param {!Common.EventTarget.EventTargetEvent} event
   */
  _tabInvoked(event) {
    const eventData = /** @type {!UI.TabbedPane.EventData} */ (event.data);
    if (!eventData.isUserGesture) {
      return;
    }

    const prevTabId = eventData.prevTabId;
    const tabId = eventData.tabId;
    if (!this._reportTabOnReveal && prevTabId && prevTabId === tabId) {
      return;
    }

    this._reportTabOnReveal = false;
    this._reportSettingsPanelShown(tabId);
  }

  /**
   * @param {string} tabId
   */
  _reportSettingsPanelShown(tabId) {
    if (tabId === ls`Shortcuts`) {
      Host.userMetrics.settingsPanelShown('shortcuts');
      return;
    }

    Host.userMetrics.settingsPanelShown(tabId);
  }

  /**
   * @param {!Common.EventTarget.EventTargetEvent} event
   */
  _search(event) {
    if (!Root.Runtime.experiments.isEnabled('settingsSearch')) {
      return;
    }

    const filter = this.settingsSearchInput.value.trim().toLocaleLowerCase();
    const tabbedPane = this._tabbedLocation.tabbedPane();
    const tabIds = tabbedPane.tabIds();
    for (const id of tabIds) {
      const view = tabbedPane.tabView(id);
      if (!(view instanceof UI.ViewManager.ContainerWidget)) {
        continue;
      }

      view.widget().then(tabView => {
        if (!(tabView instanceof SettingsTab)) {
          return;
        }

        const filterMatches = tabView.applyFilter(filter);
        if (filter && filterMatches > 0) {
          tabbedPane.setTabBubble(id, filterMatches);
        } else {
          tabbedPane.hideTabBubble(id);
        }
      });
    }
  }
}

/**
 * @unrestricted
 */
class SettingsTab extends UI.Widget.VBox {
  /**
   * @param {string} name
   * @param {string=} id
   */
  constructor(name, id) {
    super();
    this.element.classList.add('settings-tab-container');
    if (id) {
      this.element.id = id;
    }
    const header = this.element.createChild('header');
    header.createChild('h1').createTextChild(name);
    this.containerElement = this.element.createChild('div', 'settings-container-wrapper')
                                .createChild('div', 'settings-tab settings-content settings-container');

    this._noResultsElement = this.element.createChild('div', 'settings-search-preferences-no-results');
    this._noResultsElement.textContent = ls`No search results found for this tab.`;
    this._noResultsElement.classList.add('hidden');
  }

  /**
   *  @param {string=} name
   *  @return {!Element}
   */
  _appendSection(name) {
    const block = this.containerElement.createChild('div', 'settings-block');
    if (name) {
      UI.ARIAUtils.markAsGroup(block);
      const title = block.createChild('div', 'settings-section-title');
      title.textContent = name;
      UI.ARIAUtils.markAsHeading(title, 2);
      UI.ARIAUtils.setAccessibleName(block, name);
    }
    return block;
  }

  /**
   * @param {string} filter
   * @return {number}
   */
  applyFilter(filter) {
    return 0;
  }
}

/**
 * @unrestricted
 */
export class GenericSettingsTab extends SettingsTab {
  constructor() {
    super(ls`Preferences`, 'preferences-tab-content');

    /** @const */
    const explicitSectionOrder = [
      '', 'Appearance', 'Sources', 'Elements', 'Network', 'Performance', 'Console', 'Extensions', 'Persistence',
      'Debugger', 'Global'
    ];

    // Sections only available if their corresponding experiment is enabled
    /** @type {!Array<{name: string, experiment: string}>} */
    const experimentalSections = [{name: 'Grid', experiment: 'cssGridFeatures'}];


    /** @type {!Map<string, !Element>} */
    this._nameToSection = new Map();
    /** @type {!Map<!Element, !Array<!UI.SettingsUI.SettingUI>} */
    this._sectionToControls = new Map();
    /** @type {!Map<!Element, !Array<!Object>} */
    this._sectionToChanges = new Map();

    for (const sectionName of explicitSectionOrder) {
      this._createSectionElement(sectionName);
    }
    for (const section of experimentalSections) {
      if (Root.Runtime.experiments.isEnabled(section.experiment)) {
        this._createSectionElement(section.name);
      }
    }
    self.runtime.extensions('setting').forEach(this._addSetting.bind(this));
    self.runtime.extensions(UI.SettingsUI.SettingUI).forEach(this._addSettingCustomUI.bind(this));

    this._reloadButton = UI.UIUtils.createTextButton(ls`Restore defaults and reload`, restoreAndReload);
    this._appendSection().appendChild(this._reloadButton);

    function restoreAndReload() {
      Common.Settings.Settings.instance().clearAll();
      Components.Reload.reload();
    }
  }

  /**
   * @param {!Root.Runtime.Extension} extension
   * @return {boolean}
   */
  static isSettingVisible(extension) {
    const descriptor = extension.descriptor();
    if (!('title' in descriptor)) {
      return false;
    }
    if (!('category' in descriptor)) {
      return false;
    }
    return true;
  }

  /**
   * @param {!Element} sectionElement
   * @param {!Element} settingControl
   */
  _mapSectionToControl(sectionElement, settingControl) {
    if (!this._sectionToControls.get(sectionElement)) {
      this._sectionToControls.set(sectionElement, []);
    }

    this._sectionToControls.get(sectionElement).push(settingControl);
  }

  /**
   * @param {!Root.Runtime.Extension} extension
   */
  _addSetting(extension) {
    if (!GenericSettingsTab.isSettingVisible(extension)) {
      return;
    }
    const sectionElement = this._sectionElement(extension.descriptor()['category']);
    if (!sectionElement) {
      return;
    }
    const setting = Common.Settings.Settings.instance().moduleSetting(extension.descriptor()['settingName']);
    const settingControl = UI.SettingsUI.createControlForSetting(setting);
    if (settingControl) {
      this._mapSectionToControl(sectionElement, settingControl);
      sectionElement.appendChild(settingControl.element());
    }
  }

  /**
   * @param {!Root.Runtime.Extension} extension
   */
  _addSettingCustomUI(extension) {
    const descriptor = extension.descriptor();
    const sectionName = descriptor['category'] || '';
    extension.instance().then(appendCustomSetting.bind(this));

    /**
     * @param {!Object} object
     * @this {GenericSettingsTab}
     */
    function appendCustomSetting(object) {
      const settingUI = /** @type {!UI.SettingsUI.SettingUI} */ (object);
      const element = settingUI.element();
      if (element) {
        let sectionElement = this._sectionElement(sectionName);
        if (!sectionElement) {
          sectionElement = this._createSectionElement(sectionName);
        }
        this._mapSectionToControl(sectionElement, settingUI);
        sectionElement.appendChild(element);
      }
    }
  }

  /**
   * @param {string} sectionName
   * @return {!Element}
   */
  _createSectionElement(sectionName) {
    const uiSectionName = sectionName && Common.UIString.UIString(sectionName);
    const sectionElement = this._appendSection(uiSectionName);
    this._nameToSection.set(sectionName, sectionElement);
    this._sectionToChanges.set(sectionElement, []);
    return sectionElement;
  }

  /**
   * @param {string} sectionName
   * @return {?Element}
   */
  _sectionElement(sectionName) {
    return this._nameToSection.get(sectionName) || null;
  }

  /**
   * @override
   * @param {string} filter
   * @return {number}
   */
  applyFilter(filter) {
    let allMatches = 0;

    this._noResultsElement.classList.add('hidden');
    this._reloadButton.classList.remove('hidden', 'settings-search-match-outline');
    if (filter) {
      if (this._reloadButton.textContent.toLocaleLowerCase().includes(filter)) {
        this._reloadButton.classList.add('settings-search-match-outline');
      } else {
        this._reloadButton.classList.add('hidden');
      }
    }

    for (const [sectionName, sectionElement] of this._nameToSection) {
      UI.UIUtils.revertDomChanges(this._sectionToChanges.get(sectionElement));
      this._sectionToChanges.set(sectionElement, []);
      sectionElement.classList.remove('hidden');

      const sectionControls = this._sectionToControls.get(sectionElement);
      if (!sectionControls) {
        continue;
      }

      let matches = 0;
      let sectionNameMatch = false;

      if (filter) {
        const sectionNameIndex = sectionName.toLocaleLowerCase().indexOf(filter);
        if (sectionNameIndex !== -1) {
          sectionNameMatch = true;
          matches++;
          UI.UIUtils.highlightRangesWithStyleClass(
              sectionElement.firstChild, [new TextUtils.TextRange.SourceRange(sectionNameIndex, filter.length)],
              'highlighted-match', this._sectionToChanges.get(sectionElement));
        }
      }

      for (const settingControl of sectionControls) {
        const showControl = settingControl.applyFilter(filter);
        if (showControl) {
          matches++;

        } else if (sectionNameMatch) {
          // If the section header name is a search result,
          // always show all the contents of the section
          settingControl.applyFilter('');
        }
      }

      if (matches === 0) {
        sectionElement.classList.add('hidden');
      }

      allMatches += matches;
    }

    if (filter && allMatches === 0) {
      this._noResultsElement.classList.remove('hidden');
    }
    return allMatches;
  }
}

/**
 * @unrestricted
 */
export class ExperimentsSettingsTab extends SettingsTab {
  constructor() {
    super(Common.UIString.UIString('Experiments'), 'experiments-tab-content');

    /** @type {!Map<!Element, !Array<!Object>>} */
    this._experimentToDomChanges = new Map();

    const experiments = Root.Runtime.experiments.allConfigurableExperiments().sort();
    const unstableExperiments = experiments.filter(e => e.unstable);
    const stableExperiments = experiments.filter(e => !e.unstable);

    if (stableExperiments.length) {
      this._experimentsSection = this._appendSection();
      const warningMessage = Common.UIString.UIString('These experiments could be dangerous and may require restart.');
      this._experimentsSection.appendChild(this._createExperimentsWarningSubsection(warningMessage));

      this._experimentsList = this._experimentsSection.createChild('div');
      for (const experiment of stableExperiments) {
        const experimentCheckbox = this._createExperimentCheckbox(experiment);
        this._experimentsList.appendChild(experimentCheckbox);
        this._experimentToDomChanges.set(experimentCheckbox, []);
      }
    }

    if (unstableExperiments.length) {
      this._unstableSection = this._appendSection();
      const warningMessage =
          Common.UIString.UIString('These experiments are particularly unstable. Enable at your own risk.');
      this._unstableSection.appendChild(this._createExperimentsWarningSubsection(warningMessage));

      this._unstableList = this._unstableSection.createChild('div');
      for (const experiment of unstableExperiments) {
        const experimentCheckbox = this._createExperimentCheckbox(experiment);
        this._unstableList.appendChild(experimentCheckbox);
        this._experimentToDomChanges.set(experimentCheckbox, []);
      }
    }
  }

  /**
   * @param {string} warningMessage
   * @return {!Element} element
   */
  _createExperimentsWarningSubsection(warningMessage) {
    const subsection = createElement('div');
    const warning = subsection.createChild('span', 'settings-experiments-warning-subsection-warning');
    warning.textContent = Common.UIString.UIString('WARNING:');
    subsection.createTextChild(' ');
    const message = subsection.createChild('span', 'settings-experiments-warning-subsection-message');
    message.textContent = warningMessage;
    return subsection;
  }

  _createExperimentCheckbox(experiment) {
    const label = UI.UIUtils.CheckboxLabel.create(Common.UIString.UIString(experiment.title), experiment.isEnabled());
    const input = label.checkboxElement;
    input.name = experiment.name;
    function listener() {
      experiment.setEnabled(input.checked);
    }
    input.addEventListener('click', listener, false);

    const p = createElement('p');
    p.className = experiment.unstable && !experiment.isEnabled() ? 'settings-experiment-unstable' : '';
    p.appendChild(label);
    return p;
  }

  /**
   * @override
   * @param {string} filter
   * @return {number}
   */
  applyFilter(filter) {
    let allMatches = 0;
    this._noResultsElement.classList.add('hidden');

    if (this._experimentsSection && this._experimentsList) {
      this._experimentsSection.classList.remove('hidden');
      const experimentsCount = this._applyFilterToList(this._experimentsList, filter);
      if (experimentsCount === 0) {
        this._experimentsSection.classList.add('hidden');
      }

      allMatches += experimentsCount;
    }

    if (this._unstableSection && this._unstableList) {
      this._unstableSection.classList.remove('hidden');
      const unstableCount = this._applyFilterToList(this._unstableList, filter);

      if (unstableCount === 0) {
        this._unstableSection.classList.add('hidden');
      }

      allMatches += unstableCount;
    }

    if (allMatches === 0) {
      this._noResultsElement.classList.remove('hidden');
    }
    return allMatches;
  }

  /**
   * @param {!Element} experimentList
   * @param {string} filter
   * @return {number}
   */
  _applyFilterToList(experimentList, filter) {
    let allMatches = 0;

    for (const element of experimentList.children) {
      UI.UIUtils.revertDomChanges(this._experimentToDomChanges.get(element));
      this._experimentToDomChanges.set(element, []);
      element.classList.remove('hidden');

      const labelTextElement = element.children[0].textElement;
      const filterIndex = labelTextElement.textContent.toLocaleLowerCase().indexOf(filter);
      if (filterIndex === -1) {
        element.classList.add('hidden');
        continue;
      }

      UI.UIUtils.highlightRangesWithStyleClass(
          labelTextElement, [new TextUtils.TextRange.SourceRange(filterIndex, filter.length)], 'highlighted-match',
          this._experimentToDomChanges.get(element));

      allMatches += 1;
    }

    return allMatches;
  }
}

/**
 * @implements {UI.ActionDelegate.ActionDelegate}
 * @unrestricted
 */
export class ActionDelegate {
  /**
   * @override
   * @param {!UI.Context.Context} context
   * @param {string} actionId
   * @return {boolean}
   */
  handleAction(context, actionId) {
    let screen;
    switch (actionId) {
      case 'settings.show':
        SettingsScreen._showSettingsScreen({focusSearchBox: true});
        return true;
      case 'settings.documentation':
        Host.InspectorFrontendHost.InspectorFrontendHostInstance.openInNewTab(
            UI.UIUtils.addReferrerToURL('https://developers.google.com/web/tools/chrome-devtools/'));
        return true;
      case 'settings.shortcuts':
        Host.userMetrics.actionTaken(Host.UserMetrics.Action.SettingsOpenedFromMenu);
        screen = {name: ls`Shortcuts`, focusSearchBox: true};
        if (Root.Runtime.experiments.isEnabled('customKeyboardShortcuts')) {
          screen = {name: 'keybinds', focusSearchBox: true};
        }
        SettingsScreen._showSettingsScreen(screen);
        return true;
    }
    return false;
  }
}

/**
 * @implements {Common.Revealer.Revealer}
 * @unrestricted
 */
export class Revealer {
  /**
   * @override
   * @param {!Object} object
   * @return {!Promise}
   */
  reveal(object) {
    console.assert(object instanceof Common.Settings.Setting);
    const setting = /** @type {!Common.Settings.Setting} */ (object);
    let success = false;

    self.runtime.extensions('setting').forEach(revealModuleSetting);
    self.runtime.extensions(UI.SettingsUI.SettingUI).forEach(revealSettingUI);
    self.runtime.extensions('view').forEach(revealSettingsView);

    return success ? Promise.resolve() : Promise.reject();

    /**
     * @param {!Root.Runtime.Extension} extension
     */
    function revealModuleSetting(extension) {
      if (!GenericSettingsTab.isSettingVisible(extension)) {
        return;
      }
      if (extension.descriptor()['settingName'] === setting.name) {
        Host.InspectorFrontendHost.InspectorFrontendHostInstance.bringToFront();
        SettingsScreen._showSettingsScreen();
        success = true;
      }
    }

    /**
     * @param {!Root.Runtime.Extension} extension
     */
    function revealSettingUI(extension) {
      const settings = extension.descriptor()['settings'];
      if (settings && settings.indexOf(setting.name) !== -1) {
        Host.InspectorFrontendHost.InspectorFrontendHostInstance.bringToFront();
        SettingsScreen._showSettingsScreen();
        success = true;
      }
    }

    /**
     * @param {!Root.Runtime.Extension} extension
     */
    function revealSettingsView(extension) {
      const location = extension.descriptor()['location'];
      if (location !== 'settings-view') {
        return;
      }
      const settings = extension.descriptor()['settings'];
      if (settings && settings.indexOf(setting.name) !== -1) {
        Host.InspectorFrontendHost.InspectorFrontendHostInstance.bringToFront();
        SettingsScreen._showSettingsScreen({name: extension.descriptor()['id']});
        success = true;
      }
    }
  }
}
