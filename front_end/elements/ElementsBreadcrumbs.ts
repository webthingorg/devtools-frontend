// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {classMap} from '../third_party/lit-html/package/directives/class-map.js';
import {html, render} from '../third_party/lit-html/package/lit-html.js';

import {Crumb, CrumbTitle, determineElementTitle, DOMNode, NodeSelectedEvent, UserScrollPosition} from './ElementsBreadcrumbsUtils.js';

export const crumbsToRender = (crumbs: DOMNode[], selectedNode: DOMNode|null): Crumb[] => {
  if (!selectedNode) {
    return [];
  }

  return crumbs
      .filter(crumb => {
        return crumb.nodeType !== Node.DOCUMENT_NODE;
      })
      .map(crumb => {
        return {
          title: determineElementTitle(crumb),
          selected: crumb.id === selectedNode.id,
          node: crumb,
          originalNode: crumb.legacyDomNode,
        };
      })
      .reverse();
};


class ElementsBreadcrumbs extends HTMLElement {
  private readonly shadow = this.attachShadow({mode: 'open'});

  private crumbsData: DOMNode[] = [];
  private selectedDOMNode: DOMNode|null = null;
  private overflowing = false;
  private userScrollPosition: UserScrollPosition = 'start';
  private resizeObserver?: ResizeObserver;

  public constructor() {
    super();
    this.onCrumbsWindowScroll = this.onCrumbsWindowScroll.bind(this);
  }

  private onCrumbClick(node: DOMNode) {
    return () => this.dispatchEvent(new NodeSelectedEvent(node));
  }

  public set data(data: {selectedNode: DOMNode|null, crumbs: DOMNode[]}) {
    this.selectedDOMNode = data.selectedNode;
    this.crumbsData = data.crumbs;
    this.update();
  }

  private update() {
    this.overflowing = false;
    this.userScrollPosition = 'start';
    this.render();
    this.bindResizeObserver();
    this.ensureSelectedNodeIsVisible();
  }

  private onCrumbMouseMove(node: DOMNode) {
    return () => node.highlightNode();
  }

  private onCrumbMouseLeave(node: DOMNode) {
    return () => node.clearHighlight();
  }

  private connectedCallback() {
    this.resizeObserver = new ResizeObserver(() => {
      this.update();
    });
  }

  private bindResizeObserver() {
    if (!this.shadow || !this.resizeObserver) {
      return;
    }

    const crumbs = this.shadow.querySelector('.crumbs');

    if (!crumbs) {
      return;
    }

    this.resizeObserver.observe(crumbs);
  }

  private disconnectedCallback() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = undefined;
    }
  }

  private renderCrumbText = (title: CrumbTitle) => {
    const parts = [
      html`<span class="node-label-name">${title.main}</span>`,
    ];

    if (title.extras.id) {
      parts.push(html`<span class="node-label-id">#${title.extras.id}</span>`);
    }

    if (title.extras.classes && title.extras.classes.length > 0) {
      const text = title.extras.classes.map(c => `.${c}`).join('');
      parts.push(html`<span class="extra node-label-class">${text}</span>`);
    }

    return html`${parts}`;
  };

  private checkForOverflow() {
    if (!this.shadow || this.overflowing) {
      return;
    }

    const crumbScrollContainer = this.shadow.querySelector('.crumbs-scroll-container');
    const crumbWindow = this.shadow.querySelector('.crumbs-window');

    if (!crumbScrollContainer || !crumbWindow) {
      return;
    }


    const paddingAllowance = 20;
    const maxChildWidth = crumbWindow.clientWidth - paddingAllowance;

    if (crumbScrollContainer.clientWidth < maxChildWidth) {
      return;
    }

    this.overflowing = true;
    this.render();
  }

  private onCrumbsWindowScroll(event: Event) {
    if (!event.target) {
      return;
    }

    /* not all Events are DOM Events so the TS Event def doesn't have
     * .target typed as an Element but in this case we're getting this
     * from a DOM event so we're confident of having .target and it
     * being an element
     */
    const scrollWindow = event.target as Element;

    this.updateScrollState(scrollWindow);
  }

  private updateScrollState(scrollWindow: Element) {
    const maxScrollLeft = scrollWindow.scrollWidth - scrollWindow.clientWidth;
    const currentScroll = scrollWindow.scrollLeft;

    // so we disable even if the user technically could scroll one more pixel
    const beginningEndAllowance = 10;

    if (currentScroll < beginningEndAllowance) {
      this.userScrollPosition = 'start';
    } else if (currentScroll >= maxScrollLeft - beginningEndAllowance) {
      this.userScrollPosition = 'end';
    } else {
      this.userScrollPosition = 'middle';
    }

    this.render();
  }

  private onOverflowClick(direction: 'left'|'right') {
    return () => {
      const scrollWindow = this.shadow.querySelector('.crumbs-window');

      if (!scrollWindow) {
        return;
      }

      const amountToScrollOnClick = scrollWindow.clientWidth / 2;

      if (direction === 'left') {
        const newScrollLeft = Math.max(Math.floor(scrollWindow.scrollLeft - amountToScrollOnClick), 0);

        scrollWindow.scrollTo({
          behavior: 'smooth',
          left: newScrollLeft,
        });
      } else {
        const newScrollLeft = scrollWindow.scrollLeft + amountToScrollOnClick;

        scrollWindow.scrollTo({
          behavior: 'smooth',
          left: newScrollLeft,
        });
      }
    };
  }

  private renderOverflowButton(direction: 'left'|'right', disabled: boolean) {
    if (this.overflowing === false) {
      return html``;
    }

    return html`
      <button
        class="overflow ${direction}"
        @click=${this.onOverflowClick(direction)}
        ?disabled=${disabled}
      >&hellip;</button>
      `;
  }

  private render() {
    const crumbs = crumbsToRender(this.crumbsData, this.selectedDOMNode);

    // clang-format off
    render(html`
      <style>
        .crumbs {
          display: inline-flex;
          align-items: stretch;
          width: 100%;
          overflow: hidden;
          pointer-events: auto;
          cursor: default;
          white-space: nowrap;
          position: relative;
        }

        .crumbs-window {
          flex-grow: 2;
          overflow: hidden;
        }

        .crumbs-scroll-container {
          display: inline-flex;
        }

        .crumb {
          display: block;
          padding: 0 7px;
          line-height: 23px;
          white-space: nowrap;
        }

        .overflow {
          padding: 0 7px;
          font-weight: bold;
          display: block;
          border: none;
          flex-grow: 0;
          flex-shrink: 0;
          text-align: center;
        }

        .crumb.selected,
        .crumb:hover,
        .overflow:not(:disabled):hover {
          background-color: var(--toolbar-bg-color);
        }

        .crumb:not(.selected) .node-label-name {
          color: var(--dom-tag-name-color);
        }

        .crumb:not(.selected) .node-label-class {
          color: var(--dom-attribute-name-color);
        }
      </style>

      <div class="crumbs">
        ${this.renderOverflowButton('left', this.userScrollPosition === 'start')}

        <div class="crumbs-window" @scroll=${this.onCrumbsWindowScroll}>
          <div class="crumbs-scroll-container">
            ${crumbs.map(crumb => {
              const crumbClasses = {
                crumb: true,
                selected: crumb.selected,
              };
              return html`
                <span class=${classMap(crumbClasses)}
                  @click=${this.onCrumbClick(crumb.node)}
                  @mousemove=${this.onCrumbMouseMove(crumb.node)}
                  @mouseleave=${this.onCrumbMouseLeave(crumb.node)}
                  data-node-id=${crumb.node.id}
                  data-crumb="true"
                >
                  ${this.renderCrumbText(crumb.title)}
                </span>`;
            })}
          </div>
        </div>
        ${this.renderOverflowButton('right', this.userScrollPosition === 'end')}
      </div>
    `, this.shadow);
    // clang-format on

    this.checkForOverflow();
  }

  private ensureSelectedNodeIsVisible() {
    if (!this.selectedDOMNode || !this.shadow || !this.overflowing) {
      return;
    }
    const activeCrumbId = this.selectedDOMNode.id;
    const activeCrumb = this.shadow.querySelector(`.crumb[data-node-id="${activeCrumbId}"]`);

    if (activeCrumb) {
      activeCrumb.scrollIntoView();
    }
  }
}

customElements.define('devtools-elements-breadcrumbs', ElementsBreadcrumbs);

declare global {
  interface HTMLElementTagNameMap {
    'devtools-elements-breadcrumbs': ElementsBreadcrumbs;
  }
}
