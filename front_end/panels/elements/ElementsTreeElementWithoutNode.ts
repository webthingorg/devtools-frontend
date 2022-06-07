// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as SDK from '../../core/sdk/sdk.js';
import * as UI from '../../ui/legacy/legacy.js';

import * as ElementsComponents from './components/components.js';
import * as ElementsTreeOutline from './ElementsTreeOutline.js';

import type {ElementsTreeElement} from './ElementsTreeElement.js';

export class ElementsTreeElementWithoutNode extends UI.TreeOutline.TreeElement {
  treeOutline: ElementsTreeOutline.ElementsTreeOutline|null;
  domModel: SDK.DOMModel.DOMModel;

  constructor(domModel: SDK.DOMModel.DOMModel, nodeName?: string) {
    super(nodeName);
    this.treeOutline = null;
    this.domModel = domModel;
  }

  async addTopLayerElementsAsChildren(): Promise<boolean> {
    const topLayerElements = await this.domModel.getTopLayerElements();
    let topLayerElementIndex = 0;
    if (topLayerElements !== null) {
      for (const childID of topLayerElements) {
        const topLayerNode = this.domModel.idToDOMNode.get(childID);
        if (topLayerNode !== undefined) {
          topLayerElementIndex++;
          const topLayerElementShortcut = new SDK.DOMModel.DOMNodeShortcut(
              this.domModel.target(), topLayerNode.backendNodeId(), 0, topLayerNode.nodeName());
          const topLayerRepresentationElement = new ElementsTreeOutline.ShortcutTreeElement(topLayerElementShortcut);
          this.appendChild(topLayerRepresentationElement);
          const topLayerTreeElement = this.treeOutline?.treeElementByNode.get(topLayerNode);
          this.addTopLayerAdorner(topLayerTreeElement, topLayerRepresentationElement, topLayerElementIndex);
        }
      }
    }
    return (topLayerElementIndex > 0) ? true : false;
  }

  private addTopLayerAdorner(
      element: ElementsTreeElement|undefined, topLayerRepresentationElement: ElementsTreeOutline.ShortcutTreeElement,
      topLayerElementIndex: number): void {
    const config = ElementsComponents.AdornerManager.getRegisteredAdorner(
        ElementsComponents.AdornerManager.RegisteredAdorners.TOP_LAYER);
    const adornerName = document.createElement('span');
    adornerName.textContent = 'top-layer (' + topLayerElementIndex + ')';
    const adorner = element?.adorn(config, adornerName);
    if (adorner) {
      adorner.addEventListener('click', () => {
        topLayerRepresentationElement.revealAndSelect();
      });
      adorner.addEventListener('mousedown', e => e.consume(), false);
    }
  }
}
