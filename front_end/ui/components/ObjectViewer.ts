// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import './TreeOutline.js';

import * as LitHtml from '../../third_party/lit-html/lit-html.js';

import type {TreeOutlineData} from './TreeOutline.js';
import type {TreeNode} from './TreeOutlineUtils.js';
import {ObjectMetaData, JSONObject, convertObjectToTree} from './ObjectViewerUtils.js';

export interface ObjectViewerData {
  object: JSONObject;
}

function renderValueForNode(node: TreeNode<ObjectMetaData>, state: {isExpanded: boolean}): LitHtml.TemplateResult|
    string {
  const {dataType, rawValue} = node.treeNodeData;
  const primitiveTypes = new Set(['boolean', 'number', 'null', 'string']);
  if (primitiveTypes.has(dataType)) {
    const styles = LitHtml.Directives.styleMap({
      color: dataType === 'number' ? 'var(--color-syntax-3)' : 'var(--color-syntax-2)',
    });
    return LitHtml.html`<span style=${styles}>${JSON.stringify(rawValue)}</span>`;
  }
  if (Array.isArray(rawValue)) {
    return state.isExpanded ? LitHtml.nothing as LitHtml.TemplateResult : `Array(${rawValue.length})`;
  }
  if (rawValue instanceof Date) {
    return JSON.stringify(rawValue);
  }
  if (typeof rawValue === 'object') {
    // At this point we know it's not an array or a date or null; it must be an actual object
    return state.isExpanded ? LitHtml.nothing as LitHtml.TemplateResult : '{...}';
  }
  return LitHtml.html`TODO`;
}

const customRenderer = (node: TreeNode<ObjectMetaData>, state: {isExpanded: boolean}): LitHtml.TemplateResult => {
  const data = node.treeNodeData;
  const generalStyles = LitHtml.Directives.styleMap({
    fontFamily: 'var(--source-code-font-family)',
    fontSize: 'var(--source-code-font-size)',
  });

  const key = 'rawKey' in data ? data.rawKey : String(data.index);

  const value = renderValueForNode(node, state);

  return LitHtml.html`<span style=${generalStyles}>${key}: ${value}</span>`;
};

export class ObjectViewer extends HTMLElement {
  private readonly shadow = this.attachShadow({mode: 'open'});
  private object: JSONObject = {};
  private hasRenderedAtLeastOnce = false;

  get data(): ObjectViewerData {
    return {
      object: this.object,
    };
  }

  set data(data: ObjectViewerData) {
    this.object = data.object;
    this.render();
  }

  private async render(): Promise<void> {
    // TODO: probably want to cache this
    const treeNodes = convertObjectToTree(this.object);
    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
    LitHtml.render(LitHtml.html`
    <div class="wrapping-container">
     <devtools-tree-outline .data=${{tree: treeNodes, defaultRenderer: customRenderer} as TreeOutlineData<ObjectMetaData>}></devtools-tree-outline>
    </div>
    `, this.shadow, {
      eventContext: this,
    });
    // clang-format on
    this.hasRenderedAtLeastOnce = true;
  }
}

customElements.define('devtools-object-viewer', ObjectViewer);

declare global {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLElementTagNameMap {
    'devtools-object-viewer': ObjectViewer;
  }
}
