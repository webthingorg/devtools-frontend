// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../common/common.js';  // eslint-disable-line no-unused-vars
import {ls} from '../platform/platform.js';
import * as SDK from '../sdk/sdk.js';
import * as LitHtml from '../third_party/lit-html/lit-html.js';
import * as UI from '../ui/ui.js';

export class ElementsPanelLink extends HTMLElement {
  private readonly shadow = this.attachShadow({mode: 'open'});

  private nodeId: Readonly<number> = null;
  private target: Readonly<SDK.SDKModel.Target> = null;

  set data(data: {violatingNodeId: number, target: SDK.SDKModel.Target}) {
    this.nodeId = data.violatingNodeId;
    this.target = data.target;
    this.render();
  }

  private onElementRevealIconClick() {
    const deferredDOMNode = new SDK.DOMModel.DeferredDOMNode(this.target, this.nodeId);
    Common.Revealer.reveal(deferredDOMNode);
  }

  private onElementRevealIconMouseEnter() {
    const deferredDOMNode = new SDK.DOMModel.DeferredDOMNode(this.target, this.nodeId);
    if (deferredDOMNode) {
      deferredDOMNode.highlight();
    }
  }

  private onElementRevealIconMouseLeave() {
    SDK.OverlayModel.OverlayModel.hideDOMNodeHighlight();
  }

  private render() {
    const output = LitHtml.html`
        <td class="affected-resource-csp-info-node"
            @click=${this.onElementRevealIconClick()}
            @mouseenter=${this.onElementRevealIconMouseEnter()}
            @mouseleave=${this.onElementRevealIconMouseLeave()}>
        ${UI.Icon.Icon.create('largeicon-node-search', 'icon')}
        ${
        UI.Tooltip.Tooltip.install(
            UI.Icon.Icon.create('largeicon-node-search', 'icon'),
            ls`Click to reveal the violating DOM node in the Elements panel`)}
        </td>`;
    // clang-format off
        LitHtml.render(output, this.shadow);
    // clang-format on
  }
}

customElements.define('devtools-elements-elements_panel_link', ElementsPanelLink);

declare global {
  interface HTMLElementTagNameMap {
    'devtools-elements-elements_panel_link': ElementsPanelLink;
  }
}
