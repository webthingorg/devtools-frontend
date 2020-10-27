// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// @ts-nocheck

import {assert} from 'chai';
import {getBrowserAndPages, timeout} from '../../shared/helper.js';


describe('Puppeteer', () => {
  it('should connect to puppeteer', async () => {
    const {frontend, browser} = getBrowserAndPages();

    const version = await browser.version();
    const result = await frontend.evaluate(`(async () => {
      const puppeteer = await import('./third_party/puppeteer/puppeteer.js');
      const SDK = await import('./sdk/sdk.js');

      class Transport {

        /**
         *
         * @param {ProtocolClient.InspectorBackend.Connection} connection
         */
        constructor(connection) {
          this._connection = connection;
        }
        /**
         *
         * @param {*} string
         */
        send(string) {
          this._connection.sendRawMessage(string);
        }

        close() {
          this._connection.disconnect();
        }

        /**
         * @param {function(string): void} cb
         */
        set onmessage(cb) {
          this._connection.setOnMessage((data) => {
            if (data.sessionId === this._connection._sessionId) {
              delete data.sessionId;
            }
            cb(typeof data === 'string' ? data : JSON.stringify(data));
          });
        }

        /**
         * @param {() => void} cb
         */
        set onclose(cb) {
          this._connection.setOnDisconnect(() => {
            cb()
          });
        }
      }

      const childTargetManager =
        SDK.SDKModel.TargetManager.instance().mainTarget().model(SDK.ChildTargetManager.ChildTargetManager);
      const rawConnection = await childTargetManager.createParallelConnection();

      const transport = new Transport(rawConnection);
      const connection = new puppeteer.Connection('', transport);
      const browser = await puppeteer.Browser.create(connection, [], false);
      return browser.version();
    })()`);

    assert.equal(version, result);
  });
});
