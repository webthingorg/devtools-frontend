// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as LitHtml from '../../lit-html/lit-html.js';
import * as VisualLogging from '../../visual_logging/visual_logging.js';
import * as ComponentHelpers from '../helpers/helpers.js';
import * as IconButton from '../icon_button/icon_button.js';

import cardStyles from './card.css.js';

declare global {
  interface HTMLElementTagNameMap {
    'devtools-card': Card;
  }
}

interface CardState {
  heading: string;
  ariaLabel: string;
  content?: HTMLElement[];
  stylesheet?: CSSStyleSheet;
}

interface CommonCardData {
  heading?: string;
  ariaLabel?: string;
  content?: HTMLElement[];
  stylesheet?: CSSStyleSheet;
}

export type CardData = CommonCardData&({heading: string});

export class Card extends HTMLElement {
  static formAssociated = true;
  static readonly litTagName = LitHtml.literal`devtools-card`;
  readonly #shadow = this.attachShadow({mode: 'open', slotAssignment: 'manual', delegatesFocus: true});
  readonly #boundRender = this.#render.bind(this);
  readonly #props: CardState = {
    heading: '',
    ariaLabel: 'Settings section',
  };
  stylesheet: CSSStyleSheet;

  #slotRef = LitHtml.Directives.createRef();

  constructor(stylesheet: CSSStyleSheet) {
    super();
    this.stylesheet = stylesheet;
  }

  /**
   * Perfer using the .data= setter instead of setting the individual properties
   * for increased type-safety.
   */
  set data(data: CardData) {
    this.#props.heading = data.heading;
    void ComponentHelpers.ScheduledRender.scheduleRender(this, this.#boundRender);
  }

  set heading(heading: string) {
    this.#props.heading = heading;
    void ComponentHelpers.ScheduledRender.scheduleRender(this, this.#boundRender);
  }

  override set ariaLabel(ariaLabel: string) {
    this.#props.ariaLabel = ariaLabel;
    void ComponentHelpers.ScheduledRender.scheduleRender(this, this.#boundRender);
  }

  set content(contentElement: HTMLElement) {
    this.#slotRef.value?.append(contentElement);
    // if (!this.#props.content) {
    //   this.#props.content = [contentElement];
    // }
    // else {
    //   this.#props.content.push(contentElement);
    // }
    void ComponentHelpers.ScheduledRender.scheduleRender(this, this.#boundRender);
  }

  connectedCallback(): void {
    this.#shadow.adoptedStyleSheets = [cardStyles, this.stylesheet];
    void ComponentHelpers.ScheduledRender.scheduleRender(this, this.#boundRender);
  }

  appendStyles(styles: CSSStyleSheet): void {
    this.#shadow.adoptedStyleSheets.push(styles);
    void ComponentHelpers.ScheduledRender.scheduleRender(this, this.#boundRender);
  }

  #render(): void {
    const nodes = (this.#slotRef.value as HTMLSlotElement | undefined)?.assignedNodes();
    console.log('NODES: ', nodes);
    if (!this.#props.heading) {
      throw new Error('Card is required to have a heading');
    }
    const classes = {
      hasHeading: Boolean(this.#props.heading),
    };
    // clang-format off
    LitHtml.render(
      LitHtml.html`
        <div class="wrapper">
          <p role="heading" aria-level="2" class="heading">${this.#props.heading}</p>
          <div role="group" aria-label=${LitHtml.Directives.ifDefined(this.#props.ariaLabel)} class="content-container">
            ${this.#props.content}
          </div>
          <slot name="hello" @slotchange=${this.#render} ${LitHtml.Directives.ref(this.#slotRef)}></slot>
        </div>
      `, this.#shadow, {host: this});
    // clang-format on
    console.log('STYLESHEEEEEEEEEETS: ', this.#shadow.adoptedStyleSheets.length);
  }
}

customElements.define('devtools-card', Card);
