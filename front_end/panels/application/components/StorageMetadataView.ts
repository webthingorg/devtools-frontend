// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as i18n from '../../../core/i18n/i18n.js';
import * as ComponentHelpers from '../../../ui/components/helpers/helpers.js';

import type * as SDK from '../../../core/sdk/sdk.js';
import * as LitHtml from '../../../ui/lit-html/lit-html.js';
import * as Coordinator from '../../../ui/components/render_coordinator/render_coordinator.js';
import * as ReportView from '../../../ui/components/report_view/report_view.js';
import * as LegacyWrapper from '../../../ui/components/legacy_wrapper/legacy_wrapper.js';

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
  #displayStorageKey: SDK.StorageKeyManager.DisplayStorageKey|null = null;

  getShadow(): ShadowRoot {
    return this.#shadow;
  }

  set data(data: SDK.StorageKeyManager.DisplayStorageKey|null) {
    this.#displayStorageKey = data;
    void this.render();
  }

  override render(): Promise<void> {
    return coordinator.write('StorageMetadataView render', async () => {
      if (!this.#displayStorageKey) {
        LitHtml.render(LitHtml.nothing, this.#shadow, {host: this});
        return;
      }
      // Disabled until https://crbug.com/1079231 is fixed.
      // clang-format off
      LitHtml.render(LitHtml.html`
        <${ReportView.ReportView.Report.litTagName} .data=${{reportTitle: this.getTitle() || i18nString(UIStrings.loading)} as ReportView.ReportView.ReportData}>
          ${await this.renderReportContent(this.#displayStorageKey)}
        </${ReportView.ReportView.Report.litTagName}>`, this.#shadow, {host: this});
      // clang-format on
    });
  }

  getTitle(): string|undefined {
    return this.#displayStorageKey?.origin;
  }

  key(content: string|LitHtml.TemplateResult): LitHtml.TemplateResult {
    return LitHtml.html`<${ReportView.ReportView.ReportKey.litTagName}>${content}</${
        ReportView.ReportView.ReportKey.litTagName}>`;
  }

  value(content: string|LitHtml.TemplateResult): LitHtml.TemplateResult {
    return LitHtml.html`<${ReportView.ReportView.ReportValue.litTagName}>${content}</${
        ReportView.ReportView.ReportValue.litTagName}>`;
  }

  async renderReportContent(storageKey: SDK.StorageKeyManager.DisplayStorageKey): Promise<LitHtml.LitTemplate> {
    const thirdPartyReason = storageKey.ancestorChainHasCrossSite ?
        i18nString(UIStrings.yesBecauseAncestorChainHasCrossSite) :
        storageKey.hasNonce             ? i18nString(UIStrings.yesBecauseKeyIsOpaque) :
        storageKey.topLevelSiteIsOpaque ? i18nString(UIStrings.yesBecauseTopLevelIsOpaque) :
        (storageKey.topLevelSite && storageKey.origin !== storageKey.topLevelSite) ?
                                          i18nString(UIStrings.yesBecauseOriginNotInTopLevelSite) :
                                          null;
    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
    return LitHtml.html`
        ${this.key(i18nString(UIStrings.origin))}
        ${this.value(
          LitHtml.html`<div class="text-ellipsis" title=${storageKey.origin}>${storageKey.origin}</div>`)}
        ${(storageKey.topLevelSite || storageKey.topLevelSiteIsOpaque) ?
          this.key(i18nString(UIStrings.topLevelSite)) : LitHtml.nothing}
        ${storageKey.topLevelSite ? this.value(storageKey.topLevelSite) : LitHtml.nothing}
        ${storageKey.topLevelSiteIsOpaque ? this.value(i18nString(UIStrings.opaque)) : LitHtml.nothing}
        ${thirdPartyReason ? LitHtml.html`${this.key(i18nString(UIStrings.isThirdParty))}${this.value(thirdPartyReason)}` : LitHtml.nothing}
        ${storageKey.hasNonce || storageKey.topLevelSiteIsOpaque ?
          this.key(i18nString(UIStrings.isOpaque)) : LitHtml.nothing}
        ${storageKey.hasNonce ? this.value(i18nString(UIStrings.yes)) : LitHtml.nothing}
        ${storageKey.topLevelSiteIsOpaque ?
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
