// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
export interface Column {
  id: string;
  title: string;
  sortable?: boolean;
  width?: number;
  hidden?: boolean;
}

export interface Cell {
  columnId: string;
  value: string;
}


export type Row = {
  cells: Cell[];
  hidden?: boolean;
}

export const enum SortDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

export interface SortState {
  columnId: string;
  direction: SortDirection;
}

export function getRowEntryForColumnId(row: Row, id: string): Cell {
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

  const widthTaken = allColumns.filter(c => c.width && !c.hidden).reduce((a, b) => a + (b.width || 0), 0);
  const remainingWidth = 100 - widthTaken;
  const columnsForRemaining = allColumns.filter(c => !c.width).length;

  return remainingWidth / columnsForRemaining;
}
