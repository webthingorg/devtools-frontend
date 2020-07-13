// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as UI from '../ui/ui.js';
import {Categories, DefaultOrderedCategories} from './PropertyNameCategories.js';  // eslint-disable-line no-unused-vars

const template = document.createElement('template');
template.innerHTML = `
<style>
  ol {
    list-style-type: none;
    padding: 0;
    margin: 0;
  }

  li {
    text-overflow: ellipsis;
    white-space: nowrap;
    display: flex;
    align-items: center;
    min-height: 16px;
  }

  .group-title {
    font-size: 11px;
    cursor: pointer;
  }

  .group.collapsed .computed-style {
    display: none;
  }

  .group:not(:last-child)::after {
    content: "";
    display: block;
    height: 1px;
    background-color: var(--divider-color);
    margin: 15px;
  }

  .group > li:nth-child(odd) {
    background-color: #f5f5f5;
  }

  .computed-style.collapsed,
  .computed-style.expanded {
    cursor: pointer;
  }

  .computed-style.collapsed .traces {
    display: none;
  }

  .group-title::before,
  .computed-style::before {
    margin: 0 -2px 0 4px;
    user-select: none;
    height: 12px;
    width: 13px;
    content: "\u00a0\u00a0";
  }

  .group-title::before,
  .computed-style.collapsed::before,
  .computed-style.expanded::before {
    -webkit-mask-image: url(Images/treeoutlineTriangles.svg);
    -webkit-mask-size: 32px 24px;
    -webkit-mask-position: 0 0;
    background-color: #727272;
    text-shadow: none;
  }

  .group.expanded .group-title::before,
  .computed-style.expanded::before {
    -webkit-mask-position: -16px 0;
  }
</style>
<ol class="groups monospace"></ol>
`;

export class ComputedStyleGroupLists extends HTMLElement {
  constructor() {
    super();

    const shadowRoot = this._shadowRoot = this.attachShadow({mode: 'open'});
    UI.Utils.injectCoreStyles(this._shadowRoot);
    UI.Utils.appendStyle(this._shadowRoot, 'elements/computedStyleWidgetTree.css');
    shadowRoot.append(template.content.cloneNode(true));

    /** @type {!Map<string, []>} */
    this._listByGroup = new Map(DefaultOrderedCategories.map(category => [category, []]));
  }

  /**
   * @param {Categories} group
   * @param {!HTMLElement} propertyElement
   * @param {!HTMLElement[]} traceElements
   * @param {boolean} isExpanded
   */
  addPropertyToGroup(group, propertyElement, traceElements, isExpanded) {
    const list = this._listByGroup.get(group);
    if (!list) {
      return;
    }

    list.push({propertyElement, traceElements, isExpanded});
  }

  /**
   * Clear all the properties in every group
   */
  clearGroupLists() {
    this._listByGroup = new Map(DefaultOrderedCategories.map(category => [category, []]));
  }

  /**
   * Render the current groupList state
   * TODO: lit-html migration candidate
   */
  render() {
    const groupsContainer = this._shadowRoot.querySelector('.groups');
    if (groupsContainer === null) {
      throw new Error('groups container should always exist');
    }
    groupsContainer.removeChildren();

    for (const group of DefaultOrderedCategories) {
      const list = this._listByGroup.get(group);
      if (!list || list.length === 0) {
        // This may happen in the future when we enable customized group order/visibility
        continue;
      }
      const groupContainer = document.createElement('ol');
      groupContainer.classList.add('group', 'collapsed');

      const groupTitle = document.createElement('h1');
      groupTitle.classList.add('group-title');
      groupTitle.textContent = group;
      groupContainer.append(groupTitle);
      groupTitle.addEventListener('click', () => {
        if (groupContainer.classList.contains('collapsed')) {
          groupContainer.classList.remove('collapsed');
          groupContainer.classList.add('expanded');
        } else {
          groupContainer.classList.remove('expanded');
          groupContainer.classList.add('collapsed');
        }
      });

      for (const {propertyElement, traceElements, isExpanded} of list) {
        // TODO: optimize DOM structure here
        const listItem = document.createElement('li');
        listItem.classList.add('computed-style');
        listItem.append(propertyElement);

        if (traceElements.length > 0) {
          listItem.classList.add(isExpanded ? 'expanded' : 'collapsed');
          // TODO: expand/collapse logic here
          const tracesContainer = document.createElement('ol');
          tracesContainer.classList.add('traces');
          for (const traceElement of traceElements) {
            const traceItem = document.createElement('li');
            traceItem.classList.add('trace');
            traceItem.append(traceElement);
            tracesContainer.append(traceElement);
          }
          listItem.append(tracesContainer);
        }

        groupContainer.append(listItem);
      }

      groupsContainer.append(groupContainer);
    }
  }
}

self.customElements.define('devtools-computed-style-group-lists', ComputedStyleGroupLists);
