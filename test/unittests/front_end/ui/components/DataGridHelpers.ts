// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assertElement, assertElements} from '../../helpers/DOMHelpers.js';

export const getHeaderCells = (shadowRoot: ShadowRoot, options: {onlyVisible: boolean} = { onlyVisible: false}) => {
  const cells = shadowRoot.querySelectorAll('[data-grid-header-cell]');
  assertElements(cells, HTMLTableCellElement);
  return Array.from(cells).filter(cell => {
    if (!options.onlyVisible) {
      return true;
    }

    return cell.classList.contains('hidden') === false;
  });
};

export const getValuesOfRow = (shadowRoot: ShadowRoot, rowIndex: number, options: {onlyVisible: boolean} = {onlyVisible: false}): string[] => {
  const row = getRowByIndex(shadowRoot, rowIndex);
  const cells = row.querySelectorAll('[data-grid-value-cell-for-column]');
  assertElements(cells, HTMLTableCellElement);
  return Array.from(cells).filter(cell => {
    return !options.onlyVisible || cell.classList.contains('hidden') === false;
  }).map(cell => {
    return cell.innerText;
  });
};

export const getAllRows = (shadowRoot: ShadowRoot): HTMLTableRowElement[] => {
  const rows = shadowRoot.querySelectorAll('[aria-rowindex]');
  assertElements(rows, HTMLTableRowElement);
  return Array.from(rows);
};

export const getValuesOfAllRows = (shadowRoot: ShadowRoot, options: {onlyVisible: boolean} = {
  onlyVisible: false,
}): string[][] => {
  const rows = getAllRows(shadowRoot);
  return rows
      .map((row, index) => {
        // now decide if the row should be included or not
        const rowIsHidden = row.classList.contains('hidden');
        return {rowValues: getValuesOfRow(shadowRoot, index, options), hidden: options.onlyVisible && rowIsHidden};
      })
      .filter(row => row.hidden === false)
      .map(r => r.rowValues);
};

// TODO: rename to getRowByAriaIndex and don't +1 the number?
export const getRowByIndex = (shadowRoot: ShadowRoot, rowIndex: number): HTMLTableRowElement => {
  // aria-rowindex labels start at 1, not 0.
  const ariaIndex = rowIndex + 1;
  const row = shadowRoot.querySelector(`[aria-rowindex="${ariaIndex}"]`);
  assertElement(row, HTMLTableRowElement);
  return row;
};

export const getSelectedRow = (shadowRoot: ShadowRoot): HTMLTableRowElement|null => {
  const row = shadowRoot.querySelector('[data-grid-row-selected]');
  if (row !== null) {
    assertElement(row, HTMLTableRowElement);
  }
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
