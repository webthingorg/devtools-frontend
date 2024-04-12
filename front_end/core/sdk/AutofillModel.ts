// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as ProtocolProxyApi from '../../generated/protocol-proxy-api.js';
import type * as Protocol from '../../generated/protocol.js';
import * as Host from '../host/host.js';

import {SDKModel} from './SDKModel.js';
import {Capability, type Target} from './Target.js';

export class AutofillModel extends SDKModel<EventTypes> implements ProtocolProxyApi.AutofillDispatcher {
  readonly agent: ProtocolProxyApi.AutofillApi;
  #enabled?: boolean;

  constructor(target: Target) {
    super(target);

    this.agent = target.autofillAgent();
    target.registerAutofillDispatcher(this);
    this.enable();
  }

  enable(): void {
    if (this.#enabled || Host.InspectorFrontendHost.isUnderTest()) {
      return;
    }
    void this.agent.invoke_enable();
    void this.agent.invoke_setAddresses({
      addresses: [
        {
          fields: [
            {name: 'ADDRESS_HOME_COUNTRY', value: 'US'},
            {name: 'NAME_FULL', value: 'Jon Stewart Doe'},
            {name: 'NAME_FIRST', value: 'Jon'},
            {name: 'NAME_MIDDLE', value: 'Stewart'},
            {name: 'NAME_LAST', value: 'Doe'},
            {name: 'COMPANY_NAME', value: 'Google'},
            {name: 'ADDRESS_HOME_STREET_ADDRESS', value: '1600 Amphitheatre Parkway\nApartment 1'},
            {name: 'ADDRESS_HOME_STREET_NAME', value: 'Amphitheatre Parkway'},
            {name: 'ADDRESS_HOME_HOUSE_NUMBER', value: '1600'},
            {name: 'ADDRESS_HOME_SUBPREMISE', value: '1'},
            {name: 'ADDRESS_HOME_APT_NUM', value: '1'},
            {name: 'ADDRESS_HOME_ZIP', value: '94043'},
            {name: 'ADDRESS_HOME_CITY', value: 'Mountain View'},
            {name: 'ADDRESS_HOME_STATE', value: 'CA'},
            {name: 'EMAIL_ADDRESS', value: 'test@example.us'},
            {name: 'PHONE_HOME_WHOLE_NUMBER', value: '601-952-1325'},
          ],
        },
        {
          fields: [
            {name: 'ADDRESS_HOME_COUNTRY', value: 'BR'},
            {name: 'NAME_FULL', value: 'João Souza Silva'},
            {name: 'NAME_FIRST', value: 'João'},
            {name: 'NAME_MIDDLE', value: 'Souza'},
            {name: 'NAME_LAST', value: 'Silva'},
            {name: 'COMPANY_NAME', value: 'Google'},
            {name: 'ADDRESS_HOME_STREET_ADDRESS', value: 'Av. dos Andradas, 3000, Apartamento 1\nSanta Efigênia'},
            {name: 'ADDRESS_HOME_STREET_NAME', value: 'Av. dos Andradas, 3000'},
            {name: 'ADDRESS_HOME_HOUSE_NUMBER', value: '3000'},
            {name: 'ADDRESS_HOME_SUBPREMISE', value: '1'},
            {name: 'ADDRESS_HOME_APT_NUM', value: '1'},
            {name: 'ADDRESS_HOME_DEPENDENT_LOCALITY', value: 'Santa Efigênia'},
            {name: 'ADDRESS_HOME_LANDMARK', value: 'Estação Santa Efigênia'},
            {name: 'ADDRESS_HOME_OVERFLOW', value: 'Próximo à estação'},
            {name: 'ADDRESS_HOME_ZIP', value: '30260-070'},
            {name: 'ADDRESS_HOME_CITY', value: 'Belo Horizonte'},
            {name: 'ADDRESS_HOME_STATE', value: 'MG'},
            {name: 'EMAIL_ADDRESS', value: 'teste@exemplo.us'},
            {name: 'PHONE_HOME_WHOLE_NUMBER', value: '31 2128-6800'},
          ],
        },
      ],
    });
    this.#enabled = true;
  }

  disable(): void {
    if (!this.#enabled || Host.InspectorFrontendHost.isUnderTest()) {
      return;
    }
    this.#enabled = false;
    void this.agent.invoke_disable();
  }

  addressFormFilled(addressFormFilledEvent: Protocol.Autofill.AddressFormFilledEvent): void {
    this.dispatchEventToListeners(Events.AddressFormFilled, {autofillModel: this, event: addressFormFilledEvent});
  }
}

SDKModel.register(AutofillModel, {capabilities: Capability.DOM, autostart: true});

export const enum Events {
  AddressFormFilled = 'AddressFormFilled',
}

export interface AddressFormFilledEvent {
  autofillModel: AutofillModel;
  event: Protocol.Autofill.AddressFormFilledEvent;
}

export type EventTypes = {
  [Events.AddressFormFilled]: AddressFormFilledEvent,
};
