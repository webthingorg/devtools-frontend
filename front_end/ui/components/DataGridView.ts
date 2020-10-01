// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import {Column, getRowEntryForColumnId, Row} from './DataGridUtils.js';

export type SortDirection = 'ASC'|'DESC'

const sortRowsAlphabetically = (rows: Row[], columnId: string, direction: SortDirection): Row[] => {
  return rows.slice().sort((row1, row2) => {
    const row1Entry = getRowEntryForColumnId(row1, columnId);
    const row2Entry = getRowEntryForColumnId(row2, columnId);

    const value1 = row1Entry.value.toUpperCase();
    const value2 = row2Entry.value.toUpperCase();
    if (value1 < value2) {
      return direction === 'ASC' ? -1 : 1;
    }
    if (value1 > value2) {
      return direction === 'ASC' ? 1 : -1;
    }
    return 0;
  });
};

interface SortState {
  columnId: string, direction: SortDirection
}

export class DataGridView {
  private allRows: Row[] = [];
  private allColumns: Column[] = [];
  private sortState: Readonly<SortState>|null = null;
  private sortCache = new WeakMap<SortState, WeakMap<Row[], Row[]>>();

  updateData(data: {rows: Row[], columns: Column[]}) {
    this.allRows = data.rows;
    this.allColumns = data.columns;
    // TODO: if the column we were sorting by has gone, clear the sort
  }

  get data() {
    return {
      columns: this.allColumns,
      rows: this.allRows,
    };
  }

  sortByColumn(column: Column) {
    if (this.sortState && this.sortState.columnId === column.id) {
      const {columnId, direction} = this.sortState;

      if (direction === 'DESC') {
        this.sortState = null;
      } else {
        this.sortState = {
          columnId,
          direction: 'DESC',
        };
      }
    } else {
      this.sortState = {
        columnId: column.id,
        direction: 'ASC',
      };
    }
  }

  columns(): Column[] {
    // Long term this would return a filtered set when we allow for
    // hiding/showing of columns
    return this.allColumns;
  }

  /**
   * Returns the visible rows, after they have been sorted.
   * Caches on the sort state and on this.allRows;
   */
  rows(): Row[] {
    if (this.sortState === null) {
      return this.allRows;
    }

    const cachedSortsForState = this.sortCache.get(this.sortState) || new WeakMap();
    const rowsCache = cachedSortsForState.get(this.allRows);
    if (rowsCache) {
      return rowsCache;
    }

    const {columnId, direction} = this.sortState;

    const sortedRows = sortRowsAlphabetically(this.allRows, columnId, direction);

    cachedSortsForState.set(this.allRows, sortedRows);
    this.sortCache.set(this.sortState, cachedSortsForState);

    return sortedRows;
  }
}
