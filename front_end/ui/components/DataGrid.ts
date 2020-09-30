// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as LitHtml from '../../third_party/lit-html/lit-html.js';

import {calculateColumnWidth, Column, getRowEntryForColumnId, nextRowIndex, Row, RowSelectedEvent} from './DataGridUtils.js';
import {DataGridView} from './DataGridView.js';

export interface DataGridData {
  columns: Column[], rows: Row[],
}

export class DataGrid extends HTMLElement {
  private readonly shadow = this.attachShadow({mode: 'open'});
  private hasRenderedAtLeastOnce = false;
  private selectedRowIndex: number|null = null;
  private viewer = new DataGridView();

  get data(): DataGridData {
    return this.viewer.data;
  }

  set data(data: DataGridData) {
    this.viewer.updateData(data);
    this.update();
  }


  private update() {
    this.render();
    this.scrollToBottomIfRequired();
    this.hasRenderedAtLeastOnce = true;
  }

  private scrollToBottomIfRequired() {
    if (this.selectedRowIndex !== null || this.hasRenderedAtLeastOnce === false) {
      // The user has a row selected so we don't want to mess with their scroll
      // On the first render we don't want to assume the user wants to scroll to the bottom;
      return;
    }

    const lastRow = this.shadow.querySelector(`[data-grid-row="${this.viewer.rows().length - 1}"]`);
    // TODO: what if the newly added row isn't being rendered because of a filter?
    if (lastRow) {
      lastRow.scrollIntoView();
    }
  }

  private onColumnSort(column: Column) {
    return () => {
      this.viewer.sortByColumn(column);
      this.update();
    };
  }

  private onRowClick(row: Row, rowIndex: number) {
    return (_event: Event) => {
      if (rowIndex === this.selectedRowIndex) {
        return;
      }

      this.selectedRowIndex = rowIndex;
      // Focus the table when the user clicks in
      const table = this.shadow.querySelector('table');
      if (table && !table.hasFocus()) {
        table.focus();
      }

      this.update();
      this.dispatchEvent(new RowSelectedEvent(row));
    };
  }

  // TODO: when the table is focused, should the first row get selected?
  private onTableKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      const nextIndex = nextRowIndex(
          this.viewer.rows().length,
          this.selectedRowIndex,
          event.key,
      );
      this.selectedRowIndex = nextIndex;
    }
    this.update();
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
        max-height: 100%;
        overflow-y: auto;
      }
      /* Ensure that vertically we don't overflow */
      .wrapping-container {
        overflow-y: auto;
        /* Use max-height instead of height to ensure that the
           table does not use more space than necessary. */
        max-height: 100%;
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
    </style>
    <div class="wrapping-container">
      <table
        tabindex="0"
        @keydown=${this.onTableKeyDown}
      >
        <colgroup>
          ${this.viewer.columns().map(col => {
            const width = calculateColumnWidth(this.viewer.columns(), col.id);
            const style = `width: ${width}%`;
            return LitHtml.html`<col style=${style}>`;
          })}
        </colgroup>
        <thead>
          <tr>
            ${this.viewer.columns().map(col => {
              return LitHtml.html`<th data-grid-header-cell=${col.id} @click=${col.sortable ? this.onColumnSort(col) : null}>${col.title}</th>`;
            })}
          </tr>
        </thead>
        <tbody>
          ${this.viewer.rows().map((row, index) => {
            // TODO: use the lit-html repeat directive?
            // but if we do, what's the key for each row that's guaranteed to be unique? As two rows could have duplicate values. Should we take an ID column?

            const rowClasses = LitHtml.Directives.classMap({
              selected: this.selectedRowIndex === index,
            });
            return LitHtml.html`
              <tr
                data-grid-row=${index}
                class=${rowClasses}
                @click=${this.onRowClick(row, index)}
              >${this.viewer.columns().map(col => {
                const entryForRow = getRowEntryForColumnId(row, col.id);
                return LitHtml.html`<td data-grid-value-cell-for-column=${col.id}>${entryForRow.value}</td>`;
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
  }
}

customElements.define('devtools-data-grid', DataGrid);

declare global {
  interface HTMLElementTagNameMap {
    'devtools-data-grid': DataGrid;
  }
}
