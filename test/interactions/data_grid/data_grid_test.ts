// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';

import {getDataGridRows} from '../../e2e/helpers/datagrid-helpers.js';
import {$, getBrowserAndPages, waitFor} from '../../shared/helper.js';
import {loadComponentDocExample} from '../helpers/shared.js';

import type {ElementHandle} from 'puppeteer';

function assertNumberBetween(number: number, min: number, max: number) {
  assert.isAbove(number, min);
  assert.isBelow(number, max);
}

async function getDataGridText(datagrid: ElementHandle<Element>[][]): Promise<string[][]> {
  const table: Array<Array<string>> = [];
  for (const row of datagrid) {
    const textRow = [];
    for (const cell of row.values()) {
      const text = await cell.evaluate(x => {
        return (x as HTMLElement).innerText || '';
      });
      textRow.push(text);
    }
    table.push(textRow);
  }
  return table;
}

describe('data grid', () => {
  it('lists the data grid contents', async () => {
    await loadComponentDocExample('data_grid/basic.html');
    await waitFor('devtools-data-grid');
    const dataGrid = await $('devtools-data-grid');
    if (!dataGrid) {
      assert.fail('Could not find data-grid');
    }
    const data = await getDataGridRows(3, dataGrid);
    const renderedText = await getDataGridText(data);
    assert.deepEqual(
        [
          ['Bravo', 'Letter B'],
          ['Alpha', 'Letter A'],
          ['Charlie', 'Letter C'],
        ],
        renderedText);
  });

  it('can be resized', async () => {
    await loadComponentDocExample('data_grid/basic.html');
    await waitFor('devtools-data-grid');
    const dataGrid = await $('devtools-data-grid');
    if (!dataGrid) {
      assert.fail('Could not find data-grid');
    }

    await waitFor('.cell-resize-handle', dataGrid);
    await getDataGridRows(3, dataGrid);
    const firstResizeHandler = await $('.cell-resize-handle', dataGrid);
    if (!firstResizeHandler) {
      assert.fail('Could not find resizeHandler');
    }

    const columnOneFirstCell = await $('td[data-row-index="1"][data-col-index="0"]', dataGrid);
    const columnTwoFirstCell = await $('td[data-row-index="1"][data-col-index="1"]', dataGrid);
    if (!columnOneFirstCell || !columnTwoFirstCell) {
      assert.fail('Could not find columns');
    }

    const columnOneWidth = await columnOneFirstCell.evaluate(cell => cell.clientWidth);
    const columnTwoWidth = await columnTwoFirstCell.evaluate(cell => cell.clientWidth);

    assertNumberBetween(columnOneWidth, 500, 510);
    assertNumberBetween(columnTwoWidth, 500, 510);
    const position = await firstResizeHandler.evaluate(handler => {
      return {
        x: handler.getBoundingClientRect().x,
        y: handler.getBoundingClientRect().y,
      };
    });
    const {frontend} = getBrowserAndPages();
    await frontend.mouse.move(position.x, position.y);
    await frontend.mouse.down();
    await frontend.mouse.move(position.x - 50, position.y);
    const newColumnOneWidth = await columnOneFirstCell.evaluate(cell => cell.clientWidth);
    const newColumnTwoWidth = await columnTwoFirstCell.evaluate(cell => cell.clientWidth);
    assertNumberBetween(newColumnOneWidth, 450, 460);
    assertNumberBetween(newColumnTwoWidth, 550, 560);
  });
});
