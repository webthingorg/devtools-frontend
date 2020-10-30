// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
export interface Column {
  id: string;
  title: string;
  sortable?: boolean;
  widthWeighting: number;
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

export function calculateColumnWidthPercentageFromWeighting(
    allColumns: ReadonlyArray<Column>, columnId: string): number {
  const totalWeights =
      allColumns.filter(c => !c.hidden).reduce((sumOfWeights, col) => sumOfWeights + col.widthWeighting, 0);
  const matchingColumn = allColumns.find(c => c.id === columnId);
  if (!matchingColumn) {
    throw new Error(`Could not find column with ID ${columnId}`);
  }
  if (matchingColumn.widthWeighting < 1) {
    throw new Error(`Error with column ${columnId}: width weightings must be >= 1.`);
  }
  if (matchingColumn.hidden) {
    return 0;
  }

  return Math.round((matchingColumn.widthWeighting / totalWeights) * 100);
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
      const firstVisibleColumnIndex = columns.findIndex(c => !c.hidden);
      if (selectedColIndex === firstVisibleColumnIndex) {
        // User is as far left as they can go, so don't move them.
        return [selectedColIndex, selectedRowIndex];
      }

      // Set the next index to first be the column we are already on, and then
      // iterate back through all columns to our left, breaking the loop if we
      // find one that's not hidden. If we don't find one, we'll stay where we
      // are.
      let nextColIndex = selectedColIndex;
      for (let i = nextColIndex - 1; i >= 0; i--) {
        const col = columns[i];
        if (!col.hidden) {
          nextColIndex = i;
          break;
        }
      }

      return [nextColIndex, selectedRowIndex];
    }

    case 'ArrowRight': {
      // Set the next index to first be the column we are already on, and then
      // iterate through all columns to our right, breaking the loop if we
      // find one that's not hidden. If we don't find one, we'll stay where we
      // are.
      let nextColIndex = selectedColIndex;
      for (let i = nextColIndex + 1; i < columns.length; i++) {
        const col = columns[i];
        if (!col.hidden) {
          nextColIndex = i;
          break;
        }
      }

      return [nextColIndex, selectedRowIndex];
    }

    case 'ArrowUp': {
      const columnsSortable = columns.some(col => col.sortable === true);
      const minRowIndex = columnsSortable ? 0 : 1;
      if (selectedRowIndex === minRowIndex) {
        // If any columns are sortable the user can navigate into the column
        // header row, else they cannot. So if they are on the highest row they
        // can be, just return the current cell as they cannot move up.
        return [selectedColIndex, selectedRowIndex];
      }

      let rowIndexToMoveTo = selectedRowIndex;

      for (let i = selectedRowIndex - 1; i >= minRowIndex; i--) {
        // This means we got past all the body rows and therefore the user needs
        // to go into the column row.
        if (i === 0) {
          rowIndexToMoveTo = 0;
          break;
        }
        const matchingRow = rows[i - 1];
        if (!matchingRow.hidden) {
          rowIndexToMoveTo = i;
          break;
        }
      }

      return [selectedColIndex, rowIndexToMoveTo];
    }

    case 'ArrowDown': {
      if (selectedRowIndex === 0) {
        // The user is on the column header. So find the first visible body row and take them there!
        const firstVisibleBodyRowIndex = rows.findIndex(row => !row.hidden);
        if (firstVisibleBodyRowIndex > -1) {
          return [selectedColIndex, firstVisibleBodyRowIndex + 1];
        }
        // If we didn't find a single visible row, leave the user where they are.
        return [selectedColIndex, selectedRowIndex];
      }

      let rowIndexToMoveTo = selectedRowIndex;
      // Work down from our starting position to find the next visible row to move to.
      for (let i = rowIndexToMoveTo + 1; i < rows.length + 1; i++) {
        const matchingRow = rows[i - 1];
        if (!matchingRow.hidden) {
          rowIndexToMoveTo = i;
          break;
        }
      }

      return [selectedColIndex, rowIndexToMoveTo];
    }
  }
}
