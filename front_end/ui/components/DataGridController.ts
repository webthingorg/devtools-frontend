// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import './DataGrid.js';

import * as LitHtml from '../../third_party/lit-html/lit-html.js';

import type {DataGridData, RowClickEvent, TableKeyDownEvent, ColumnHeaderClickEvent} from './DataGrid.js';

import {Column, nextRowIndex, Row, getRowEntryForColumnId} from './DataGridUtils.js';

export interface DataGridControllerData {
  columns: Column[];
  rows: Row[];
  filterText?: string;
}

type SortDirection = 'ASC'|'DESC';

interface SortState {
  columnId: string;
  direction: SortDirection;
}

export class DataGridController extends HTMLElement {
  private readonly shadow = this.attachShadow({mode: 'open'});

  /**
   * We store the data but also the original, because when we sort we sort in
   * place. So we store the original data too so we always have a non-mutated
   * copy.
   */
  private columns: ReadonlyArray<Column> = [];
  private rows: Row[] = [];
  private originalColumns: ReadonlyArray<Column> = [];
  private originalRows: Row[] = [];

  private selectedRowIndex: number|null = null;
  private sortState: Readonly<SortState>|null = null;
  private filterText?: string;

  get data(): DataGridControllerData {
    return {
      columns: this.originalColumns as Column[],
      rows: this.originalRows as Row[],
    };
  }

  set data(data: DataGridControllerData) {
    this.originalColumns = data.columns;
    this.originalRows = data.rows;
    this.filterText = data.filterText;

    this.columns = [...this.originalColumns];
    this.rows = this.cloneAndFilterRows(data.rows, data.columns, this.filterText);
    this.update();
  }

  private update() {
    this.render();
  }

  private cloneAndFilterRows(rows: Row[], columns: Column[], filterText?: string): Row[] {
    if (!filterText) {
      return [...rows];
    }

    const filterTextIsColumnValue = /(.+):(.+)/.test(filterText);
    const [filterColumn, filterValue] = filterText.split(':');
    if (filterTextIsColumnValue) {
      // find the ID of the column that we want to filter on
      const column = columns.find(col => col.title.toLowerCase() === filterColumn.toLowerCase());
      if (!column) {
        // If we couldn't find a column, the filter is invalid, so let's return nothing.
        return [];
      }

      return this.filterRowsByColumnValue(rows, column, filterValue);
    }

    // Plain text search across all columns.
    return rows.filter(row => {
      const rowHasMatchingValue = row.some(rowEntry => {
        return rowEntry.value.toLowerCase().includes(filterText.toLowerCase());
      });

      return rowHasMatchingValue;
    });
  }

  private filterRowsByColumnValue(rows: Row[], column: Column, value: string): Row[] {
    return rows.filter(row => {
      const entryForColumn = getRowEntryForColumnId(row, column.id);
      return entryForColumn && entryForColumn.value.toLowerCase().includes(value.toLowerCase());
    });
  }

  // TODO: when the table is focused, should the first row get selected?
  private onTableKeyDown(event: TableKeyDownEvent) {
    const key = event.data.key;
    const arrowKeys = new Set(['ArrowDown', 'ArrowUp']);
    if (!arrowKeys.has(key)) {
      return;
    }

    const nextIndex = nextRowIndex(
        this.rows.length,
        this.selectedRowIndex,
        key as 'ArrowDown' | 'ArrowUp',
    );
    this.selectedRowIndex = nextIndex;
    this.render();
  }

  private onRowClick(event: RowClickEvent) {
    this.selectedRowIndex = event.data.rowIndex;
    this.render();
  }

  private sortRows(state: SortState) {
    const {columnId, direction} = state;

    this.rows.sort((row1, row2) => {
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
    this.render();
  }

  private onColumnHeaderClick(event: ColumnHeaderClickEvent) {
    const {column} = event.data;
    if (this.sortState && this.sortState.columnId === column.id) {
      const {columnId, direction} = this.sortState;

      /* When users sort, we go No Sort => ASC => DESC => No sort
       * So if the current direction is DESC, we clear the state.
       */
      if (direction === 'DESC') {
        this.sortState = null;
      } else {
        /* The state is ASC, so toggle to DESC */
        this.sortState = {
          columnId,
          direction: 'DESC',
        };
      }
    } else {
      /* The column wasn't previously sorted, so we sort it in ASC order. */
      this.sortState = {
        columnId: column.id,
        direction: 'ASC',
      };
    }

    if (this.sortState) {
      this.sortRows(this.sortState);
    } else {
      // No sortstate = render the original rows.
      this.rows = [...this.originalRows];
      this.render();
    }
  }

  private render() {
    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
    LitHtml.render(LitHtml.html`
      <style>
        :host {
          display: block;
          height: 100%;
          overflow: hidden;
        }
      </style>
      <devtools-data-grid .data=${{
          columns: this.columns,
          rows: this.rows,
          selectedRowIndex: this.selectedRowIndex,
        } as DataGridData}
        @rowClick=${this.onRowClick}
        @tableKeyDown=${this.onTableKeyDown}
        @columnHeaderClick=${this.onColumnHeaderClick}
      ></devtools-data-grid>
    `, this.shadow, {
      eventContext: this,
    });
    // clang-format on
  }
}

customElements.define('devtools-data-grid-controller', DataGridController);

declare global {
  interface HTMLElementTagNameMap {
    'devtools-data-grid-controller': DataGridController;
  }
}
