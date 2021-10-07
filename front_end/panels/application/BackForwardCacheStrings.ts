// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as i18n from '../../core/i18n/i18n.js';

const UIStrings = {
  /**
     * @description Title text in Back-forward Cache view of the Application panel
     */
  mainFrame: 'Main Frame',
  /**
     * @description Section header text in Back-forward Cache view of the Application panel
     */
  lastMainFrameNavigation: 'Last Main Frame Navigation',
  /**
     * @description Title text in Back-forward Cache view of the Application panel
     */
  backForwardCacheTitle: 'Back-forward Cache',
  /**
     * @description Status text for the status of the main frame
     */
  unavailable: 'unavailable',
  /**
     * @description Entry name text in the Back-forward Cache view of the Application panel
     */
  url: 'URL',
  /**
     * @description Entry name text in the Back-forward Cache view of the Application panel
     */
  bfcacheStatus: 'Back-forward Cache Status',
  /**
     * @description Status text for the status of the back-forward cache status
     */
  unknown: 'unknown',
  /**
      * @description Status text for the status of the back-forward cache status indicating that
      * the back-forward cache was not used and a normal navigation occured instead.
      */
  normalNavigation: 'Normal navigation (Not restored from back-forward cache)',
  /**
      * @description Status text for the status of the back-forward cache status indicating that
      * the back-forward cache was used to restore the page instead of reloading it.
      */
  restoredFromBFCache: 'Restored from back-forward cache',
  /**
      * @description Category text for the reasons which need to be cleaned up on the websites in
      * order to make the page eligible for the back-forward cache.
      */
  pageSupportNeeded: 'Actionable',
  /**
      * @description Category text for the reasons which are circumstantial and cannot be addressed
      * by developers.
      */
  circumstantial: 'Not Actionable',
  /**
      * @description Explanation text appended to a reason why the usage of the back-forward cache
      * is not possible, if in a future version of Chrome this reason will not prevent the usage
      * of the back-forward cache anymore.
      */
  supportPending: 'Pending Support',
};

const str_ = i18n.i18n.registerUIStrings('panels/application/BackForwardCacheStrings.ts', UIStrings);
const i18nLazyString = i18n.i18n.getLazilyComputedLocalizedString.bind(undefined, str_);

export const BackForwardCacheUIStrings = {
  'mainFrame': {name: i18nLazyString(UIStrings.mainFrame)},
  'lastMainFrameNavigation': {name: i18nLazyString(UIStrings.lastMainFrameNavigation)},
  'backForwardCacheTitle': {name: i18nLazyString(UIStrings.backForwardCacheTitle)},
  'unavailable': {name: i18nLazyString(UIStrings.unavailable)},
  'url': {name: i18nLazyString(UIStrings.url)},
  'bfcacheStatus': {name: i18nLazyString(UIStrings.bfcacheStatus)},
  'unknown': {name: i18nLazyString(UIStrings.unknown)},
  'normalNavigation': {name: i18nLazyString(UIStrings.normalNavigation)},
  'restoredFromBFCache': {name: i18nLazyString(UIStrings.restoredFromBFCache)},
  'pageSupportNeeded': {name: i18nLazyString(UIStrings.pageSupportNeeded)},
  'circumstantial': {name: i18nLazyString(UIStrings.circumstantial)},
  'supportPending': {name: i18nLazyString(UIStrings.supportPending)},
};
