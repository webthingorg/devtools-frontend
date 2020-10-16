// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assertElement, assertElements} from '../../helpers/DOMHelpers.js';

export const getHeaderCells = (shadowRoot: ShadowRoot) => {
  const cells = shadowRoot.querySelectorAll('[data-grid-header-cell]');
  assertElements(cells, HTMLTableCellElement);
  return cells;
};

export const getValuesOfRow = (shadowRoot: ShadowRoot, rowIndex: number): string[] => {
  const row = getRowByIndex(shadowRoot, rowIndex);
  const cells = row.querySelectorAll('[data-grid-value-cell-for-column]');
  assertElements(cells, HTMLTableCellElement);
  return Array.from(cells, cell => {
    return cell.innerText;
  });
};

export const getValuesOfAllRows = (shadowRoot: ShadowRoot): string[][] => {
  const rows = shadowRoot.querySelectorAll('[data-grid-row]');
  assertElements(rows, HTMLTableRowElement);
  return Array.from(rows, (_row, index) => getValuesOfRow(shadowRoot, index));
};

export const getRowByIndex = (shadowRoot: ShadowRoot, rowIndex: number): HTMLTableRowElement => {
  const row = shadowRoot.querySelector(`[data-grid-row="${rowIndex}"]`);
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
