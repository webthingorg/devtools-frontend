// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../../../core/common/common.js';
import * as ComponentHelpers from '../../../../ui/components/helpers/helpers.js';
import * as Coordinator from '../../../../ui/components/render_coordinator/render_coordinator.js';
import * as LitHtml from '../../../../ui/lit-html/lit-html.js';

import gamutOverlayStyles from './gamutOverlay.css.js';

const coordinator = Coordinator.RenderCoordinator.RenderCoordinator.instance();

type SrgbOverlayProps = {
  // [0 - 1] corresponding to HSV hue
  hue: number,
  width: number,
  height: number,
};

const SRGB_LABEL_HEIGHT = 10;
const SRGB_LABEL_BOTTOM = 3;
const SRGB_TEXT_UPPER_POINT_FROM_BOTTOM = SRGB_LABEL_HEIGHT + SRGB_LABEL_BOTTOM;

function isColorInSrgbGamut(hsv: number[]): boolean {
  const rgba: number[] = [];
  Common.Color.hsva2rgba([...hsv, 1], rgba);
  const displayP3Color =
      new Common.Color.ColorFunction(Common.Color.Format.DISPLAY_P3, rgba[0], rgba[1], rgba[2], rgba[3], undefined);
  return displayP3Color.as(Common.Color.Format.SRGB).getUnclippedColor().isInGamut();
}

export class SrgbOverlay extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-spectrum-srgb-overlay`;
  readonly #shadow = this.attachShadow({mode: 'open'});

  constructor() {
    super();
    this.#shadow.adoptedStyleSheets = [
      gamutOverlayStyles,
    ];
  }

  #getLinePoints({hue, width, height}: SrgbOverlayProps): {x: number, y: number}[]|null {
    if (width === 0 || height === 0) {
      return null;
    }

    const step = 1 / window.devicePixelRatio;
    const linePoints = [];
    let x = 0;
    for (let y = 0; y < height; y += step) {
      const value = 1 - (y / height);

      for (; x < width; x += step) {
        const saturation = x / width;
        if (!isColorInSrgbGamut([hue, saturation, value])) {
          linePoints.push({x, y});
          break;
        }
      }
    }

    return linePoints;
  }

  #closestPointAtHeight(points: {x: number, y: number}[], atHeight: number): {x: number, y: number}|null {
    let min = Infinity;
    let closestPoint = null;
    for (const point of points) {
      if (Math.abs(atHeight - point.y) < min) {
        min = Math.abs(atHeight - point.y);
        closestPoint = point;
      }
    }

    return closestPoint;
  }

  render({hue, width, height}: SrgbOverlayProps): Promise<void> {
    return coordinator.write('GamutOverlay render', () => {
      const points = this.#getLinePoints({hue, width, height});
      if (!points || points.length === 0) {
        return;
      }

      const closestPoint = this.#closestPointAtHeight(points, height - SRGB_TEXT_UPPER_POINT_FROM_BOTTOM);
      if (!closestPoint) {
        return;
      }

      LitHtml.render(
          LitHtml.html`
          <span class="label" style="right: ${width - closestPoint.x}px">sRGB</span>
          <svg>
            <polyline points=${points.map(point => `${point.x},${point.y}`).join(' ')} class="gamut-line" />
          </svg>
        `,
          this.#shadow, {host: this});
    });
  }
}

ComponentHelpers.CustomElements.defineComponent('devtools-spectrum-srgb-overlay', SrgbOverlay);

declare global {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLElementTagNameMap {
    'devtools-spectrum-srgb-overlay': SrgbOverlay;
  }
}
