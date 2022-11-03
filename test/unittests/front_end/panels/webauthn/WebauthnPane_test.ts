// Copyright (c) 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {createTarget} from '../../helpers/EnvironmentHelpers.js';
import {
  describeWithMockConnection,
  setMockConnectionResponseHandler,
} from '../../helpers/MockConnection.js';

import type * as WebauthnModule from '../../../../../front_end/panels/webauthn/webauthn.js';
import * as SDK from '../../../../../front_end/core/sdk/sdk.js';

const {assert} = chai;

interface ResponseOverrideBit {
  isBogusSignature: boolean;
  isBadUVBit: boolean;
  isBadUPBit: boolean;
  bogusSignatureCheckbox: HTMLInputElement;
  badUVBitCheckbox: HTMLInputElement;
  badUPBitCheckbox: HTMLInputElement;
}

describeWithMockConnection('WebAuthn pane', () => {
  let Webauthn: typeof WebauthnModule;

  before(async () => {
    Webauthn = await import('../../../../../front_end/panels/webauthn/webauthn.js');
  });

  it('disables the large blob checkbox if resident key is disabled', () => {
    const panel = Webauthn.WebauthnPane.WebauthnPaneImpl.instance();
    const largeBlob = panel.largeBlobCheckbox;
    const residentKeys = panel.residentKeyCheckbox;

    if (!largeBlob || !residentKeys) {
      assert.fail('Required checkbox not found');
      return;
    }

    // Make sure resident keys is disabled. Large blob should be disabled and
    // unchecked.
    residentKeys.checked = false;
    residentKeys.dispatchEvent(new Event('change'));
    assert.isTrue(largeBlob.disabled);
    assert.isFalse(largeBlob.checked);

    // Enable resident keys. Large blob should be enabled but still not
    // checked.
    residentKeys.checked = true;
    residentKeys.dispatchEvent(new Event('change'));
    assert.isFalse(largeBlob.disabled);
    assert.isFalse(largeBlob.checked);

    // Manually check large blob.
    largeBlob.checked = true;
    assert.isTrue(largeBlob.checked);

    // Disabling resident keys should reset large blob to disabled and
    // unchecked.
    residentKeys.checked = false;
    residentKeys.dispatchEvent(new Event('change'));
    assert.isTrue(largeBlob.disabled);
    assert.isFalse(largeBlob.checked);
  });

  const largeBlobOption = (targetFactory: () => SDK.Target.Target) => {
    it('adds an authenticator with large blob option', done => {
      const target = targetFactory();
      const panel = Webauthn.WebauthnPane.WebauthnPaneImpl.instance();
      panel.modelAdded(new SDK.WebAuthnModel.WebAuthnModel(target));

      const largeBlob = panel.largeBlobCheckbox;
      const residentKeys = panel.residentKeyCheckbox;

      if (!largeBlob || !residentKeys) {
        assert.fail('Required checkbox not found');
        return;
      }
      residentKeys.checked = true;
      largeBlob.checked = true;

      setMockConnectionResponseHandler('WebAuthn.addVirtualAuthenticator', params => {
        assert.isTrue(params.options.hasLargeBlob);
        assert.isTrue(params.options.hasResidentKey);
        done();
        return {
          authenticatorId: 'test',
        };
      });
      panel.addAuthenticatorButton?.click();
    });

    it('adds an authenticator without the large blob option', done => {
      const target = targetFactory();
      const panel = Webauthn.WebauthnPane.WebauthnPaneImpl.instance();
      panel.modelAdded(new SDK.WebAuthnModel.WebAuthnModel(target));

      const largeBlob = panel.largeBlobCheckbox;
      const residentKeys = panel.residentKeyCheckbox;

      if (!largeBlob || !residentKeys) {
        assert.fail('Required checkbox not found');
        return;
      }
      residentKeys.checked = true;
      largeBlob.checked = false;

      setMockConnectionResponseHandler('WebAuthn.addVirtualAuthenticator', params => {
        assert.isFalse(params.options.hasLargeBlob);
        assert.isTrue(params.options.hasResidentKey);
        done();
        return {
          authenticatorId: 'test',
        };
      });
      panel.addAuthenticatorButton?.click();
    });

    it('it verifies that the bogus signature is set to true in the authenticator state', done => {
      const target = targetFactory();
      const panel = Webauthn.WebauthnPane.WebauthnPaneImpl.instance();
      panel.modelAdded(new SDK.WebAuthnModel.WebAuthnModel(target));
      setMockConnectionResponseHandler('WebAuthn.addVirtualAuthenticator', () => {
        window.setTimeout(() => {
          const authenticatorIdToResponseBits = panel.authenticatorIdToResponseBits;

          authenticatorIdToResponseBits.forEach((value: ResponseOverrideBit) => {
            const bogusSignatureCheckbox = value.bogusSignatureCheckbox;
            if (!bogusSignatureCheckbox) {
              assert.fail('Required checkbox not found');
              done();
              return;
            }
            bogusSignatureCheckbox.checked = true;
            const event = new Event('change');
            bogusSignatureCheckbox.dispatchEvent(event);
          }, 100);
        });
        return {
          authenticatorId: 'test',
        };
      });

      setMockConnectionResponseHandler('WebAuthn.setResponseOverrideBits', params => {
        assert.isTrue(params.isBogusSignature);
        done();
        return {
          authenticatorId: 'test',
        };
      });
      panel.addAuthenticatorButton?.click();
    });

    it('it verifies that the bad uv bit signature is set to true in the authenticator state', done => {
      const target = targetFactory();
      const panel = Webauthn.WebauthnPane.WebauthnPaneImpl.instance();
      panel.modelAdded(new SDK.WebAuthnModel.WebAuthnModel(target));
      setMockConnectionResponseHandler('WebAuthn.addVirtualAuthenticator', () => {
        window.setTimeout(() => {
          const authenticatorIdToResponseBits = panel.authenticatorIdToResponseBits;

          authenticatorIdToResponseBits.forEach((value: ResponseOverrideBit) => {
            const badUVBitCheckbox = value.badUVBitCheckbox;
            if (!badUVBitCheckbox) {
              assert.fail('Required checkbox not found');
              done();
              return;
            }
            badUVBitCheckbox.checked = true;
            const event = new Event('change');
            badUVBitCheckbox.dispatchEvent(event);
          }, 100);
        });
        return {
          authenticatorId: 'test',
        };
      });

      setMockConnectionResponseHandler('WebAuthn.setResponseOverrideBits', params => {
        assert.isTrue(params.isBadUV);
        done();
        return {
          authenticatorId: 'test',
        };
      });
      panel.addAuthenticatorButton?.click();
    });

    it('it verifies that the bad up bit is set to true in the authenticator state', done => {
      const target = targetFactory();
      const panel = Webauthn.WebauthnPane.WebauthnPaneImpl.instance();
      panel.modelAdded(new SDK.WebAuthnModel.WebAuthnModel(target));
      setMockConnectionResponseHandler('WebAuthn.addVirtualAuthenticator', () => {
        window.setTimeout(() => {
          const authenticatorIdToResponseBits = panel.authenticatorIdToResponseBits;

          authenticatorIdToResponseBits.forEach((value: ResponseOverrideBit) => {
            const badUPBitCheckbox = value.badUPBitCheckbox;
            if (!badUPBitCheckbox) {
              assert.fail('Required checkbox not found');
              done();
              return;
            }
            badUPBitCheckbox.checked = true;
            const event = new Event('change');
            badUPBitCheckbox.dispatchEvent(event);
          }, 100);
        });
        return {
          authenticatorId: 'test',
        };
      });

      setMockConnectionResponseHandler('WebAuthn.setResponseOverrideBits', params => {
        assert.isTrue(params.isBadUP);
        done();
        return {
          authenticatorId: 'test',
        };
      });
      panel.addAuthenticatorButton?.click();
    });
  };

  describe('without tab target', () => largeBlobOption(() => createTarget()));
  describe('with tab target', () => largeBlobOption(() => {
                                const tabTarget = createTarget({type: SDK.Target.Type.Tab});
                                const frameTarget = createTarget({parentTarget: tabTarget});
                                createTarget({parentTarget: tabTarget, subtype: 'prerender'});
                                return frameTarget;
                              }));
});
