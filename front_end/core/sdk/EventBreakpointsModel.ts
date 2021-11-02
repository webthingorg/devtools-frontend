// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as Common from '../common/common.js';
import * as i18n from '../i18n/i18n.js';
import type * as ProtocolProxyApi from '../../generated/protocol-proxy-api.js';

import * as DOMDebuggerModel from './DOMDebuggerModel.js';
import type {Target} from './Target.js';
import {Capability} from './Target.js';
import {SDKModel} from './SDKModel.js';
import type {SDKModelObserver} from './TargetManager.js';
import {TargetManager} from './TargetManager.js';

const UIStrings = {
  /**
   * @description Category of breakpoints
   */
  auctionWorklet: 'Ad Auction Worklet',

  /**
   * @description Name of a breakpoint type.
   */
  beforeBidderWorkletBiddingStart: 'Bidder Bidding Phase Start',

  /**
   * @description Name of a breakpoint type.
   */
  beforeBidderWorkletReportingStart: 'Bidder Reporting Phase Start',

  /**
   * @description Name of a breakpoint type.
   */
  beforeSellerWorkletScoringStart: 'Seller Scoring Phase Start',

  /**
   * @description Name of a breakpoint type.
   */
  beforeSellerWorkletReportingStart: 'Seller Reporting Phase Start',
};

const str_ = i18n.i18n.registerUIStrings('core/sdk/EventBreakpointsModel.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

export class EventBreakpointsModel extends SDKModel<void> {
  readonly agent: ProtocolProxyApi.EventBreakpointsApi;

  constructor(target: Target) {
    super(target);
    this.agent = target.eventBreakpointsAgent();
  }
}

class EventListenerBreakpoint extends DOMDebuggerModel.CategorizedBreakpoint {
  readonly instrumentationName: string;
  constructor(instrumentationName: string, category: string, title: string) {
    super(category, title);
    this.instrumentationName = instrumentationName;
  }

  setEnabled(enabled: boolean): void {
    if (this.enabled() === enabled) {
      return;
    }
    super.setEnabled(enabled);
    for (const model of TargetManager.instance().models(EventBreakpointsModel)) {
      this.updateOnModel(model);
    }
  }

  updateOnModel(model: EventBreakpointsModel): void {
    if (this.enabled()) {
      model.agent.invoke_setInstrumentationBreakpoint({eventName: this.instrumentationName});
    } else {
      model.agent.invoke_removeInstrumentationBreakpoint({eventName: this.instrumentationName});
    }
  }

  static readonly instrumentation = 'instrumentation:';
}

let eventBreakpointManagerInstance: EventBreakpointsManager;

export class EventBreakpointsManager implements SDKModelObserver<EventBreakpointsModel> {
  readonly #eventListenerBreakpointsInternal: EventListenerBreakpoint[];

  constructor() {
    this.#eventListenerBreakpointsInternal = [];
    this.createInstrumentationBreakpoints(i18nString(UIStrings.auctionWorklet), [
      ['beforeBidderWorkletBiddingStart', i18nString(UIStrings.beforeBidderWorkletBiddingStart)],
      ['beforeBidderWorkletReportingStart', i18nString(UIStrings.beforeBidderWorkletReportingStart)],
      ['beforeSellerWorkletScoringStart', i18nString(UIStrings.beforeSellerWorkletScoringStart)],
      ['beforeSellerWorkletReportingStart', i18nString(UIStrings.beforeSellerWorkletReportingStart)],
    ]);

    TargetManager.instance().observeModels(EventBreakpointsModel, this);
  }

  static instance(opts: {
    forceNew: boolean|null,
  } = {forceNew: null}): EventBreakpointsManager {
    const {forceNew} = opts;
    if (!eventBreakpointManagerInstance || forceNew) {
      eventBreakpointManagerInstance = new EventBreakpointsManager();
    }

    return eventBreakpointManagerInstance;
  }

  private createInstrumentationBreakpoints(category: string, instrumentationNamesAndTitles: [
    string,
    Common.UIString.LocalizedString,
  ][]): void {
    for (const [instrumentationName, title] of instrumentationNamesAndTitles) {
      this.#eventListenerBreakpointsInternal.push(new EventListenerBreakpoint(instrumentationName, category, title));
    }
  }

  eventListenerBreakpoints(): EventListenerBreakpoint[] {
    return this.#eventListenerBreakpointsInternal.slice();
  }

  private resolveEventListenerBreakpointInternal(eventName: string): EventListenerBreakpoint|null {
    const instrumentationPrefix = 'instrumentation:';
    let instrumentationName = '';
    if (eventName.startsWith(instrumentationPrefix)) {
      instrumentationName = eventName.substring(instrumentationPrefix.length);
    } else {
      return null;
    }
    for (const breakpoint of this.#eventListenerBreakpointsInternal) {
      if (instrumentationName && breakpoint.instrumentationName === instrumentationName) {
        return breakpoint;
      }
    }
    return null;
  }

  resolveEventListenerBreakpointTitle(auxData: {
    eventName: string,
  }): string|null {
    const id = auxData['eventName'];
    const breakpoint = this.resolveEventListenerBreakpointInternal(id);
    return breakpoint ? breakpoint.title() : null;
  }

  resolveEventListenerBreakpoint(auxData: {eventName: string}): EventListenerBreakpoint|null {
    return this.resolveEventListenerBreakpointInternal(auxData['eventName']);
  }

  modelAdded(eventBreakpointModel: EventBreakpointsModel): void {
    for (const breakpoint of this.#eventListenerBreakpointsInternal) {
      if (breakpoint.enabled()) {
        breakpoint.updateOnModel(eventBreakpointModel);
      }
    }
  }

  modelRemoved(_eventBreakpointModel: EventBreakpointsModel): void {
  }
}

SDKModel.register(EventBreakpointsModel, {capabilities: Capability.EventBreakpoints, autostart: false});
