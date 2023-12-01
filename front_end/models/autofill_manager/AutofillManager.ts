// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../core/common/common.js';
import * as SDK from '../../core/sdk/sdk.js';
import type * as Protocol from '../../generated/protocol.js';

let autofillManagerInstance: AutofillManager;

export class AutofillManager extends Common.ObjectWrapper.ObjectWrapper<EventTypes> implements
    SDK.TargetManager.SDKModelObserver<SDK.AutofillModel.AutofillModel> {
  #addressFormFilledEvent: SDK.AutofillModel.AddressFormFilledEvent|null = null;

  private constructor() {
    super();
    SDK.TargetManager.TargetManager.instance().observeModels(SDK.AutofillModel.AutofillModel, this, {scoped: true});
  }

  static instance(opts: {forceNew: boolean|null} = {forceNew: null}): AutofillManager {
    const {forceNew} = opts;
    if (!autofillManagerInstance || forceNew) {
      autofillManagerInstance = new AutofillManager();
    }
    return autofillManagerInstance;
  }

  modelAdded(model: SDK.AutofillModel.AutofillModel): void {
    model.addEventListener(SDK.AutofillModel.Events.AddressFormFilled, this.#addressFormFilled, this);
  }

  modelRemoved(model: SDK.AutofillModel.AutofillModel): void {
    model.removeEventListener(SDK.AutofillModel.Events.AddressFormFilled, this.#addressFormFilled, this);
  }

  async #addressFormFilled(
      {data}: Common.EventTarget
          .EventTargetEvent<SDK.AutofillModel.EventTypes[SDK.AutofillModel.Events.AddressFormFilled]>): Promise<void> {
    this.#addressFormFilledEvent = data;
    this.dispatchEventToListeners(Events.AddressFormFilled, data);
  }

  getAddressFormFilled(): SDK.AutofillModel.AddressFormFilledEvent|null {
    return this.#addressFormFilledEvent;
  }
}

// TODO(crbug.com/1167717): Make this a const enum again
// eslint-disable-next-line rulesdir/const_enum
export enum Events {
  AddressFormFilled = 'AddressFormFilled',
}

export interface AddressFormFilledEvent {
  autofillModel: SDK.AutofillModel.AutofillModel;
  event: Protocol.Autofill.AddressFormFilledEvent;
}

export type EventTypes = {
  [Events.AddressFormFilled]: AddressFormFilledEvent,
};
