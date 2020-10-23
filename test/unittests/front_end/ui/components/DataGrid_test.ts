// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {ColumnHeaderClickEvent, CellFocusEvent, DataGrid, DataGridData} from '../../../../../front_end/ui/components/DataGrid.js';
import {Row, Column} from '../../../../../front_end/ui/components/DataGridUtils.js';
import {assertElement, assertElements, assertShadowRoot, dispatchClickEvent, renderElementIntoDOM, dispatchKeyDownEvent} from '../../helpers/DOMHelpers.js';
import {withMutations} from '../../helpers/MutationHelpers.js';

import {getCellByIndexes, getFocusableCell, getHeaderCellForColumnId, getHeaderCells, getValuesOfBodyRow, getValuesOfAllBodyRows} from './DataGridHelpers.js';

const {assert} = chai;


const renderDataGrid = (data: Partial<DataGridData>): DataGrid => {
  const component = new DataGrid();
  component.data = {
    rows: data.rows || [],
    columns: data.columns || [],
    activeSort: data.activeSort || null,
  };
  return component;
};

describe.only('DataGrid', () => {
  describe('rendering and hiding rows/columns', () => {
    it('renders the right headers and values', () => {
      const columns = [
        {id: 'key', title: 'Key', sortable: true, width: 50},
        {id: 'value', title: 'Value', sortable: false, width: 50},
      ];

      const rows = [
        {cells: [{columnId: 'key', value: 'Foo'}, {columnId: 'value', value: 'foobar'}]},
        {cells: [{columnId: 'key', value: 'Bar'}, {columnId: 'value', value: 'bazbar'}]},
      ];
      const component = renderDataGrid({rows, columns});
      renderElementIntoDOM(component);
      assertShadowRoot(component.shadowRoot);

      const headerCells = getHeaderCells(component.shadowRoot);
      const values = Array.from(headerCells, cell => cell.textContent || '');
      assert.deepEqual(values, ['Key', 'Value']);

      const renderedRows = component.shadowRoot.querySelectorAll('tbody tr');
      assertElements(renderedRows, HTMLTableRowElement);

      const outputtedRowValues = [getValuesOfBodyRow(component.shadowRoot, 1), getValuesOfBodyRow(component.shadowRoot, 2)];
      assert.deepEqual(outputtedRowValues, [
        ['Foo', 'foobar'],
        ['Bar', 'bazbar'],
      ]);
    });

    it('hides columns marked as hidden', () => {
      const columns = [
        {id: 'key', title: 'Key', sortable: true, width: 50, hidden: true},
        {id: 'value', title: 'Value', sortable: false, width: 50},
      ];

      const rows = [
        {cells: [{columnId: 'key', value: 'Foo'}, {columnId: 'value', value: 'foobar'}]},
        {cells: [{columnId: 'key', value: 'Bar'}, {columnId: 'value', value: 'bazbar'}]},
      ];
      const component = renderDataGrid({rows, columns});
      renderElementIntoDOM(component);
      assertShadowRoot(component.shadowRoot);

      const headerCells = getHeaderCells(component.shadowRoot, {onlyVisible: true});
      const values = Array.from(headerCells, cell => cell.textContent || '');
      assert.deepEqual(values, ['Value']);

      const rowValues = getValuesOfAllBodyRows(component.shadowRoot, {onlyVisible: true});
      assert.deepEqual(rowValues, [['foobar'], ['bazbar']]);
    });

    it('hides rows marked as hidden', () => {
      const columns = [
        {id: 'key', title: 'Key', sortable: true, width: 50},
        {id: 'value', title: 'Value', sortable: false, width: 50},
      ];

      const rows = [
        {cells: [{columnId: 'key', value: 'Foo'}, {columnId: 'value', value: 'foobar'}], hidden: true},
        {cells: [{columnId: 'key', value: 'Bar'}, {columnId: 'value', value: 'bazbar'}]},
      ];
      const component = renderDataGrid({rows, columns});
      renderElementIntoDOM(component);
      assertShadowRoot(component.shadowRoot);

      const rowValues = getValuesOfAllBodyRows(component.shadowRoot, {onlyVisible: true});
      assert.deepEqual(rowValues, [['Bar', 'bazbar']]);
    });
  });

  describe('aria-labels', () => {
    const columns = [
      {id: 'key', title: 'Key', sortable: true, width: 50},
      {id: 'value', title: 'Value', sortable: false, width: 50},
    ];

    const rows = [
      {cells: [{columnId: 'key', value: 'Foo'}, {columnId: 'value', value: 'foobar'}]},
      {cells: [{columnId: 'key', value: 'Bar'}, {columnId: 'value', value: 'bazbar'}]},
    ];

    it('adds rowcount and colcount to the table', () => {
      const component = renderDataGrid({columns, rows});
      assertShadowRoot(component.shadowRoot);
      const table = component.shadowRoot.querySelector('table');
      assertElement(table, HTMLTableElement);
      assert.strictEqual(table.getAttribute('aria-rowcount'), '2');
      assert.strictEqual(table.getAttribute('aria-colcount'), '2');
    });

    it('shows the total row and colcount regardless of any hidden rows', () => {
    const rowsWithOneHidden = [
      {cells: [{columnId: 'key', value: 'Foo'}, {columnId: 'value', value: 'foobar'}]},
      {cells: [{columnId: 'key', value: 'Bar'}, {columnId: 'value', value: 'bazbar'}], hidden: true},
    ];
      const component = renderDataGrid({columns, rows: rowsWithOneHidden});
      assertShadowRoot(component.shadowRoot);
      const table = component.shadowRoot.querySelector('table');
      assertElement(table, HTMLTableElement);
      assert.strictEqual(table.getAttribute('aria-rowcount'), '2');
    });

    it('labels a column when it is sortable and does not add a label when it is not', () => {
      const component = renderDataGrid({columns, rows});
      assertShadowRoot(component.shadowRoot);

      const keyHeader = getHeaderCellForColumnId(component.shadowRoot, 'key');
      const valueHeader = getHeaderCellForColumnId(component.shadowRoot, 'value');
      assert.strictEqual(keyHeader.getAttribute('aria-sort'), 'none');
      assert.strictEqual(valueHeader.getAttribute('aria-sort'), null);
    });

    it('labels a column when it is sorted in ASC order', () => {
      const component = renderDataGrid({
        columns,
        rows,
        activeSort: {
          columnId: 'key',
          direction: 'ASC',
        },
      });
      assertShadowRoot(component.shadowRoot);

      const keyHeader = getHeaderCellForColumnId(component.shadowRoot, 'key');
      assert.strictEqual(keyHeader.getAttribute('aria-sort'), 'ascending');
    });

    it('labels a column when it is sorted in DESC order', () => {
      const component = renderDataGrid({
        columns,
        rows,
        activeSort: {
          columnId: 'key',
          direction: 'DESC',
        },
      });
      assertShadowRoot(component.shadowRoot);

      const keyHeader = getHeaderCellForColumnId(component.shadowRoot, 'key');
      assert.strictEqual(keyHeader.getAttribute('aria-sort'), 'descending');
    });
  });

  describe('navigating with the keyboard', () => {
    const columns: Column[] = [
      {id: 'key', title: 'Key', sortable: false, width: 40},
      {id: 'value', title: 'Value', sortable: false, width: 40},
      {id: 'number', title: 'Number', sortable: false, width: 20},
    ];

    const rows: Row[] = [
      {cells: [{columnId: 'key', value: 'Foo'}, {columnId: 'value', value: 'foo'}, {columnId: 'number', value: '1'}]},
      {cells: [{columnId: 'key', value: 'Bar'}, {columnId: 'value', value: 'bar'}, {columnId: 'number', value: '2'}]},
      {cells: [{columnId: 'key', value: 'Baz'}, {columnId: 'value', value: 'baz'}, {columnId: 'number', value: '3'}]},
    ];

    it('makes the first body cell focusable by default', () => {
      const component = renderDataGrid({rows, columns});
      assertShadowRoot(component.shadowRoot);
      const focusableCell = getFocusableCell(component.shadowRoot);
      assert.strictEqual(focusableCell.getAttribute('data-row-index'), '1');
      assert.strictEqual(focusableCell.getAttribute('data-col-index'), '0');
    });

    it('does not let the user navigate into the columns when no colums are sortable', () => {
      const component = renderDataGrid({rows, columns});
      assertShadowRoot(component.shadowRoot);
      let focusableCell = getFocusableCell(component.shadowRoot);
      assert.strictEqual(focusableCell.getAttribute('data-row-index'), '1');
      assert.strictEqual(focusableCell.getAttribute('data-col-index'), '0');
      const table = component.shadowRoot.querySelector('table');
      assertElement(table, HTMLTableElement);
      dispatchKeyDownEvent(table, { key: 'ArrowUp'});
      focusableCell = getFocusableCell(component.shadowRoot);
      assert.strictEqual(focusableCell.getAttribute('data-row-index'), '1');
      assert.strictEqual(focusableCell.getAttribute('data-col-index'), '0');
    });

    it('focuses the column header by default when it is sortable', () => {
      const sortableColumns = [
        { ...columns[0], sortable: true},
        columns[1],
        columns[2],
      ];
      const component = renderDataGrid({rows, columns: sortableColumns});
      assertShadowRoot(component.shadowRoot);
      const focusableCell = getFocusableCell(component.shadowRoot);
      assert.strictEqual(focusableCell.getAttribute('data-row-index'), '0');
      assert.strictEqual(focusableCell.getAttribute('data-col-index'), '0');
    });

    it('lets the user press the right arrow key to navigate right', () => {
      const component = renderDataGrid({rows, columns});
      assertShadowRoot(component.shadowRoot);
      const table = component.shadowRoot.querySelector('table');
      assertElement(table, HTMLTableElement);

      // Mimic the user tabbing into the table
      const firstFocusedCell = getFocusableCell(component.shadowRoot);
      firstFocusedCell.focus();
      dispatchKeyDownEvent(table, { key: 'ArrowRight'});

      const newFocusedCell = getFocusableCell(component.shadowRoot);
      assert.strictEqual(newFocusedCell.getAttribute('data-row-index'), '1');
      assert.strictEqual(newFocusedCell.getAttribute('data-col-index'), '1');
    });

    it('lets the user press the left arrow key to navigate left', () => {
      const component = renderDataGrid({rows, columns});
      assertShadowRoot(component.shadowRoot);
      const table = component.shadowRoot.querySelector('table');
      assertElement(table, HTMLTableElement);

      // Find a cell in the 2nd column to click to focus
      const firstCellInSecondColumn = getCellByIndexes(component.shadowRoot, { column: 1, row: 1});
      dispatchClickEvent(firstCellInSecondColumn);
      let newFocusedCell = getFocusableCell(component.shadowRoot);
      dispatchKeyDownEvent(table, { key: 'ArrowLeft'});
      newFocusedCell = getFocusableCell(component.shadowRoot);
      assert.strictEqual(newFocusedCell.getAttribute('data-row-index'), '1');
      assert.strictEqual(newFocusedCell.getAttribute('data-col-index'), '0');
    });

    it('lets the user press the down arrow key to navigate down', () => {
      const component = renderDataGrid({rows, columns});
      assertShadowRoot(component.shadowRoot);
      const table = component.shadowRoot.querySelector('table');
      assertElement(table, HTMLTableElement);

      // Mimic the user tabbing into the table
      const firstFocusedCell = getFocusableCell(component.shadowRoot);
      firstFocusedCell.focus();
      dispatchKeyDownEvent(table, { key: 'ArrowDown'});
      const newFocusedCell = getFocusableCell(component.shadowRoot);
      assert.strictEqual(newFocusedCell.getAttribute('data-row-index'), '2');
      assert.strictEqual(newFocusedCell.getAttribute('data-col-index'), '0');
    });

    it('lets the user press the up arrow key to navigate up', () => {
      const component = renderDataGrid({rows, columns});
      assertShadowRoot(component.shadowRoot);
      const table = component.shadowRoot.querySelector('table');
      assertElement(table, HTMLTableElement);

      // Find a cell in the 2nd row to click to focus
      const cellInSecondRow = getCellByIndexes(component.shadowRoot, { column: 1, row: 2});
      dispatchClickEvent(cellInSecondRow);
      dispatchKeyDownEvent(table, { key: 'ArrowUp'});
      const newFocusedCell = getFocusableCell(component.shadowRoot);
      assert.strictEqual(newFocusedCell.getAttribute('data-row-index'), '1');
      assert.strictEqual(newFocusedCell.getAttribute('data-col-index'), '1');
    });

    it('correctly skips hidden columns', () => {
      const columnsWithHidden = [...columns];
      columnsWithHidden[1].hidden = true;
      const component = renderDataGrid({rows, columns});
      assertShadowRoot(component.shadowRoot);
      const table = component.shadowRoot.querySelector('table');
      assertElement(table, HTMLTableElement);

      const firstFocusedCell = getFocusableCell(component.shadowRoot);
      firstFocusedCell.focus();
      dispatchKeyDownEvent(table, { key: 'ArrowRight' });
      const newFocusedCell = getFocusableCell(component.shadowRoot);
      assert.strictEqual(newFocusedCell.getAttribute('data-row-index'), '1');
      // It's 2 here because column 1 is hidden
      assert.strictEqual(newFocusedCell.getAttribute('data-col-index'), '2');
    });

    it('correctly skips hidden rows', () => {
      const rowsWithHidden = [...rows];
      rowsWithHidden[1].hidden = true;
      const component = renderDataGrid({rows, columns});
      assertShadowRoot(component.shadowRoot);
      const table = component.shadowRoot.querySelector('table');
      assertElement(table, HTMLTableElement);

      const firstFocusedCell = getFocusableCell(component.shadowRoot);
      firstFocusedCell.focus();
      dispatchKeyDownEvent(table, { key: 'ArrowDown' });
      const newFocusedCell = getFocusableCell(component.shadowRoot);
      // It's 2 here because row 1 is hidden
      assert.strictEqual(newFocusedCell.getAttribute('data-row-index'), '2');
      assert.strictEqual(newFocusedCell.getAttribute('data-col-index'), '0');
    });

  });

  describe('setting the widths of the columns', () => {
    it('defaults to 100% if there is only one column', () => {
      const columns = [
        {id: 'key', title: 'Key', sortable: false},
      ];

      const rows = [
        {cells: [{columnId: 'key', value: 'Foo'}]},
      ];

      const component = renderDataGrid({rows, columns});
      renderElementIntoDOM(component);
      assertShadowRoot(component.shadowRoot);

      const colGroupsCols = component.shadowRoot.querySelectorAll('colgroup col');
      assert.lengthOf(colGroupsCols, 1);
      assertElements(colGroupsCols, HTMLTableColElement);
      assert.strictEqual(colGroupsCols[0].style.width, '100%');
    });

    it('splits the widths evenly if no columns have it given', () => {
      const columns = [
        {id: 'one', title: 'One', sortable: false},
        {id: 'two', title: 'Two', sortable: false},
      ];

      const rows = [
        {cells: [{columnId: 'one', value: 'one'}, {columnId: 'two', value: 'two'}]},
      ];

      const component = renderDataGrid({rows, columns});
      renderElementIntoDOM(component);
      assertShadowRoot(component.shadowRoot);

      const colGroupsCols = component.shadowRoot.querySelectorAll('colgroup col');
      assert.lengthOf(colGroupsCols, 2);
      assertElements(colGroupsCols, HTMLTableColElement);
      assert.strictEqual(colGroupsCols[0].style.width, '50%');
      assert.strictEqual(colGroupsCols[1].style.width, '50%');
    });

    it('distributes remaining width if only some columns have a set width', () => {
      const columns = [
        {id: 'one', title: 'One', sortable: false, width: 60},
        {id: 'two', title: 'Two', sortable: false},
        {id: 'three', title: 'Three', sortable: false},
      ];

      const rows = [
        {
          cells:
              [{columnId: 'one', value: 'one'}, {columnId: 'two', value: 'two'}, {columnId: 'three', value: 'three'}],
        },
      ];

      const component = renderDataGrid({rows, columns});
      renderElementIntoDOM(component);
      assertShadowRoot(component.shadowRoot);

      const colGroupsCols = component.shadowRoot.querySelectorAll('colgroup col');
      assert.lengthOf(colGroupsCols, 3);
      assertElements(colGroupsCols, HTMLTableColElement);
      assert.strictEqual(colGroupsCols[0].style.width, '60%');
      assert.strictEqual(colGroupsCols[1].style.width, '20%');
      assert.strictEqual(colGroupsCols[2].style.width, '20%');
    });
  });


  it('emits an event when the user clicks a column header', async () => {
    const columns = [
      {id: 'key', title: 'Key', sortable: false},
    ];

    const rows = [{
      cells: [{
        columnId: 'key',
        value: 'Hello world',
      }],
    }];
    const component = renderDataGrid({rows, columns});
    renderElementIntoDOM(component);

    const columnHeaderClickEvent = await new Promise<ColumnHeaderClickEvent>(resolve => {
      assertShadowRoot(component.shadowRoot);
      component.addEventListener('columnHeaderClick', (event: unknown) => {
        resolve(event as ColumnHeaderClickEvent);
      });
      const keyColumn = getHeaderCellForColumnId(component.shadowRoot, 'key');
      dispatchClickEvent(keyColumn);
    });

    assert.deepEqual(columnHeaderClickEvent.data, {column: columns[0], columnIndex: 0});
  });

  // TODO: needs equivalent for column header
  it('emits an event when the user focuses a cell with the keyboard', async () => {
    const columns = [
      {id: 'key', title: 'Key', sortable: false, width: 40},
      {id: 'value', title: 'Value', sortable: false, width: 40},
      {id: 'number', title: 'Number', sortable: false, width: 20},
    ];

    const rows = [
      {cells: [{columnId: 'key', value: 'Foo'}, {columnId: 'value', value: 'foobar'}, {columnId: 'number', value: '1'}]},
      {cells: [{columnId: 'key', value: 'Bar'}, {columnId: 'value', value: 'bazbar'}, {columnId: 'number', value: '2'}]},
    ];

    const component = renderDataGrid({rows, columns});
    renderElementIntoDOM(component);
    assertShadowRoot(component.shadowRoot);
    const table = component.shadowRoot.querySelector('table');
    assertElement(table, HTMLTableElement);

    const cellFocusEvent = await new Promise<CellFocusEvent>(resolve => {
      assertShadowRoot(component.shadowRoot);
      component.addEventListener('cellFocus', (event: unknown) => {
        resolve(event as CellFocusEvent);
      });

      // Mimic the user tabbing into the table
      const firstFocusedCell = getFocusableCell(component.shadowRoot);
      firstFocusedCell.focus();
    });

    assert.deepEqual(cellFocusEvent.data, {cell: rows[0].cells[0], position: {columnIndex: 0, rowIndex: 1}});
  });

  // TODO: needs equivalent for column header
  it('emits an event when the user focuses a cell with the mouse', async () => {
      const columns = [
        {id: 'key', title: 'Key', sortable: false, width: 40},
        {id: 'value', title: 'Value', sortable: false, width: 40},
        {id: 'number', title: 'Number', sortable: false, width: 20},
      ];

      const rows = [
        {cells: [{columnId: 'key', value: 'Foo'}, {columnId: 'value', value: 'foobar'}, {columnId: 'number', value: '1'}]},
        {cells: [{columnId: 'key', value: 'Bar'}, {columnId: 'value', value: 'bazbar'}, {columnId: 'number', value: '2'}]},
      ];

      const component = renderDataGrid({rows, columns});
      renderElementIntoDOM(component);
      assertShadowRoot(component.shadowRoot);
      const table = component.shadowRoot.querySelector('table');
      assertElement(table, HTMLTableElement);

      const cellFocusEvent = await new Promise<CellFocusEvent>(resolve => {
        assertShadowRoot(component.shadowRoot);
        component.addEventListener('cellFocus', (event: unknown) => {
          resolve(event as CellFocusEvent);
        });

        const firstFocusedCell = getFocusableCell(component.shadowRoot);
        dispatchClickEvent(firstFocusedCell);
      });

      assert.deepEqual(cellFocusEvent.data, {cell: rows[0].cells[0], position: {columnIndex: 0, rowIndex: 1}});
  });

  describe('adding new rows', () => {
    it('only has one DOM mutation to add the new row', async () => {
      const columns = [
        {id: 'key', title: 'Key', sortable: true, width: 50},
        {id: 'value', title: 'Value', sortable: false, width: 50},
      ];

      const rows: Row[] = [];
      const component = renderDataGrid({rows, columns});
      renderElementIntoDOM(component);
      assertShadowRoot(component.shadowRoot);

      await withMutations(
          [
            // We expect one <tr> to be added
            {target: 'tr', max: 1},
          ],
          component.shadowRoot, shadowRoot => {
            const newRow = {
              cells: [
                {columnId: 'key', value: 'Hello'},
                {columnId: 'value', value: 'World'},
              ],
            };

            component.data = {
              columns,
              rows: [...rows, newRow],
              activeSort: null,
            };

            const newRowValues = getValuesOfBodyRow(shadowRoot, 1);
            assert.deepEqual(newRowValues, ['Hello', 'World']);
          });
    });

    it('scrolls to the bottom of the table when a row is inserted', async () => {
      const container = document.createElement('div');
      container.style.height = '100px';

      const columns = [
        {id: 'key', title: 'Key', sortable: false, width: 50},
        {id: 'value', title: 'Value', sortable: false, width: 50},
      ];

      const rows: Row[] = [
        {cells: [{columnId: 'key', value: 'Row'}, {columnId: 'value', value: 'One'}]},
        {cells: [{columnId: 'key', value: 'Row'}, {columnId: 'value', value: 'Two'}]},
        {cells: [{columnId: 'key', value: 'Row'}, {columnId: 'value', value: 'Three'}]},
        {cells: [{columnId: 'key', value: 'Row'}, {columnId: 'value', value: 'Four'}]},
        {cells: [{columnId: 'key', value: 'Row'}, {columnId: 'value', value: 'Five'}]},
        {cells: [{columnId: 'key', value: 'Row'}, {columnId: 'value', value: 'Six'}]},
      ];
      const component = renderDataGrid({rows, columns});
      container.appendChild(component);
      renderElementIntoDOM(container);
      assertShadowRoot(component.shadowRoot);

      const scrolledElement = component.shadowRoot.querySelector('.wrapping-container');
      assertElement(scrolledElement, HTMLDivElement);
      assert.strictEqual(scrolledElement.scrollTop, 0);
      const newRow = {
        cells: [
          {columnId: 'key', value: 'Newly inserted'},
          {columnId: 'value', value: 'row'},
        ],
      };
      component.data = {
        columns,
        rows: [...rows, newRow],
        activeSort: null,
      };
      assert.strictEqual(scrolledElement.scrollTop, 61);
    });

    it('does not auto scroll if the user has a cell selected', () => {
      const container = document.createElement('div');
      container.style.height = '100px';

      const columns = [
        {id: 'key', title: 'Key', sortable: true, width: 50},
        {id: 'value', title: 'Value', sortable: false, width: 50},
      ];

      const rows: Row[] = [
        {cells: [{columnId: 'key', value: 'Row'}, {columnId: 'value', value: 'One'}]},
        {cells: [{columnId: 'key', value: 'Row'}, {columnId: 'value', value: 'Two'}]},
        {cells: [{columnId: 'key', value: 'Row'}, {columnId: 'value', value: 'Three'}]},
        {cells: [{columnId: 'key', value: 'Row'}, {columnId: 'value', value: 'Four'}]},
        {cells: [{columnId: 'key', value: 'Row'}, {columnId: 'value', value: 'Five'}]},
        {cells: [{columnId: 'key', value: 'Row'}, {columnId: 'value', value: 'Six'}]},
      ];
      const component = renderDataGrid({rows, columns});
      container.appendChild(component);
      renderElementIntoDOM(container);
      assertShadowRoot(component.shadowRoot);

      // Mimic the user tabbing into the table
      const firstFocusedCell = getFocusableCell(component.shadowRoot);
      firstFocusedCell.focus();

      const scrolledElement = component.shadowRoot.querySelector('.wrapping-container');
      assertElement(scrolledElement, HTMLDivElement);

      const newRow = {
        cells: [
          {columnId: 'key', value: 'Newly inserted'},
          {columnId: 'value', value: 'row'},
        ],
      };
      component.data = {
        columns,
        rows: [...rows, newRow],
        activeSort: null,
      };
      assert.strictEqual(scrolledElement.scrollTop, 0);
    });
  });
});
