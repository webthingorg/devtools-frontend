// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as LitHtml from '../third_party/lit-html/lit-html.js';

export interface Slice {
  value: number, color: string, title: string
}

export class PieChart2 extends HTMLElement {
  private readonly shadow = this.attachShadow({mode: 'open'});
  private chartName = '';
  private size = 0;
  private formatter: ((value: number) => string)|null = null;
  private showLegend = false;
  private total = 0;
  private slices: Slice[] = [];

  private readonly innerR = 0.618;
  private lastAngle = -Math.PI / 2;

  private render() {
    // clang-format off
    const output = LitHtml.html`
      <style>
        .root {
          align-items: center;
          display: flex;
          min-width: fit-content;
          white-space: nowrap;
        }

        .chart-root {
          position: relative;
          overflow: hidden;
        }

        .pie-chart-foreground {
          position: absolute;
          width: 100%;
          height: 100%;
          z-index: 10;
          top: 0;
          display: flex;
          pointer-events: none;
        }

        .pie-chart-total {
          margin: auto;
          padding: 2px 5px;
          background-color: rgba(255, 255, 255, 0.6);
          pointer-events: auto;
        }

        .pie-chart-legend {
          margin-left: 30px;
        }

        .pie-chart-legend-row {
          margin: 5px auto;
          padding-right: 25px;
        }

        .pie-chart-swatch {
          display: inline-block;
          width: 11px;
          height: 11px;
          margin: 0 6px;
          top: 1px;
          position: relative;
          border: 1px solid rgba(100, 100, 100, 0.2);
        }

        .pie-chart-swatch.pie-chart-empty-swatch {
          border: none;
        }

        .pie-chart-name {
          display: inline-block;
        }

        .pie-chart-size {
          display: inline-block;
          text-align: right;
          width: 70px;
        }

        @media (forced-colors: active) {
          .pie-chart-swatch {
            forced-color-adjust: none;
            border-color: ButtonText;
          }
        }
      </style>
      <div class="root" role="group" aria-label=${this.chartName}>
        <div class="chart-root" style="width: ${this.size}px; height: ${this.size}px;">
          ${LitHtml.svg`
          <svg>
          <g transform="scale(${this.size / 2}) translate(1, 1) scale(0.99, 0.99)">
            <circle r="1" stroke="hsl(0, 0%, 80%)" fill="transparent" stroke-width=${1 / this.size}></circle>
            <circle r=${this.innerR} stroke="hsl(0, 0%, 80%)" fill="transparent" stroke-width=${1 / this.size}></circle>
            ${this.slices.map(slice => {
              // TODO: Aria label - name?
              return LitHtml.svg`<path class="slice" d=${this.getPathStringForSlice(slice)} fill=${slice.color}></path>`;
            })}
            </g>
          </svg>
          `}
          <div class="pie-chart-foreground">
            <div class="pie-chart-total">
              ${this.total ? this.formatter!(this.total) : ''}
            </div>
          </div>
        </div>
        ${this.showLegend && LitHtml.html`
        <div class="pie-chart-legend">

        </div>
        `}
    `;
    // clang-format on
    LitHtml.render(output, this.shadow);
  }

  private getPathStringForSlice(slice: Slice) {
    const value = slice.value;
    let sliceAngle = value / this.total * 2 * Math.PI;
    if (!isFinite(sliceAngle)) {
      return;
    }
    sliceAngle = Math.min(sliceAngle, 2 * Math.PI * 0.9999);
    // TODO add to render
    // const path = this._createSVGChild(this._group, 'path');
    // path.classList.add('slice');
    // path.tabIndex = -1;
    const x1 = Math.cos(this.lastAngle);
    const y1 = Math.sin(this.lastAngle);
    this.lastAngle += sliceAngle;
    const x2 = Math.cos(this.lastAngle);
    const y2 = Math.sin(this.lastAngle);
    const r2 = this.innerR;
    const x3 = x2 * r2;
    const y3 = y2 * r2;
    const x4 = x1 * r2;
    const y4 = y1 * r2;
    const largeArc = sliceAngle > Math.PI ? 1 : 0;

    const pathString =
        `M${x1},${y1} A1,1,0,${largeArc},1,${x2},${y2} L${x3},${y3} A${r2},${r2},0,${largeArc},0,${x4},${y4} Z`;
    return pathString;
    // TODO add to render
    // path.setAttribute('fill', color);
    // const clickHandler = this._focusClickedElement.bind(this, path);
    // path.addEventListener('click', clickHandler);
    // if (this._legend) {
    //   const legendItem = this._addLegendItem(value, clickHandler, name, color);
    //   this._sliceToLegendItem.set(path, legendItem);
    // }
    // if (name) {
    //   UI.ARIAUtils.setAccessibleName(path, name);
    // }
  }

  set data(data: {
    chartName: string,
    size: number,
    formatter: (value: number) => string,
    showLegend: boolean,
    total: number,
    slices: Slice[]
  }) {
    this.chartName = data.chartName;
    this.size = data.size;
    this.formatter = data.formatter;
    this.showLegend = data.showLegend;
    this.total = data.total;
    this.slices = data.slices;

    this.lastAngle = -Math.PI / 2;

    this.render();
  }
}

customElements.define('devtools-perf-piechart', PieChart2);

declare global {
  interface HTMLElementTagNameMap {
    'devtools-perf-piechart': PieChart2;
  }
}
