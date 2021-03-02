// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../common/common.js';
import * as Host from '../host/host.js';
import * as i18n from '../i18n/i18n.js';
import * as Platform from '../platform/platform.js';
import * as SDK from '../sdk/sdk.js';
import * as UI from '../ui/ui.js';

const UIStrings = {
  /**
  *@description Alt text description of an image's source
  */
  unknownSource: 'unknown source',
  /**
  *@description Text to indicate the source of an image
  *@example {example.com} PH1
  */
  imageFromS: 'Image from {PH1}',
  /**
   * @description Title of the row that shows the file size of an image.
   */
  fileSize: 'File size:',
  /**
   * @description Title of the row that shows the intrinsic size of an image in pixels.
   */
  intrinsicSize: 'Intrinsic size:',
  /**
   * @description Title of the row that shows the rendered size of an image in pixels.
   */
  renderedSize: 'Rendered size:',
  /**
   * @description The img element's current request's current URL.
   * https://html.spec.whatwg.org/multipage/embedded-content.html#dom-img-currentsrc.
   */
  currentSource: 'Current source:',
};
const str_ = i18n.i18n.registerUIStrings('components/ImagePreview.js', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);
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
  static async build(
      target, originalImageURL, showDimensions, options = {precomputedFeatures: undefined, imageAltText: undefined}) {
    const {precomputedFeatures, imageAltText} = options;
    const resourceTreeModel = target.model(SDK.ResourceTreeModel.ResourceTreeModel);
    if (!resourceTreeModel) {
      return /** @type {?Element} */ (null);
    }
    let resource = resourceTreeModel.resourceForURL(originalImageURL);
    let imageURL = originalImageURL;
    if (!isImageResource(resource) && precomputedFeatures && precomputedFeatures.currentSrc) {
      imageURL = precomputedFeatures.currentSrc;
      resource = resourceTreeModel.resourceForURL(imageURL);
    }
    if (!resource || !isImageResource(resource)) {
      return /** @type {?Element} */ (null);
    }

    const displayName = resource.displayName;

    // When opening DevTools for the first time, base64 resource has no content.
    const content = resource.content ? resource.content : resource.url.split('base64,')[1];
    const contentSize = resource.contentSize();
    const resourceSize = contentSize ? contentSize : base64ToSize(content);
    const resourceSizeText = resourceSize > 0 ? Platform.NumberUtilities.bytesToString(resourceSize) : '';

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
      return resource !== null && resource.resourceType() === Common.ResourceType.resourceTypes.Image;
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
      if (showDimensions) {
        const renderedRow = container.createChild('tr', 'row');
        if (renderedHeight !== intrinsicHeight || renderedWidth !== intrinsicWidth) {
          renderedRow.createChild('td', 'title').textContent = i18nString(UIStrings.renderedSize);
          renderedRow.createChild('td', 'description').textContent = `${renderedWidth} × ${renderedHeight} px`;

          const intrinsicRow = container.createChild('tr', 'row');
          intrinsicRow.createChild('td', 'title').textContent = i18nString(UIStrings.intrinsicSize);
          intrinsicRow.createChild('td', 'description').textContent = `${intrinsicWidth} × ${intrinsicHeight} px`;
        } else {
          renderedRow.createChild('td', 'title').textContent = i18nString(UIStrings.renderedSize);
          renderedRow.createChild('td', 'description').textContent = `${renderedWidth} × ${renderedHeight} px`;
        }
      }

      // File size
      const fileRow = container.createChild('tr', 'row');
      fileRow.createChild('td', 'title').textContent = i18nString(UIStrings.fileSize);
      fileRow.createChild('td', 'description').textContent = resourceSizeText;

      // Current source
      const originalRow = container.createChild('tr', 'row');
      originalRow.createChild('td', 'title').textContent = i18nString(UIStrings.currentSource);

      const sourceText = Platform.StringUtilities.trimMiddle(imageURL, 100);
      const sourceLink = /** @type {!HTMLLinkElement} */ (
          originalRow.createChild('td', 'description description-link').createChild('span', 'source-link'));
      sourceLink.textContent = sourceText;
      sourceLink.addEventListener('click', () => {
        Host.InspectorFrontendHost.InspectorFrontendHostInstance.openInNewTab(imageURL);
      });
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
    const imageSourceText = parsedImageURL.isValid ? parsedImageURL.displayName : i18nString(UIStrings.unknownSource);
    return i18nString(UIStrings.imageFromS, {PH1: imageSourceText});
  }
}
