// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as LitHtml from '../../third_party/lit-html/lit-html.js';

import {calculateColumnWidth, Column, getRowEntryForColumnId, Row, SortState} from './DataGridUtils.js';

export interface DataGridData {
  columns: Column[];
  rows: Row[];
  selectedRowIndex: number|null;
  activeSort: SortState|null;
}

export class RowClickEvent extends Event {
  data: {
    row: Row,
    rowIndex: number,
  }

  constructor(row: Row, rowIndex: number) {
    super('rowClick');
    this.data = {
      row,
      rowIndex,
    };
  }
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
  private selectedRowIndex: number|null = null;
  private hasRenderedAtLeastOnce = false;

  get data(): DataGridData {
    return {
      columns: this.columns as Column[],
      rows: this.rows as Row[],
      selectedRowIndex: this.selectedRowIndex,
      activeSort: this.sortState,
    };
  }
  set data(data: DataGridData) {
    this.columns = data.columns;
    this.rows = data.rows;
    this.sortState = data.activeSort;
    this.selectedRowIndex = data.selectedRowIndex;
    this.render();
  }


  private scrollToBottomIfRequired() {
    if (this.selectedRowIndex !== null || this.hasRenderedAtLeastOnce === false) {
      // The user has a row selected so we don't want to mess with their scroll
      // On the first render we don't want to assume the user wants to scroll to the bottom;
      return;
    }

    const lastRow = this.shadow.querySelector(`[aria-rowindex="${this.rows.length}"]`);
    // TODO: what if the newly added row isn't being rendered because of a filter?
    if (lastRow) {
      lastRow.scrollIntoView();
    }
  }

  private onRowClick(row: Row, rowIndex: number) {
    this.dispatchEvent(new RowClickEvent(row, rowIndex));
    // Focus the table when the user clicks in
    const table = this.shadow.querySelector('table');
    if (table && !table.hasFocus()) {
      table.focus();
    }
  }

  // TODO: when the table is focused, should the first row get selected?
  private onTableKeyDown(event: KeyboardEvent) {
    this.dispatchEvent(new TableKeyDownEvent(event));
  }

  private onColumnHeaderClick(col: Column, index: number) {
    return () => {
      this.dispatchEvent(new ColumnHeaderClickEvent(col, index));
    };
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
    return '';
  }

  private render() {
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
        /* overflow: hidden; */
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
      td:first-child, th:first-child {
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
    </style>
    <div class="wrapping-container">
      <table
        tabindex="0"
        @keydown=${this.onTableKeyDown}
      >
        <colgroup>
          ${this.columns.map(col => {
            const width = calculateColumnWidth(this.columns, col.id);
            const style = `width: ${width}%`;
            return LitHtml.html`<col style=${style}>`;
          })}
        </colgroup>
        <thead>
          <tr>
            ${this.columns.map((col, index) => {
              return LitHtml.html`<th data-grid-header-cell=${col.id} @click=${this.onColumnHeaderClick(col, index)} aria-sort=${this.ariaSortForHeader(col)} aria-colindex=${index + 1}>${col.title}</th>`;
            })}
          </tr>
        </thead>
        <tbody>
          ${this.rows.map((row, index) => {
            // TODO: use the lit-html repeat directive?
            // but if we do, what's the key for each row that's guaranteed to be unique? As two rows could have duplicate values. Should we take an ID column?

            const rowClasses = LitHtml.Directives.classMap({
              selected: this.selectedRowIndex === index,
              hidden: row.hidden === true,
            });
            return LitHtml.html`
              <tr
                aria-rowindex=${index + 1}
                ?data-grid-row-selected=${this.selectedRowIndex === index}
                class=${rowClasses}
                @click=${() => this.onRowClick(row, index)}
              >${this.columns.map((col, index) => {
                const entryForRow = getRowEntryForColumnId(row, col.id);
                return LitHtml.html`<td aria-colindex=${index + 1} data-grid-value-cell-for-column=${col.id}>${entryForRow.value}</td>`;
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
