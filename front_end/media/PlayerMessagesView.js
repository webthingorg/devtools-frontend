// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @unrestricted
 */
Media.PlayerMessagesView = class extends UI.VBox {
  constructor() {
    super();
    this.registerRequiredCSS('media/playerMessagesView.css');

    this._headerPanel = this.contentElement.createChild('div', 'media-messages-header');
    this._bodyPanel = this.contentElement.createChild('div', 'media-messages-body');
    this._bodyPanelStyle = this.contentElement.createChild('style');

    this._buildToolbar();
  }

  _buildToolbar() {
    const toolbar = new UI.Toolbar('media-messages-toolbar', this._headerPanel);
    toolbar.appendText(ls`Log Level`);
    toolbar.appendToolbarItem(this._createDropdown());
    toolbar.appendSeparator();
    toolbar.appendToolbarItem(this._createFilterInput());
  }

  _createDropdown() {
    /** @type {!UI.ListModel<!Media.PlayerMessagesView.SelectableLevel>} */
    const items = new UI.ListModel();
    /** @type {!UI.SoftDropDown.Delegate<!Media.PlayerMessagesView.SelectableLevel>} **/
    this._messageLevelSelector = new Media.PlayerMessagesView.MessageLevelSelector(items, this);
    /** @type {!UI.SoftDropDown<!Media.PlayerMessagesView.SelectableLevel>} */
    const dropDown = new UI.SoftDropDown(items, this._messageLevelSelector);

    this._messageLevelSelector.populate();
    this._messageLevelSelector.setDefault(dropDown);

    const dropDownItem = new UI.ToolbarItem(dropDown.element);
    dropDownItem.element.classList.add('toolbar-has-dropdown');
    dropDownItem.setEnabled(true);
    dropDownItem.setTitle(this._messageLevelSelector.defaultTitle());
    return dropDownItem;
  }

  _createFilterInput() {
    const filterInput = new UI.ToolbarInput(ls`filter log messages`);
    filterInput.addEventListener(UI.ToolbarInput.Event.TextChanged, this._filterByString, this);
    return filterInput;
  }

  regenerateMessageDisplayCss(hiddenLevels) {
    let classString = '';
    for (const level of hiddenLevels) {
      if (classString) {
        classString += ', ';
      }
      classString += ('.media-message-' + level);
    }
    if (classString) {
      this._bodyPanelStyle.textContent = classString + '{ display: none; }';
    } else {
      this._bodyPanelStyle.textContent = '';
    }
  }

  _filterByString(userStringData) {
    const userString = userStringData.data;
    const messages = this._bodyPanel.getElementsByClassName('media-messages-message-container');

    for (const message of messages) {
      if (userString === '') {
        message.classList.remove('media-messages-message-filtered');
      } else if (message.textContent.includes(userString)) {
        message.classList.remove('media-messages-message-filtered');
      } else {
        message.classList.add('media-messages-message-filtered');
      }
    }
  }

  /**
   * @param {string} playerID
   * @param {!Array.<!Media.Event>} changes
   */
  renderChanges(playerID, changes) {
    for (const change of changes) {
      this._createChangeEntry(change);
    }
  }

  _createChangeEntry(change) {
    const container =
        this._bodyPanel.createChild('div', 'media-messages-message-container media-message-' + change.level);
    container.createTextChild(change.message);
  }
};

/**
 * @enum {number}
 */
Media.PlayerMessagesView.MessageLevelBitfield = {
  Error: 1 << 0,
  Warning: 1 << 1,
  Info: 1 << 2,
  Debug: 1 << 3,

  Default: (1 << 0) | (1 << 1) | (1 << 2),         // Error, Warning, Info
  All: (1 << 0) | (1 << 1) | (1 << 2) | (1 << 3),  // Error, Warning, Info, Debug
  Custom: 0
};

Media.PlayerMessagesView.MessageLevelMap = new Map([
  ['error', Media.PlayerMessagesView.MessageLevelBitfield.Error],
  ['warning', Media.PlayerMessagesView.MessageLevelBitfield.Warning],
  ['info', Media.PlayerMessagesView.MessageLevelBitfield.Info],
  ['debug', Media.PlayerMessagesView.MessageLevelBitfield.Debug],
]);

/**
 * @typedef {{
 *     title: string,
 *     value: Media.PlayerMessagesView.MessageLevelBitfield,
 *     stringValue: string,
 *     selectable: boolean
 * }}
 */
Media.PlayerMessagesView.SelectableLevel;

/**
 * @implements {UI.SoftDropDown.Delegate<!Media.PlayerMessagesView.SelectableLevel>}
 */
Media.PlayerMessagesView.MessageLevelSelector = class extends Common.Object {
  constructor(items, view) {
    super();
    this._items = items;
    this._view = view;
    this._itemMap = new Map();
    this._hiddenLevels = [];

    this._bitFieldValue = Media.PlayerMessagesView.MessageLevelBitfield.Default;
    this._savedBitFieldValue = Media.PlayerMessagesView.MessageLevelBitfield.Default;

    this._defaultTitle = ls`Default`;
    this._customTitle = ls`Custom`;
    this._allTitle = ls`All`;
  }

  defaultTitle() {
    return this._defaultTitle;
  }

  // UI.SoftDropDown
  setDefault(dropdown) {
    dropdown.selectItem(this._items.at(0));
  }

  populate() {
    this._items.insert(this._items.length, {
      title: this._defaultTitle,
      overwrite: true,
      stringValue: '',
      value: Media.PlayerMessagesView.MessageLevelBitfield.Default
    });

    this._items.insert(this._items.length, {
      title: this._allTitle,
      overwrite: true,
      stringValue: '',
      value: Media.PlayerMessagesView.MessageLevelBitfield.All
    });

    this._items.insert(this._items.length, {
      title: ls`Error`,
      overwrite: false,
      stringValue: 'error',
      value: Media.PlayerMessagesView.MessageLevelBitfield.Error
    });

    this._items.insert(this._items.length, {
      title: ls`Warning`,
      overwrite: false,
      stringValue: 'warning',
      value: Media.PlayerMessagesView.MessageLevelBitfield.Warning
    });

    this._items.insert(this._items.length, {
      title: ls`Info`,
      overwrite: false,
      stringValue: 'info',
      value: Media.PlayerMessagesView.MessageLevelBitfield.Info
    });

    this._items.insert(this._items.length, {
      title: ls`Debug`,
      overwrite: false,
      stringValue: 'debug',
      value: Media.PlayerMessagesView.MessageLevelBitfield.Debug
    });
  }

  _updateCheckMarks() {
    this._hiddenLevels = [];
    for (const [key, item] of this._itemMap) {
      if (!item.overwrite) {
        if (item.element.firstChild) {
          item.element.firstChild.remove();
        }
        if (key & this._bitFieldValue) {
          item.element.createChild('div').createTextChild('✓');
        } else {
          this._hiddenLevels.push(item.stringValue);
        }
      }
    }
  }

  /**
   * @override
   * @param {!Media.PlayerMessagesView.SelectableLevel} item
   * @return {string}
   */
  titleFor(item) {
    // This would make a lot more sense to have in |itemSelected|, but this
    // method gets called first.
    if (item.overwrite) {
      this._bitFieldValue = item.value;
    } else {
      this._bitFieldValue ^= item.value;
    }

    if (this._bitFieldValue === Media.PlayerMessagesView.MessageLevelBitfield.Default) {
      return this._defaultTitle;
    }

    if (this._bitFieldValue === Media.PlayerMessagesView.MessageLevelBitfield.All) {
      return this._allTitle;
    }

    const potentialMatch = this._itemMap.get(this._bitFieldValue);
    if (potentialMatch) {
      return potentialMatch.title;
    }

    return this._customTitle;
  }

  /**
   * @override
   * @param {!Media.PlayerMessagesView.SelectableLevel} item
   * @return {!Element}
   */
  createElementForItem(item) {
    const element = createElementWithClass('div');
    const shadowRoot = UI.createShadowRootWithCoreStyles(element, 'media/playerMessagesView.css');
    const container = shadowRoot.createChild('div', 'media-messages-level-dropdown-element');
    const checkBox = container.createChild('div', 'media-messages-level-dropdown-checkbox');
    const text = container.createChild('span', 'media-messages-level-dropdown-text');
    text.createTextChild(item.title);
    item.element = checkBox;
    this._itemMap.set(item.value, item);
    this._updateCheckMarks();
    this._view.regenerateMessageDisplayCss(this._hiddenLevels);
    return element;
  }

  /**
   * @override
   * @param {!Media.PlayerMessagesView.SelectableLevel} item
   * @return {boolean}
   */
  isItemSelectable(item) {
    return true;
  }

  /**
   * @override
   * @param {?Media.PlayerMessagesView.SelectableLevel} item
   */
  itemSelected(item) {
    this._updateCheckMarks();
    this._view.regenerateMessageDisplayCss(this._hiddenLevels);
  }

  /**
   * @override
   * @param {?Media.PlayerMessagesView.SelectableLevel} from
   * @param {?Media.PlayerMessagesView.SelectableLevel} to
   * @param {?Element} fromElement
   * @param {?Element} toElement
   */
  highlightedItemChanged(from, to, fromElement, toElement) {
  }
};
