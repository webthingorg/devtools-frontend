// Copyright (c) 2015 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../common/common.js';
import * as i18n from '../i18n/i18n.js';
import * as MobileThrottling from '../mobile_throttling/mobile_throttling.js';
import * as SDK from '../sdk/sdk.js';
import * as UI from '../ui/ui.js';

export const UIStrings = {
  /**
  *@description Text in Network Config View of the Network panel
  */
  custom: 'Custom...',
  /**
  *@description Other user agent element placeholder in Network Config View of the Network panel
  */
  enterACustomUserAgent: 'Enter a custom user agent',
  /**
  *@description Error message for empty custom user agent input
  */
  customUserAgentFieldIsRequired: 'Custom user agent field is required',
  /**
  *@description Text in Network Config View of the Network panel
  */
  caching: 'Caching',
  /**
  *@description Text in Network Config View of the Network panel
  */
  disableCache: 'Disable cache',
  /**
  *@description Text in Network Config View of the Network panel
  */
  networkThrottling: 'Network throttling',
  /**
  *@description Text in Network Config View of the Network panel
  */
  userAgent: 'User agent',
  /**
  *@description Text in Network Config View of the Network panel
  */
  selectAutomatically: 'Select automatically',
  /**
  *@description A group title in the user agent dropdown menu in the Network conditions tool
  */
  android: '`Android`',
  /**
  *@description An option in the user agent dropdown menu in the Network conditions tool
  */
  androidBrowserGalaxyNexus: '`Android (4.0.2) Browser — Galaxy Nexus`',
  /**
  *@description An option in the user agent dropdown menu in the Network conditions tool
  */
  androidBrowserNexusS: '`Android (2.3) Browser — Nexus S`',
  /**
  *@description A group title in the user agent dropdown menu in the Network conditions tool
  */
  blackberry: '`BlackBerry`',
  /**
  *@description An option in the user agent dropdown menu in the Network conditions tool
  */
  blackberryBb: '`BlackBerry — BB10`',
  /**
  *@description An option in the user agent dropdown menu in the Network conditions tool
  */
  blackberryPlaybook: '`BlackBerry — PlayBook 2.1`',
  /**
  *@description An option in the user agent dropdown menu in the Network conditions tool
  */
  blackberry9: '`BlackBerry — 9900`',
  /**
  *@description A group title in the user agent dropdown menu in the Network conditions tool
  */
  chrome: '`Chrome`',
  /**
  *@description An option in the user agent dropdown menu in the Network conditions tool
  */
  chromeAndroidMobile: '`Chrome — Android Mobile`',
  /**
  *@description An option in the user agent dropdown menu in the Network conditions tool
  */
  chromeAndroidMobileHighend: '`Chrome — Android Mobile (high-end)`',
  /**
  *@description An option in the user agent dropdown menu in the Network conditions tool
  */
  chromeAndroidTablet: '`Chrome — Android Tablet`',
  /**
  *@description An option in the user agent dropdown menu in the Network conditions tool
  */
  chromeIphone: '`Chrome — iPhone`',
  /**
  *@description An option in the user agent dropdown menu in the Network conditions tool
  */
  chromeIpad: '`Chrome — iPad`',
  /**
  *@description An option in the user agent dropdown menu in the Network conditions tool
  */
  chromeChromeOs: '`Chrome — Chrome OS`',
  /**
  *@description An option in the user agent dropdown menu in the Network conditions tool
  */
  chromeMac: '`Chrome — Mac`',
  /**
  *@description An option in the user agent dropdown menu in the Network conditions tool
  */
  chromeWindows: '`Chrome — Windows`',
  /**
  *@description A group title in the user agent dropdown menu in the Network conditions tool
  */
  firefox: '`Firefox`',
  /**
  *@description An option in the user agent dropdown menu in the Network conditions tool
  */
  firefoxAndroidMobile: '`Firefox — Android Mobile`',
  /**
  *@description An option in the user agent dropdown menu in the Network conditions tool
  */
  firefoxAndroidTablet: '`Firefox — Android Tablet`',
  /**
  *@description An option in the user agent dropdown menu in the Network conditions tool
  */
  firefoxIphone: '`Firefox — iPhone`',
  /**
  *@description An option in the user agent dropdown menu in the Network conditions tool
  */
  firefoxIpad: '`Firefox — iPad`',
  /**
  *@description An option in the user agent dropdown menu in the Network conditions tool
  */
  firefoxMac: '`Firefox — Mac`',
  /**
  *@description An option in the user agent dropdown menu in the Network conditions tool
  */
  firefoxWindows: '`Firefox — Windows`',
  /**
  *@description A group title in the user agent dropdown menu in the Network conditions tool
  */
  googlebot: '`Googlebot`',
  /**
  *@description An option in the user agent dropdown menu in the Network conditions tool
  */
  googlebotDesktop: '`Googlebot Desktop`',
  /**
  *@description An option in the user agent dropdown menu in the Network conditions tool
  */
  googlebotSmartphone: '`Googlebot Smartphone`',
  /**
  *@description A group title in the user agent dropdown menu in the Network conditions tool
  */
  internetExplorer: '`Internet Explorer`',
  /**
  *@description An option in the user agent dropdown menu in the Network conditions tool
  */
  internetExplorer11: '`Internet Explorer 11`',
  /**
  *@description An option in the user agent dropdown menu in the Network conditions tool
  */
  internetExplorer10: '`Internet Explorer 10`',
  /**
  *@description An option in the user agent dropdown menu in the Network conditions tool
  */
  internetExplorer9: '`Internet Explorer 9`',
  /**
  *@description An option in the user agent dropdown menu in the Network conditions tool
  */
  internetExplorer8: '`Internet Explorer 8`',
  /**
  *@description An option in the user agent dropdown menu in the Network conditions tool
  */
  internetExplorer7: '`Internet Explorer 7`',
  /**
  *@description A group title in the user agent dropdown menu in the Network conditions tool
  */
  microsoftEdge: '`Microsoft Edge`',
  /**
  *@description An option in the user agent dropdown menu in the Network conditions tool
  */
  microsoftEdgeChromiumWindows: '`Microsoft Edge (Chromium) — Windows`',
  /**
  *@description An option in the user agent dropdown menu in the Network conditions tool
  */
  microsoftEdgeChromiumMac: '`Microsoft Edge (Chromium) — Mac`',
  /**
  *@description An option in the user agent dropdown menu in the Network conditions tool
  */
  microsoftEdgeIphone: '`Microsoft Edge — iPhone`',
  /**
  *@description An option in the user agent dropdown menu in the Network conditions tool
  */
  microsoftEdgeIpad: '`Microsoft Edge — iPad`',
  /**
  *@description An option in the user agent dropdown menu in the Network conditions tool
  */
  microsoftEdgeAndroidMobile: '`Microsoft Edge — Android Mobile`',
  /**
  *@description An option in the user agent dropdown menu in the Network conditions tool
  */
  microsoftEdgeAndroidTablet: '`Microsoft Edge — Android Tablet`',
  /**
  *@description An option in the user agent dropdown menu in the Network conditions tool
  */
  microsoftEdgeEdgehtmlWindows: '`Microsoft Edge (EdgeHTML) — Windows`',
  /**
  *@description An option in the user agent dropdown menu in the Network conditions tool
  */
  microsoftEdgeEdgehtmlXbox: '`Microsoft Edge (EdgeHTML) — XBox`',
  /**
  *@description A group title in the user agent dropdown menu in the Network conditions tool
  */
  opera: '`Opera`',
  /**
  *@description An option in the user agent dropdown menu in the Network conditions tool
  */
  operaMac: '`Opera — Mac`',
  /**
  *@description An option in the user agent dropdown menu in the Network conditions tool
  */
  operaWindows: '`Opera — Windows`',
  /**
  *@description An option in the user agent dropdown menu in the Network conditions tool
  */
  operaPrestoMac: '`Opera (Presto) — Mac`',
  /**
  *@description An option in the user agent dropdown menu in the Network conditions tool
  */
  operaPrestoWindows: '`Opera (Presto) — Windows`',
  /**
  *@description An option in the user agent dropdown menu in the Network conditions tool
  */
  operaMobileAndroidMobile: '`Opera Mobile — Android Mobile`',
  /**
  *@description An option in the user agent dropdown menu in the Network conditions tool
  */
  operaMiniIos: '`Opera Mini — iOS`',
  /**
  *@description A group title in the user agent dropdown menu in the Network conditions tool
  */
  safari: '`Safari`',
  /**
  *@description An option in the user agent dropdown menu in the Network conditions tool
  */
  safariIpadIos: 'Safari — iPad iOS 13.2',
  /**
  *@description An option in the user agent dropdown menu in the Network conditions tool
  */
  safariIphoneIos: 'Safari — iPhone iOS 13.2',
  /**
  *@description An option in the user agent dropdown menu in the Network conditions tool
  */
  safariMac: '`Safari — Mac`',
  /**
  *@description A group title in the user agent dropdown menu in the Network conditions tool
  */
  ucBrowser: '`UC Browser`',
  /**
  *@description An option in the user agent dropdown menu in the Network conditions tool
  */
  ucBrowserAndroidMobile: '`UC Browser — Android Mobile`',
  /**
  *@description An option in the user agent dropdown menu in the Network conditions tool
  */
  ucBrowserIos: '`UC Browser — iOS`',
  /**
  *@description An option in the user agent dropdown menu in the Network conditions tool
  */
  ucBrowserWindowsPhone: '`UC Browser — Windows Phone`',
};
const str_ = i18n.i18n.registerUIStrings('network/NetworkConfigView.js', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

/** @type {!NetworkConfigView} */
let networkConfigViewInstance;

export class NetworkConfigView extends UI.Widget.VBox {
  constructor() {
    super(true);
    this.registerRequiredCSS('network/networkConfigView.css', {enableLegacyPatching: true});
    this.contentElement.classList.add('network-config');

    this._createCacheSection();
    this.contentElement.createChild('div').classList.add('panel-section-separator');
    this._createNetworkThrottlingSection();
    this.contentElement.createChild('div').classList.add('panel-section-separator');
    this._createUserAgentSection();
  }

  /**
   * @param {{forceNew: ?boolean}} opts
   */
  static instance(opts = {forceNew: null}) {
    const {forceNew} = opts;
    if (!networkConfigViewInstance || forceNew) {
      networkConfigViewInstance = new NetworkConfigView();
    }
    return networkConfigViewInstance;
  }

  /**
   * @param {string} title
   * @return {{select: !HTMLSelectElement, input: !HTMLInputElement, error: !HTMLElement}}
   */
  static createUserAgentSelectAndInput(title) {
    const userAgentSetting = Common.Settings.Settings.instance().createSetting('customUserAgent', '');
    /** @type {!HTMLSelectElement} */
    const userAgentSelectElement = /** @type {!HTMLSelectElement} */ (document.createElement('select'));
    UI.ARIAUtils.setAccessibleName(userAgentSelectElement, title);

    const customOverride = {title: i18nString(UIStrings.custom), value: 'custom'};
    userAgentSelectElement.appendChild(new Option(customOverride.title, customOverride.value));

    for (const userAgentDescriptor of userAgentGroups) {
      /** @type {!HTMLOptGroupElement} */
      const groupElement = /** @type {!HTMLOptGroupElement} */ (userAgentSelectElement.createChild('optgroup'));
      groupElement.label = userAgentDescriptor.title;
      for (const userAgentVersion of userAgentDescriptor.values) {
        const userAgentValue =
            SDK.NetworkManager.MultitargetNetworkManager.patchUserAgentWithChromeVersion(userAgentVersion.value);
        groupElement.appendChild(new Option(userAgentVersion.title, userAgentValue));
      }
    }

    userAgentSelectElement.selectedIndex = 0;

    const otherUserAgentElement = UI.UIUtils.createInput('', 'text');
    otherUserAgentElement.value = userAgentSetting.get();
    UI.Tooltip.Tooltip.install(otherUserAgentElement, userAgentSetting.get());
    otherUserAgentElement.placeholder = i18nString(UIStrings.enterACustomUserAgent);
    otherUserAgentElement.required = true;
    UI.ARIAUtils.setAccessibleName(otherUserAgentElement, otherUserAgentElement.placeholder);

    /** @type {!HTMLElement} */
    const errorElement = /** @type {!HTMLElement} */ (document.createElement('div'));
    errorElement.classList.add('network-config-input-validation-error');
    UI.ARIAUtils.markAsAlert(errorElement);
    if (!otherUserAgentElement.value) {
      errorElement.textContent = i18nString(UIStrings.customUserAgentFieldIsRequired);
    }

    settingChanged();
    userAgentSelectElement.addEventListener('change', userAgentSelected, false);
    otherUserAgentElement.addEventListener('input', applyOtherUserAgent, false);

    function userAgentSelected() {
      const value = userAgentSelectElement.options[userAgentSelectElement.selectedIndex].value;
      if (value !== customOverride.value) {
        userAgentSetting.set(value);
        otherUserAgentElement.value = value;
        UI.Tooltip.Tooltip.install(otherUserAgentElement, value);
      } else {
        otherUserAgentElement.select();
      }
      errorElement.textContent = '';
    }

    function settingChanged() {
      const value = userAgentSetting.get();
      const options = userAgentSelectElement.options;
      let selectionRestored = false;
      for (let i = 0; i < options.length; ++i) {
        if (options[i].value === value) {
          userAgentSelectElement.selectedIndex = i;
          selectionRestored = true;
          break;
        }
      }

      if (!selectionRestored) {
        userAgentSelectElement.selectedIndex = 0;
      }
    }

    function applyOtherUserAgent() {
      if (userAgentSetting.get() !== otherUserAgentElement.value) {
        if (!otherUserAgentElement.value) {
          errorElement.textContent = i18nString(UIStrings.customUserAgentFieldIsRequired);
        } else {
          errorElement.textContent = '';
        }
        userAgentSetting.set(otherUserAgentElement.value);
        UI.Tooltip.Tooltip.install(otherUserAgentElement, otherUserAgentElement.value);
        settingChanged();
      }
    }

    return {select: userAgentSelectElement, input: otherUserAgentElement, error: errorElement};
  }

  /**
   * @param {string} title
   * @param {string=} className
   * @return {!Element}
   */
  _createSection(title, className) {
    const section = this.contentElement.createChild('section', 'network-config-group');
    if (className) {
      section.classList.add(className);
    }
    section.createChild('div', 'network-config-title').textContent = title;
    return section.createChild('div', 'network-config-fields');
  }

  _createCacheSection() {
    const section = this._createSection(i18nString(UIStrings.caching), 'network-config-disable-cache');
    section.appendChild(UI.SettingsUI.createSettingCheckbox(
        i18nString(UIStrings.disableCache), Common.Settings.Settings.instance().moduleSetting('cacheDisabled'), true));
  }

  _createNetworkThrottlingSection() {
    const title = i18nString(UIStrings.networkThrottling);
    const section = this._createSection(title, 'network-config-throttling');
    const networkThrottlingSelect =
        /** @type {!HTMLSelectElement} */ (section.createChild('select', 'chrome-select'));
    MobileThrottling.ThrottlingManager.throttlingManager().decorateSelectWithNetworkThrottling(networkThrottlingSelect);
    UI.ARIAUtils.setAccessibleName(networkThrottlingSelect, title);
  }

  _createUserAgentSection() {
    const title = i18nString(UIStrings.userAgent);
    const section = this._createSection(title, 'network-config-ua');
    const checkboxLabel = UI.UIUtils.CheckboxLabel.create(i18nString(UIStrings.selectAutomatically), true);
    section.appendChild(checkboxLabel);
    const autoCheckbox = checkboxLabel.checkboxElement;

    const customUserAgentSetting = Common.Settings.Settings.instance().createSetting('customUserAgent', '');
    customUserAgentSetting.addChangeListener(() => {
      if (autoCheckbox.checked) {
        return;
      }
      SDK.NetworkManager.MultitargetNetworkManager.instance().setCustomUserAgentOverride(customUserAgentSetting.get());
    });
    const customUserAgentSelectBox = section.createChild('div', 'network-config-ua-custom');
    autoCheckbox.addEventListener('change', userAgentSelectBoxChanged);
    const customSelectAndInput = NetworkConfigView.createUserAgentSelectAndInput(title);
    customSelectAndInput.select.classList.add('chrome-select');
    customUserAgentSelectBox.appendChild(customSelectAndInput.select);
    customUserAgentSelectBox.appendChild(customSelectAndInput.input);
    customUserAgentSelectBox.appendChild(customSelectAndInput.error);
    userAgentSelectBoxChanged();

    function userAgentSelectBoxChanged() {
      const useCustomUA = !autoCheckbox.checked;
      customUserAgentSelectBox.classList.toggle('checked', useCustomUA);
      customSelectAndInput.select.disabled = !useCustomUA;
      customSelectAndInput.input.disabled = !useCustomUA;
      customSelectAndInput.error.hidden = !useCustomUA;
      const customUA = useCustomUA ? customUserAgentSetting.get() : '';
      SDK.NetworkManager.MultitargetNetworkManager.instance().setCustomUserAgentOverride(customUA);
    }
  }
}

/** @type {!Array.<{title: string, values: !Array.<{title: string, value: string}>}>} */
export const userAgentGroups = [
  {
    title: i18nString(UIStrings.android),
    values: [
      {
        title: i18nString(UIStrings.androidBrowserGalaxyNexus),
        value:
            'Mozilla/5.0 (Linux; U; Android 4.0.2; en-us; Galaxy Nexus Build/ICL53F) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30'
      },
      {
        title: i18nString(UIStrings.androidBrowserNexusS),
        value:
            'Mozilla/5.0 (Linux; U; Android 2.3.6; en-us; Nexus S Build/GRK39F) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1'
      }
    ]
  },
  {
    title: i18nString(UIStrings.blackberry),
    values: [
      {
        title: i18nString(UIStrings.blackberryBb),
        value:
            'Mozilla/5.0 (BB10; Touch) AppleWebKit/537.1+ (KHTML, like Gecko) Version/10.0.0.1337 Mobile Safari/537.1+'
      },
      {
        title: i18nString(UIStrings.blackberryPlaybook),
        value:
            'Mozilla/5.0 (PlayBook; U; RIM Tablet OS 2.1.0; en-US) AppleWebKit/536.2+ (KHTML, like Gecko) Version/7.2.1.0 Safari/536.2+'
      },
      {
        title: i18nString(UIStrings.blackberry9),
        value:
            'Mozilla/5.0 (BlackBerry; U; BlackBerry 9900; en-US) AppleWebKit/534.11+ (KHTML, like Gecko) Version/7.0.0.187 Mobile Safari/534.11+'
      }
    ]
  },
  {
    title: i18nString(UIStrings.chrome),
    values: [
      {
        title: i18nString(UIStrings.chromeAndroidMobile),
        value:
            'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/%s Mobile Safari/537.36'
      },
      {
        title: i18nString(UIStrings.chromeAndroidMobileHighend),
        value:
            'Mozilla/5.0 (Linux; Android 10; Pixel 4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/%s Mobile Safari/537.36'
      },
      {
        title: i18nString(UIStrings.chromeAndroidTablet),
        value:
            'Mozilla/5.0 (Linux; Android 4.3; Nexus 7 Build/JSS15Q) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/%s Safari/537.36'
      },
      {
        title: i18nString(UIStrings.chromeIphone),
        value:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/%s Mobile/15E148 Safari/604.1'
      },
      {
        title: i18nString(UIStrings.chromeIpad),
        value:
            'Mozilla/5.0 (iPad; CPU OS 13_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/%s Mobile/15E148 Safari/604.1'
      },
      {
        title: i18nString(UIStrings.chromeChromeOs),
        value: 'Mozilla/5.0 (X11; CrOS x86_64 10066.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/%s Safari/537.36'
      },
      {
        title: i18nString(UIStrings.chromeMac),
        value:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/%s Safari/537.36'
      },
      {
        title: i18nString(UIStrings.chromeWindows),
        value: 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/%s Safari/537.36'
      }
    ]
  },
  {
    title: i18nString(UIStrings.firefox),
    values: [
      {
        title: i18nString(UIStrings.firefoxAndroidMobile),
        value: 'Mozilla/5.0 (Android 4.4; Mobile; rv:70.0) Gecko/70.0 Firefox/70.0'
      },
      {
        title: i18nString(UIStrings.firefoxAndroidTablet),
        value: 'Mozilla/5.0 (Android 4.4; Tablet; rv:70.0) Gecko/70.0 Firefox/70.0'
      },
      {
        title: i18nString(UIStrings.firefoxIphone),
        value:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 8_3 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko) FxiOS/1.0 Mobile/12F69 Safari/600.1.4'
      },
      {
        title: i18nString(UIStrings.firefoxIpad),
        value:
            'Mozilla/5.0 (iPad; CPU iPhone OS 8_3 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko) FxiOS/1.0 Mobile/12F69 Safari/600.1.4'
      },
      {
        title: i18nString(UIStrings.firefoxMac),
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.14; rv:70.0) Gecko/20100101 Firefox/70.0'
      },
      {
        title: i18nString(UIStrings.firefoxWindows),
        value: 'Mozilla/5.0 (Windows NT 10.0; WOW64; rv:70.0) Gecko/20100101 Firefox/70.0'
      }
    ]
  },
  {
    title: i18nString(UIStrings.googlebot),
    values: [
      {
        title: i18nString(UIStrings.googlebot),
        value: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
      },
      {
        title: i18nString(UIStrings.googlebotDesktop),
        value:
            'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Chrome/%s Safari/537.36'
      },
      {
        title: i18nString(UIStrings.googlebotSmartphone),
        value:
            'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/%s Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
      }
    ]
  },
  {
    title: i18nString(UIStrings.internetExplorer),
    values: [
      {
        title: i18nString(UIStrings.internetExplorer11),
        value: 'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko'
      },
      {
        title: i18nString(UIStrings.internetExplorer10),
        value: 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; WOW64; Trident/6.0)'
      },
      {
        title: i18nString(UIStrings.internetExplorer9),
        value: 'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0)'
      },
      {
        title: i18nString(UIStrings.internetExplorer8),
        value: 'Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.0; Trident/4.0)'
      },
      {title: i18nString(UIStrings.internetExplorer7), value: 'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0)'}
    ]
  },
  {
    title: i18nString(UIStrings.microsoftEdge),
    values: [
      {
        title: i18nString(UIStrings.microsoftEdgeChromiumWindows),
        value:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/%s Safari/537.36 Edg/%s'
      },
      {
        title: i18nString(UIStrings.microsoftEdgeChromiumMac),
        value:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Chrome/%s Safari/604.1 Edg/%s'
      },
      {
        title: i18nString(UIStrings.microsoftEdgeIphone),
        value:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 12_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1.1 EdgiOS/44.5.0.10 Mobile/15E148 Safari/604.1'
      },
      {
        title: i18nString(UIStrings.microsoftEdgeIpad),
        value:
            'Mozilla/5.0 (iPad; CPU OS 12_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0 EdgiOS/44.5.2 Mobile/15E148 Safari/605.1.15'
      },
      {
        title: i18nString(UIStrings.microsoftEdgeAndroidMobile),
        value:
            'Mozilla/5.0 (Linux; Android 8.1.0; Pixel Build/OPM4.171019.021.D1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.109 Mobile Safari/537.36 EdgA/42.0.0.2057'
      },
      {
        title: i18nString(UIStrings.microsoftEdgeAndroidTablet),
        value:
            'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 7 Build/MOB30X) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.109 Safari/537.36 EdgA/42.0.0.2057'
      },
      {
        title: i18nString(UIStrings.microsoftEdgeEdgehtmlWindows),
        value:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36 Edge/18.18362'
      },
      {
        title: i18nString(UIStrings.microsoftEdgeEdgehtmlXbox),
        value:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; Xbox; Xbox One) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36 Edge/18.18362'
      }
    ]
  },
  {
    title: i18nString(UIStrings.opera),
    values: [
      {
        title: i18nString(UIStrings.operaMac),
        value:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.97 Safari/537.36 OPR/65.0.3467.48'
      },
      {
        title: i18nString(UIStrings.operaWindows),
        value:
            'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.97 Safari/537.36 OPR/65.0.3467.48'
      },
      {
        title: i18nString(UIStrings.operaPrestoMac),
        value: 'Opera/9.80 (Macintosh; Intel Mac OS X 10.9.1) Presto/2.12.388 Version/12.16'
      },
      {
        title: i18nString(UIStrings.operaPrestoWindows),
        value: 'Opera/9.80 (Windows NT 6.1) Presto/2.12.388 Version/12.16'
      },
      {
        title: i18nString(UIStrings.operaMobileAndroidMobile),
        value: 'Opera/12.02 (Android 4.1; Linux; Opera Mobi/ADR-1111101157; U; en-US) Presto/2.9.201 Version/12.02'
      },
      {
        title: i18nString(UIStrings.operaMiniIos),
        value: 'Opera/9.80 (iPhone; Opera Mini/8.0.0/34.2336; U; en) Presto/2.8.119 Version/11.10'
      }
    ]
  },
  {
    title: i18nString(UIStrings.safari),
    values: [
      {
        title: i18nString(UIStrings.safariIpadIos),
        value:
            'Mozilla/5.0 (iPad; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1'
      },
      {
        title: i18nString(UIStrings.safariIphoneIos),
        value:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1'
      },
      {
        title: i18nString(UIStrings.safariMac),
        value:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Safari/605.1.15'
      }
    ]
  },
  {
    title: i18nString(UIStrings.ucBrowser),
    values: [
      {
        title: i18nString(UIStrings.ucBrowserAndroidMobile),
        value:
            'Mozilla/5.0 (Linux; U; Android 8.1.0; en-US; Nexus 6P Build/OPM7.181205.001) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/57.0.2987.108 UCBrowser/12.11.1.1197 Mobile Safari/537.36'
      },
      {
        title: i18nString(UIStrings.ucBrowserIos),
        value:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 12_1 like Mac OS X; zh-CN) AppleWebKit/537.51.1 (KHTML, like Gecko) Mobile/16B92 UCBrowser/12.1.7.1109 Mobile AliApp(TUnionSDK/0.1.20.3)'
      },
      {
        title: i18nString(UIStrings.ucBrowserWindowsPhone),
        value:
            'Mozilla/5.0 (compatible; MSIE 10.0; Windows Phone 8.0; Trident/6.0; IEMobile/10.0; ARM; Touch; NOKIA; Lumia 920) UCBrowser/10.1.0.563 Mobile'
      }
    ]
  }
];
