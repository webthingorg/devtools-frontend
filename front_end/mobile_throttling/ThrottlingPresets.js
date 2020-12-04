// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

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
const str_ = i18n.i18n.registerUIStrings('mobile_throttling/ThrottlingPresets.js', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);
/** @enum {number} */
export const CPUThrottlingRates = {
  NoThrottling: 1,
  MidTierMobile: 4,
  LowEndMobile: 6,
};

/** @type {!Conditions} */
export const NoThrottlingConditions = {
  title: SDK.NetworkManager.NoThrottlingConditions.title,
  description: i18nString(UIStrings.noThrottling),
  network: SDK.NetworkManager.NoThrottlingConditions,
  cpuThrottlingRate: CPUThrottlingRates.NoThrottling,
};

/** @type {!Conditions} */
export const OfflineConditions = {
  title: SDK.NetworkManager.OfflineConditions.title,
  description: i18nString(UIStrings.noInternetConnectivity),
  network: SDK.NetworkManager.OfflineConditions,
  cpuThrottlingRate: CPUThrottlingRates.NoThrottling,
};

/** @type {!Conditions} */
export const LowEndMobileConditions = {
  title: i18nString(UIStrings.lowendMobile),
  description: i18nString(UIStrings.slowGXCpuSlowdown),
  network: SDK.NetworkManager.Slow3GConditions,
  cpuThrottlingRate: CPUThrottlingRates.LowEndMobile,
};

/** @type {!Conditions} */
export const MidTierMobileConditions = {
  title: i18nString(UIStrings.midtierMobile),
  description: i18nString(UIStrings.fastGXCpuSlowdown),
  network: SDK.NetworkManager.Fast3GConditions,
  cpuThrottlingRate: CPUThrottlingRates.MidTierMobile,
};

/** @type {!PlaceholderConditions} */
export const CustomConditions = {
  title: i18nString(UIStrings.custom),
  description: i18nString(UIStrings.checkNetworkAndPerformancePanels),
};

/** @type {!Array.<(!Conditions|!PlaceholderConditions)>} */
export const mobilePresets = [MidTierMobileConditions, LowEndMobileConditions, CustomConditions];

/** @type {!Array.<!Conditions>} */
export const advancedMobilePresets = [
  OfflineConditions,
];

/** @type {!Array<!SDK.NetworkManager.Conditions>} */
export const networkPresets = [
  SDK.NetworkManager.Fast3GConditions,
  SDK.NetworkManager.Slow3GConditions,
  SDK.NetworkManager.OfflineConditions,
];

/** @type {!Array<!CPUThrottlingRates>} */
export const cpuThrottlingPresets = [
  CPUThrottlingRates.NoThrottling,
  CPUThrottlingRates.MidTierMobile,
  CPUThrottlingRates.LowEndMobile,
];

/**
 * @typedef {{
  *   title: string,
  *   description: string,
  *   network: !SDK.NetworkManager.Conditions,
  *   cpuThrottlingRate: !CPUThrottlingRates
  * }}
  **/
// @ts-ignore typedef
export let Conditions;

/** @typedef {!{title: string, items: !Array<!SDK.NetworkManager.Conditions>}} */
// @ts-ignore typedef
export let NetworkThrottlingConditionsGroup;

/** @typedef {!{title: string, items: !Array<!Conditions|!PlaceholderConditions>}} */
// @ts-ignore typedef
export let MobileThrottlingConditionsGroup;

/** @typedef {!Array<?Conditions|!PlaceholderConditions>} */
// @ts-ignore typedef
export let ConditionsList;

/**
 * @typedef {{
  *   title: string,
  *   description: string
  * }}
  **/
// @ts-ignore typedef
export let PlaceholderConditions;
