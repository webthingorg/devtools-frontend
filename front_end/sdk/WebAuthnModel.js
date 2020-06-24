// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {Capability, SDKModel, Target} from './SDKModel.js';  // eslint-disable-line no-unused-vars

export class WebAuthnModel extends SDKModel {
  /**
  * @param {!Target} target
  */
  constructor(target) {
    super(target);
    this._agent = target.webAuthnAgent();
  }

  /**
   * @param {boolean} enable
   * @return {!Promise<!Object>}
   */
  setVirtualAuthEnvEnabled(enable) {
    if (enable) {
      return this._agent.invoke_enable();
    }
    return this._agent.invoke_disable();
  }

  /**
   * @param {Protocol.WebAuthn.VirtualAuthenticatorOptions} _options
   * @return {!Promise<?>}
   */
  async addAuthenticator(_options) {
    /** @type {!Protocol.WebAuthn.AddVirtualAuthenticatorRequest} */
    const request = {options: _options};
    const response = await this._agent.invoke_addVirtualAuthenticator(request);
    return response.authenticatorId;
  }

  /**
   * @param {!Protocol.WebAuthn.AuthenticatorId} _authenticatorId
   */
  async removeAuthenticator(_authenticatorId) {
    /** @type {!Protocol.WebAuthn.RemoveVirtualAuthenticatorRequest} */
    const request = {authenticatorId: _authenticatorId};
    this._agent.invoke_removeVirtualAuthenticator(request);
  }
}

SDKModel.register(WebAuthnModel, Capability.WebAuthn, false);
