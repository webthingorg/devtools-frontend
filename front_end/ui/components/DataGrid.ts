// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as LitHtml from '../../third_party/lit-html/lit-html.js';

import {calculateColumnWidth, Column, getRowEntryForColumnId, Row, SortState} from './DataGridUtils.js';

export interface DataGridData {
  columns: Column[];
  rows: Row[];
  activeSort: SortState|null;
}

export class ColumnHeaderClickEvent extends Event {
  data: {
    column: Column,
    columnIndex: number,
  }

  constructor(column: Column, columnIndex: number) {
    super('columnHeaderClick');
    this.data = {
      column,
      columnIndex,
    };
  }
}

export class TableKeyDownEvent extends Event {
  data: KeyboardEvent;
  constructor(keyEvent: KeyboardEvent) {
    super('tableKeyDown');
    this.data = keyEvent;
  }
}

export class DataGrid extends HTMLElement {
  private readonly shadow = this.attachShadow({mode: 'open'});
  private columns: ReadonlyArray<Column> = [];
  private rows: ReadonlyArray<Row> = [];
  private sortState: Readonly<SortState>|null = null;
  /**
   * Following guidance from
   * https://www.w3.org/TR/wai-aria-practices/examples/grid/dataGrids.html, we
   * allow a single cell inside the table to be focusable, such that when a user
   * tabs in they select that cell. IMPORTANT: if the data-grid has sortable
   * columns, the user has to be able to navigate to the headers to toggle the
   * sort. [0,0] is considered the first cell INCLUDING the column header
   * Therefore if a user is on the first header cell, the position is considerd [0, -0],
   * and if a user is on the first body cell, the position is considerd [0, 1].
   *
   * We set the selectable cell to the first tbody value by default, but then on the
   * first render if any of the columns are sortable we'll set the active cell
   * to [0, 0].
   */
  private focusableCell: readonly[number, number] = [0, 1] as const;
  private hasRenderedAtLeastOnce = false;

  get data(): DataGridData {
    return {
      columns: this.columns as Column[],
      rows: this.rows as Row[],
      activeSort: this.sortState,
    };
  }
  set data(data: DataGridData) {
    this.columns = data.columns;
    this.rows = data.rows;
    this.sortState = data.activeSort;

    /**
     * On first render, now we have data, we can figure out which cell is the
     * focusable cell for the table.
     *
     * If any columns are sortable, we pick [0, 0], which is the first cell of
     * the columns row. However, if any columns are hidden, we adjust
     * accordingly. e.g., if the first column is hidden, we'll set the starting
     * index as [1, 0].
     *
     * If the columns aren't sortable, we pick the first visible body row as the
     * index.
     */
    const someColumnsSortable = this.columns.some(col => col.sortable === true);
    const focusableRowIndex = someColumnsSortable ? 0 : this.rows.findIndex(row => !row.hidden) + 1;
    const focusableColIndex = this.columns.findIndex(col => !col.hidden);

    this.focusableCell = [focusableColIndex, focusableRowIndex];
    this.render();
  }


  private scrollToBottomIfRequired() {
    if (this.hasRenderedAtLeastOnce === false) {
      // On the first render we don't want to assume the user wants to scroll to the bottom;
      return;
    }

    const focusableCell = this.getCurrentlyFocusableCell();
    if (focusableCell && focusableCell.hasFocus()) {
      // The user has a cell (and indirectly, a row) selected so we don't want
      // to mess with their scroll
      return;
    }

    const lastVisibleRow = this.shadow.querySelector('tbody tr:not(.hidden):last-child');
    if (lastVisibleRow) {
      lastVisibleRow.scrollIntoView();
    }
  }

  private getCurrentlyFocusableCell() {
    const [columnIndex, rowIndex] = this.focusableCell;
    const cell = this.shadow.querySelector<HTMLTableCellElement>(
        `[data-row-index="${rowIndex}"][data-col-index="${columnIndex}"]`);
    return cell;
  }
  private focusCell(columnIndex: number, rowIndex: number) {
    this.focusableCell = [columnIndex, rowIndex];
    this.render();
    const cellElement = this.getCurrentlyFocusableCell();
    if (!cellElement) {
      throw new Error('Unexpected error: could not find cell marked as focusable');
    }
    /* The cell may already be focused if the user clicked into it, but we also
     * add arrow key support, so in the case where we're programatically moving the
     * focus, ensure we actually focus the cell.
     */
    if (!cellElement.hasFocus()) {
      cellElement.focus();
    }
  }

  private onTableKeyDown(event: KeyboardEvent) {
    const key = event.key;

    const keysThatAreTreatedAsClicks = new Set([' ', 'Enter']);

    if (keysThatAreTreatedAsClicks.has(key)) {
      const focusedCell = this.getCurrentlyFocusableCell();
      const [focusedColumnIndex, focusedRowIndex] = this.focusableCell;
      const activeColumn = this.columns[focusedColumnIndex];
      const keyIsClickEquivalent = key === 'Enter' || key === ' ';
      if (keyIsClickEquivalent && focusedCell && focusedRowIndex === 0 && activeColumn && activeColumn.sortable) {
        this.onColumnHeaderClick(activeColumn, focusedColumnIndex);
      }
    }

    const arrowKeys = new Set(['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight']);
    if (!arrowKeys.has(key)) {
      return;
    }

    const [selectedColIndex, selectedRowIndex] = this.focusableCell;

    if (key === 'ArrowLeft') {
      let newColumnIndex = Math.max(selectedColIndex - 1, 0);
      while (newColumnIndex > 0) {
        const columnToLeft = this.columns[newColumnIndex];
        if (columnToLeft && !columnToLeft.hidden) {
          break;
        }
        newColumnIndex--;
      }
      this.focusCell(newColumnIndex, selectedRowIndex);
    } else if (key === 'ArrowRight') {
      let newColumnIndex = Math.min(selectedColIndex + 1, this.columns.length - 1);
      while (newColumnIndex < this.columns.length) {
        const columnToRight = this.columns[newColumnIndex];
        if (columnToRight && !columnToRight.hidden) {
          break;
        }
        newColumnIndex++;
      }
      if (newColumnIndex === this.columns.length) {
        return;
      }
      this.focusCell(newColumnIndex, selectedRowIndex);
    } else if (key === 'ArrowUp') {
      let newRowIndex = selectedRowIndex - 1;
      while (newRowIndex > 0) {
        const rowAbove = this.rows[newRowIndex];
        if (rowAbove && !rowAbove.hidden) {
          break;
        }
        newRowIndex--;
      }
      // If any columns are sortable the user can navigate into the column
      // header row, else they cannot.
      const minRowIndex = this.columns.some(col => col.sortable === true) ? 0 : 1;
      newRowIndex = Math.max(newRowIndex, minRowIndex);
      this.focusCell(selectedColIndex, newRowIndex);

    } else if (key === 'ArrowDown') {
      // We start at selectedRowIndex because we have the columns which are considered row 0. So if the user is on 0, we check for this.rows[0] which would take them into the first row of the body.
      let newRowIndexIncludingColumnRow = selectedRowIndex + 1;
      while (newRowIndexIncludingColumnRow < this.rows.length) {
        // Subtract one because this.rows contains only the body rows.
        const rowBelow = this.rows[newRowIndexIncludingColumnRow - 1];
        if (rowBelow && !rowBelow.hidden) {
          break;
        }
        newRowIndexIncludingColumnRow++;
      }
      if (newRowIndexIncludingColumnRow === this.rows.length + 1) {
        // User is on the very last row.
        return;
      }
      this.focusCell(selectedColIndex, newRowIndexIncludingColumnRow);
    }

    this.render();
  }

  private onColumnHeaderClick(col: Column, index: number) {
    this.dispatchEvent(new ColumnHeaderClickEvent(col, index));
  }

  /**
   * Applies the aria-sort label to a column's th.
   * Guidance on values of attribute taken from
   * https://www.w3.org/TR/wai-aria-practices/examples/grid/dataGrids.html.
   */
  private ariaSortForHeader(col: Column) {
    if (col.sortable && (!this.sortState || this.sortState.columnId !== col.id)) {
      // Column is sortable but is not currently sorted
      return 'none';
    }

    if (this.sortState && this.sortState.columnId === col.id) {
      return this.sortState.direction === 'ASC' ? 'ascending' : 'descending';
    }

    // Column is not sortable, so don't apply any label
    return undefined;
  }

  private render() {
    const indexOfFirstVisibleColumn = this.columns.findIndex(col => !col.hidden);
    const anyColumnsSortable = this.columns.some(col => col.sortable === true);
    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
    LitHtml.render(LitHtml.html`
    <style>
      :host {
        --table-divider-color: #aaa;
        --toolbar-bg-color: #f3f3f3;
        --selected-row-color: rgb(212, 212, 212);
        --selection-bg-color: #1a73e8;

        height: 100%;
        display: block;
      }
      /* Ensure that vertically we don't overflow */
      .wrapping-container {
        overflow-y: scroll;
        /* Use max-height instead of height to ensure that the
           table does not use more space than necessary. */
        height: 100%;
        position: relative;
      }

      table {
        border-spacing: 0;
        width: 100%;
        /* To make sure that we properly hide overflowing text
           when horizontal space is too narrow. */
        table-layout: fixed;
      }

      tr {
        outline: none;
      }


      tbody tr.selected {
        background-color: var(--selected-row-color);
      }

      table:focus tr.selected {
        background-color: var(--selection-bg-color)
      }

      td, th {
        padding: 1px 4px;
        /* Divider between each cell, except the first one (see below) */
        border-left: 1px solid var(--table-divider-color);
        line-height: 18px;
        height: 18px;
        user-select: text;
        /* Ensure that text properly cuts off if horizontal space is too narrow */
        white-space: nowrap;
        text-overflow: ellipsis;
      }
      /* There is no divider before the first cell */
      td.firstVisibleColumn, th.firstVisibleColumn {
        border-left: none;
      }

      th {
        font-weight: normal;
        text-align: left;
        border-bottom: 1px solid var(--table-divider-color);
        position: sticky;
        top: 0;
        z-index: 2;
        background-color: var(--toolbar-bg-color);
      }

      .hidden {
        display: none;
      }

      [aria-sort] {
        position: relative;
      }
      [aria-sort]:hover {
        cursor: pointer;
      }

      [aria-sort="descending"]::after {
        content: " ";
        border-left: 0.4em solid transparent;
        border-right: 0.4em solid transparent;
        border-top: 0.4em solid black;
        position: absolute;
        right: 1em;
        top: 0.8em;
      }
      [aria-sort="ascending"]::after {
        content: " ";
        border-bottom: 0.4em solid black;
        border-left: 0.4em solid transparent;
        border-right: 0.4em solid transparent;
        position: absolute;
        right: 1em;
        top: 0.8em;
      }
    </style>
    <div class="wrapping-container">
      <table
        aria-rowcount=${this.rows.length}
        aria-colcount=${this.columns.length}
        @keydown=${this.onTableKeyDown}
      >
        <colgroup>
          ${this.columns.filter(col => !col.hidden).map(col => {
            const width = calculateColumnWidth(this.columns, col.id);
            const style = `width: ${width}%`;
            return LitHtml.html`<col style=${style}>`;
          })}
        </colgroup>
        <thead>
          <tr>
            ${this.columns.map((col, columnIndex) => {
              const thClasses = LitHtml.Directives.classMap({
                hidden: col.hidden === true,
                firstVisibleColumn: columnIndex === indexOfFirstVisibleColumn,
              });
                const cellIsFocusableCell = anyColumnsSortable && columnIndex === this.focusableCell[0] && this.focusableCell[1] === 0;

              return LitHtml.html`<th class=${thClasses}
                data-grid-header-cell=${col.id}
                @click=${() => {
                  this.focusCell(columnIndex, 0);
                  this.onColumnHeaderClick(col, columnIndex);
                }}
                aria-sort=${LitHtml.Directives.ifDefined(this.ariaSortForHeader(col))}
                aria-colindex=${columnIndex + 1}
                data-row-index='0'
                data-col-index=${columnIndex}
                tabindex=${LitHtml.Directives.ifDefined(anyColumnsSortable ? (cellIsFocusableCell ? '0' : '-1') : undefined)}
                }}
              >${col.title}</th>`;
            })}
          </tr>
        </thead>
        <tbody>
          ${this.rows.map((row, rowIndex) => {
            // TODO: use the lit-html repeat directive?
            // but if we do, what's the key for each row that's guaranteed to be unique? As two rows could have duplicate values. Should we take an ID column?

            const focusableCell = this.getCurrentlyFocusableCell();
            const [,focusableCellRowIndex] = this.focusableCell;

            // Remember that row 0 is considered the header row, so the first tbody row is row 1.
            const tableRowIndex = rowIndex + 1;

            // Have to check for focusableCell existing as this runs on the
            // first render before it's ever been created.
            const rowIsSelected = focusableCell ? focusableCell.hasFocus() && tableRowIndex === focusableCellRowIndex : false;

            const rowClasses = LitHtml.Directives.classMap({
              selected: rowIsSelected,
              hidden: row.hidden === true,
            });
            return LitHtml.html`
              <tr
                aria-rowindex=${rowIndex + 1}
                class=${rowClasses}
              >${this.columns.map((col, columnIndex) => {
                const entryForRow = getRowEntryForColumnId(row, col.id);
                const cellClasses = LitHtml.Directives.classMap({
                  hidden: col.hidden === true,
                  firstVisibleColumn: columnIndex === indexOfFirstVisibleColumn,
                });
                const cellIsFocusableCell = columnIndex === this.focusableCell[0] && tableRowIndex === this.focusableCell[1];
                return LitHtml.html`<td
                  class=${cellClasses}
                  tabindex=${cellIsFocusableCell ? '0' : '-1'}
                  aria-colindex=${columnIndex + 1}
                  data-row-index=${tableRowIndex}
                  data-col-index=${columnIndex}
                  data-grid-value-cell-for-column=${col.id}
                  @click=${() => {
                    this.focusCell(columnIndex, tableRowIndex);
                  }}
                >${entryForRow.value}</td>`;
              })}
            `;
          })}
        </tbody>
      </table>
    </div>
    `, this.shadow, {
      eventContext: this,
    });
    // clang-format on

    this.scrollToBottomIfRequired();
    this.hasRenderedAtLeastOnce = true;
  }
}

customElements.define('devtools-data-grid', DataGrid);

declare global {
  interface HTMLElementTagNameMap {
    'devtools-data-grid': DataGrid;
  }
}
