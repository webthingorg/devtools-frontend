// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as Common from '../../core/common/common.js';
import * as IconButton from '../../ui/components/icon_button/icon_button.js';
import * as UI from '../../ui/legacy/legacy.js';

import * as ElementsComponents from './components/components.js';

import type {ElementsTreeOutline} from './ElementsTreeOutline.js';
import type {ElementsTreeElement} from './ElementsTreeElement.js';
import type * as SDK from '../../core/sdk/sdk.js';
export class ElementsTreeElementWithoutNode extends UI.TreeOutline.TreeElement {
  treeOutline: ElementsTreeOutline|null;
  domModel: SDK.DOMModel.DOMModel;

  constructor(treeOutline: ElementsTreeOutline|null, domModel: SDK.DOMModel.DOMModel, nodeName?: string) {
    super(nodeName);
    this.treeOutline = treeOutline;
    this.domModel = domModel;
  }

  async addTopLayerElementsAsChildren(): Promise<void> {
    const topLayerElements = await this.domModel.getTopLayerElements();
    if (topLayerElements !== null) {
      for (const childID of topLayerElements) {
        const topLayerNode = this.domModel.idToDOMNode.get(childID);
        if (topLayerNode !== undefined) {
          const topLayerTreeElement = this.treeOutline?.insertChildElement(this, topLayerNode, 0, false);
          this.addLinkIconAdorner(topLayerTreeElement, topLayerNode);
        }
      }
    }
  }

  private addLinkIconAdorner(element: ElementsTreeElement|undefined, topLayerNode: SDK.DOMModel.DOMNode): void {
    const linkIcon = new IconButton.Icon.Icon();
    linkIcon
        .data = {iconName: 'ic_show_node_16x16', color: 'var(--color-text-disabled)', width: '12px', height: '12px'};
    const config = ElementsComponents.AdornerManager.getRegisteredAdorner(
        ElementsComponents.AdornerManager.RegisteredAdorners.ELEMENT_LINK);

    const adorner = element?.adorn(config, linkIcon);

    if (adorner) {
      adorner.addEventListener('click', () => {
        topLayerNode.distributedNodes()[0].deferredNode.resolve(node => {
          void Common.Revealer.reveal(node);
        });
      });
    }
  }
}
