import {html, render} from '../third_party/lit-html/package/lit-html.js';

interface PieChartOptions {
  size: number,
  formatter: (value: number) => string,
  showLegend: boolean,
  chartName: string
}

interface SliceModel {
  value: number,
  pathString: string,
  color: string,
  name: string
}

export class PieChart extends HTMLElement {
  private readonly shadow = this.attachShadow({mode: 'open'});

  private readonly innerR = 0.618;
  private slices: SliceModel[] = []; // TODO: type
  private lastAngle = -Math.PI / 2;
  private totalValue: number = 0;
  private totalValueFormatted: string = '';

  private size: number = 0;
  private formatter?: (value: number) => string = undefined;
  private showLegend: boolean = true;
  private chartName: string = '';

  constructor() {
    super();
  }

  setOptions(options: PieChartOptions) {
    const {size, formatter, showLegend, chartName} = options;
    this.size = size;
    this.formatter = formatter;
    this.showLegend = showLegend;
    this.chartName = chartName;
  }

  private render() {
    render(html`
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
          <svg>
          <g transform="scale(${this.size / 2}) translate(1, 1) scale(0.99, 0.99)">
            <circle r="1" stroke="hsl(0, 0%, 80%)" fill="transparent" stroke-width=${this.size}></circle>
            <circle r=${this.innerR} stroke="hsl(0, 0%, 80%)" fill="transparent" stroke-width=${this.size}></circle>
            ${this.slices.map(slice => {
              // TODO: Aria label - name?
              return html`<path d=${slice.pathString} fill=${slice.color}></path>`;
            })}
            </g>
          </svg>
          <div class="pie-chart-foreground">
            <div class="pie-chart-total">
              ${this.totalValue}
            </div>
          </div>
        </div>
        ${this.showLegend && html`
        <div class="pie-chart-legend">

        </div>
        `}
      </div>`,
      this.shadow);
  }

  setTotal(totalValue: number): void {
    this.slices = [];
    this.totalValue = totalValue;
    this.lastAngle = -Math.PI / 2;
    let totalString: string;
    if (totalValue) {
      // TODO: Can formatter be falsey?
      totalString = this.formatter ? this.formatter(totalValue) : totalValue.toString();
    } else {
      totalString = '';
    }
    this.totalValueFormatted = totalString;
    // this._totalElement.textContent = totalString;
    // TODO: Legend
    // if (this._legend) {
    //   this._legend.removeChildren();
    //   this.addLegendItem(this._totalElement, totalValue, ls`Total`);
    // }
    this.render();
  }

  addSlice(value: number, color: string, name?: string): void {
    let sliceAngle = value / this.totalValue * 2 * Math.PI;
    if (!isFinite(sliceAngle)) {
      return;
    }
    sliceAngle = Math.min(sliceAngle, 2 * Math.PI * 0.9999);
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

    const pathString = `M${x1},${y1} A1,1,0,${largeArc},1,${x2},${y2} L${x3},${y3} A${r2},${r2},0,${largeArc},0,${x4},${y4} Z`;
    this.slices.push({value, pathString, color, name: name ? name : '' });
    // if (this._legend) {
    //   this.addLegendItem(path, value, name, color);
    // }
    this.render();
  }

  // private addLegendItem(figureElement: Element, value: number, name?: string, color?: string): Element {
  //   const node = this._legend.ownerDocument.createElement('div');
  //   node.className = 'pie-chart-legend-row';
  //   // make sure total always appears at the bottom
  //   if (this._legend.childElementCount) {
  //     this._legend.insertBefore(node, this._legend.lastElementChild);
  //   } else {
  //     this._legend.appendChild(node);
  //   }
  //   const sizeDiv = node.createChild('div', 'pie-chart-size');
  //   const swatchDiv = node.createChild('div', 'pie-chart-swatch');
  //   const nameDiv = node.createChild('div', 'pie-chart-name');
  //   if (color) {
  //     swatchDiv.style.backgroundColor = color;
  //   } else {
  //     swatchDiv.classList.add('pie-chart-empty-swatch');
  //   }
  //   nameDiv.textContent = name;
  //   const size = this.formatter ? this.formatter(value) : value;
  //   sizeDiv.textContent = size;
  //   UI.ARIAUtils.setAccessibleName(figureElement, name + ' ' + size);
  //   return node;
  // }
}

customElements.define('pie-chart', PieChart);

declare global {
  interface HTMLElementTagNameMap {
    'pie-chart': PieChart;
  }
}
