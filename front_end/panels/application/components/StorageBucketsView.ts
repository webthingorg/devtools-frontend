// Copyright (c) 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as i18n from '../../../core/i18n/i18n.js';
import type * as SDK from '../../../core/sdk/sdk.js';
import type * as Protocol from '../../../generated/protocol.js';
import * as Buttons from '../../../ui/components/buttons/buttons.js';
import * as ComponentHelpers from '../../../ui/components/helpers/helpers.js';
import * as Coordinator from '../../../ui/components/render_coordinator/render_coordinator.js';
import * as ReportView from '../../../ui/components/report_view/report_view.js';
import * as UI from '../../../ui/legacy/legacy.js';
import * as LitHtml from '../../../ui/lit-html/lit-html.js';

import storageBucketsViewStyles from './storageBucketsView.css.js';

const UIStrings = {
  /**
   * @description Text when the storage bucket is loading.
   */
  loading: 'Loading…',
  /**
   * @description Name of the field that displays the Storage Bucket's Storage Key.
   */
  storageKey: 'Storage Key',
  /**
   * @description Name of the field that displays the Storage Bucket's Persistent value.
   */
  persistent: 'Persistent',
  /**
   * @description Name of the field that displays the Storage Bucket's Durability value.
   */
  durability: 'Durability',
  /**
   * @description Name of the field that displays the Storage Bucket's Quota value.
   */
  quota: 'Quota',
  /**
   * @description Name of the field that displays the Storage Bucket's Expiration value.
   */
  expiration: 'Expiration',
  /**
   * @description Label of the button that triggers the Storage Bucket to be deleted.
   */
  deleteBucket: 'Delete bucket',
  /**
   *@description Value of the field that displays the Storage Bucket's Quota when the Quota is set to none.
   */
  quotaNone: 'None',
  /**
   *@description Value of the field that displays the Storage Bucket's Expiration when the Expiration is set to none.
   */
  expirationNone: 'None',
  /**
   *@description Text shown in confirmation dialogue that displays before deleting the bucket.
   *@example {inbox} PH1
   */
  pleaseConfirmDeleteOfBucket: 'Please confirm delete of "{PH1}" bucket.',
};

const str_ = i18n.i18n.registerUIStrings('panels/application/components/StorageBucketsView.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

export class StorageBucketsViewWrapper extends UI.ThrottledWidget.ThrottledWidget {
  readonly #storageBucketsView: StorageBucketsView;
  #model: SDK.StorageBucketsModel.StorageBucketsModel;
  #bucket: Protocol.Storage.StorageBucketInfo;

  constructor(model: SDK.StorageBucketsModel.StorageBucketsModel, bucket: Protocol.Storage.StorageBucketInfo) {
    super(true, 1000);
    this.#storageBucketsView = new StorageBucketsView();
    this.#model = model;
    this.#bucket = bucket;
    this.contentElement.classList.add('overflow-auto');
    this.contentElement.appendChild(this.#storageBucketsView);
    this.update();
  }

  set bucket(bucket: Protocol.Storage.StorageBucketInfo) {
    this.#bucket = bucket;
    this.update();
  }

  async doUpdate(): Promise<void> {
    this.#storageBucketsView.data = {model: this.#model, bucket: this.#bucket};
  }
}

const coordinator = Coordinator.RenderCoordinator.RenderCoordinator.instance();

export interface StorageBucketViewData {
  model: SDK.StorageBucketsModel.StorageBucketsModel;
  bucket: Protocol.Storage.StorageBucketInfo;
}

export class StorageBucketsView extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-resources-storage-buckets-view`;
  readonly #shadow = this.attachShadow({mode: 'open'});
  #model: SDK.StorageBucketsModel.StorageBucketsModel|null = null;
  #bucket: Protocol.Storage.StorageBucketInfo|null = null;

  connectedCallback(): void {
    this.#shadow.adoptedStyleSheets = [storageBucketsViewStyles];
    void this.#render();
  }

  set data(data: StorageBucketViewData) {
    this.#model = data.model;
    this.#bucket = data.bucket;
    void this.#render();
  }

  #bucketName(): string {
    if (!this.#bucket) {
      throw new Error('Should not call #bucketName if #bucket is null.');
    }
    return `${this.#bucket.name} - ${this.#bucket.storageKey}`;
  }

  async #render(): Promise<void> {
    await coordinator.write('StorageBucketsView render', () => {
      if (this.#bucket) {
        // Disabled until https://crbug.com/1079231 is fixed.
        // clang-format off
        LitHtml.render(LitHtml.html`
          <${ReportView.ReportView.Report.litTagName}
          .data=${{reportTitle: this.#bucketName()} as
                  ReportView.ReportView.ReportData}>
            ${this.#renderBucketInformation()}
            <${ReportView.ReportView.ReportSectionDivider.litTagName}>
            </${ReportView.ReportView.ReportSectionDivider.litTagName}>
            ${this.#renderBucketControls()}
          </${ReportView.ReportView.Report.litTagName}>
        `, this.#shadow, {host: this});
        // clang-format on
      } else {
        // Disabled until https://crbug.com/1079231 is fixed.
        // clang-format off
        LitHtml.render(LitHtml.html`
          <${ReportView.ReportView.Report.litTagName}
          .data=${{reportTitle: i18nString(UIStrings.loading)} as
                  ReportView.ReportView.ReportData}>
          </${ReportView.ReportView.Report.litTagName}>
        `, this.#shadow, {host: this});
        // clang-format on
      }
    });
  }

  #getQuotaString(): string {
    if (!this.#bucket) {
      throw new Error('Should not call #getQuotaString if #bucket is null.');
    }

    let {quota} = this.#bucket;

    if (quota === 0) {
      return i18nString(UIStrings.quotaNone);
    }

    const units = ['bytes', 'KB', 'MB', 'GB', 'TB'];
    let i = 0;
    while (quota > 1024 && i < units.length) {
      quota /= 1024;
      i++;
    }

    return `${quota} ${units[i]}`;
  }

  #getExpirationString(): string {
    if (!this.#bucket) {
      throw new Error('Should not call #getExpirationString if #bucket is null.');
    }

    const {expiration} = this.#bucket;

    if (expiration === 0) {
      return i18nString(UIStrings.expirationNone);
    }

    return (new Date(expiration * 1000)).toString();
  }

  #renderBucketInformation(): LitHtml.TemplateResult {
    if (!this.#bucket) {
      throw new Error('Should not call #renderBucketInformation if #bucket is null.');
    }

    const {storageKey, persistent, durability} = this.#bucket;
    const quota = this.#getQuotaString();
    const expiration = this.#getExpirationString();

    // clang-format off
    return LitHtml.html`
      ${this.#renderRow(i18nString(UIStrings.storageKey), storageKey)}
      ${this.#renderRow(i18nString(UIStrings.persistent), persistent)}
      ${this.#renderRow(i18nString(UIStrings.durability), durability)}
      ${this.#renderRow(i18nString(UIStrings.quota), quota)}
      ${this.#renderRow(i18nString(UIStrings.expiration), expiration)}
      `;
  }

  #renderRow(key: string, value: string | number | boolean): LitHtml.TemplateResult {
    return LitHtml.html`
      <${ReportView.ReportView.ReportKey.litTagName}>${
        key
      }</${ReportView.ReportView.ReportKey.litTagName}>
      <${ReportView.ReportView.ReportValue.litTagName}>${
        value
      }</${ReportView.ReportView.ReportValue.litTagName}>
      `;
  }

  #renderBucketControls(): LitHtml.TemplateResult {
    // clang-format off
    return LitHtml.html`
      <${ReportView.ReportView.ReportSection.litTagName}>
        <${Buttons.Button.Button.litTagName}
          aria-label=${i18nString(UIStrings.deleteBucket)}
          .variant=${Buttons.Button.Variant.PRIMARY}
          @click=${this.#deleteBucket}>
          ${i18nString(UIStrings.deleteBucket)}
        </${Buttons.Button.Button.litTagName}>
      </${ReportView.ReportView.ReportSection.litTagName}>`;
    // clang-format on
  }

  async #deleteBucket(): Promise<void> {
    if (!this.#model || !this.#bucket) {
      throw new Error('Should not call #deleteBucket if #model or #bucket is null.');
    }
    const ok = await UI.UIUtils.ConfirmDialog.show(
        i18nString(UIStrings.pleaseConfirmDeleteOfBucket, {PH1: this.#bucketName() || ''}), this);
    if (ok) {
      this.#model.deleteBucket(this.#bucket);
    }
  }
}

ComponentHelpers.CustomElements.defineComponent('devtools-resources-storage-buckets-view', StorageBucketsView);

declare global {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLElementTagNameMap {
    'devtools-resources-storage-buckets-view': StorageBucketsView;
  }
}
