// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assertElement, assertElements} from '../../helpers/DOMHelpers.js';
const {assert} = chai;

export const getFocusableCell = (shadowRoot: ShadowRoot) => {
  // We only expect one here, but we qSA so we can assert on only one.
  // Can't use td as it may be a th if the user has focused a column header.
  const tabIndexCells = shadowRoot.querySelectorAll('table [tabindex="0"]');
  assertElements(tabIndexCells, HTMLTableCellElement);
  assert.lengthOf(tabIndexCells, 1);
  return tabIndexCells[0];
};

export const getCellByIndexes = (shadowRoot: ShadowRoot, indexes: {column: number, row: number}) => {
  const cell = shadowRoot.querySelector<HTMLTableCellElement>(
      `[data-row-index="${indexes.row}"][data-col-index="${indexes.column}"]`);
  assertElement(cell, HTMLTableCellElement);
  return cell;
};

export const getHeaderCells = (shadowRoot: ShadowRoot, options: {onlyVisible: boolean} = {
  onlyVisible: false,
}) => {
  const cells = shadowRoot.querySelectorAll('[data-grid-header-cell]');
  assertElements(cells, HTMLTableCellElement);
  return Array.from(cells).filter(cell => {
    if (!options.onlyVisible) {
      return true;
    }

    return cell.classList.contains('hidden') === false;
  });
};

// TODO: change this to ByAriaIndex
export const getValuesOfBodyRow = (shadowRoot: ShadowRoot, rowIndex: number, options: {onlyVisible: boolean} = {
  onlyVisible: false,
}): string[] => {
  const row = getBodyRowByAriaIndex(shadowRoot, rowIndex);
  const cells = row.querySelectorAll('[data-grid-value-cell-for-column]');
  assertElements(cells, HTMLTableCellElement);
  return Array.from(cells)
      .filter(cell => {
        return !options.onlyVisible || cell.classList.contains('hidden') === false;
      })
      .map(cell => {
        return cell.innerText;
      });
};

export const getAllRows = (shadowRoot: ShadowRoot): HTMLTableRowElement[] => {
  const rows = shadowRoot.querySelectorAll('[aria-rowindex]');
  assertElements(rows, HTMLTableRowElement);
  return Array.from(rows);
};

export const getValuesOfAllBodyRows = (shadowRoot: ShadowRoot, options: {onlyVisible: boolean} = {
  onlyVisible: false,
}): string[][] => {
  const rows = getAllRows(shadowRoot);
  return rows
      .map((row, index) => {
        // now decide if the row should be included or not
        const rowIsHidden = row.classList.contains('hidden');
        return {
          rowValues: getValuesOfBodyRow(shadowRoot, index + 1, options),
          hidden: options.onlyVisible && rowIsHidden,
        };
      })
      .filter(row => row.hidden === false)
      .map(r => r.rowValues);
};

export const getBodyRowByAriaIndex = (shadowRoot: ShadowRoot, rowIndex: number): HTMLTableRowElement => {
  const row = shadowRoot.querySelector(`[aria-rowindex="${rowIndex}"]`);
  assertElement(row, HTMLTableRowElement);
  return row;
};

export const getHeaderCellForColumnId = (shadowRoot: ShadowRoot, columnId: string): HTMLTableCellElement => {
  const cell = shadowRoot.querySelector(`[data-grid-header-cell="${columnId}`);
  assertElement(cell, HTMLTableCellElement);
  return cell;
};


export const getValuesForColumn = (shadowRoot: ShadowRoot, columnId: string): string[] => {
  const cells = shadowRoot.querySelectorAll(`[data-grid-value-cell-for-column=${columnId}]`);
  assertElements(cells, HTMLTableCellElement);
  return Array.from(cells, cell => cell.innerText);
};
