// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as SDK from '../../core/sdk/sdk.js';
import * as UI from '../../ui/legacy/legacy.js';

import * as ElementsComponents from './components/components.js';
import * as ElementsTreeOutline from './ElementsTreeOutline.js';

import type {ElementsTreeElement} from './ElementsTreeElement.js';

export class TopLayerContainer extends UI.TreeOutline.TreeElement {
  treeOutline: ElementsTreeOutline.ElementsTreeOutline|null;
  domModel: SDK.DOMModel.DOMModel;
  currentTopLayerElements: ElementsTreeElement[];
  bodyElement?: ElementsTreeElement;

  constructor(bodyElement: ElementsTreeElement) {
    super('#top-layer');
    this.bodyElement = bodyElement;
    this.domModel = bodyElement.node().domModel();
    this.treeOutline = null;
    this.currentTopLayerElements = [];
  }

  updateBody(bodyElement?: ElementsTreeElement) {
    this.bodyElement = bodyElement;
  }

  async addTopLayerElementsAsChildren(): Promise<boolean> {
    this.removeCurrentTopLayerElementsAdorners();
    this.currentTopLayerElements = [];
    const newTopLayerElementsIDs = await this.domModel.getTopLayerElements();
    let topLayerElementIndex = 0;
    if (newTopLayerElementsIDs !== null) {
      for (const elementID of newTopLayerElementsIDs) {
        const topLayerDOMNode = this.domModel.idToDOMNode.get(elementID);
        // Will need to add support for backdrop in the future.
        if (topLayerDOMNode && topLayerDOMNode.nodeName() !== '::backdrop') {
          topLayerElementIndex++;
          const topLayerElementShortcut = new SDK.DOMModel.DOMNodeShortcut(
              this.domModel.target(), topLayerDOMNode.backendNodeId(), 0, topLayerDOMNode.nodeName());
          const topLayerTreeElement = this.treeOutline?.treeElementByNode.get(topLayerDOMNode);
          const topLayerElementRepresentation = new ElementsTreeOutline.ShortcutTreeElement(topLayerElementShortcut);
          if (topLayerTreeElement && !this.currentTopLayerElements.includes(topLayerTreeElement)) {
            this.appendChild(topLayerElementRepresentation);
            this.addTopLayerAdorner(topLayerTreeElement, topLayerElementRepresentation, topLayerElementIndex);
            this.currentTopLayerElements.push(topLayerTreeElement);
          }
        }
      }
    }
    return (topLayerElementIndex > 0) ? true : false;
  }

  private removeCurrentTopLayerElementsAdorners() {
    for (const topLayerElement of this.currentTopLayerElements) {
      topLayerElement.removeAllAdorners();
    }
  }

  private addTopLayerAdorner(
      element: ElementsTreeElement|undefined, topLayerElementRepresentation: ElementsTreeOutline.ShortcutTreeElement,
      topLayerElementIndex: number): void {
    const config = ElementsComponents.AdornerManager.getRegisteredAdorner(
        ElementsComponents.AdornerManager.RegisteredAdorners.TOP_LAYER);
    const adornerContent = document.createElement('span');
    adornerContent.textContent = 'top-layer (' + topLayerElementIndex + ')';
    const adorner = element?.adorn(config, adornerContent);
    if (adorner) {
      adorner.addEventListener('click', () => {
        topLayerElementRepresentation.revealAndSelect();
      });
      adorner.addEventListener('mousedown', e => e.consume(), false);
    }
  }
}
