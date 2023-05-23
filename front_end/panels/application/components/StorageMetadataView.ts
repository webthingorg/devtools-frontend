// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as i18n from '../../../core/i18n/i18n.js';
import * as SDK from '../../../core/sdk/sdk.js';
import * as ComponentHelpers from '../../../ui/components/helpers/helpers.js';
import * as LegacyWrapper from '../../../ui/components/legacy_wrapper/legacy_wrapper.js';
import * as Coordinator from '../../../ui/components/render_coordinator/render_coordinator.js';
import * as ReportView from '../../../ui/components/report_view/report_view.js';
import * as LitHtml from '../../../ui/lit-html/lit-html.js';

const UIStrings = {
  /**
   *@description The origin of a URL (https://web.dev/same-site-same-origin/#origin)
   *(for a lot of languages this does not need to be translated, please translate only where necessary)
   */
  origin: 'Origin',
  /**
   *@description The origin of a URL (https://web.dev/same-site-same-origin/#origin)
   *(for a lot of languages this does not need to be translated, please translate only where necessary)
   */
  topLevelSite: 'Top-level Site',
  /**
   *@description The origin of a URL (https://web.dev/same-site-same-origin/#origin)
   *(for a lot of languages this does not need to be translated, please translate only where necessary)
   */
  opaque: '(opaque)',
  /**
   *@description The origin of a URL (https://web.dev/same-site-same-origin/#origin)
   *(for a lot of languages this does not need to be translated, please translate only where necessary)
   */
  isOpaque: 'Is Opaque',
  /**
   *@description The origin of a URL (https://web.dev/same-site-same-origin/#origin)
   *(for a lot of languages this does not need to be translated, please translate only where necessary)
   */
  isThirdParty: 'Is Third-Party',
  /**
   *@description The origin of a URL (https://web.dev/same-site-same-origin/#origin)
   *(for a lot of languages this does not need to be translated, please translate only where necessary)
   */
  yes: 'Yes',
  /**
   *@description The origin of a URL (https://web.dev/same-site-same-origin/#origin)
   *(for a lot of languages this does not need to be translated, please translate only where necessary)
   */
  yesBecauseTopLevelIsOpaque: 'Yes (because top-level site is opaque)',
  /**
   *@description The origin of a URL (https://web.dev/same-site-same-origin/#origin)
   *(for a lot of languages this does not need to be translated, please translate only where necessary)
   */
  yesBecauseKeyIsOpaque: 'Yes (because the key is opaque)',
  /**
   *@description The origin of a URL (https://web.dev/same-site-same-origin/#origin)
   *(for a lot of languages this does not need to be translated, please translate only where necessary)
   */
  yesBecauseOriginNotInTopLevelSite: 'Yes (because origin is outside of top-level site)',
  /**
   *@description The origin of a URL (https://web.dev/same-site-same-origin/#origin)
   *(for a lot of languages this does not need to be translated, please translate only where necessary)
   */
  yesBecauseAncestorChainHasCrossSite: 'Yes (because there is a third-party origin in the ancestry chain)',
  /**
   *@description Text when something is loading
   */
  loading: 'Loading…',
};

const str_ = i18n.i18n.registerUIStrings('panels/application/components/StorageMetadataView.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);
const coordinator = Coordinator.RenderCoordinator.RenderCoordinator.instance();

export class StorageMetadataView extends LegacyWrapper.LegacyWrapper.WrappableComponent {
  static readonly litTagName = LitHtml.literal`devtools-storage-metadata-view`;
  readonly #shadow = this.attachShadow({mode: 'open'});
  #storageKey: SDK.StorageKeyManager.StorageKey|null = null;

  getShadow(): ShadowRoot {
    return this.#shadow;
  }

  setStorageKey(storageKey: string): void {
    this.#storageKey = SDK.StorageKeyManager.parseStorageKey(storageKey);
    void this.render();
  }

  override render(): Promise<void> {
    return coordinator.write('StorageMetadataView render', async () => {
      // Disabled until https://crbug.com/1079231 is fixed.
      // clang-format off
      LitHtml.render(LitHtml.html`
        <${ReportView.ReportView.Report.litTagName} .data=${{reportTitle: this.getTitle() || i18nString(UIStrings.loading)} as ReportView.ReportView.ReportData}>
          ${await this.renderReportContent()}
        </${ReportView.ReportView.Report.litTagName}>`, this.#shadow, {host: this});
      // clang-format on
    });
  }

  getTitle(): string|undefined {
    return this.#storageKey?.origin;
  }

  key(content: string|LitHtml.TemplateResult): LitHtml.TemplateResult {
    return LitHtml.html`<${ReportView.ReportView.ReportKey.litTagName}>${content}</${
        ReportView.ReportView.ReportKey.litTagName}>`;
  }

  value(content: string|LitHtml.TemplateResult): LitHtml.TemplateResult {
    return LitHtml.html`<${ReportView.ReportView.ReportValue.litTagName}>${content}</${
        ReportView.ReportView.ReportValue.litTagName}>`;
  }

  async renderReportContent(): Promise<LitHtml.LitTemplate> {
    if (!this.#storageKey) {
      return LitHtml.nothing;
    }
    const origin = this.#storageKey.origin;
    const ancestorChainHasCrossSite =
        Boolean(this.#storageKey.components.get(SDK.StorageKeyManager.StorageKeyComponent.ANCESTOR_CHAIN_BIT));
    const hasNonce = Boolean(this.#storageKey.components.get(SDK.StorageKeyManager.StorageKeyComponent.NONCE_HIGH));
    const topLevelSiteIsOpaque = Boolean(
        this.#storageKey.components.get(SDK.StorageKeyManager.StorageKeyComponent.TOP_LEVEL_SITE_OPAQUE_NONCE_HIGH));
    const topLevelSite = this.#storageKey.components.get(SDK.StorageKeyManager.StorageKeyComponent.TOP_LEVEL_SITE);
    const thirdPartyReason = ancestorChainHasCrossSite ? i18nString(UIStrings.yesBecauseAncestorChainHasCrossSite) :
        hasNonce                                       ? i18nString(UIStrings.yesBecauseKeyIsOpaque) :
        topLevelSiteIsOpaque                           ? i18nString(UIStrings.yesBecauseTopLevelIsOpaque) :
        (topLevelSite && origin !== topLevelSite)      ? i18nString(UIStrings.yesBecauseOriginNotInTopLevelSite) :
                                                         null;
    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
    return LitHtml.html`
        ${this.key(i18nString(UIStrings.origin))}
        ${this.value(LitHtml.html`<div class="text-ellipsis" title=${origin}>${origin}</div>`)}
        ${(topLevelSite || topLevelSiteIsOpaque) ?  this.key(i18nString(UIStrings.topLevelSite)) : LitHtml.nothing}
        ${topLevelSite ? this.value(topLevelSite) : LitHtml.nothing}
        ${topLevelSiteIsOpaque ? this.value(i18nString(UIStrings.opaque)) : LitHtml.nothing}
        ${thirdPartyReason ? LitHtml.html`${this.key(i18nString(UIStrings.isThirdParty))}${this.value(thirdPartyReason)}` : LitHtml.nothing}
        ${hasNonce || topLevelSiteIsOpaque ?
          this.key(i18nString(UIStrings.isOpaque)) : LitHtml.nothing}
        ${hasNonce ? this.value(i18nString(UIStrings.yes)) : LitHtml.nothing}
        ${topLevelSiteIsOpaque ?
          this.value(i18nString(UIStrings.yesBecauseTopLevelIsOpaque)) : LitHtml.nothing}`;
    // clang-format on
  }
}

ComponentHelpers.CustomElements.defineComponent('devtools-storage-metadata-view', StorageMetadataView);

declare global {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLElementTagNameMap {
    'devtools-storage-metadata-view': StorageMetadataView;
  }
}
