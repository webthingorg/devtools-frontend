// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../common/common.js';
import * as SDK from '../sdk/sdk.js';
import * as UI from '../ui/ui.js';

export const decorateNodeLabel = function(
    node: SDK.DOMModel.DOMNode, parentElement: HTMLElement, tooltipContent?: string|undefined) {
  const originalNode = node;
  const isPseudo = node.nodeType() === Node.ELEMENT_NODE && node.pseudoType();
  if (isPseudo && node.parentNode) {
    node = node.parentNode;
  }

  let title = node.nodeNameInCorrectCase();

  const nameElement = parentElement.createChild('span', 'node-label-name');
  nameElement.textContent = title;

  const idAttribute = node.getAttribute('id');
  if (idAttribute) {
    const idElement = parentElement.createChild('span', 'node-label-id');
    const part = '#' + idAttribute;
    title += part;
    UI.UIUtils.createTextChild(idElement, part);

    // Mark the name as extra, since the ID is more important.
    nameElement.classList.add('extra');
  }

  const classAttribute = node.getAttribute('class');
  if (classAttribute) {
    const classes = classAttribute.split(/\s+/);
    if (classes.length) {
      const foundClasses = new Set<string>();
      const classesElement = parentElement.createChild('span', 'extra node-label-class');
      for (let i = 0; i < classes.length; ++i) {
        const className = classes[i];
        if (className && !foundClasses.has(className)) {
          const part = '.' + className;
          title += part;
          UI.UIUtils.createTextChild(classesElement, part);
          foundClasses.add(className);
        }
      }
    }
  }

  if (isPseudo) {
    const pseudoElement = parentElement.createChild('span', 'extra node-label-pseudo');
    const pseudoText = '::' + originalNode.pseudoType();
    UI.UIUtils.createTextChild(pseudoElement, pseudoText);
    title += pseudoText;
  }
  UI.Tooltip.Tooltip.install(parentElement, tooltipContent || title);
};

export const linkifyNodeReference = function(
    node: SDK.DOMModel.DOMNode|null, options: Common.Linkifier.Options|undefined = {
      tooltip: undefined,
      preventKeyboardFocus: undefined,
    }): Node {
  if (!node) {
    return document.createTextNode(Common.UIString.UIString('<node>'));
  }

  const root = document.createElement('span');
  root.classList.add('monospace');
  const shadowRoot = UI.Utils.createShadowRootWithCoreStyles(
      root, {cssFile: 'elements/domLinkifier.css', enableLegacyPatching: false, delegatesFocus: undefined});
  const link = (shadowRoot.createChild('div', 'node-link') as HTMLDivElement);

  decorateNodeLabel(node, link, options.tooltip);

  link.addEventListener('click', () => Common.Revealer.reveal(node, false) && false, false);
  link.addEventListener('mouseover', node.highlight.bind(node, undefined), false);
  link.addEventListener('mouseleave', () => SDK.OverlayModel.OverlayModel.hideDOMNodeHighlight(), false);

  if (!options.preventKeyboardFocus) {
    link.addEventListener(
        'keydown', (event: KeyboardEvent) => isEnterKey(event) && Common.Revealer.reveal(node, false) && false);
    link.tabIndex = 0;
    UI.ARIAUtils.markAsLink(link);
  }

  return root;
};

export const linkifyDeferredNodeReference = function(
    deferredNode: SDK.DOMModel.DeferredDOMNode, options: Common.Linkifier.Options|undefined = {
      tooltip: undefined,
      preventKeyboardFocus: undefined,
    }): Node {
  const root = document.createElement('div');
  const shadowRoot = UI.Utils.createShadowRootWithCoreStyles(
      root, {cssFile: 'elements/domLinkifier.css', enableLegacyPatching: false, delegatesFocus: undefined});
  const link = (shadowRoot.createChild('div', 'node-link') as HTMLDivElement);
  link.createChild('slot');
  link.addEventListener('click', deferredNode.resolve.bind(deferredNode, onDeferredNodeResolved), false);
  link.addEventListener('mousedown', (e: MouseEvent) => e.consume(), false);

  if (!options.preventKeyboardFocus) {
    link.addEventListener(
        'keydown', (event: KeyboardEvent) => isEnterKey(event) && deferredNode.resolve(onDeferredNodeResolved));
    link.tabIndex = 0;
    UI.ARIAUtils.markAsLink(link);
  }

  function onDeferredNodeResolved(node: SDK.DOMModel.DOMNode|null) {
    Common.Revealer.reveal(node);
  }

  return root;
};

export class Linkifier implements Common.Linkifier.Linkifier {
  linkify(object: Object, options?: Common.Linkifier.Options|undefined): Node {
    if (object instanceof SDK.DOMModel.DOMNode) {
      return linkifyNodeReference(object, options);
    }
    if (object instanceof SDK.DOMModel.DeferredDOMNode) {
      return linkifyDeferredNodeReference(object, options);
    }
    throw new Error('Can\'t linkify non-node');
  }
}
