// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as Common from '../../core/common/common.js';
import * as i18n from '../../core/i18n/i18n.js';
import type * as Platform from '../../core/platform/platform.js';
import * as SDK from '../../core/sdk/sdk.js';
import * as UI from '../../ui/legacy/legacy.js';

import type * as Protocol from '../../generated/protocol.js';

import {ExpandableApplicationPanelTreeElement} from './ApplicationPanelTreeElement.js';
import {type ResourcesPanel} from './ResourcesPanel.js';
import {StorageBucketsViewWrapper} from './components/components.js';
import {IndexedDBTreeElement} from './ApplicationPanelSidebar.js';
import {ServiceWorkerCacheTreeElement} from './ServiceWorkerCacheTreeElement.js';

const UIStrings = {
  /**
   *@description Label for an item in the Application Panel Sidebar of the Application panel
   * Storage Buckets allow developers to seperate site data into buckets so that they can be
   * deleted independently.
   */
  storageBuckets: 'Storage Buckets',
};
const str_ = i18n.i18n.registerUIStrings('panels/application/StorageBucketsTreeElement.ts', UIStrings);
export const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

export class StorageBucketsTreeParentElement extends ExpandableApplicationPanelTreeElement {
  private bucketTreeElements: Set<StorageBucketsTreeElement> = new Set();

  constructor(storagePanel: ResourcesPanel) {
    super(storagePanel, i18nString(UIStrings.storageBuckets), 'StorageBuckets');
    const interestGroupIcon = UI.Icon.Icon.create('mediumicon-database', 'resource-tree-item');
    this.setLeadingIcons([interestGroupIcon]);
    this.setLink(
        'https://github.com/WICG/storage-buckets/blob/gh-pages/explainer.md' as Platform.DevToolsPath.UrlString);
    this.initialize();
  }

  private initialize(): void {
    SDK.TargetManager.TargetManager.instance().addModelListener(
        SDK.StorageBucketsModel.StorageBucketsModel, SDK.StorageBucketsModel.Events.BucketAdded, this.bucketAdded,
        this);
    SDK.TargetManager.TargetManager.instance().addModelListener(
        SDK.StorageBucketsModel.StorageBucketsModel, SDK.StorageBucketsModel.Events.BucketRemoved, this.bucketRemoved,
        this);
    SDK.TargetManager.TargetManager.instance().addModelListener(
        SDK.StorageBucketsModel.StorageBucketsModel, SDK.StorageBucketsModel.Events.BucketChanged, this.bucketChanged,
        this);

    for (const bucketsModel of SDK.TargetManager.TargetManager.instance().models(
             SDK.StorageBucketsModel.StorageBucketsModel)) {
      const buckets = bucketsModel.getBuckets();
      for (const bucket of buckets) {
        this.addBucketTreeElement(bucketsModel, bucket);
      }
    }
  }

  removeBucketsForModel(model: SDK.StorageBucketsModel.StorageBucketsModel): void {
    for (const bucketTreeElement of this.bucketTreeElements) {
      if (bucketTreeElement.model === model) {
        this.removeBucketTreeElement(bucketTreeElement);
      }
    }
  }

  private bucketAdded({data: {model, bucket}}:
                          Common.EventTarget.EventTargetEvent<SDK.StorageBucketsModel.BucketEvent>): void {
    this.addBucketTreeElement(model, bucket);
  }

  private bucketRemoved({data: {model, bucket}}:
                            Common.EventTarget.EventTargetEvent<SDK.StorageBucketsModel.BucketEvent>): void {
    const idbDatabaseTreeElement = this.getBucketTreeElement(model, bucket);
    if (!idbDatabaseTreeElement) {
      return;
    }
    this.removeBucketTreeElement(idbDatabaseTreeElement);
  }

  private bucketChanged({data: {model, bucket}}:
                            Common.EventTarget.EventTargetEvent<SDK.StorageBucketsModel.BucketEvent>): void {
    const idbDatabaseTreeElement = this.getBucketTreeElement(model, bucket);
    if (!idbDatabaseTreeElement) {
      return;
    }
    idbDatabaseTreeElement.bucket = bucket;
  }

  private addBucketTreeElement(
      model: SDK.StorageBucketsModel.StorageBucketsModel, bucket: Protocol.Storage.StorageBucketInfo): void {
    if (bucket.isDefault) {
      return;
    }
    const singleBucketTreeElement = new StorageBucketsTreeElement(this.resourcesPanel, model, bucket);
    this.bucketTreeElements.add(singleBucketTreeElement);
    this.appendChild(singleBucketTreeElement);
    singleBucketTreeElement.initialize();
  }

  private removeBucketTreeElement(bucketTreeElement: StorageBucketsTreeElement): void {
    this.removeChild(bucketTreeElement);
    this.bucketTreeElements.delete(bucketTreeElement);
    this.setExpandable(this.bucketTreeElements.size > 0);
  }

  get itemURL(): Platform.DevToolsPath.UrlString {
    return 'storage-buckets-group://' as Platform.DevToolsPath.UrlString;
  }

  getBucketTreeElement(model: SDK.StorageBucketsModel.StorageBucketsModel, bucket: Protocol.Storage.StorageBucketInfo):
      StorageBucketsTreeElement|null {
    for (const bucketTreeElement of this.bucketTreeElements) {
      if (bucketTreeElement.model === model && bucketTreeElement.bucket.id === bucket.id) {
        return bucketTreeElement;
      }
    }
    return null;
  }
}

export class StorageBucketsTreeElement extends ExpandableApplicationPanelTreeElement {
  private storageBucket: Protocol.Storage.StorageBucketInfo;
  private bucketModel: SDK.StorageBucketsModel.StorageBucketsModel;
  private view: StorageBucketsViewWrapper.StorageBucketsViewWrapper;

  constructor(
      resourcesPanel: ResourcesPanel, model: SDK.StorageBucketsModel.StorageBucketsModel,
      bucket: Protocol.Storage.StorageBucketInfo) {
    super(resourcesPanel, `${bucket.name} - ${bucket.storageKey}`, `StorageBucket_${bucket.name}_${bucket.storageKey}`);
    this.bucketModel = model;
    this.storageBucket = bucket;
    const interestGroupIcon = UI.Icon.Icon.create('mediumicon-database', 'resource-tree-item');
    this.setLeadingIcons([interestGroupIcon]);
    this.view = new StorageBucketsViewWrapper.StorageBucketsViewWrapper(model, bucket);
  }

  initialize(): void {
    const indexedDBTreeElement = new IndexedDBTreeElement(this.resourcesPanel, this.storageBucket);
    this.appendChild(indexedDBTreeElement);
    const serviceWorkerCacheTreeElement = new ServiceWorkerCacheTreeElement(this.resourcesPanel, this.storageBucket);
    this.appendChild(serviceWorkerCacheTreeElement);
    serviceWorkerCacheTreeElement.initialize();
  }

  get itemURL(): Platform.DevToolsPath.UrlString {
    return `storage-buckets-group://${this.bucket.name}/${this.bucket.storageKey}` as Platform.DevToolsPath.UrlString;
  }

  get model(): SDK.StorageBucketsModel.StorageBucketsModel {
    return this.bucketModel;
  }

  get bucket(): Protocol.Storage.StorageBucketInfo {
    return this.storageBucket;
  }

  set bucket(bucket: Protocol.Storage.StorageBucketInfo) {
    this.storageBucket = bucket;
    this.view.bucket = bucket;
  }

  onselect(selectedByUser?: boolean): boolean {
    super.onselect(selectedByUser);
    this.showView(this.view);
    return false;
  }
}
