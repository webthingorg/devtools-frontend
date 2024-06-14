// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as ComponentHelpers from '../../../ui/components/helpers/helpers.js';
import * as LitHtml from '../../../ui/lit-html/lit-html.js';

import styles from './entryLabelOverlay.css.js';

export class EntryLabelOverlay extends HTMLElement {
  // Length of the line that connects the label to the entry.
  static readonly LABLE_CONNECTOR_HEIGHT = 6;
  static readonly LABEL_PADDING = 4;
  // The label is angled on the left from the centre of the entry it belongs to. `labelAndConnectorAngleOffset` specifies how many pixels to the left it is shifted.
  static readonly LABEL_AND_CONNECTOR_ANGLE_OFFSET = 4;

  static readonly litTagName = LitHtml.literal`devtools-entry-label-overlay`;
  readonly #shadow = this.attachShadow({mode: 'open'});
  #label = '';
  readonly #boundRender = this.render.bind(this);

  set label(label: string) {
    if (label === this.#label) {
      return;
    }
    this.#label = label;
    void ComponentHelpers.ScheduledRender.scheduleRender(this, this.#boundRender);
  }

  connectedCallback(): void {
    this.#shadow.adoptedStyleSheets = [styles];
  }

  afterOverlayUpdate(entryHeight: number, entryWidth: number): void {
    const labelElement = this.#shadow.querySelector<HTMLElement>('.wrap')?.querySelector<HTMLElement>('.label-element');

    if (!labelElement) {
      return;
    }

    // Set label height to the entry height + padding
    labelElement.style.height = `${entryHeight}px`;

    labelElement.style.padding = `${EntryLabelOverlay.LABEL_PADDING}px`;
    labelElement.innerHTML = 'labley';
    labelElement.style.transform = `translateX(-${EntryLabelOverlay.LABEL_AND_CONNECTOR_ANGLE_OFFSET}px)`;

    // Set the width of the canvas that draws the connector to be equal to the label element
    const svg = this.#shadow.querySelector<HTMLElement>('.wrap')?.querySelector('#connectorContainer') as SVGAElement;
    svg.setAttribute('width', (labelElement.getBoundingClientRect().width).toString());
    svg.setAttribute('height', EntryLabelOverlay.LABLE_CONNECTOR_HEIGHT.toString());
    const line = svg.children[0] as SVGLineElement;

    line.setAttribute(
        'x1', (svg.getBoundingClientRect().width / 2 - EntryLabelOverlay.LABEL_AND_CONNECTOR_ANGLE_OFFSET).toString());
    line.setAttribute('y1', '0');
    line.setAttribute('x2', (svg.getBoundingClientRect().width / 2).toString());
    line.setAttribute('y2', (svg.getBoundingClientRect().height).toString());
    line.setAttribute('stroke', 'black');
    line.setAttribute('stroke-width', '2');

    const entryWrap = this.#shadow.querySelector<HTMLElement>('.wrap')?.querySelector('.entry-wrap') as HTMLElement;
    entryWrap.style.height = `${entryHeight}px`;
    entryWrap.style.width = `${entryWidth}px`;
  }

  render(): void {
    LitHtml.render(
        LitHtml.html`
        <span class="wrap">
        <div class="label-element"></div>
        <svg id="connectorContainer">
          <line>
          </line>      
        </svg>
        <div class="entry-wrap"> </div>
        </span>`,
        this.#shadow, {host: this});
  }
}

customElements.define('devtools-entry-label-overlay', EntryLabelOverlay);

declare global {
  interface HTMLElementTagNameMap {
    'devtools-entry-label-overlay': EntryLabelOverlay;
  }
}
