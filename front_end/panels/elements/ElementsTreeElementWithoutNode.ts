// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as SDK from '../../core/sdk/sdk.js';
import * as IconButton from '../../ui/components/icon_button/icon_button.js';
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

  async addTopLayerElementsAsChildren(): Promise<void> {
    const topLayerElements = await this.domModel.getTopLayerElements();
    let topElementLayerIndex = 0;
    if (topLayerElements !== null) {
      // for (let i = 0, len = topLayerElements.length; i< len; i++) {
      for (const childID of topLayerElements) {
        const topLayerNode = this.domModel.idToDOMNode.get(childID);
        if (topLayerNode !== undefined) {
          topElementLayerIndex++;
          const newShortcut = new SDK.DOMModel.DOMNodeShortcut(
              this.domModel.target(), topLayerNode.backendNodeId(), 0, topLayerNode.nodeName());
          const newShortcutElement = new ElementsTreeOutline.ShortcutTreeElement(newShortcut);
          this.appendChild(newShortcutElement);

          const topLayerElement = this.treeOutline?.treeElementByNode.get(topLayerNode);
          this.addLinkIconAdorner(topLayerElement, newShortcutElement, topElementLayerIndex);
        }
      }
    }
  }

  private addLinkIconAdorner(
      element: ElementsTreeElement|undefined, topLayerNode: ElementsTreeOutline.ShortcutTreeElement,
      topLayerElementIndex: number): void {
    const linkIcon = new IconButton.Icon.Icon();
    linkIcon
        .data = {iconName: 'ic_show_node_16x16', color: 'var(--color-text-disabled)', width: '12px', height: '12px'};
    const config = ElementsComponents.AdornerManager.getRegisteredAdorner(
        ElementsComponents.AdornerManager.RegisteredAdorners.TOP_LAYER);

    const adornerName = document.createElement('span');
    adornerName.textContent = 'top-layer (' + topLayerElementIndex + ')';
    const adorner = element?.adorn(config, adornerName);
    if (adorner) {
      adorner.addEventListener('click', () => {
        topLayerNode.revealAndSelect();
      });
      adorner.addEventListener('mousedown', e => e.consume(), false);
    }
  }
}
