// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as i18n from '../../../core/i18n/i18n.js';
import * as ComponentHelpers from '../../../ui/components/helpers/helpers.js';
import * as LitHtml from '../../../ui/lit-html/lit-html.js';

import type * as Protocol from '../../../generated/protocol.js';
import * as IconButton from '../../../ui/components/icon_button/icon_button.js';
import type * as UI from '../../../ui/legacy/legacy.js';
import * as EmulationUtils from '../utils/utils.js';

const UIStrings = {
  /**
    * @description Title for user agent client hints form
    */
  title: 'User agent client hints',
  /**
    * @description Heading for brands section
    */
  brands: 'Brands',
  /**
    * @description Input field placeholder for brands browser
    */
  brandBrowser: 'Browser',
  /**
    * @description Input field placeholder for brands version
    */
  version: 'Version',
  /**
    * @description Button title for adding another brand
    */
  addBrand: 'Add Brand',
  /**
    * @description Tooltip for delete icon
    */
  deleteTooltip: 'Delete',
  /**
    * @description Label for full browser version input field
    */
  fullBrowserVersion: 'Full browser version',
  /**
    * @description Label for platform heading
    */
  platformLabel: 'Platform',
  /**
    * @description Placeholder for platform name input field
    */
  platformName: 'Name',
  /**
    * @description Label for architecture input field
    */
  architecture: 'Architecture',
  /**
    * @description Label for Device Model input field
    */
  deviceModel: 'Device model',
  /**
    * @description Label for Mobile checkbox
    */
  mobileCheckboxLabel: 'Mobile',
  /**
    * @description Tooltip for client hints info form
    */
  clientHintsInfo:
      'User agent client hints are an alternative to the user agent string that identify the browser and the device in a more structured way with better privacy accounting. Click the button to learn more.',
  /**
  *@description Field Error message in the Device settings pane that shows that the entered value has characters that can't be represented in the corresponding User Agent Client Hints
  */
  notRepresentable: 'Not representable as structured headers string.',
};
const str_ = i18n.i18n.registerUIStrings('panels/emulation/components/UserAgentClientHintsForm.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

export interface UserAgentClientHintsFormData {
  metaData?: Protocol.Emulation.UserAgentMetadata;
}

const DEFAULT_METADATA = {
  brands: [
    {
      brand: '',
      version: '',
    },
  ],
  fullVersion: '',
  platform: '',
  platformVersion: '',
  architecture: '',
  model: '',
  mobile: false,
};

/**
 * A list component to render learn links, help links and whats new announcements.
 * Title and link are required for list item, subtitle is optional. List is customizable with ListOptions.
 */
export class UserAgentClientHintsForm extends HTMLElement {
  static litTagName = LitHtml.literal`devtools-emulation-useragentclienthintsform`;
  private readonly shadow = this.attachShadow({mode: 'open'});

  private isFormOpened: boolean = false;
  private metaData: Protocol.Emulation.UserAgentMetadata = DEFAULT_METADATA;

  set value(data: UserAgentClientHintsFormData) {
    const {metaData = DEFAULT_METADATA} = data;
    this.metaData = {
      ...this.metaData,
      ...metaData,
    };
    this.render();
  }

  get value(): UserAgentClientHintsFormData {
    return {
      metaData: this.metaData,
    };
  }

  private handleTreeExpand = (event: KeyboardEvent): void => {
    if (event.code === 'Space' || event.code === 'Enter') {
      event.preventDefault();
      this.handleTreeClick();
    }
  };

  private handleTreeClick = (): void => {
    this.isFormOpened = !this.isFormOpened;
    this.render();
  };

  private handleBrandInputChange = (value: string, index: number, brandInputType: 'brandName'|'brandVersion'): void => {
    const updatedBrands = this.metaData.brands?.map((browserBrand, brandIndex) => {
      if (brandIndex === index) {
        const {brand, version} = browserBrand;
        if (brandInputType === 'brandName') {
          return {
            brand: value,
            version,
          };
        }
        return {
          brand,
          version: value,
        };
      }
      return browserBrand;
    });
    this.metaData = {
      ...this.metaData,
      brands: updatedBrands,
    };
    this.render();
  };

  private handleBrandDelete = (index: number): void => {
    const {brands} = this.metaData;
    const updatedBrands = Array.isArray(brands) ? brands.filter((_, brandIndex) => brandIndex !== index) : [];
    this.metaData = {
      ...this.metaData,
      brands: updatedBrands,
    };
    this.render();
  };

  private handleAddBrandClick = (): void => {
    const {brands} = this.metaData;
    this.metaData = {
      ...this.metaData,
      brands: [
        ...(Array.isArray(brands) ? brands : []),
        {
          brand: '',
          version: '',
        },
      ],
    };
    this.render();
  };

  private handleAddBrandKeyPress = (event: KeyboardEvent): void => {
    if (event.code === 'Space' || event.code === 'Enter') {
      event.preventDefault();
      this.handleAddBrandClick();
    }
  };

  private handleInputChange = (stateKey: keyof Protocol.Emulation.UserAgentMetadata, value: string|boolean): void => {
    if (stateKey in this.metaData) {
      this.metaData = {
        ...this.metaData,
        [stateKey]: value,
      };
      this.render();
    }
  };

  private handleClientHintsSubmit = (event: Event): void => {
    event.preventDefault();
    this.isFormOpened = false;
    this.render();
  };

  private handleLinkPress = (event: KeyboardEvent): void => {
    if (event.code === 'Space' || event.code === 'Enter') {
      event.preventDefault();
      (event.target as HTMLAnchorElement).click();
    }
  };

  private renderInputWithLabel(
      label: string, placeholder: string, value: string,
      stateKey: keyof Protocol.Emulation.UserAgentMetadata): LitHtml.TemplateResult {
    const handleInputChange = (event: KeyboardEvent): void => {
      const value = (event.target as HTMLInputElement).value;
      this.handleInputChange(stateKey, value);
    };
    return LitHtml.html`
      <label for="${stateKey}" class="full-row label">${label}</label>
      <input id="${stateKey}" class="input-field full-row" type="text" @input="${handleInputChange}" .value="${
        value}" placeholder="${placeholder}" />
    `;
  }

  private renderPlatformSection(): LitHtml.TemplateResult {
    const {platform, platformVersion} = this.metaData;
    const handlePlatformNameChange = (event: KeyboardEvent): void => {
      const value = (event.target as HTMLInputElement).value;
      this.handleInputChange('platform', value);
    };
    const handlePlatformVersionChange = (event: KeyboardEvent): void => {
      const value = (event.target as HTMLInputElement).value;
      this.handleInputChange('platformVersion', value);
    };
    return LitHtml.html`
      <label class="full-row label">${i18nString(UIStrings.platformLabel)}</label>
      <input class="input-field half-row" type="text" @input="${handlePlatformNameChange}" .value="${
        platform}" placeholder="${i18nString(UIStrings.platformName)}" />
      <input class="input-field half-row" type="text" @input="${handlePlatformVersionChange}" .value="${
        platformVersion}" placeholder="${i18nString(UIStrings.version)}" />
    `;
  }

  private renderDeviceModelSection(): LitHtml.TemplateResult {
    const {model, mobile} = this.metaData;
    const handleDeviceModelChange = (event: KeyboardEvent): void => {
      const value = (event.target as HTMLInputElement).value;
      this.handleInputChange('model', value);
    };
    const handleMobileChange = (event: KeyboardEvent): void => {
      const value = (event.target as HTMLInputElement).checked;
      this.handleInputChange('mobile', value);
    };
    return LitHtml.html`
      <label for="device-model" class="full-row label">${i18nString(UIStrings.deviceModel)}</label>
      <input id="device-model" class="input-field device-model-input" type="text" @input="${
        handleDeviceModelChange}" .value="${model}" placeholder="${i18nString(UIStrings.deviceModel)}" />
      <div class="mobile-checkbox-container">
        <input id="mobile" type="checkbox" @input="${handleMobileChange}" .value="${mobile}" />
        <label for="mobile" class="label">${i18nString(UIStrings.mobileCheckboxLabel)}</label>
      </div>
      <div></div>
    `;
  }

  private renderBrands(): LitHtml.TemplateResult {
    const {
      brands =
          [
            {
              brand: '',
              version: '',
            },
          ],
    } = this.metaData;
    const brandElements = brands.map((brandRow, index) => {
      const {brand, version} = brandRow;
      const handleDeleteClick = (): void => {
        this.handleBrandDelete(index);
      };
      const handleKeyPress = (event: KeyboardEvent): void => {
        if (event.code === 'Space' || event.code === 'Enter') {
          event.preventDefault();
          handleDeleteClick();
        }
      };
      const handleBrandBrowserChange = (event: KeyboardEvent): void => {
        const value = (event.target as HTMLInputElement).value;
        this.handleBrandInputChange(value, index, 'brandName');
      };
      const handleBrandVersionChange = (event: KeyboardEvent): void => {
        const value = (event.target as HTMLInputElement).value;
        this.handleBrandInputChange(value, index, 'brandVersion');
      };
      return LitHtml.html`
        <div class="full-row brand-row">
          <input class="input-field" type="text" @input="${handleBrandBrowserChange}" .value="${brand}" placeholder="${
          i18nString(UIStrings.brandBrowser)}" />
          <input class="input-field" type="text" @input="${handleBrandVersionChange}" .value="${
          version}" placeholder="${i18nString(UIStrings.version)}" />
          <${IconButton.Icon.Icon.litTagName}
            .data=${{
        color: 'var(--color-text-primary)',
        iconName: 'trash_bin_icon',
        width: '10px',
        height: '14px',
      } as IconButton.Icon.IconData}
            title="${i18nString(UIStrings.deleteTooltip)}"
            class="delete-icon"
            tabindex="0"
            role="button"
            @click="${handleDeleteClick}"
            @keypress="${handleKeyPress}"
            aria-label="${i18nString(UIStrings.deleteTooltip)}"
          />
        </div>
      `;
    });
    return LitHtml.html`
      <label class="full-row label">${i18nString(UIStrings.brands)}</label>
      ${brandElements}
      <div class="add-container full-row" role="button" tabindex="0" @click="${this.handleAddBrandClick}" @keypress="${
        this.handleAddBrandKeyPress}">
        <${IconButton.Icon.Icon.litTagName} aria-hidden="true"
          .data=${{color: 'var(--color-text-primary)', iconName: 'plus', width: '20px'} as IconButton.Icon.IconData}>
        </${IconButton.Icon.Icon.litTagName}>
        ${i18nString(UIStrings.addBrand)}
      </div>
    `;
  }

  private render(): void {
    const {fullVersion, architecture} = this.metaData;
    const brandSection = this.renderBrands();
    const fullBrowserInput = this.renderInputWithLabel(
        i18nString(UIStrings.fullBrowserVersion), i18nString(UIStrings.version), fullVersion || '', 'fullVersion');
    const platformSection = this.renderPlatformSection();
    const architectureInput = this.renderInputWithLabel(
        i18nString(UIStrings.architecture), i18nString(UIStrings.architecture), architecture, 'architecture');
    const deviceModelSection = this.renderDeviceModelSection();
    const formSection = this.isFormOpened ? LitHtml.html`
      <form class="form-container">
        ${brandSection}
        ${fullBrowserInput}
        ${platformSection}
        ${architectureInput}
        ${deviceModelSection}
      </form>
    ` :
                                            LitHtml.html``;
    const output = LitHtml.html`
      <style>
        .root {
          color: var(--color-text-primary);
          width: 100%;
        }

        .tree-title {
          font-weight: 700;
          display: flex;
          align-items: center;
        }

        .rotate-icon {
          transform: rotate(-90deg);
        }

        .form-container {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr auto;
          align-items: center;
          column-gap: 10px;
          row-gap: 8px;
          padding: 0 10px;
        }

        .full-row {
          grid-column: 1 / 5;
        }

        .half-row {
          grid-column: span 2;
        }

        .mobile-checkbox-container {
          display: flex;
          align-items: center;
        }

        .device-model-input {
          grid-column: 1 / 4;
        }

        .input-field {
          color: var(--color-text-primary);
          padding: 3px 6px;
          border: none;
          border-radius: 2px;
          box-shadow: var(--legacy-focus-ring-inactive-shadow);
          background-color: var(--color-background);
          font-size: inherit;
          height: 18px;
        }

        .input-field:focus {
          box-shadow: var(--legacy-focus-ring-active-shadow);
          outline-width: 0;
        }

        .add-container {
          cursor: pointer;
          display: flex;
          align-items: center;
        }

        .add-icon {
          margin-right: 5px;
        }

        .delete-icon {
          cursor: pointer;
        }

        .brand-row {
          display: flex;
          align-items: center;
          gap: 10px;
          justify-content: space-between;
        }

        .brand-row > input {
          width: 100%;
        }

        .info-link {
          display: flex;
          align-items: center;
          margin-left: 5px;
        }
      </style>
      <section class="root">
        <div class="tree-title" role="button" @click="${this.handleTreeClick}" tabindex="0" @keypress="${
        this.handleTreeExpand}">
          <${IconButton.Icon.Icon.litTagName} class="${this.isFormOpened ? '' : 'rotate-icon'}"
                .data=${
        {color: 'var(--color-text-primary)', iconName: 'chromeSelect', width: '20px'} as IconButton.Icon.IconData}>
          </${IconButton.Icon.Icon.litTagName}>
          ${i18nString(UIStrings.title)}
          <a href="https://web.dev/user-agent-client-hints/" target="_blank" title="${
        i18nString(UIStrings.clientHintsInfo)}" class="info-link" @keypress="${this.handleLinkPress}">
            <${IconButton.Icon.Icon.litTagName}
                  .data=${
        {color: 'var(--color-text-primary)', iconName: 'ic_info_black_18dp', width: '14px'} as
        IconButton.Icon.IconData}>
            </${IconButton.Icon.Icon.litTagName}>
          </a>
        </div>
        ${formSection}
      </section>
    `;
    // clang-format off
    LitHtml.render(output, this.shadow);
    // clang-format on
  }

  validate(): UI.ListWidget.ValidatorResult {
    for (const [metaDataKey, metaDataValue] of Object.entries(this.metaData)) {
      if (metaDataKey === 'brands') {
        const brandError = this.metaData.brands?.every(({brand, version}) => {
          const brandNameResult = EmulationUtils.UserAgentMetadata.validateAsStructuredHeadersString(
              brand, i18nString(UIStrings.notRepresentable));
          const brandVersionResult = EmulationUtils.UserAgentMetadata.validateAsStructuredHeadersString(
              version, i18nString(UIStrings.notRepresentable));
          return brandNameResult.valid && brandVersionResult.valid;
        });
        if (!brandError) {
          return {valid: false, errorMessage: i18nString(UIStrings.notRepresentable)};
        }
      } else {
        const metaDataError = EmulationUtils.UserAgentMetadata.validateAsStructuredHeadersString(
            metaDataValue, i18nString(UIStrings.notRepresentable));
        if (!metaDataError.valid) {
          return metaDataError;
        }
      }
    }
    return {valid: true};
  }
}

ComponentHelpers.CustomElements.defineComponent(
    'devtools-emulation-useragentclienthintsform', UserAgentClientHintsForm);

declare global {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLElementTagNameMap {
    'devtools-emulation-useragentclienthintsform': UserAgentClientHintsForm;
  }
}
