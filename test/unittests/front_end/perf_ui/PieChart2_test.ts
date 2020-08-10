// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {PieChart2} from '../../../../front_end/perf_ui/PieChart2.js';
import {assertShadowRoot, renderElementIntoDOM} from '../helpers/DOMHelpers.js';

const {assert} = chai;

const testChartData = {
  chartName: 'Nice Chart',
  size: 110,
  formatter: (value: number) => String(value) + ' f',
  showLegend: true,
  total: 100,
  slices: [{value: 100, color: 'red', title: 'Slice1'}],
};

const testChartNoLegendData = {
  chartName: 'Nice Chart',
  size: 110,
  formatter: (value: number) => String(value) + ' f',
  showLegend: false,
  total: 100,
  slices: [{value: 100, color: 'red', title: 'Slice1'}],
};

describe('PieChart2', () => {
  describe('with legend', () => {
    it('has a path node for a 1-slice chart', () => {
      const chart = new PieChart2();
      renderElementIntoDOM(chart);

      chart.data = testChartData;
      assertShadowRoot(chart.shadowRoot);

      const slices = Array.from(chart.shadowRoot.querySelectorAll('path'));
      assert.strictEqual(slices.length, 1);
    });

    it('has a legend', () => {
      const chart = new PieChart2();
      renderElementIntoDOM(chart);

      chart.data = testChartData;
      assertShadowRoot(chart.shadowRoot);

      const legendRows = chart.shadowRoot.querySelectorAll('.pie-chart-legend-row');
      assert.strictEqual(legendRows.length, 2);
    });

    it('has a total', () => {
      const chart = new PieChart2();
      renderElementIntoDOM(chart);

      chart.data = testChartData;
      assertShadowRoot(chart.shadowRoot);

      const total = chart.shadowRoot.querySelector('.pie-chart-total');
      assert.isNotNull(total);
    });

    it('formats the total', () => {
      const chart = new PieChart2();
      renderElementIntoDOM(chart);

      chart.data = testChartData;
      assertShadowRoot(chart.shadowRoot);

      const total = chart.shadowRoot.querySelector('.pie-chart-total');
      assert.strictEqual(total!.textContent?.trim(), '100 f');
    });

    it('selects total by default', () => {
      const chart = new PieChart2();
      renderElementIntoDOM(chart);

      chart.data = testChartData;
      assertShadowRoot(chart.shadowRoot);

      const legendRows = chart.shadowRoot.querySelectorAll('.pie-chart-legend-row');
      assert.strictEqual(legendRows.length, 2);

      // Legend has selected set.
      const sliceLegendRow = legendRows[0];
      const totalLegendRow = legendRows[1];
      assert.isFalse(sliceLegendRow.classList.contains('selected'));
      assert.isTrue(totalLegendRow.classList.contains('selected'));

      // Chart total display in the center has selected set.
      const total = chart.shadowRoot.querySelector('.pie-chart-total');
      assert.isNotNull(total);
      assert.isTrue(total!.classList.contains('selected'));
    });
  });
  describe('without legend', () => {
    it('has no legend', () => {
      const chart = new PieChart2();
      renderElementIntoDOM(chart);

      chart.data = testChartNoLegendData;
      assertShadowRoot(chart.shadowRoot);

      const legendRows = chart.shadowRoot.querySelectorAll('.pie-chart-legend-row');
      assert.strictEqual(legendRows.length, 0);
    });
  });
});
