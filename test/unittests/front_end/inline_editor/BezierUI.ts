// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import { BezierUI } from '/front_end/inline_editor/BezierUI.js';
import { Point, CubicBezier } from '/front_end/ui/Geometry.js';

describe('BezierUI', () => {
  it('can be instantiated successfully', () => {
    const testWidth = 1;
    const testHeight = 2;
    const testMarginTop = 3;
    const testRadius = 4;
    const testLinearLine = true;
    const bezierUI = new BezierUI(testWidth, testHeight, testMarginTop, testRadius, testLinearLine);
    assert.equal(bezierUI.width, testWidth, 'width was not set or retrieved correctly');
    assert.equal(bezierUI.height, testHeight, 'height was not set or retrieved correctly');
    assert.equal(bezierUI.marginTop, testMarginTop, 'margin top was not set or retrieved correctly');
    assert.equal(bezierUI.radius, testRadius, 'radius was not set or retrieved correctly');
    assert.equal(bezierUI.linearLine, testLinearLine, 'linear line value was not set or retrieved correctly');
  });

  // TODO continue writing tests here or use another describe block
  it('can draw velocity chart correctly', () => {
    const bezier = new CubicBezier(new Point(1, 1), new Point(3, 4));
    const path = document.createElement('path');
    BezierUI.drawVelocityChart(bezier, path, 10);
    assert.equal(path.outerHTML, '<path d="M 0 26 L 0.02 10.58 L 0.81 10.11 L 1.63 9.72 L 2.48 9.40 L 3.36 9.12 L 4.25 8.88 L 5.16 8.68 L 6.08 8.50 L 7.00 8.34 L 7.92 8.20 L 8.84 8.08 L 9.74 7.97 L 10.63 7.88 L 11.49 7.80 L 12.33 7.72 L 13.14 7.66 L 13.91 7.61 L 14.64 7.57 L 15.32 7.54 L 15.96 7.52 L 16.53 7.52 L 17.04 7.54 L 17.49 7.60 L 17.87 7.72 L 18.16 7.94 L 18.38 8.46 L 18.51 10.15 L 18.55 50.73 L 18.49 4.00 L 18.33 5.24 L 18.06 5.68 L 17.68 5.89 L 17.18 6.01 L 16.56 6.08 L 15.82 6.13 L 14.94 6.16 L 13.92 6.18 L 12.76 6.19 L 11.46 6.20 L 10.00 6.20 L 10.00 26 Z"></path>', 'velocity chart was not drawn correctly');
  });

  it('calculates curve width correctly', () => {
    const bezierUI = new BezierUI(10, 10, 1, 3, true);
    assert.equal(bezierUI.curveWidth(), 4, 'curve width was not calculated correctly');
  });

  it('calculates curve height correctly', () => {
    const bezierUI = new BezierUI(10, 10, 1, 3, true);
    assert.equal(bezierUI.curveHeight(), 2, 'curve width was not calculated correctly');
  });

  it('draws curve correctly', () => {
    const bezierUI = new BezierUI(10, 10, 1, 3, true);
    const bezier = new CubicBezier(new Point(1, 1), new Point(3, 4));
    const svg = document.createElement('svg');
    bezierUI.drawCurve(bezier, svg);
    /*
    <svg width="10" height="10">
      <g>
        <line class="linear-line" x1="3" y1="6" x2="7" y2="4"></line>
        <path class="bezier-path" d="M3,6 C7, 4 15, -2 7, 4"></path>
        <line class="bezier-control-line" x1="3" y1="6" x2="7" y2="4"></line>
        <circle class="bezier-control-circle" cx="7" cy="4" r="3"></circle>
        <line class="bezier-control-line" x1="7" y1="4" x2="15" y2="-2"></line>
        <circle class="bezier-control-circle" cx="15" cy="-2" r="3"></circle>
      </g>
    </svg>
    */
    assert.equal(svg.outerHTML, '<svg width="10" height="10"><g><line class="linear-line" x1="3" y1="6" x2="7" y2="4"></line><path class="bezier-path" d="M3,6 C7, 4 15, -2 7, 4"></path><line class="bezier-control-line" x1="3" y1="6" x2="7" y2="4"></line><circle class="bezier-control-circle" cx="7" cy="4" r="3"></circle><line class="bezier-control-line" x1="7" y1="4" x2="15" y2="-2"></line><circle class="bezier-control-circle" cx="15" cy="-2" r="3"></circle></g></svg>', 'curve SVG was not drawn correctly');
  });
});
