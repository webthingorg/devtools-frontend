// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import * as SDK from '../../../../../front_end/core/sdk/sdk.js';
import * as Common from '../../../../../front_end/core/common/common.js';
import type * as Protocol from '../../../../../front_end/generated/protocol.js';
import {describeWithEnvironment} from '../../helpers/EnvironmentHelpers.js';

describe('MultitargetNetworkManager', () => {
  describe('Trust Token done event', () => {
    it('is not lost when arriving before the corresponding requestWillBeSent event', () => {
      // 1) Setup a NetworkManager and listen to "RequestStarted" events.
      const networkManager = new Common.ObjectWrapper.ObjectWrapper();
      const startedRequests: SDK.NetworkRequest.NetworkRequest[] = [];
      networkManager.addEventListener(SDK.NetworkManager.Events.RequestStarted, event => {
        const request = event.data.request as SDK.NetworkRequest.NetworkRequest;
        startedRequests.push(request);
      });
      const networkDispatcher =
          new SDK.NetworkManager.NetworkDispatcher(networkManager as SDK.NetworkManager.NetworkManager);

      // 2) Fire a trust token event, followed by a requestWillBeSent event.
      const mockEvent = {requestId: 'mockId'} as Protocol.Network.TrustTokenOperationDoneEvent;
      networkDispatcher.trustTokenOperationDone(mockEvent);
      networkDispatcher.requestWillBeSent(
          {requestId: 'mockId', request: {url: 'example.com'}} as Protocol.Network.RequestWillBeSentEvent);

      // 3) Check that the resulting NetworkRequest has the Trust Token Event data associated with it.
      assert.strictEqual(startedRequests.length, 1);
      assert.strictEqual(startedRequests[0].trustTokenOperationDoneEvent(), mockEvent);
    });
  });
});

describe('NetworkDispatcher', () => {
  describeWithEnvironment('request', () => {
    let networkDispatcher: SDK.NetworkManager.NetworkDispatcher;

    beforeEach(() => {
      const networkManager = new Common.ObjectWrapper.ObjectWrapper();
      networkDispatcher = new SDK.NetworkManager.NetworkDispatcher(networkManager as SDK.NetworkManager.NetworkManager);
      /* Common.Settings.registerSettingsForTest( */
      /*     [ */
      /*       { */
      /*         category: Common.Settings.SettingCategory.NETWORK, */
      /*         settingType: Common.Settings.SettingType.BOOLEAN, */
      /*         settingName: 'requestBlockingEnabled', */
      /*         defaultValue: false, */
      /*       }, */
      /*       { */
      /*         category: Common.Settings.SettingCategory.CONSOLE, */
      /*         settingType: Common.Settings.SettingType.BOOLEAN, */
      /*         settingName: 'monitoringXHREnabled', */
      /*         defaultValue: false, */
      /*       }, */
      /*     ], */
      // /*     /* reset=*/ true); */
      /*  */
      /* const settingsStorage = new Common.Settings.SettingsStorage({}); */
      /*  */
      /* Common.Settings.Settings.instance( */
      /*     {forceNew: true, globalStorage: settingsStorage, localStorage: settingsStorage}); */
    });

    it('is preserved after loadingFinished', () => {
      networkDispatcher.requestWillBeSent(
          {requestId: 'mockId', request: {url: 'example.com'}} as Protocol.Network.RequestWillBeSentEvent);
      networkDispatcher.loadingFinished(
          {requestId: 'mockId', timestamp: 42, encodedDataLength: 42, shouldReportCorbBlocking: false} as
          Protocol.Network.LoadingFinishedEvent);

      assert.exists(networkDispatcher.requestForId('mockId'));
    });

    it('is cleared on clearRequests()', () => {
      networkDispatcher.requestWillBeSent(
          {requestId: 'mockId', request: {url: 'example.com'}} as Protocol.Network.RequestWillBeSentEvent);
      networkDispatcher.loadingFinished(
          {requestId: 'mockId', timestamp: 42, encodedDataLength: 42, shouldReportCorbBlocking: false} as
          Protocol.Network.LoadingFinishedEvent);

      networkDispatcher.clearRequests();
      assert.notExists(networkDispatcher.requestForId('mockId'));
    });
  });
});
