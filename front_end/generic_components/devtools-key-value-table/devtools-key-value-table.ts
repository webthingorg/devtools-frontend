// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {html, render} from '../../third_party/lit-html/package/lit-html.js';

class DevToolsKeyValueTable extends HTMLElement {
  private editing = false;
  private readonly root = this.attachShadow({mode: 'open'});

  public set data({mapping}: {mapping: Array<{key: string, value: string}>}) {
    this.editing = false;

    render(
        html`
    <style>
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
        overflow: hidden;
      }

      tr {
        outline: none;
      }

      td {
        padding: 1px 4px;
        /* Divider between each cell, except the first one (see below) */
        border-left: var(--table-divider-color);
        line-height: 18px;
        height: 18px;
        user-select: text;
        /* Ensure that text properly cuts off if horizontal space is too narrow */
        white-space: nowrap;
        text-overflow: ellipsis;
      }
      /* There is no divider before the first cell */
      td:first-child {
        border-left: none;
      }

      thead tr {
        background-color: var(--toolbar-bg-color);
      }

      /* Striping of rows in the table */
      tbody tr:nth-of-type(2n+1) {
        background-color: var(--table-secondary-color);
      }

      /* Use tbody to increase specificity to override previous rule */
      /* Use focus-within instead of :focus, to make sure that, when
         editing a cell, the rest of the row remains properly highlighted. */
      tbody tr:focus-within {
        background-color: var(--selection-bg-color);
        color: var(--selection-fg-color);
      }

      /* Create an editor-like experience by resetting the colors */
      tbody td.editing {
        background-color: white;
        color: black;
      }
    </style>
    <div class="wrapping-container">
      <table>
        <colgroup>
          <col style="width: 50%;">
          <col style="width: 50%;">
        </colgroup>
        <thead>
          <tr>
            <td>Key</td>
            <td>Value</td>
          </tr>
        </thead>
        <tbody>
          ${mapping.map(({key, value}) => {
          return html`
              <tr
                  tabindex="-1"
                  @click=${this.handleRowClick}
                  @dblclick=${this.handleRowDoubleClick}
                  @keyup=${this.handleRowKeyUp}
                >
                <td>${key}</td>
                <td>${value}</td>
              </tr>
              `;
        })}
        </tbody>
      </table>
    </div>`,
        this.root, {
          eventContext: this,
        });
  }

  private handleRowClick(event: MouseEvent) {
    const selectedRow = event.currentTarget as HTMLElement;

    if (this.editing) {
      return;
    }

    selectedRow.focus();
  }

  private handleRowDoubleClick(event: MouseEvent) {
    const selectedCell = event.target as HTMLElement;

    // We directly clicked on the row, not on a cell in it
    if (selectedCell === event.currentTarget) {
      return;
    }

    if (this.editing) {
      return;
    }

    event.preventDefault();
    this.startEditingCell(selectedCell);
  }

  /**
   * Edit a particular cell in the table. This allows the user
   * to change either the key or value of a particular row.
   * It does so by making the content editable and mimicing a
   * text-editor.
   *
   * Once the user is finished, an event is fired to notify any
   * state management that it has to update its internal value.
   *
   * @param selectedCell The cell we are editing its value for
   */
  private startEditingCell(selectedCell: HTMLElement) {
    // Make sure that all actions in `startEditing`
    // are reversed in `onFinishedEditing`.
    const startEditing = () => {
      selectedCell.classList.add('editing');
      selectedCell.contentEditable = 'plaintext-only';
      this.editing = true;
    };
    const onFinishedEditing = () => {
      selectedCell.classList.remove('editing');
      selectedCell.removeAttribute('contenteditable');
      this.editing = false;
    };

    const keyDownListener = (event: KeyboardEvent) => {
      if (['Enter', 'Escape', 'Tab'].includes(event.key)) {
        event.preventDefault();
        onFinishedEditing();
        selectedCell.removeEventListener('keydown', keyDownListener);

        // TODO(tvanderlippe): Handle shift-tab
        if (event.key === 'Tab') {
          const nextCell = selectedCell.nextElementSibling;

          // Next cell in the same row
          if (nextCell) {
            this.startEditingCell(nextCell as HTMLElement);
          } else {
            const nextRow = selectedCell.parentElement?.nextElementSibling;

            if (nextRow) {
              // Key cell in the next row
              this.startEditingCell(nextRow.firstElementChild as HTMLElement);
            }
          }
        }
      }
    };
    // Use keydown rather than keyup, to make sure that when you hit
    // the enter key, there is no flash of an extra line being added
    // to the the contenteditable node.
    //
    // Don't use once here, as we only want to listen for a couple of
    // key codes.
    selectedCell.addEventListener('keydown', keyDownListener);
    selectedCell.addEventListener('blur', onFinishedEditing, {once: true});

    startEditing();
    // Make sure to transfer the focus to the cell, rather than the
    // currently focused row. If we don't, after triple-clicking,
    // the click event on the row would fire and hijack the focus.
    // Moreover, it automatically selects the full text, for easier
    // copy-pasting for the user.
    selectedCell.focus();
  }

  private handleRowKeyUp(event: KeyboardEvent) {
    const selectedRow = event.currentTarget as HTMLElement;

    let nextSelectedRow: HTMLElement|null;

    if (event.key === 'Enter') {
      this.selectKeyCell(selectedRow.firstElementChild as HTMLElement);
      return;
    }

    if (event.key === 'ArrowDown') {
      nextSelectedRow = selectedRow.nextElementSibling as HTMLElement;
    } else if (event.key === 'ArrowUp') {
      nextSelectedRow = selectedRow.previousElementSibling as HTMLElement;
    } else {
      return;
    }

    // If we are are the first or last element and are moving respectively up or down,
    // then nextSelectedRow is `null`.
    if (nextSelectedRow) {
      nextSelectedRow.focus();
    }
  }

  /**
   * Select the keycell and automatically select all text in that cell.
   *
   * @param keyCell The key cell to automatically select the text for
   */
  private selectKeyCell(keyCell: HTMLElement) {
    const selection = this.root.getSelection()!;
    const range = document.createRange();

    range.selectNodeContents(keyCell);
    selection.removeAllRanges();
    selection.addRange(range);

    this.startEditingCell(keyCell);
  }
}

customElements.define('devtools-key-value-table', DevToolsKeyValueTable);
