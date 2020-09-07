// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../common/common.js';
import * as LitHtml from '../third_party/lit-html/lit-html.js';

const {render, html} = LitHtml;

export const Regex = /(?<value>[+-]?\d*\.?\d+)(?<unit>deg|grad|rad|turn)/;

export const enum AngleUnit {
  Deg = 'deg',
  Grad = 'grad',
  Rad = 'rad',
  Turn = 'turn',
}

const parseText = (text: string): {value: number, unit: AngleUnit}|null => {
  const result = text.match(Regex);
  if (!result || !result.groups) {
    return null;
  }

  return {
    value: Number(result.groups.value),
    unit: result.groups.unit as AngleUnit,
  };
};

export class PopoverToggledEvent extends Event {
  data: {open: boolean};

  constructor(open: boolean) {
    super('popover-toggled', {});
    this.data = {open};
  }
}

export class CSSAngle extends HTMLElement {
  private readonly shadow = this.attachShadow({mode: 'open'});
  private degree = 0;
  private unit = AngleUnit.Deg;
  private mousemoveThrottler = new Common.Throttler.Throttler(16.67 /* 60fps */);
  private popoverOpen = false;
  private onDocumentMousedown = this.minify.bind(this);

  set data(data: {value: number, unit: AngleUnit}) {
    // TODO: unit conversion
    this.degree = data.value;
    this.unit = data.unit;
    this.render();
  }

  setText(text: string): void {
    const data = parseText(text);
    if (data) {
      this.data = data;
    }
  }

  // We bind and unbind mouse event listeners upon popping over and minifying,
  // because we anticipate most of the time this widget is minified even when
  // it's attached to the DOM tree.
  popover(): void {
    this.popoverOpen = true;
    this.dispatchEvent(new PopoverToggledEvent(true));
    document.addEventListener('mousedown', this.onDocumentMousedown);
    this.render();
  }

  minify(): void {
    this.popoverOpen = false;
    this.dispatchEvent(new PopoverToggledEvent(false));
    document.removeEventListener('mousedown', this.onDocumentMousedown);
    this.render();
  }

  private onMiniIconClick(event: Event): void {
    event.stopPropagation();
    this.popoverOpen ? this.minify() : this.popover();
  }

  private onMouseDown(event: MouseEvent): void {
    event.stopPropagation();
    this.calculateDegreeFromMousePosition(event.pageX, event.pageY);
  }

  private onMouseMove(event: MouseEvent): void {
    const isPressed = event.buttons === 1;
    if (!isPressed) {
      return;
    }

    this.mousemoveThrottler.schedule(() => {
      this.calculateDegreeFromMousePosition(event.pageX, event.pageY);
      return Promise.resolve();
    });
  }

  private calculateDegreeFromMousePosition(mouseX: number, mouseY: number): void {
    const popover = this.shadow.querySelector('.popover');
    if (!popover) {
      return;
    }
    // TODO: investigate the possibility of caching these
    const {top, right, bottom, left} = popover.getBoundingClientRect();
    const popoverCenterX = left + (right - left) / 2;
    const popoverCenterY = bottom + (top - bottom) / 2;
    const degree = -Math.atan2(mouseX - popoverCenterX, mouseY - popoverCenterY) * 180 / Math.PI + 180;
    this.degree = degree;
    this.render();
    return;
  }

  private render() {
    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
    render(html`
      <style>
        .css-type {
          display: inline-block;
          position: relative;
        }

        .mini-icon {
          display: inline-block;
        }

        .popover {
          --size: 200px;
          --border-size: 5px;
          position: fixed;
          width: var(--size);
          height: var(--size);
          background: darkgrey;
          border: var(--border-size) solid #555555;
          border-radius: var(--size);
        }

        .dial {
          position: absolute;
          width: 5px;
          height: 15px;
          background-color: aliceblue;
          border-radius: 2px;
        }

        .dial.deg-0 {
          top: var(--border-size);
          left: calc(var(--size) / 2);
        }

        .dial.deg-45 {
          top: calc(var(--size) / 2);
          right: var(--border-size);
          transform: rotate(90deg);
        }

        .dial.deg-90 {
          bottom: var(--border-size);
          left: calc(var(--size) / 2);
        }

        .dial.deg-135 {
          top: calc(var(--size) / 2);
          left: var(--border-size);
          transform: rotate(90deg);
        }

        .hand {
          position: absolute;
          margin: auto;
          left: 0;
          right: 0;
          top: 0;
          bottom: 0;
          height: var(--size);
          width: 5px;
          background: linear-gradient(to top, transparent 50%, pink);
        }
      </style>

      <div class="css-type">
        <div class="mini-icon" @mousedown=${this.onMiniIconClick}>${this.degree}${this.unit}</div>
        ${this.popoverOpen ? this.renderPopover() : null}
      </div>
    `, this.shadow, {
      eventContext: this,
    });
    // clang-format on
  }

  private renderPopover() {
    const handStyles = {
      transform: `rotate(${this.degree}deg)`,
    };

    return html`
      <div class="popover popover-css-angle" @mousedown=${this.onMouseDown} @mousemove=${this.onMouseMove}>
        <span class="dial deg-0"></span>
        <span class="dial deg-45"></span>
        <span class="dial deg-90"></span>
        <span class="dial deg-135"></span>
        <span class="hand" style=${LitHtml.Directives.styleMap(handStyles)}></span>
      </div>
    `;
  }
}

customElements.define('devtools-css-angle', CSSAngle);

declare global {
  interface HTMLElementTagNameMap {
    'devtools-css-angle': CSSAngle;
  }
}
