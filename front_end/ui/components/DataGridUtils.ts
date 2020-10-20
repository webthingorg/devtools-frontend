// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as Platform from '../../platform/platform.js';

export interface Column {
  id: string;
  title: string;
  sortable: boolean;
  width?: number;
}

// TODO: rename to Cell
export interface RowEntry {
  columnId: string;
  value: string;
}


export type Row = {
  cells: RowEntry[];
  hidden?: boolean;
}

export type SortDirection = 'ASC'|'DESC';

export interface SortState {
  columnId: string;
  direction: SortDirection;
}

export function nextRowIndex(totalRows: number, currentIndex: number|null, key: 'ArrowDown'|'ArrowUp'): number|null {
  if (totalRows === 0) {
    return null;
  }

  if (key === 'ArrowUp') {
    if (currentIndex === null) {
      return null;
    }
    return Platform.NumberUtilities.clamp(
        currentIndex - 1,
        0,
        totalRows - 1,
    );
  }

  if (currentIndex === null) {
    return 0;
  }
  return Platform.NumberUtilities.clamp(
      currentIndex + 1,
      0,
      totalRows - 1,
  );
}

export function getRowEntryForColumnId(row: Row, id: string): RowEntry {
  const rowEntry = row.cells.find(r => r.columnId === id);
  if (rowEntry === undefined) {
    throw new Error(`Found a row that was missing an entry for column ${id}.`);
  }

  return rowEntry;
}

export function calculateColumnWidth(allColumns: ReadonlyArray<Column>, columnId: string): number {
  const matchingColumn = allColumns.find(c => c.id === columnId);
  if (!matchingColumn) {
    throw new Error(`Could not find column with ID ${columnId}`);
  }

  if (matchingColumn.width) {
    return matchingColumn.width;
  }

  const widthTaken = allColumns.filter(c => c.width).reduce((a, b) => a + (b.width || 0), 0);
  const remainingWidth = 100 - widthTaken;
  const columnsForRemaining = allColumns.filter(c => !c.width).length;

  return remainingWidth / columnsForRemaining;
}

export class RowSelectedEvent extends Event {
  data: Row

  constructor(row: Row) {
    super('data-grid-row-selected');
    this.data = row;
  }
}
