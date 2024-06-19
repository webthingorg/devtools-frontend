// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as ComponentHelpers from '../../../ui/components/helpers/helpers.js';
import * as LitHtml from '../../../ui/lit-html/lit-html.js';

import styles from './entryLabelOverlay.css.js';

export class EntryLabelOverlay extends HTMLElement {
  // The label is angled on the left from the centre of the entry it belongs to.
  // `LABEL_AND_CONNECTOR_SHIFT_LENGTH` specifies how many pixels to the left it is shifted.
  static readonly LABEL_AND_CONNECTOR_SHIFT_LENGTH = 4;
  // Length of the line that connects the label to the entry.
  static readonly LABEL_CONNECTOR_HEIGHT = 6;
  static readonly LABEL_HEIGHT = 17;
  static readonly LABEL_PADDING = 4;
  static readonly LABEL_AND_CONNECTOR_HEIGHT =
      EntryLabelOverlay.LABEL_HEIGHT + EntryLabelOverlay.LABEL_PADDING * 2 + EntryLabelOverlay.LABEL_CONNECTOR_HEIGHT;

  static readonly litTagName = LitHtml.literal`devtools-entry-label-overlay`;
  readonly #shadow = this.attachShadow({mode: 'open'});
  readonly #boundRender = this.render.bind(this);
  #label = '';
  #entryDimentions: {height: number, width: number}|null = null;

  /*
The entry label overlay consists of 3 parts - the label part with the label string inside,
the line connecting the label to the entry, and a black box around an entry to highlight the entry with a label.
________
|_label__|                <-- label part with the label string inside
    \
      \                   <-- line connecting the label to the entry
      \
________________
|_____entry______|         <--- box around an entry

`drawLabel` method below draws the first part.
`drawConnector` method below draws the first second part - the connector line and the svg container for it.
`drawEntryHighlightWrapper` draws the third part.
We only rerender the first part if the label changes and the third part if the size of the entry changes.
The connector shape never changes so we only draw the second part when the component is created.

Otherwise, the entry label overlay object only gets repositioned.
*/

  constructor() {
    super();
    this.render();
    this.drawConnector();
  }

  connectedCallback(): void {
    this.#shadow.adoptedStyleSheets = [styles];
  }

  set label(label: string) {
    if (label === this.#label) {
      return;
    }
    this.#label = label;

    void ComponentHelpers.ScheduledRender.scheduleRender(this, this.#boundRender);
    // We need to redraw the label only when the label is set to a new one
    this.drawLabel();
  }

  set entryDimentions(entryDimentions: {height: number, width: number}) {
    if (entryDimentions.height === this.#entryDimentions?.height &&
        entryDimentions.width === this.#entryDimentions?.width) {
      return;
    }

    this.#entryDimentions = entryDimentions;
    void ComponentHelpers.ScheduledRender.scheduleRender(this, this.#boundRender);
    // We need to redraw the entry erapper only if the entry dimentions change
    this.drawEntryHighlightWrapper();
  }

  drawConnector(): void {
    const labelPartsWrapper = this.#shadow.querySelector<HTMLElement>('.label-parts-wrapper');
    const connectorLineContainer = labelPartsWrapper?.querySelector('#connectorContainer') as SVGAElement;
    const connector = connectorLineContainer.querySelector('line');
    const entryHighlightWrapper = labelPartsWrapper?.querySelector('.entry-highlight-wrapper') as HTMLElement;
    if (!connectorLineContainer || !entryHighlightWrapper || !connector) {
      console.error('Some entry label elements are missing.');
      return;
    }
    // PART 2: draw the connector from label to the entry
    // Set the width of the canvas that draws the connector to be equal to the length of the shift multiplied by two.
    // That way, we can draw the connector from its corner to its middle. Since all elements are alligned in the middle, the connector
    // will end in the middle of the entry.
    connectorLineContainer.setAttribute('width', (EntryLabelOverlay.LABEL_AND_CONNECTOR_SHIFT_LENGTH * 2).toString());
    connectorLineContainer.setAttribute('height', EntryLabelOverlay.LABEL_CONNECTOR_HEIGHT.toString());
    // Start drawing the top right corner.
    connector.setAttribute('x1', '0');
    connector.setAttribute('y1', '0');
    // Finish drawing in middle of the connector container.
    connector.setAttribute('x2', EntryLabelOverlay.LABEL_AND_CONNECTOR_SHIFT_LENGTH.toString());
    connector.setAttribute('y2', EntryLabelOverlay.LABEL_CONNECTOR_HEIGHT.toString());
    connector.setAttribute('stroke', 'black');
    connector.setAttribute('stroke-width', '2');
  }

  drawLabel(): void {
    const labelPartsWrapper = this.#shadow.querySelector<HTMLElement>('.label-parts-wrapper');
    const labelBox = labelPartsWrapper?.querySelector<HTMLElement>('.label-box');
    const connectorLineContainer = labelPartsWrapper?.querySelector('#connectorContainer') as SVGAElement;
    const connector = connectorLineContainer.querySelector('line');
    const entryHighlightWrapper = labelPartsWrapper?.querySelector('.entry-highlight-wrapper') as HTMLElement;

    if (!labelBox || !connectorLineContainer || !entryHighlightWrapper || !connector) {
      console.error('Some entry label elements are missing.');
      return;
    }

    // PART 1: draw the label box
    // Set label height to the entry height
    labelBox.style.height = `${EntryLabelOverlay.LABEL_HEIGHT}px`;
    labelBox.style.padding = `${EntryLabelOverlay.LABEL_PADDING}px`;
    labelBox.style.transform = `translateX(-${EntryLabelOverlay.LABEL_AND_CONNECTOR_SHIFT_LENGTH}px)`;
    labelBox.innerHTML = this.#label;
  }

  drawEntryHighlightWrapper(): void {
    const labelPartsWrapper = this.#shadow.querySelector<HTMLElement>('.label-parts-wrapper');
    const entryHighlightWrapper = labelPartsWrapper?.querySelector('.entry-highlight-wrapper') as HTMLElement;

    if (!entryHighlightWrapper) {
      console.error('Some entry label elements are missing.');
      return;
    }

    // PART 3: draw the box that highlights the entry with a label
    entryHighlightWrapper.style.height = `${this.#entryDimentions?.height}px`;
    entryHighlightWrapper.style.width = `${this.#entryDimentions?.width}px`;
  }

  render(): void {
    LitHtml.render(
        LitHtml.html`
        <span class="label-parts-wrapper">
        <div class="label-box"></div>
        <svg id="connectorContainer">
          <line/>
        </svg>
        <div class="entry-highlight-wrapper"/>
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
