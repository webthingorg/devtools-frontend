// Copyright (c) 2015 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/* eslint-disable rulesdir/no_underscored_properties */

import * as Common from '../../core/common/common.js';
import * as i18n from '../../core/i18n/i18n.js';
import * as SDK from '../../core/sdk/sdk.js';
import * as UI from '../../ui/legacy/legacy.js';
import * as MobileThrottling from '../mobile_throttling/mobile_throttling.js';


const UIStrings = {
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
  selectAutomatically: 'Use browser default',
  /**
   * @description Title of a section in the Network conditions view that includes
   * a set of checkboxes to override the content encodings supported by the browser.
   */
  acceptedEncoding: 'Accepted `Content-Encoding`s',
  /**
  *@description Title of foldable group of options in Devices pane letting users customize what
  *information is sent about the browser and device via user agent client hints functionality. 'user
  *agent' refers to the browser/unique ID the user is using. 'hints' is a noun.
  */
  userAgentClient: 'User agent client hints',
  /**
  *@description Tooltip text for the foldable 'User agent client hints' section's help button
  */
  userAgentClientHintsAre:
      'User agent client hints are an alternative to the user agent string that identify the browser and the device in a more structured way with better privacy accounting. Click the button to learn more.',
  /**
  *@description Field in Devices pane letting users customize which browser names
  * edited device presents via User Agent Client Hints. Placeholder is locked text.
  */
  UABrand: 'Browser',
  /**
  *@description Field in Devices pane letting users customize which browser major version
  * edited device presents via User Agent Client Hints. Placeholder is locked text.
  */
  UAVersion: 'Version',
  /**
  *@description Field in Network conditions pane letting users add another browser.
  */
  UAAddABrowser: '+ Add another browser',
  /**
  *@description Field in the Devices pane letting customize precise browser version the edited device presents via User Agent Client Hints.
  */
  fullBrowserVersion: 'Build version',
  /**
  *@description Field in Devices pane letting customize which operating system the edited device presents via User Agent Client Hints. Example should be kept exactly.
  */
  platform: 'Platform',
  /**
  *@description Field in Devices pane letting customize which operating system version the edited device presents via User Agent Client Hints
  */
  platformVersion: 'Version',
  /**
  *@description Field in Devices pane letting customize which CPU architecture the edited device presents via User Agent Client Hints. Example should be kept exactly.
  */
  architecture: 'Architecture',
  /**
  *@description Field in the Devices pane letting customize the name the edited device presents via User Agent Client Hints
  */
  deviceModel: 'Device model',
  /**
  *@description Field Field in the Devices pane letting customize the mobile checkbox via User Agent Client Hints
  */
  mobile: 'Mobile',
};
const str_ = i18n.i18n.registerUIStrings('panels/network/NetworkConfigView.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

let networkConfigViewInstance: NetworkConfigView;

export class NetworkConfigView extends UI.Widget.VBox {
  constructor() {
    super(true);
    this.registerRequiredCSS('panels/network/networkConfigView.css', {enableLegacyPatching: false});
    this.contentElement.classList.add('network-config');

    this._createCacheSection();
    this.contentElement.createChild('div').classList.add('panel-section-separator');
    this._createNetworkThrottlingSection();
    this.contentElement.createChild('div').classList.add('panel-section-separator');
    this._createUserAgentSection();
    this.contentElement.createChild('div').classList.add('panel-section-separator');
    this._createAcceptedEncodingSection();
  }

  static instance(opts: {
    forceNew: boolean|null,
  } = {forceNew: null}): NetworkConfigView {
    const {forceNew} = opts;
    if (!networkConfigViewInstance || forceNew) {
      networkConfigViewInstance = new NetworkConfigView();
    }
    return networkConfigViewInstance;
  }

  static createUserAgentSelectAndInput(title: string): {
    select: HTMLSelectElement,
    input: HTMLInputElement,
    error: HTMLElement,
    clientHint: HTMLElement,
  } {
    const userAgentSetting = Common.Settings.Settings.instance().createSetting('customUserAgent', '');
    const userAgentSelectElement = (document.createElement('select') as HTMLSelectElement);
    UI.ARIAUtils.setAccessibleName(userAgentSelectElement, title);

    const customOverride = {title: i18nString(UIStrings.custom), value: 'custom'};
    userAgentSelectElement.appendChild(new Option(customOverride.title, customOverride.value));

    for (const userAgentDescriptor of userAgentGroups) {
      const groupElement = (userAgentSelectElement.createChild('optgroup') as HTMLOptGroupElement);
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

    const errorElement = (document.createElement('div') as HTMLElement);
    errorElement.classList.add('network-config-input-validation-error');
    UI.ARIAUtils.markAsAlert(errorElement);
    if (!otherUserAgentElement.value) {
      errorElement.textContent = i18nString(UIStrings.customUserAgentFieldIsRequired);
    }

    settingChanged();
    userAgentSelectElement.addEventListener('change', userAgentSelected, false);
    otherUserAgentElement.addEventListener('input', applyOtherUserAgent, false);

    // create user agent client hing
    const clientHint = (document.createElement('div') as HTMLElement);

    const uaChFields = clientHint.createChild('div', 'devices-edit-client-hints-heading');
    UI.UIUtils.createTextChild(uaChFields.createChild('b'), i18nString(UIStrings.userAgentClient));

    const helpIconWrapper = document.createElement('a');
    helpIconWrapper.href = 'https://web.dev/user-agent-client-hints/';
    helpIconWrapper.target = '_blank';
    const icon = UI.Icon.Icon.create('mediumicon-info', 'help-icon');
    helpIconWrapper.appendChild(icon);
    helpIconWrapper.title = i18nString(UIStrings.userAgentClientHintsAre);
    // Prevent the editor grabbing the enter key, letting the default behavior happen.
    helpIconWrapper.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.stopPropagation();
      }
    });
    uaChFields.appendChild(helpIconWrapper);

    const tree = new UI.TreeOutline.TreeOutlineInShadow();
    tree.registerRequiredCSS('panels/network/networkConfigView.css', {enableLegacyPatching: true});
    tree.registerRequiredCSS('panels/emulation/devicesSettingsTab.css', {enableLegacyPatching: true});
    tree.setShowSelectionOnKeyboardFocus(true, false);
    const treeRoot = new UI.TreeOutline.TreeElement(uaChFields, true);
    tree.appendChild(treeRoot);
    // Select the folder to make left/right arrows work as expected; don't change focus, however, since it should start with the device name field.
    treeRoot.select(true, false);
    clientHint.appendChild(tree.element);

    // create an input field with suggestion box
    function createInputWithSuggestBox(title: string, placeholder: string, suggestions: Array<string>): HTMLElement {
      const container = document.createElement('div');
      const input = document.createElement('div');
      UI.ARIAUtils.setAccessibleName(input, title);
      input.id = `network-config-ua-client-hints-${title}`;
      input.classList.add('network-config-ua-client-hints');
      container.appendChild(input);

      const prompt = new UI.TextPrompt.TextPrompt();
      prompt.initialize(
          async(expression: string, prefix: string, _force?: boolean): Promise<UI.SuggestBox.Suggestions> => {
            if (!prefix) {
              return [];
            }

            prefix = prefix.toLowerCase();
            return suggestions.filter(proposal => proposal.toLowerCase().startsWith(prefix))
                .map(completion => ({text: completion} as UI.SuggestBox.Suggestion));
          }, ' ');
      prompt.attach(input);
      prompt.setTitle(title);
      prompt.setPlaceholder(placeholder);

      return container;
    }

    function createALabel(title: string): HTMLElement {
      const container = document.createElement('div');
      const label = document.createElement('span');
      label.classList.add('network-config-ua-client-hints-label');
      label.appendChild(document.createTextNode(title));
      container.appendChild(label);
      return container;
    }

    function createABrowserBrand(): HTMLElement {
      const uaClientBrandContainer = document.createElement('div');
      uaClientBrandContainer.classList.add('network-config-ua-client-hints-container');
      const uaClientHintsBrand =
          createInputWithSuggestBox('brand', i18nString(UIStrings.UABrand), ['Chrome', 'Chromium', 'Chroooomium']);
      uaClientHintsBrand.classList.add('network-config-ua-client-hints-brand');
      uaClientBrandContainer.appendChild(uaClientHintsBrand);
      const uaClientHintsVersion = createInputWithSuggestBox('version', i18nString(UIStrings.UAVersion), []);
      uaClientHintsVersion.classList.add('network-config-ua-client-hints-version');
      uaClientBrandContainer.appendChild(uaClientHintsVersion);
      const uaClientHintsDeleteIcon = UI.Icon.Icon.create('largeicon-delete');
      uaClientHintsDeleteIcon.classList.add('network-config-ua-client-hints-delete-icon');
      uaClientBrandContainer.appendChild(uaClientHintsDeleteIcon);
      uaClientHintsDeleteIcon.addEventListener('click', () => {
        uaClientBrandContainer.remove();
      });
      return uaClientBrandContainer;
    }

    function addToTree(input: HTMLElement): void {
      const treeNode = new UI.TreeOutline.TreeElement(input, false);
      // The inputs themselves are selectable, no need for the tree nodes to be.
      treeNode.selectable = false;
      treeNode.listItemElement.classList.add('devices-edit-client-hints-field');
      treeRoot.appendChild(treeNode);
    }

    // group #1: user agent: a uaClientHintsBrandsContainer consists of a label,
    // 0+ uaClientBrandContainer and a uaClientHintsAddABrowserLink
    const uaClientHintsBrandsContainer = document.createElement('div');
    uaClientHintsBrandsContainer.appendChild(createALabel('User agent'));
    uaClientHintsBrandsContainer.appendChild(createABrowserBrand());
    addToTree(uaClientHintsBrandsContainer);

    const uaClientHintsBrandsContainer2 = document.createElement('div');
    const uaClientHintsFullVersion =
        createInputWithSuggestBox('full-version', i18nString(UIStrings.fullBrowserVersion), []);
    uaClientHintsFullVersion.classList.add('network-config-ua-client-hints-full-version');
    uaClientHintsBrandsContainer2.appendChild(uaClientHintsFullVersion);

    const uaClientHintsAddABrowserLink = document.createElement('a');
    uaClientHintsAddABrowserLink.innerHTML = i18nString(UIStrings.UAAddABrowser);
    uaClientHintsAddABrowserLink.classList.add('network-config-ua-client-hints-add-a-browser-link');
    uaClientHintsAddABrowserLink.addEventListener('click', () => {
      uaClientHintsBrandsContainer.appendChild(createABrowserBrand());
    });
    uaClientHintsBrandsContainer2.appendChild(uaClientHintsAddABrowserLink);
    addToTree(uaClientHintsBrandsContainer2);

    // group #2: platform
    const uaClientHintsPlatformContainer = document.createElement('div');
    uaClientHintsPlatformContainer.classList.add('network-config-ua-client-hints-container');
    uaClientHintsPlatformContainer.appendChild(createALabel(i18nString(UIStrings.platform)));
    const uaClientHintsPlatform = createInputWithSuggestBox('platform', i18nString(UIStrings.platform), []);
    uaClientHintsPlatform.classList.add('network-config-ua-client-hints-platform');
    const uaClientHintsPlatformVersion =
        createInputWithSuggestBox('platform-version', i18nString(UIStrings.platformVersion), []);
    uaClientHintsPlatformVersion.classList.add('network-config-ua-client-hints-platform-version');
    uaClientHintsPlatformContainer.appendChild(uaClientHintsPlatform);
    uaClientHintsPlatformContainer.appendChild(uaClientHintsPlatformVersion);
    addToTree(uaClientHintsPlatformContainer);

    // group #3: architecture
    const uaClientHintsArchContainer = document.createElement('div');
    uaClientHintsArchContainer.classList.add('network-config-ua-client-hints-container');
    uaClientHintsArchContainer.appendChild(createALabel(i18nString(UIStrings.architecture)));
    const uaClientHintsArch = createInputWithSuggestBox('arch', i18nString(UIStrings.architecture), []);
    uaClientHintsArch.classList.add('network-config-ua-client-hints-arch');
    uaClientHintsArchContainer.appendChild(uaClientHintsArch);
    addToTree(uaClientHintsArchContainer);

    // group #4: device model
    const uaClientHintsDeviceContainer = document.createElement('div');
    uaClientHintsDeviceContainer.classList.add('network-config-ua-client-hints-container');
    uaClientHintsDeviceContainer.appendChild(createALabel(i18nString(UIStrings.deviceModel)));
    const uaClientHintsModel = createInputWithSuggestBox('model', i18nString(UIStrings.deviceModel), []);
    uaClientHintsModel.classList.add('network-config-ua-client-hints-model');
    uaClientHintsDeviceContainer.appendChild(uaClientHintsModel);
    const uaClientHintsMobileLabel = UI.UIUtils.CheckboxLabel.create(i18nString(UIStrings.mobile), false);
    uaClientHintsMobileLabel.classList.add('network-condition-ua-client-hints-mobile');
    // const uaClientHintsMobile = uaClientHintsMobileLabel.checkboxElement;
    uaClientHintsDeviceContainer.appendChild(uaClientHintsMobileLabel);
    addToTree(uaClientHintsDeviceContainer);

    const addButton = document.createElement('button');
    addButton.innerHTML = 'Add';
    addButton.classList.add('network-config-ua-client-hints-button');
    addButton.addEventListener('click', addCustomizedUAClientHints);
    addToTree(addButton);

    function addCustomizedUAClientHints(): void {
      // if (!uaClientHintsBrand?.textContent) {
      //   errorElement.textContent = i18nString(UIStrings.brandFieldIsRequired);
      //   return;
      // }
      // if (!uaClientHintsVersion?.textContent) {
      //   errorElement.textContent = i18nString(UIStrings.versionFieldIsRequired);
      //   return;
      // }
      // if (!uaClientHintsFullVersion?.textContent) {
      //   errorElement.textContent = i18nString(UIStrings.fullVersionFieldIsRequired);
      //   return;
      // }
      // if (!uaClientHintsPlatform?.textContent) {
      //   errorElement.textContent = i18nString(UIStrings.platformFieldIsRequired);
      //   return;
      // }
      // if (!uaClientHintsPlatformVersion?.textContent) {
      //   errorElement.textContent = i18nString(UIStrings.platformVersionFieldIsRequired);
      //   return;
      // }
      // if (!uaClientHintsArch?.textContent) {
      //   errorElement.textContent = i18nString(UIStrings.archFieldIsRequired);
      //   return;
      // }
      // if (!uaClientHintsModel?.textContent) {
      //   errorElement.textContent = i18nString(UIStrings.modelFieldIsRequired);
      //   return;
      // }
      // errorElement.textContent = '';

      // const customUAClientHintsMetaData = {
      //   brands: [{
      //     brand: uaClientHintsBrand.textContent,
      //     version: uaClientHintsVersion.textContent,
      //   }],
      //   fullVersion: uaClientHintsFullVersion.textContent,
      //   platform: uaClientHintsPlatform.textContent,
      //   platformVersion: uaClientHintsPlatformVersion.textContent,
      //   architecture: uaClientHintsArch.textContent,
      //   model: uaClientHintsModel.textContent,
      //   mobile: uaClientHintsMobile.checked,
      // };

      // userAgentSelected(null, customUAClientHintsMetaData);
    }

    function userAgentSelected(
        e: Event|null, customUAClientHintsMetaData?: Protocol.Emulation.UserAgentMetadata|null): void {
      const value = userAgentSelectElement.options[userAgentSelectElement.selectedIndex].value;
      if (value !== customOverride.value) {
        userAgentSetting.set(value);
        otherUserAgentElement.value = value;
        UI.Tooltip.Tooltip.install(otherUserAgentElement, value);
        const userAgentMetadata =
            customUAClientHintsMetaData ? customUAClientHintsMetaData : getUserAgentMetadata(value);
        SDK.NetworkManager.MultitargetNetworkManager.instance().setCustomUserAgentOverride(value, userAgentMetadata);
      } else {
        otherUserAgentElement.select();
      }
      errorElement.textContent = '';
    }

    function settingChanged(): void {
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

    function applyOtherUserAgent(): void {
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

    return {select: userAgentSelectElement, input: otherUserAgentElement, error: errorElement, clientHint: clientHint};
  }

  _createSection(title: string, className?: string): Element {
    const section = this.contentElement.createChild('section', 'network-config-group');
    if (className) {
      section.classList.add(className);
    }
    section.createChild('div', 'network-config-title').textContent = title;
    return section.createChild('div', 'network-config-fields');
  }

  _createCacheSection(): void {
    const section = this._createSection(i18nString(UIStrings.caching), 'network-config-disable-cache');
    section.appendChild(UI.SettingsUI.createSettingCheckbox(
        i18nString(UIStrings.disableCache), Common.Settings.Settings.instance().moduleSetting('cacheDisabled'), true));
  }

  _createNetworkThrottlingSection(): void {
    const title = i18nString(UIStrings.networkThrottling);
    const section = this._createSection(title, 'network-config-throttling');
    const networkThrottlingSelect = (section.createChild('select', 'chrome-select') as HTMLSelectElement);
    MobileThrottling.ThrottlingManager.throttlingManager().decorateSelectWithNetworkThrottling(networkThrottlingSelect);
    UI.ARIAUtils.setAccessibleName(networkThrottlingSelect, title);
  }

  _createUserAgentSection(): void {
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
      const customUA = customUserAgentSetting.get();
      const userAgentMetadata = getUserAgentMetadata(customUA);
      SDK.NetworkManager.MultitargetNetworkManager.instance().setCustomUserAgentOverride(customUA, userAgentMetadata);
    });
    const customUserAgentSelectBox = section.createChild('div', 'network-config-ua-custom');
    autoCheckbox.addEventListener('change', userAgentSelectBoxChanged);
    const customSelectAndInput = NetworkConfigView.createUserAgentSelectAndInput(title);
    customSelectAndInput.select.classList.add('chrome-select');
    customUserAgentSelectBox.appendChild(customSelectAndInput.select);
    customUserAgentSelectBox.appendChild(customSelectAndInput.input);
    customUserAgentSelectBox.appendChild(customSelectAndInput.error);
    customUserAgentSelectBox.appendChild(customSelectAndInput.clientHint);
    userAgentSelectBoxChanged();

    function userAgentSelectBoxChanged(): void {
      const useCustomUA = !autoCheckbox.checked;
      customUserAgentSelectBox.classList.toggle('checked', useCustomUA);
      customSelectAndInput.select.disabled = !useCustomUA;
      customSelectAndInput.input.disabled = !useCustomUA;
      customSelectAndInput.error.hidden = !useCustomUA;
      const customUA = useCustomUA ? customUserAgentSetting.get() : '';
      const userAgentMetadata = useCustomUA ? getUserAgentMetadata(customUA) : null;
      SDK.NetworkManager.MultitargetNetworkManager.instance().setCustomUserAgentOverride(customUA, userAgentMetadata);
    }
  }

  _createAcceptedEncodingSection(): void {
    const title = i18nString(UIStrings.acceptedEncoding);
    const section = this._createSection(title, 'network-config-accepted-encoding');
    const checkboxLabel = UI.UIUtils.CheckboxLabel.create(i18nString(UIStrings.selectAutomatically), true);
    section.appendChild(checkboxLabel);
    const autoCheckbox = checkboxLabel.checkboxElement;

    const useCustomAcceptedEncodingSetting =
        Common.Settings.Settings.instance().createSetting('useCustomAcceptedEncodings', false);
    const customAcceptedEncodingSetting = Common.Settings.Settings.instance().createSetting(
        'customAcceptedEncodings',
        `${Protocol.Network.ContentEncoding.Gzip},${Protocol.Network.ContentEncoding.Br},${
            Protocol.Network.ContentEncoding.Deflate}`);

    function onSettingChange(): void {
      if (!useCustomAcceptedEncodingSetting.get()) {
        SDK.NetworkManager.MultitargetNetworkManager.instance().clearCustomAcceptedEncodingsOverride();
      } else {
        SDK.NetworkManager.MultitargetNetworkManager.instance().setCustomAcceptedEncodingsOverride(
            customAcceptedEncodingSetting.get() === '' ?
                [] :
                customAcceptedEncodingSetting.get().split(',') as Protocol.Network.ContentEncoding[]);
      }
    }

    customAcceptedEncodingSetting.addChangeListener(onSettingChange);
    useCustomAcceptedEncodingSetting.addChangeListener(onSettingChange);

    const encodingsSection = section.createChild('div', 'network-config-accepted-encoding-custom');
    autoCheckbox.checked = !useCustomAcceptedEncodingSetting.get();
    autoCheckbox.addEventListener('change', acceptedEncodingsChanged);
    const checkboxes = new Map<Protocol.Network.ContentEncoding, HTMLInputElement>();
    for (const encoding of Object.values(Protocol.Network.ContentEncoding)) {
      const label = UI.UIUtils.CheckboxLabel.create(encoding, true);
      encodingsSection.appendChild(label);
      checkboxes.set(encoding, label.checkboxElement);
    }
    for (const [encoding, checkbox] of checkboxes) {
      checkbox.checked = customAcceptedEncodingSetting.get().includes(encoding);
      checkbox.addEventListener('change', acceptedEncodingsChanged);
    }

    acceptedEncodingsChanged();

    function acceptedEncodingsChanged(): void {
      useCustomAcceptedEncodingSetting.set(!autoCheckbox.checked);
      const encodings = [];
      for (const [encoding, checkbox] of checkboxes) {
        checkbox.disabled = autoCheckbox.checked;
        if (checkbox.checked) {
          encodings.push(encoding);
        }
      }
      customAcceptedEncodingSetting.set(encodings.join(','));
    }
  }
}

function getUserAgentMetadata(userAgent: string): Protocol.Emulation.UserAgentMetadata|null {
  for (const userAgentDescriptor of userAgentGroups) {
    for (const userAgentVersion of userAgentDescriptor.values) {
      if (userAgent ===
          SDK.NetworkManager.MultitargetNetworkManager.patchUserAgentWithChromeVersion(userAgentVersion.value)) {
        if (!userAgentVersion.metadata) {
          return null;
        }
        SDK.NetworkManager.MultitargetNetworkManager.patchUserAgentMetadataWithChromeVersion(userAgentVersion.metadata);
        return userAgentVersion.metadata;
      }
    }
  }
  return null;
}

interface UserAgentGroup {
  title: string;
  values: {
    title: string,
    value: string,
    metadata: Protocol.Emulation.UserAgentMetadata|null,
  }[];
}

export const userAgentGroups: UserAgentGroup[] = [
  {
    title: 'Android',
    values: [
      {
        title: 'Android (4.0.2) Browser \u2014 Galaxy Nexus',
        value:
            'Mozilla/5.0 (Linux; U; Android 4.0.2; en-us; Galaxy Nexus Build/ICL53F) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30',
        metadata: {
          brands: [
            {brand: 'Not A;Brand', version: '99'},
            {brand: 'Chromium', version: '%s'},
            {brand: 'Google Chrome', version: '%s'},
          ],
          platform: 'Android',
          platformVersion: '4.0.2',
          architecture: '',
          model: 'Galaxy Nexus',
          mobile: true,
        },
      },
      {
        title: 'Android (2.3) Browser \u2014 Nexus S',
        value:
            'Mozilla/5.0 (Linux; U; Android 2.3.6; en-us; Nexus S Build/GRK39F) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1',
        metadata: {
          brands: [
            {brand: 'Not A;Brand', version: '99'},
            {brand: 'Chromium', version: '%s'},
            {brand: 'Google Chrome', version: '%s'},
          ],
          platform: 'Android',
          platformVersion: '2.3.6',
          architecture: '',
          model: 'Nexus S',
          mobile: true,
        },
      },
    ],
  },
  {
    title: 'BlackBerry',
    values: [
      {
        title: 'BlackBerry \u2014 BB10',
        value:
            'Mozilla/5.0 (BB10; Touch) AppleWebKit/537.1+ (KHTML, like Gecko) Version/10.0.0.1337 Mobile Safari/537.1+',
        metadata: null,
      },
      {
        title: 'BlackBerry \u2014 PlayBook 2.1',
        value:
            'Mozilla/5.0 (PlayBook; U; RIM Tablet OS 2.1.0; en-US) AppleWebKit/536.2+ (KHTML, like Gecko) Version/7.2.1.0 Safari/536.2+',
        metadata: null,
      },
      {
        title: 'BlackBerry \u2014 9900',
        value:
            'Mozilla/5.0 (BlackBerry; U; BlackBerry 9900; en-US) AppleWebKit/534.11+ (KHTML, like Gecko) Version/7.0.0.187 Mobile Safari/534.11+',
        metadata: null,
      },
    ],
  },
  {
    title: 'Chrome',
    values: [
      {
        title: 'Chrome \u2014 Android Mobile',
        value:
            'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/%s Mobile Safari/537.36',
        metadata: {
          brands: [
            {brand: 'Not A;Brand', version: '99'},
            {brand: 'Chromium', version: '%s'},
            {brand: 'Google Chrome', version: '%s'},
          ],
          platform: 'Android',
          platformVersion: '6.0',
          architecture: '',
          model: 'Nexus 5',
          mobile: true,
        },
      },
      {
        title: 'Chrome \u2014 Android Mobile (high-end)',
        value:
            'Mozilla/5.0 (Linux; Android 10; Pixel 4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/%s Mobile Safari/537.36',
        metadata: {
          brands: [
            {brand: 'Not A;Brand', version: '99'},
            {brand: 'Chromium', version: '%s'},
            {brand: 'Google Chrome', version: '%s'},
          ],
          platform: 'Android',
          platformVersion: '10',
          architecture: '',
          model: 'Pixel 4',
          mobile: true,
        },
      },
      {
        title: 'Chrome \u2014 Android Tablet',
        value:
            'Mozilla/5.0 (Linux; Android 4.3; Nexus 7 Build/JSS15Q) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/%s Safari/537.36',
        metadata: {
          brands: [
            {brand: 'Not A;Brand', version: '99'},
            {brand: 'Chromium', version: '%s'},
            {brand: 'Google Chrome', version: '%s'},
          ],
          platform: 'Android',
          platformVersion: '4.3',
          architecture: '',
          model: 'Nexus 7',
          mobile: true,
        },
      },
      {
        title: 'Chrome \u2014 iPhone',
        value:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/%s Mobile/15E148 Safari/604.1',
        metadata: null,
      },
      {
        title: 'Chrome \u2014 iPad',
        value:
            'Mozilla/5.0 (iPad; CPU OS 13_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/%s Mobile/15E148 Safari/604.1',
        metadata: null,
      },
      {
        title: 'Chrome \u2014 Chrome OS',
        value:
            'Mozilla/5.0 (X11; CrOS x86_64 10066.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/%s Safari/537.36',
        metadata: {
          brands: [
            {brand: 'Not A;Brand', version: '99'},
            {brand: 'Chromium', version: '%s'},
            {brand: 'Google Chrome', version: '%s'},
          ],
          platform: 'Chrome OS',
          platformVersion: '10066.0.0',
          architecture: 'x86',
          model: '',
          mobile: false,
        },
      },
      {
        title: 'Chrome \u2014 Mac',
        value:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/%s Safari/537.36',
        metadata: {
          brands: [
            {brand: 'Not A;Brand', version: '99'},
            {brand: 'Chromium', version: '%s'},
            {brand: 'Google Chrome', version: '%s'},
          ],
          platform: 'macOS',
          platformVersion: '10_14_6',
          architecture: 'x86',
          model: '',
          mobile: false,
        },
      },
      {
        title: 'Chrome \u2014 Windows',
        value: 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/%s Safari/537.36',
        metadata: {
          brands: [
            {brand: 'Not A;Brand', version: '99'},
            {brand: 'Chromium', version: '%s'},
            {brand: 'Google Chrome', version: '%s'},
          ],
          platform: 'Windows',
          platformVersion: '10.0',
          architecture: 'x86',
          model: '',
          mobile: false,
        },
      },
    ],
  },
  {
    title: 'Firefox',
    values: [
      {
        title: 'Firefox \u2014 Android Mobile',
        value: 'Mozilla/5.0 (Android 4.4; Mobile; rv:70.0) Gecko/70.0 Firefox/70.0',
        metadata: null,
      },
      {
        title: 'Firefox \u2014 Android Tablet',
        value: 'Mozilla/5.0 (Android 4.4; Tablet; rv:70.0) Gecko/70.0 Firefox/70.0',
        metadata: null,
      },
      {
        title: 'Firefox \u2014 iPhone',
        value:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 8_3 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko) FxiOS/1.0 Mobile/12F69 Safari/600.1.4',
        metadata: null,
      },
      {
        title: 'Firefox \u2014 iPad',
        value:
            'Mozilla/5.0 (iPad; CPU iPhone OS 8_3 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko) FxiOS/1.0 Mobile/12F69 Safari/600.1.4',
        metadata: null,
      },
      {
        title: 'Firefox \u2014 Mac',
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.14; rv:70.0) Gecko/20100101 Firefox/70.0',
        metadata: null,
      },
      {
        title: 'Firefox \u2014 Windows',
        value: 'Mozilla/5.0 (Windows NT 10.0; WOW64; rv:70.0) Gecko/20100101 Firefox/70.0',
        metadata: null,
      },
    ],
  },
  {
    title: 'Googlebot',
    values: [
      {
        title: 'Googlebot',
        value: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        metadata: null,
      },
      {
        title: 'Googlebot Desktop',
        value:
            'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Chrome/%s Safari/537.36',
        metadata: null,
      },
      {
        title: 'Googlebot Smartphone',
        value:
            'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/%s Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        metadata: null,
      },
    ],
  },
  {
    title: 'Internet Explorer',
    values: [
      {
        title: 'Internet Explorer 11',
        value: 'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko',
        metadata: null,
      },
      {
        title: 'Internet Explorer 10',
        value: 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; WOW64; Trident/6.0)',
        metadata: null,
      },
      {
        title: 'Internet Explorer 9',
        value: 'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0)',
        metadata: null,
      },
      {
        title: 'Internet Explorer 8',
        value: 'Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.0; Trident/4.0)',
        metadata: null,
      },
      {title: 'Internet Explorer 7', value: 'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0)', metadata: null},
    ],
  },
  {
    title: 'Microsoft Edge',
    values: [
      {
        title: 'Microsoft Edge (Chromium) \u2014 Windows',
        value:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/%s Safari/537.36 Edg/%s',
        metadata: {
          brands: [
            {brand: 'Not A;Brand', version: '99'},
            {brand: 'Chromium', version: '%s'},
            {brand: 'Microsoft Edge', version: '%s'},
          ],
          platform: 'Windows',
          platformVersion: '10.0',
          architecture: 'x86',
          model: '',
          mobile: false,
        },
      },
      {
        title: 'Microsoft Edge (Chromium) \u2014 Mac',
        value:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Chrome/%s Safari/604.1 Edg/%s',
        metadata: {
          brands: [
            {brand: 'Not A;Brand', version: '99'},
            {brand: 'Chromium', version: '%s'},
            {brand: 'Microsoft Edge', version: '%s'},
          ],
          platform: 'macOS',
          platformVersion: '10_14_6',
          architecture: 'x86',
          model: '',
          mobile: false,
        },
      },
      {
        title: 'Microsoft Edge \u2014 iPhone',
        value:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 12_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1.1 EdgiOS/44.5.0.10 Mobile/15E148 Safari/604.1',
        metadata: null,
      },
      {
        title: 'Microsoft Edge \u2014 iPad',
        value:
            'Mozilla/5.0 (iPad; CPU OS 12_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0 EdgiOS/44.5.2 Mobile/15E148 Safari/605.1.15',
        metadata: null,
      },
      {
        title: 'Microsoft Edge \u2014 Android Mobile',
        value:
            'Mozilla/5.0 (Linux; Android 8.1.0; Pixel Build/OPM4.171019.021.D1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.109 Mobile Safari/537.36 EdgA/42.0.0.2057',
        metadata: {
          brands: [
            {brand: 'Not A;Brand', version: '99'},
            {brand: 'Chromium', version: '%s'},
            {brand: 'Microsoft Edge', version: '%s'},
          ],
          platform: 'Android',
          platformVersion: '8.1.0',
          architecture: '',
          model: 'Pixel',
          mobile: true,
        },
      },
      {
        title: 'Microsoft Edge \u2014 Android Tablet',
        value:
            'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 7 Build/MOB30X) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.109 Safari/537.36 EdgA/42.0.0.2057',
        metadata: {
          brands: [
            {brand: 'Not A;Brand', version: '99'},
            {brand: 'Chromium', version: '%s'},
            {brand: 'Microsoft Edge', version: '%s'},
          ],
          platform: 'Android',
          platformVersion: '6.0.1',
          architecture: '',
          model: 'Nexus 7',
          mobile: true,
        },
      },
      {
        title: 'Microsoft Edge (EdgeHTML) \u2014 Windows',
        value:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36 Edge/18.19042',
        metadata: null,
      },
      {
        title: 'Microsoft Edge (EdgeHTML) \u2014 XBox',
        value:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; Xbox; Xbox One) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36 Edge/18.19041',
        metadata: null,
      },
    ],
  },
  {
    title: 'Opera',
    values: [
      {
        title: 'Opera \u2014 Mac',
        value:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.97 Safari/537.36 OPR/65.0.3467.48',
        metadata: null,
      },
      {
        title: 'Opera \u2014 Windows',
        value:
            'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.97 Safari/537.36 OPR/65.0.3467.48',
        metadata: null,
      },
      {
        title: 'Opera (Presto) \u2014 Mac',
        value: 'Opera/9.80 (Macintosh; Intel Mac OS X 10.9.1) Presto/2.12.388 Version/12.16',
        metadata: null,
      },
      {
        title: 'Opera (Presto) \u2014 Windows',
        value: 'Opera/9.80 (Windows NT 6.1) Presto/2.12.388 Version/12.16',
        metadata: null,
      },
      {
        title: 'Opera Mobile \u2014 Android Mobile',
        value: 'Opera/12.02 (Android 4.1; Linux; Opera Mobi/ADR-1111101157; U; en-US) Presto/2.9.201 Version/12.02',
        metadata: null,
      },
      {
        title: 'Opera Mini \u2014 iOS',
        value: 'Opera/9.80 (iPhone; Opera Mini/8.0.0/34.2336; U; en) Presto/2.8.119 Version/11.10',
        metadata: null,
      },
    ],
  },
  {
    title: 'Safari',
    values: [
      {
        title: 'Safari \u2014 iPad iOS 13.2',
        value:
            'Mozilla/5.0 (iPad; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1',
        metadata: null,
      },
      {
        title: 'Safari \u2014 iPhone iOS 13.2',
        value:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1',
        metadata: null,
      },
      {
        title: 'Safari \u2014 Mac',
        value:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Safari/605.1.15',
        metadata: null,
      },
    ],
  },
  {
    title: 'UC Browser',
    values: [
      {
        title: 'UC Browser \u2014 Android Mobile',
        value:
            'Mozilla/5.0 (Linux; U; Android 8.1.0; en-US; Nexus 6P Build/OPM7.181205.001) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/57.0.2987.108 UCBrowser/12.11.1.1197 Mobile Safari/537.36',
        metadata: null,
      },
      {
        title: 'UC Browser \u2014 iOS',
        value:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 12_1 like Mac OS X; zh-CN) AppleWebKit/537.51.1 (KHTML, like Gecko) Mobile/16B92 UCBrowser/12.1.7.1109 Mobile AliApp(TUnionSDK/0.1.20.3)',
        metadata: null,
      },
      {
        title: 'UC Browser \u2014 Windows Phone',
        value:
            'Mozilla/5.0 (compatible; MSIE 10.0; Windows Phone 8.0; Trident/6.0; IEMobile/10.0; ARM; Touch; NOKIA; Lumia 920) UCBrowser/10.1.0.563 Mobile',
        metadata: null,
      },
    ],
  },
];
