// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import './ElementsBreadcrumbs.js';

/**
 * @typedef {{
 * parentNode:DOMNode,
 * id:number,
 * nodeType:number,
 * pseudoType:(string|undefined),
 * shadowRootType:?string,
 * nodeName:string,
 * nodeNameNicelyCased:string,
 * legacyDomNode: *,
 * highlightNode: function(): void,
 * clearHighlight: function(): void,
 * getAttribute: function(string): string,
 * }}
 */
// @ts-ignore
export let DOMNode;  // eslint-disable-line no-unused-vars

// eslint-disable-next-line no-unused-vars
class ElementsBreadcrumbsInterface extends HTMLElement {
  /**
   *
   * @param {!Array.<!DOMNode>} crumbs
   * @param {?DOMNode} selectedNode
   */
  update(crumbs, selectedNode) {
  }

  /**
   *
   * @param {!Array.<!DOMNode>} nodes
   */
  updateIfRequiredBasedOnNodeChanges(nodes) {
  }
}

/**
 * @suppressGlobalPropertiesCheck
 * @return {!ElementsBreadcrumbsInterface}
 */
export function createElementsBreadcrumbs() {
  return /** @type {!ElementsBreadcrumbsInterface} */ (document.createElement('devtools-elements-breadcrumbs'));
}
