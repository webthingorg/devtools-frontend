// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as Protocol from '../../../../../front_end/generated/protocol.js';
import {assertNotNullOrUndefined} from '../../../../../front_end/core/platform/platform.js';
import * as SDK from '../../../../../front_end/core/sdk/sdk.js';
import * as Media from '../../../../../front_end/panels/media/media.js';
import {createTarget} from '../../helpers/EnvironmentHelpers.js';
import {describeWithMockConnection} from '../../helpers/MockConnection.js';

const {assert} = chai;

const PLAYER_ID = 'PLAYER_ID' as Protocol.Media.PlayerId;

describeWithMockConnection.only('MediaMainView', () => {
  let target: SDK.Target.Target;

  beforeEach(() => {
    target = createTarget();
  });

  const testUiUpdate =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (event: any, expectedMethod: keyof Media.MainView.PlayerDataDownloadManager, inScope: boolean) => async () => {
        if (inScope) {
          SDK.TargetManager.TargetManager.instance().setScopeTarget(target);
        }
        const downloadStore = new Media.MainView.PlayerDataDownloadManager();
        const expectedCall = sinon.stub(downloadStore, expectedMethod).returns();
        const mainView = Media.MainView.MainView.instance({forceNew: true, downloadStore});
        mainView.markAsRoot();
        mainView.show(document.body);
        const model = target.model(Media.MediaModel.MediaModel);
        assertNotNullOrUndefined(model);
        model.dispatchEventToListeners(Media.MediaModel.Events.PlayersCreated, [PLAYER_ID]);
        const field = [{name: 'kResolution', value: '{}', data: {}, stack: [], cause: []}];
        const data = {playerId: PLAYER_ID, properties: field, events: field, messages: field, errors: field};
        model.dispatchEventToListeners(event, data);
        await new Promise(resolve => setTimeout(resolve, 0));
        assert.strictEqual(expectedCall.called, inScope);
        mainView.detach();
      };

  it('reacts to properties on in scope event',
     testUiUpdate(Media.MediaModel.Events.PlayerPropertiesChanged, 'onProperty', true));
  it('does not react to properties on out of scope event',
     testUiUpdate(Media.MediaModel.Events.PlayerPropertiesChanged, 'onProperty', false));
  it('reacts to event on in scope event', testUiUpdate(Media.MediaModel.Events.PlayerEventsAdded, 'onEvent', true));
  it('does not react to event on out of scope event',
     testUiUpdate(Media.MediaModel.Events.PlayerEventsAdded, 'onEvent', false));
  it('reacts to messages on in scope event',
     testUiUpdate(Media.MediaModel.Events.PlayerMessagesLogged, 'onMessage', true));
  it('does not react to messages on out of scope event',
     testUiUpdate(Media.MediaModel.Events.PlayerMessagesLogged, 'onMessage', false));
  it('reacts to error on in scope event', testUiUpdate(Media.MediaModel.Events.PlayerErrorsRaised, 'onError', true));
  it('does not react to error on out of scope event',
     testUiUpdate(Media.MediaModel.Events.PlayerErrorsRaised, 'onError', false));
});
