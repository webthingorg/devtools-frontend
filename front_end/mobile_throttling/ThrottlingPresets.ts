// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/* eslint-disable rulesdir/no_underscored_properties */

import * as i18n from '../i18n/i18n.js';
import * as SDK from '../sdk/sdk.js';

export const UIStrings = {
  /**
   *@description Text for no network throttling
   */
  noThrottling: 'No throttling',
  /**
   *@description Text in Throttling Presets of the Network panel
   */
  noInternetConnectivity: 'No internet connectivity',
  /**
   *@description Text in Throttling Presets of the Network panel
   */
  lowendMobile: 'Low-end mobile',
  /**
   *@description Text in Throttling Presets of the Network panel
   */
  slowGXCpuSlowdown: 'Slow 3G & 6x CPU slowdown',
  /**
   *@description Text in Throttling Presets of the Network panel
   */
  midtierMobile: 'Mid-tier mobile',
  /**
   *@description Text in Throttling Presets of the Network panel
   */
  fastGXCpuSlowdown: 'Fast 3G & 4x CPU slowdown',
  /**
   *@description Text in Network Throttling Selector of the Network panel
   */
  custom: 'Custom',
  /**
   *@description Text in Throttling Presets of the Network panel
   */
  checkNetworkAndPerformancePanels: 'Check Network and Performance panels',
};

const str_ = i18n.i18n.registerUIStrings('mobile_throttling/ThrottlingPresets.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

export class ThrottlingPresets {
  /** @enum {number} */
  static CPUThrottlingRates = {
    NoThrottling: 1,
    MidTierMobile: 4,
    LowEndMobile: 6,
  };

  static getNoThrottlingConditions(): Conditions {
    return {
      title: SDK.NetworkManager.NoThrottlingConditions.title,
      description: i18nString(UIStrings.noThrottling),
      network: SDK.NetworkManager.NoThrottlingConditions,
      cpuThrottlingRate: ThrottlingPresets.CPUThrottlingRates.NoThrottling,
    };
  }

  static getOfflineConditions(): Conditions {
    return {
      title: SDK.NetworkManager.OfflineConditions.title,
      description: i18nString(UIStrings.noInternetConnectivity),
      network: SDK.NetworkManager.OfflineConditions,
      cpuThrottlingRate: ThrottlingPresets.CPUThrottlingRates.NoThrottling,
    };
  }

  static getLowEndMobileConditions(): Conditions {
    return {
      title: i18nString(UIStrings.lowendMobile),
      description: i18nString(UIStrings.slowGXCpuSlowdown),
      network: SDK.NetworkManager.Slow3GConditions,
      cpuThrottlingRate: ThrottlingPresets.CPUThrottlingRates.LowEndMobile,
    };
  }

  static getMidTierMobileConditions(): Conditions {
    return {
      title: i18nString(UIStrings.midtierMobile),
      description: i18nString(UIStrings.fastGXCpuSlowdown),
      network: SDK.NetworkManager.Fast3GConditions,
      cpuThrottlingRate: ThrottlingPresets.CPUThrottlingRates.MidTierMobile,
    };
  }

  static getCustomConditions(): PlaceholderConditions {
    return {
      title: i18nString(UIStrings.custom),
      description: i18nString(UIStrings.checkNetworkAndPerformancePanels),
    };
  }

  static getMobilePresets(): (Conditions | PlaceholderConditions)[] {
    return [
      ThrottlingPresets.getMidTierMobileConditions(), ThrottlingPresets.getLowEndMobileConditions(),
      ThrottlingPresets.getCustomConditions()
    ];
  }

  static getAdvancedMobilePresets(): Conditions[] {
    return [
      ThrottlingPresets.getOfflineConditions(),
    ];
  }

  /** @type {!Array<!SDK.NetworkManager.Conditions>} */
  static networkPresets = [
    SDK.NetworkManager.Fast3GConditions,
    SDK.NetworkManager.Slow3GConditions,
    SDK.NetworkManager.OfflineConditions,
  ];

  /** @type {!Array<!CPUThrottlingRates>} */
  static cpuThrottlingPresets = [
    ThrottlingPresets.CPUThrottlingRates.NoThrottling,
    ThrottlingPresets.CPUThrottlingRates.MidTierMobile,
    ThrottlingPresets.CPUThrottlingRates.LowEndMobile,
  ];
}
export interface Conditions {
  title: string;
  description: string;
  network: SDK.NetworkManager.Conditions;
  cpuThrottlingRate: number;
}
export interface NetworkThrottlingConditionsGroup {
  title: string;
  items: SDK.NetworkManager.Conditions[];
}
export interface MobileThrottlingConditionsGroup {
  title: string;
  items: (Conditions | PlaceholderConditions)[];
}

/** @typedef {!Array<?Conditions|!PlaceholderConditions>} */
// @ts-ignore typedef
export let ConditionsList;
export interface PlaceholderConditions {
  title: string;
  description: string;
}
