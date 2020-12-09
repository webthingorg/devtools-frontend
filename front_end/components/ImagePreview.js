// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../common/common.js';
import * as Host from '../host/host.js';
import * as Platform from '../platform/platform.js';
import * as SDK from '../sdk/sdk.js';
import * as UI from '../ui/ui.js';


/** @typedef {{
 * renderedWidth: number,
 * renderedHeight: number,
 * currentSrc: (string|undefined)
 * }}
 */
// @ts-ignore typedef
export let PrecomputedFeatures;

export class ImagePreview {
  /**
   * @param {!SDK.SDKModel.Target} target
   * @param {string} originalImageURL
   * @param {boolean} showDimensions
   * @param {!{precomputedFeatures: (!PrecomputedFeatures|undefined), imageAltText: (string|undefined)}=} options
   * @return {!Promise<?Element>}
   */
  static build(
      target, originalImageURL, showDimensions, options = {precomputedFeatures: undefined, imageAltText: undefined}) {
    const {precomputedFeatures, imageAltText} = options;
    const resourceTreeModel = target.model(SDK.ResourceTreeModel.ResourceTreeModel);
    if (!resourceTreeModel) {
      return Promise.resolve(/** @type {?Element} */ (null));
    }
    let resource = resourceTreeModel.resourceForURL(originalImageURL);
    let imageURL = originalImageURL;
    if (!isImageResource(resource) && precomputedFeatures && precomputedFeatures.currentSrc) {
      imageURL = precomputedFeatures.currentSrc;
      resource = resourceTreeModel.resourceForURL(imageURL);
    }
    if (!resource || !isImageResource(resource)) {
      return Promise.resolve(/** @type {?Element} */ (null));
    }

    const displayName = resource.displayName;

    // Open DevTools for the first time, base64 resource has no content.
    const content = resource.content ? resource.content : resource.url.split('base64,')[1];
    const resourceSize = resource.contentSize() ? Number(resource.contentSize()) : base64ToSize(content);
    const formatResourceSize = Platform.NumberUtilities.bytesToString(resourceSize);
    const formatResourceSizeText = resourceSize > 0 ? formatResourceSize : '';

    /** @type {function(*):void} */
    let fulfill;
    const promise = new Promise(x => {
      fulfill = x;
    });
    const imageElement = /** @type{!HTMLImageElement} */ (document.createElement('img'));
    imageElement.addEventListener('load', buildContent, false);
    imageElement.addEventListener('error', () => fulfill(null), false);
    if (imageAltText) {
      imageElement.alt = imageAltText;
    }
    resource.populateImageSource(imageElement);
    return promise;

    /**
     * @param {?SDK.Resource.Resource} resource
     * @return {boolean}
     */
    function isImageResource(resource) {
      return !!resource && resource.resourceType() === Common.ResourceType.resourceTypes.Image;
    }

    function buildContent() {
      const container = document.createElement('table');
      UI.Utils.appendStyle(container, 'components/imagePreview.css', {enableLegacyPatching: false});
      container.className = 'image-preview-container';


      const imageRow =
          /** @type {!HTMLTableDataCellElement} */ (container.createChild('tr').createChild('td', 'image-container'));
      imageRow.colSpan = 2;

      const link = /** @type {!HTMLLinkElement} */ (imageRow.createChild('div'));
      link.title = displayName;
      link.appendChild(imageElement);

      // Open image in new tab.
      link.addEventListener('click', () => {
        Host.InspectorFrontendHost.InspectorFrontendHostInstance.openInNewTab(imageURL);
      });

      const intrinsicWidth = imageElement.naturalWidth;
      const intrinsicHeight = imageElement.naturalHeight;
      const renderedWidth = precomputedFeatures ? precomputedFeatures.renderedWidth : intrinsicWidth;
      const renderedHeight = precomputedFeatures ? precomputedFeatures.renderedHeight : intrinsicHeight;

      const renderedTitle = ls`Rendered size:`;
      const intrinsicTitle = ls`Intrinsic size:`;
      const fileTitle = ls`File size:`;
      const renderedRow = container.createChild('tr', 'row');

      if (showDimensions) {
        if (renderedHeight !== intrinsicHeight || renderedWidth !== intrinsicWidth) {
          renderedRow.createChild('td', 'title').textContent = renderedTitle;
          renderedRow.createChild('td', 'description').textContent = `${renderedWidth} × ${renderedHeight} px`;

          const intrinsicRow = container.createChild('tr', 'row');
          intrinsicRow.createChild('td', 'title').textContent = intrinsicTitle;
          intrinsicRow.createChild('td', 'description').textContent = `${intrinsicWidth} × ${intrinsicHeight} px`;
        } else {
          renderedRow.createChild('td', 'title').textContent = renderedTitle;
          renderedRow.createChild('td', 'description').textContent = `${renderedWidth} × ${renderedHeight} px`;
        }
      }

      // File size
      const fileRow = container.createChild('tr', 'row');
      fileRow.createChild('td', 'title').textContent = fileTitle;
      fileRow.createChild('td', 'description').textContent = `${formatResourceSizeText}`;


      // srcset
      if (imageURL !== originalImageURL) {
        const originalTitle = ls`Current source:`;
        const originalRow = container.createChild('tr', 'row');
        originalRow.createChild('td', 'title').textContent = originalTitle;

        const sourceText = imageURL.trimMiddle(100);
        const link = /** @type {!HTMLLinkElement} */ (
            originalRow.createChild('td', 'description description-link').createChild('span', 'source-link'));
        link.textContent = sourceText;
        link.addEventListener('click', () => {
          Host.InspectorFrontendHost.InspectorFrontendHostInstance.openInNewTab(imageURL);
        });
      }
      fulfill(container);
    }
  }

  /**
   * @param {!SDK.DOMModel.DOMNode} node
   * @return {!Promise<!PrecomputedFeatures|undefined>}
   */
  static async loadDimensionsForNode(node) {
    if (!node.nodeName() || node.nodeName().toLowerCase() !== 'img') {
      return;
    }

    const object = await node.resolveToObject('');

    if (!object) {
      return;
    }

    const featuresObject = object.callFunctionJSON(features, undefined);
    object.release();
    return featuresObject;

    /**
     * @return {!PrecomputedFeatures}
     * @this {!HTMLImageElement}
     */
    function features() {
      return {renderedWidth: this.width, renderedHeight: this.height, currentSrc: this.currentSrc};
    }
  }

  /**
   * @param {string} url
   * @return {string}
   */
  static defaultAltTextForImageURL(url) {
    const parsedImageURL = new Common.ParsedURL.ParsedURL(url);
    const imageSourceText = parsedImageURL.isValid ? parsedImageURL.displayName : ls`unknown source`;
    return ls`Image from ${imageSourceText}`;
  }
}
