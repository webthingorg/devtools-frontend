// Copyright (c) 2015 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as SDK from '../sdk/sdk.js';  // eslint-disable-line no-unused-vars

import {StylePropertyTreeElement} from './StylePropertyTreeElement.js';  // eslint-disable-line no-unused-vars
import {StylesSidebarPane} from './StylesSidebarPane.js';                // eslint-disable-line no-unused-vars

export class StylePropertyHighlighter {
  _styleSidebarPane: StylesSidebarPane;
  constructor(ssp: StylesSidebarPane) {
    this._styleSidebarPane = ssp;
  }

  /**
   * Expand all shorthands, find the given property, scroll to it and highlight it.
   */
  highlightProperty(cssProperty: SDK.CSSProperty.CSSProperty) {
    // Expand all shorthands.
    for (const section of this._styleSidebarPane.allSections()) {
      for (let treeElement:
               (import('/Users/janscheffler/dev/devtools/devtools-frontend/out/Default/gen/front_end/ui/Treeoutline')
                    .TreeElement|null) = section.propertiesTreeOutline.firstChild();
           treeElement; treeElement = treeElement.nextSibling) {
        treeElement.onpopulate();
      }
    }

    const treeElement =
        this._findTreeElement((treeElement: StylePropertyTreeElement) => treeElement.property === cssProperty);
    if (treeElement) {
      treeElement.parent && treeElement.parent.expand();
      this._scrollAndHighlightTreeElement(treeElement);
    }
  }

  /**
   * Find the first property that matches the provided name, scroll to it and highlight it.
   */
  findAndHighlightPropertyName(propertyName: string) {
    const treeElement =
        this._findTreeElement((treeElement: StylePropertyTreeElement) => treeElement.property.name === propertyName);
    if (treeElement) {
      this._scrollAndHighlightTreeElement(treeElement);
    }
  }

  /**
   * Traverse the styles pane tree, execute the provided callback for every tree element found, and
   * return the first tree element for which the callback returns a truthy value.
   */
  _findTreeElement(compareCb: (arg0: StylePropertyTreeElement) => boolean): StylePropertyTreeElement|null {
    let result: StylePropertyTreeElement|null = null;
    for (const section of this._styleSidebarPane.allSections()) {
      let treeElement:
          (import('/Users/janscheffler/dev/devtools/devtools-frontend/out/Default/gen/front_end/ui/Treeoutline')
               .TreeElement|null) = section.propertiesTreeOutline.firstChild();
      while (treeElement && !result && (treeElement instanceof StylePropertyTreeElement)) {
        if (compareCb(treeElement)) {
          result = treeElement;
          break;
        }
        treeElement = treeElement.traverseNextTreeElement(false, null, true);
      }
      if (result) {
        break;
      }
    }
    return result;
  }

  _scrollAndHighlightTreeElement(treeElement: StylePropertyTreeElement) {
    treeElement.listItemElement.scrollIntoViewIfNeeded();
    treeElement.listItemElement.animate(
        [
          {offset: 0, backgroundColor: 'rgba(255, 255, 0, 0.2)'},
          {offset: 0.1, backgroundColor: 'rgba(255, 255, 0, 0.7)'},
          {offset: 1, backgroundColor: 'transparent'},
        ],
        {duration: 2000, easing: 'cubic-bezier(0, 0, 0.2, 1)'});
  }
}
