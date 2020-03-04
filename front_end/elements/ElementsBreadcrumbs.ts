import {classMap} from '../third_party/lit-html/package/directives/class-map.js';
import {html, render} from '../third_party/lit-html/package/lit-html.js';

import {Crumb, CrumbTitle, DOMNode, makeCrumbTitle, NodeSelectedEvent, UserScrollPosition} from './ElementsBreadcrumbsUtils.js';


const determineElementTitle = (domNode: DOMNode): CrumbTitle => {
  switch (domNode.nodeType) {
    case Node.ELEMENT_NODE:
      if (domNode.pseudoType) {
        return makeCrumbTitle('::' + domNode.pseudoType);
      }
      const crumbTitle: CrumbTitle = makeCrumbTitle(domNode.nodeNameNicelyCased);

      const id = domNode.getAttribute('id');
      if (id) {
        crumbTitle.extras.id = id;
      }

      const classAttribute = domNode.getAttribute('class');
      if (classAttribute) {
        const classes = new Set(classAttribute.split(/\s+/));
        crumbTitle.extras.classes = Array.from(classes);
      }

      return crumbTitle;

    case Node.TEXT_NODE:
      return makeCrumbTitle('(text)');
      // return Common.UIString.UIString('(text)', []);
    case Node.COMMENT_NODE:
      return makeCrumbTitle('<!-->');
    case Node.DOCUMENT_TYPE_NODE:
      return makeCrumbTitle('<!doctype>');
    case Node.DOCUMENT_FRAGMENT_NODE:
      return makeCrumbTitle(domNode.shadowRootType ? '#shadow-root' : domNode.nodeNameNicelyCased);
    default:
      return makeCrumbTitle(domNode.nodeNameNicelyCased);
  }
};

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
  private selectedNode: DOMNode|null = null;
  private overflowing = false;
  private userScrollPosition: UserScrollPosition = 'start';
  private resizeObserver?: ResizeObserver;

  constructor() {
    super();
    this.onWindowScroll = this.onWindowScroll.bind(this);
  }

  onCrumbClick(node: DOMNode) {
    return () => this.dispatchEvent(new NodeSelectedEvent(node));
  }

  onCrumbMouseMove(node: DOMNode) {
    return () => node.highlightNode();
  }

  onCrumbMouseLeave(node: DOMNode) {
    return () => node.clearHighlight();
  }

  connectedCallback() {
    this.resizeObserver = new ResizeObserver(() => {
      this.update(this.crumbsData, this.selectedNode);
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

  disconnectedCallback() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = undefined;
    }
  }

  renderCrumbText = (title: CrumbTitle) => {
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

  checkForOverflow() {
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

  private onWindowScroll(event: Event) {
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
    const crumbs = crumbsToRender(this.crumbsData, this.selectedNode);

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

        .overflow:focus {
          outline: none;
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

        <div class="crumbs-window" @scroll=${this.onWindowScroll}>
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
    if (!this.selectedNode || !this.shadow || !this.overflowing) {
      return;
    }
    const activeCrumbId = this.selectedNode.id;
    const activeCrumb = this.shadow.querySelector(`.crumb[data-node-id="${activeCrumbId}"]`);

    if (activeCrumb) {
      activeCrumb.scrollIntoView();
    }
  }

  updateIfRequiredBasedOnNodeChanges(nodesThatHaveChanged: DOMNode[]) {
    const nodesThatHaveChangedMap = new Map<number, DOMNode>();
    nodesThatHaveChanged.forEach(c => nodesThatHaveChangedMap.set(c.id, c));

    let shouldUpdate = false;

    /* we need to go through our existing crumbs, and swap any out
     * that have been passed in as nodesThatHaveChanged
     * we track if any of them have, so if we don't replace any
     * we can no-op and save calling render again
     */
    const newCrumbs = this.crumbsData.map(crumb => {
      const replacement = nodesThatHaveChangedMap.get(crumb.id);

      if (replacement) {
        shouldUpdate = true;
      }

      return replacement || crumb;
    });

    if (shouldUpdate) {
      this.crumbsData = newCrumbs;
      this.render();
      /* if the crumbs changed significantly it might have bumped the selected node
       * to off screen, so let's scroll if need-be to put it back in the right place
       */
      this.ensureSelectedNodeIsVisible();
    }
  }

  update(crumbsData: DOMNode[], selectedNode: DOMNode|null) {
    this.crumbsData = crumbsData;
    this.selectedNode = selectedNode;
    this.overflowing = false;
    this.userScrollPosition = 'start';
    this.render();
    this.bindResizeObserver();
    this.ensureSelectedNodeIsVisible();
  }
}

customElements.define('devtools-elements-breadcrumbs', ElementsBreadcrumbs);

declare global {
  interface HTMLElementTagNameMap {
    'devtools-elements-breadcrumbs': ElementsBreadcrumbs;
  }
}
