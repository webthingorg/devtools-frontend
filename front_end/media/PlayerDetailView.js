// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @unrestricted
 */
Media.PlayerDetailView = class extends UI.TabbedPane {
  constructor() {
    super();

    const eventView = new Media.PlayerEventsView();
    const propertyView = new Media.PlayerPropertiesView();
    const messageView = new Media.PlayerMessagesView();

    // maps handler type to a list of panels that support rendering changes.
    this._panels = new Map([
      [Media.MediaModel.MediaChangeTypeKeys.Property, [propertyView]],
      [Media.MediaModel.MediaChangeTypeKeys.Event, [eventView]],
      [Media.MediaModel.MediaChangeTypeKeys.Message, [messageView]],
    ]);

    this.appendTab(
        Media.PlayerDetailView.Tabs.Properties, Common.UIString('Properties'), propertyView,
        Common.UIString('Player properties'));

    this.appendTab(
        Media.PlayerDetailView.Tabs.Events, Common.UIString('Events'), eventView, Common.UIString('Player events'));

    this.appendTab(
        Media.PlayerDetailView.Tabs.Messages, Common.UIString('Messages'), messageView,
        Common.UIString('Player messages'));
  }

  /**
   * @param {string} playerID
   * @param {!Array.<!Media.Event>} changes
   * @param {!Media.MediaModel.MediaChangeTypeKeys} changeType
   */
  renderChanges(playerID, changes, changeType) {
    for (const panel of this._panels.get(changeType)) {
      panel.renderChanges(playerID, changes);
    }
  }
};

/**
 * @enum {string}
 */
Media.PlayerDetailView.Tabs = {
  Events: 'events',
  Properties: 'properties',
  Messages: 'messages'
};
