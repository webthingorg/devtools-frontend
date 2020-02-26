// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../common/common.js';
import * as PlayerEventsView from './EventDisplayTable.js';
import * as PlayerMessagesView from './PlayerMessagesView.js';
import * as PlayerPropertiesView from './PlayerPropertiesView.js';
import * as UI from '../ui/ui.js';
import * as MediaModel from './MediaModel.js';

/**
 * @enum {string}
 */
export const PlayerDetailViewTabs = {
  Events: 'events',
  Properties: 'properties',
  Messages: 'messages'
};

/**
 * @unrestricted
 */
export class PlayerDetailView extends UI.TabbedPane.TabbedPane {
  constructor() {
    super();

    const eventView = new PlayerEventsView.PlayerEventsView();
    const propertyView = new PlayerPropertiesView.PlayerPropertiesView();
    const messageView = new PlayerMessagesView.PlayerMessagesView();

    // maps handler type to a list of panels that support rendering changes.
    this._panels = new Map([
      [MediaModel.MediaChangeTypeKeys.Property, [propertyView]],
      [MediaModel.MediaChangeTypeKeys.Event, [eventView]],
      [MediaModel.MediaChangeTypeKeys.Message, [messageView]]
    ]);


    this.appendTab(
        PlayerDetailViewTabs.Properties, Common.UIString.UIString('Properties'), propertyView,
        Common.UIString.UIString('Player properties'));

    this.appendTab(
        PlayerDetailViewTabs.Events, Common.UIString.UIString('Events'), eventView,
        Common.UIString.UIString('Player events'));

    this.appendTab(
        PlayerDetailViewTabs.Messages, Common.UIString.UIString('Messages'), messageView,
        Common.UIString.UIString('Player messages'));
  }

  /**
   * @param {string} playerID
   * @param {!Array.<!MediaModel.Event>} changes
   * @param {!MediaModel.MediaChangeTypeKeys} changeType
   */
  renderChanges(playerID, changes, changeType) {
    for (const panel of this._panels.get(changeType)) {
      panel.renderChanges(playerID, changes);
    }
  }
}
