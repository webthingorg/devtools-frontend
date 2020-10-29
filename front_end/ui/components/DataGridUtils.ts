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

export interface HandleArrowKeyOptions {
  key: 'ArrowLeft'|'ArrowRight'|'ArrowUp'|'ArrowDown', currentFocusedCell: readonly[number, number],
      columns: readonly Column[], rows: readonly Row[],
}

export function handleArrowKeyNavigation(options: HandleArrowKeyOptions): readonly[number, number] {
  const {key, currentFocusedCell, columns, rows} = options;
  const [selectedColIndex, selectedRowIndex] = currentFocusedCell;

  switch (key) {
    case 'ArrowLeft': {
      let newColumnIndex = Math.max(selectedColIndex - 1, 0);
      while (newColumnIndex > 0) {
        const columnToLeft = columns[newColumnIndex];
        if (columnToLeft && !columnToLeft.hidden) {
          break;
        }
        newColumnIndex--;
      }
      return [newColumnIndex, selectedRowIndex];
    }

    case 'ArrowRight': {
      let newColumnIndex = selectedColIndex + 1;
      while (newColumnIndex < columns.length) {
        const columnToRight = columns[newColumnIndex];
        if (columnToRight && !columnToRight.hidden) {
          break;
        }
        newColumnIndex++;
      }
      // User is at the far right col, so stay where they are.
      if (newColumnIndex === columns.length) {
        return currentFocusedCell;
      }

      return [newColumnIndex, selectedRowIndex];
    }

    case 'ArrowUp': {
      let newRowIndex = selectedRowIndex - 1;
      while (newRowIndex > 0) {
        // -1 to account for the column row being index 0
        const rowAbove = rows[newRowIndex - 1];
        if (rowAbove && !rowAbove.hidden) {
          break;
        }
        newRowIndex--;
      }
      // If any columns are sortable the user can navigate into the column
      // header row, else they cannot. So if by this point we ended up at
      // newRowIndex === 0, but the columns aren't sortable, we leave the user
      // at row 1.
      const columnsSortable = columns.some(col => col.sortable === true);
      const minRowIndex = columnsSortable ? 0 : 1;
      newRowIndex = Math.max(newRowIndex, minRowIndex);
      return [selectedColIndex, newRowIndex];
    }

    case 'ArrowDown': {
      /**
       * ArrowDown is the most complex case because we index the column headers
       * row as 0, and the first body row as 1. So if the user is on index 0,
       * and needs to move to index 1, we check rows[0], because rows[0] is the
       * first body row, hence the - 1.
       */
      let newRowIndexIncludingColumnRow = selectedRowIndex + 1;
      while (newRowIndexIncludingColumnRow < rows.length) {
        const rowBelow = rows[newRowIndexIncludingColumnRow - 1];
        if (rowBelow && !rowBelow.hidden) {
          break;
        }
        newRowIndexIncludingColumnRow++;
      }
      if (newRowIndexIncludingColumnRow === rows.length + 1) {
        // User is on the very last row.
        return currentFocusedCell;
      }

      return [selectedColIndex, newRowIndexIncludingColumnRow];
    }
  }

  { return [0, 0]; }
}
