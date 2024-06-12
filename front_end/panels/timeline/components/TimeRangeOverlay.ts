// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as TraceEngine from '../../../models/trace/trace.js';
import * as ComponentHelpers from '../../../ui/components/helpers/helpers.js';
import * as LitHtml from '../../../ui/lit-html/lit-html.js';

import styles from './timeRangeOverlay.css.js';

export class TimeRangeOverlay extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-time-range-overlay`;
  readonly #shadow = this.attachShadow({mode: 'open'});
  readonly #boundRender = this.#render.bind(this);
  #duration: TraceEngine.Types.Timing.MicroSeconds|null = null;
  #label = '';
  #canvasWidthPixels: number = 0;

  connectedCallback(): void {
    this.#shadow.adoptedStyleSheets = [styles];
  }

  set canvasWidthPixels(width: number) {
    if (width === this.#canvasWidthPixels) {
      return;
    }
    this.#canvasWidthPixels = width;
    void ComponentHelpers.ScheduledRender.scheduleRender(this, this.#boundRender);
  }

  set duration(duration: TraceEngine.Types.Timing.MicroSeconds|null) {
    if (duration === this.#duration) {
      return;
    }
    this.#duration = duration;
    void ComponentHelpers.ScheduledRender.scheduleRender(this, this.#boundRender);
  }

  set label(label: string) {
    if (label === this.#label) {
      return;
    }
    this.#label = label;
    void ComponentHelpers.ScheduledRender.scheduleRender(this, this.#boundRender);
  }

  /**
   * This calculates how much of the time range is in the user's view. This is
   * used to determine how much of the label can fit into the view, and if we
   * should even show the label.
   */
  #visibleOverlayWidth(overlayRect: DOMRect): number {
    // Canvas bounds are 0 to this.canvasWidthPixels
    const {x: startX, width} = overlayRect;
    const endX = startX + width;

    // The entire range is in view
    if (startX >= 0 && endX <= this.#canvasWidthPixels) {
      return width;
    }

    // Window is scrolled off the left hand edge.
    if (startX < 0 && endX < this.#canvasWidthPixels) {
      // startX is negative, so subtract it from the width to get the visible portion.
      return width + startX;
    }

    if (startX > 0 && endX > this.#canvasWidthPixels) {
      return this.#canvasWidthPixels - startX;
    }

    // The time range spans the entire canvas and more so just return the canvas width;
    return this.#canvasWidthPixels;
  }

  /**
   * We use this method after the overlay has been positioned in order to move
   * the label as required to keep it on screen.
   * If the label is off to the left or right, we fix it to that corner and
   * align the text so the label is visible as long as possible.
   */
  afterOverlayUpdate(): void {
    const label = this.#shadow.querySelector<HTMLElement>('.label');
    if (!label) {
      return;
    }

    const parentRect = this.getBoundingClientRect();
    const labelRect = label.getBoundingClientRect();
    const visibleOverlayWidth = this.#visibleOverlayWidth(parentRect);
    const overlayTooNarrow = visibleOverlayWidth <= labelRect.width;
    label.classList.toggle('labelHidden', overlayTooNarrow);

    if (overlayTooNarrow) {
      // Label is invisible, no need to do all the layout.
      return;
    }

    // Check if label is off the LHS of the screen.
    const labelLeftMarginToCenter = (parentRect.width - labelRect.width) / 2;
    const newLabelX = parentRect.x + labelLeftMarginToCenter;

    const labelOffLeftOfScreen = newLabelX < 0;
    label.classList.toggle('offScreenLeft', labelOffLeftOfScreen);

    // Check if label is off the RHS of the screen
    const rightBound = this.#canvasWidthPixels;
    // The label's right hand edge is the gap from the left of the range to the
    // label, and then the width of the label.
    const labelRightEdge = parentRect.x + labelLeftMarginToCenter + labelRect.width;
    const labelOffRightOfScreen = labelRightEdge > rightBound;
    label.classList.toggle('offScreenRight', labelOffRightOfScreen);

    if (labelOffLeftOfScreen) {
      // If the label is off the left of the screen, parentRect.x will be a
      // negative number indicating how far left off screen it is. So we push
      // the label by the positive version of that number.
      // Add on 9 pixels to pad from the left; this is the width of the sidebar
      // on the RHS so we match it so the label is equally padded on either
      // side.
      label.style.marginLeft = `${Math.abs(parentRect.x) + 9}px`;
    } else if (labelOffRightOfScreen) {
      // To calculate how far left to push the label, we take the right hand
      // bound (the canvas width and subtract the label's width).
      // Finally, we subtract the X position of the overlay (if the overlay is
      // 200px within the view, we don't need to push the label that 200px too
      // otherwise it will be off-screen)
      const leftMargin = rightBound - labelRect.width - parentRect.x;

      label.style.marginLeft = `${leftMargin}px`;

    } else {
      // Keep the label central.
      label.style.marginLeft = `${labelLeftMarginToCenter}px`;
    }
  }

  #render(): void {
    const durationText = this.#duration ? TraceEngine.Helpers.Timing.formatMicrosecondsTime(this.#duration) : '';

    LitHtml.render(
        LitHtml.html`<span class="label">${this.#label}<br>${durationText}</span>`, this.#shadow, {host: this});
  }
}

customElements.define('devtools-time-range-overlay', TimeRangeOverlay);

declare global {
  interface HTMLElementTagNameMap {
    'devtools-time-range-overlay': TimeRangeOverlay;
  }
}
