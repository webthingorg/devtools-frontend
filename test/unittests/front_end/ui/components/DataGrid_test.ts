// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {ColumnHeaderClickEvent, DataGrid, DataGridData} from '../../../../../front_end/ui/components/DataGrid.js';
import {Row} from '../../../../../front_end/ui/components/DataGridUtils.js';
import {assertElement, assertElements, assertShadowRoot, dispatchClickEvent, dispatchKeyDownEvent, getEventPromise, renderElementIntoDOM} from '../../helpers/DOMHelpers.js';
import {withMutations} from '../../helpers/MutationHelpers.js';

import {getCellByIndexes, getFocusableCell, getHeaderCellForColumnId, getHeaderCells, getValuesOfAllBodyRows, getValuesOfBodyRow} from './DataGridHelpers.js';

const {assert} = chai;
import {rows, columnsWithNoneSortable, columns, createColumns, createRows} from './DataGridTestData.js';


const renderDataGrid = (data: Partial<DataGridData>): DataGrid => {
  const component = new DataGrid();
  component.data = {
    rows: data.rows || [],
    columns: data.columns || [],
    activeSort: data.activeSort || null,
  };
  return component;
};


describe('DataGrid', () => {
  describe('rendering and hiding rows/columns', () => {
    it('renders the right headers and values', () => {
      const component = renderDataGrid({rows, columns});
      renderElementIntoDOM(component);
      assertShadowRoot(component.shadowRoot);

      const headerCells = getHeaderCells(component.shadowRoot);
      const values = Array.from(headerCells, cell => cell.textContent || '');
      assert.deepEqual(values, ['City', 'Country', 'Population']);

      const renderedRows = component.shadowRoot.querySelectorAll('tbody tr');
      assertElements(renderedRows, HTMLTableRowElement);

      const rowValues = getValuesOfAllBodyRows(component.shadowRoot);
      assert.deepEqual(rowValues, [
        ['London', 'UK', '8.98m'],
        ['Munich', 'Germany', '1.47m'],
        ['Barcelona', 'Spain', '1.62m'],
      ]);
    });

    it('hides columns marked as hidden', () => {
      const columnsWithCityHidden = createColumns();
      columnsWithCityHidden[0].hidden = true;
      const component = renderDataGrid({rows, columns: columnsWithCityHidden});
      renderElementIntoDOM(component);
      assertShadowRoot(component.shadowRoot);

      const headerCells = getHeaderCells(component.shadowRoot, {onlyVisible: true});
      const values = Array.from(headerCells, cell => cell.textContent || '');
      assert.deepEqual(values, ['Country', 'Population']);

      const rowValues = getValuesOfAllBodyRows(component.shadowRoot, {onlyVisible: true});
      assert.deepEqual(rowValues, [
        ['UK', '8.98m'],
        ['Germany', '1.47m'],
        ['Spain', '1.62m'],
      ]);
    });

    it('hides rows marked as hidden', () => {
      const rowsWithLondonHidden = createRows();
      rowsWithLondonHidden[0].hidden = true;
      const component = renderDataGrid({rows: rowsWithLondonHidden, columns});
      renderElementIntoDOM(component);
      assertShadowRoot(component.shadowRoot);

      const rowValues = getValuesOfAllBodyRows(component.shadowRoot, {onlyVisible: true});
      assert.deepEqual(rowValues, [
        ['Munich', 'Germany', '1.47m'],
        ['Barcelona', 'Spain', '1.62m'],
      ]);
    });
  });

  describe('aria-labels', () => {
    it('adds rowcount and colcount to the table', () => {
      const component = renderDataGrid({columns, rows});
      assertShadowRoot(component.shadowRoot);
      const table = component.shadowRoot.querySelector('table');
      assertElement(table, HTMLTableElement);
      assert.strictEqual(table.getAttribute('aria-rowcount'), '3');
      assert.strictEqual(table.getAttribute('aria-colcount'), '3');
    });

    it('shows the total row and colcount regardless of any hidden rows', () => {
      const rowsWithLondonHidden = createRows();
      rowsWithLondonHidden[0].hidden = true;
      const component = renderDataGrid({columns, rows: rowsWithLondonHidden});
      assertShadowRoot(component.shadowRoot);
      const table = component.shadowRoot.querySelector('table');
      assertElement(table, HTMLTableElement);
      assert.strictEqual(table.getAttribute('aria-rowcount'), '3');
      assert.strictEqual(table.getAttribute('aria-colcount'), '3');
    });

    it('labels a column when it is sortable and does not add a label when it is not', () => {
      const component = renderDataGrid({columns, rows});
      assertShadowRoot(component.shadowRoot);

      const cityHeader = getHeaderCellForColumnId(component.shadowRoot, 'city');
      const countryHeader = getHeaderCellForColumnId(component.shadowRoot, 'country');
      assert.strictEqual(cityHeader.getAttribute('aria-sort'), 'none');
      assert.strictEqual(countryHeader.getAttribute('aria-sort'), null);
    });

    it('labels a column when it is sorted in ASC order', () => {
      const component = renderDataGrid({
        columns,
        rows,
        activeSort: {
          columnId: 'city',
          direction: 'ASC',
        },
      });
      assertShadowRoot(component.shadowRoot);

      const cityHeader = getHeaderCellForColumnId(component.shadowRoot, 'city');
      assert.strictEqual(cityHeader.getAttribute('aria-sort'), 'ascending');
    });

    it('labels a column when it is sorted in DESC order', () => {
      const component = renderDataGrid({
        columns,
        rows,
        activeSort: {
          columnId: 'city',
          direction: 'DESC',
        },
      });
      assertShadowRoot(component.shadowRoot);
      const cityHeader = getHeaderCellForColumnId(component.shadowRoot, 'city');
      assert.strictEqual(cityHeader.getAttribute('aria-sort'), 'descending');
    });
  });

  describe('navigating with the keyboard', () => {
    it('makes the first body cell focusable by default when no columns are sortable', () => {
      const component = renderDataGrid({rows, columns: columnsWithNoneSortable});
      assertShadowRoot(component.shadowRoot);
      const focusableCell = getFocusableCell(component.shadowRoot);
      assert.strictEqual(focusableCell.getAttribute('data-row-index'), '1');
      assert.strictEqual(focusableCell.getAttribute('data-col-index'), '0');
    });

    it('does not let the user navigate into the columns when no colums are sortable', () => {
      const component = renderDataGrid({rows, columns: columnsWithNoneSortable});
      assertShadowRoot(component.shadowRoot);
      let focusableCell = getFocusableCell(component.shadowRoot);
      assert.strictEqual(focusableCell.getAttribute('data-row-index'), '1');
      assert.strictEqual(focusableCell.getAttribute('data-col-index'), '0');
      const table = component.shadowRoot.querySelector('table');
      assertElement(table, HTMLTableElement);
      dispatchKeyDownEvent(table, {key: 'ArrowUp'});
      focusableCell = getFocusableCell(component.shadowRoot);
      assert.strictEqual(focusableCell.getAttribute('data-row-index'), '1');
      assert.strictEqual(focusableCell.getAttribute('data-col-index'), '0');
    });

    it('focuses the column header by default when it is sortable', () => {
      const component = renderDataGrid({rows, columns});
      assertShadowRoot(component.shadowRoot);
      const focusableCell = getFocusableCell(component.shadowRoot);
      assert.strictEqual(focusableCell.getAttribute('data-row-index'), '0');
      assert.strictEqual(focusableCell.getAttribute('data-col-index'), '0');
    });

    it('lets the user press the right arrow key to navigate right', () => {
      const component = renderDataGrid({rows, columns: columnsWithNoneSortable});
      assertShadowRoot(component.shadowRoot);
      const table = component.shadowRoot.querySelector('table');
      assertElement(table, HTMLTableElement);

      // Mimic the user tabbing into the table
      const firstFocusedCell = getFocusableCell(component.shadowRoot);
      firstFocusedCell.focus();
      dispatchKeyDownEvent(table, {key: 'ArrowRight'});

      const newFocusedCell = getFocusableCell(component.shadowRoot);
      assert.strictEqual(newFocusedCell.getAttribute('data-row-index'), '1');
      assert.strictEqual(newFocusedCell.getAttribute('data-col-index'), '1');
    });

    it('lets the user press the left arrow key to navigate left', () => {
      const component = renderDataGrid({rows, columns: columnsWithNoneSortable});
      assertShadowRoot(component.shadowRoot);
      const table = component.shadowRoot.querySelector('table');
      assertElement(table, HTMLTableElement);

      // Find a cell in the 2nd column to click to focus
      const firstCellInSecondColumn = getCellByIndexes(component.shadowRoot, {column: 1, row: 1});
      dispatchClickEvent(firstCellInSecondColumn);
      let newFocusedCell = getFocusableCell(component.shadowRoot);
      dispatchKeyDownEvent(table, {key: 'ArrowLeft'});
      newFocusedCell = getFocusableCell(component.shadowRoot);
      assert.strictEqual(newFocusedCell.getAttribute('data-row-index'), '1');
      assert.strictEqual(newFocusedCell.getAttribute('data-col-index'), '0');
    });

    it('lets the user press the down arrow key to navigate down', () => {
      const component = renderDataGrid({rows, columns: columnsWithNoneSortable});
      assertShadowRoot(component.shadowRoot);
      const table = component.shadowRoot.querySelector('table');
      assertElement(table, HTMLTableElement);

      // Mimic the user tabbing into the table
      const firstFocusedCell = getFocusableCell(component.shadowRoot);
      firstFocusedCell.focus();
      dispatchKeyDownEvent(table, {key: 'ArrowDown'});
      const newFocusedCell = getFocusableCell(component.shadowRoot);
      assert.strictEqual(newFocusedCell.getAttribute('data-row-index'), '2');
      assert.strictEqual(newFocusedCell.getAttribute('data-col-index'), '0');
    });

    it('lets the user press the up arrow key to navigate up', () => {
      const component = renderDataGrid({rows, columns: columnsWithNoneSortable});
      assertShadowRoot(component.shadowRoot);
      const table = component.shadowRoot.querySelector('table');
      assertElement(table, HTMLTableElement);

      // Find a cell in the 2nd row to click to focus
      const cellInSecondRow = getCellByIndexes(component.shadowRoot, {column: 1, row: 2});
      dispatchClickEvent(cellInSecondRow);
      dispatchKeyDownEvent(table, {key: 'ArrowUp'});
      const newFocusedCell = getFocusableCell(component.shadowRoot);
      assert.strictEqual(newFocusedCell.getAttribute('data-row-index'), '1');
      assert.strictEqual(newFocusedCell.getAttribute('data-col-index'), '1');
    });

    it('correctly skips hidden columns', () => {
      const columnsWithCountryHidden = createColumns();
      columnsWithCountryHidden[1].hidden = true;
      const component = renderDataGrid({rows, columns: columnsWithCountryHidden});
      assertShadowRoot(component.shadowRoot);
      const table = component.shadowRoot.querySelector('table');
      assertElement(table, HTMLTableElement);

      const firstFocusedCell = getFocusableCell(component.shadowRoot);
      firstFocusedCell.focus();
      dispatchKeyDownEvent(table, {key: 'ArrowRight'});
      const newFocusedCell = getFocusableCell(component.shadowRoot);
      assert.strictEqual(newFocusedCell.getAttribute('data-row-index'), '0');
      // It's 2 here because column 1 is hidden
      assert.strictEqual(newFocusedCell.getAttribute('data-col-index'), '2');
    });

    it('correctly skips hidden rows when navigating from the column header', () => {
      const rowsWithLondonHidden = createRows();
      rowsWithLondonHidden[0].hidden = true;
      const component = renderDataGrid({rows: rowsWithLondonHidden, columns});
      assertShadowRoot(component.shadowRoot);
      const table = component.shadowRoot.querySelector('table');
      assertElement(table, HTMLTableElement);

      const firstFocusedCell = getFocusableCell(component.shadowRoot);
      firstFocusedCell.focus();
      dispatchKeyDownEvent(table, {key: 'ArrowDown'});
      const newFocusedCell = getFocusableCell(component.shadowRoot);
      // It's 2 here because row 1 is hidden
      assert.strictEqual(newFocusedCell.getAttribute('data-row-index'), '2');
      assert.strictEqual(newFocusedCell.getAttribute('data-col-index'), '0');
    });

    it('correctly skips hidden rows when navigating from a body row to another', () => {
      const rowsWithMunichHidden = createRows();
      rowsWithMunichHidden[1].hidden = true;
      const component = renderDataGrid({rows: rowsWithMunichHidden, columns: columnsWithNoneSortable});
      assertShadowRoot(component.shadowRoot);
      const table = component.shadowRoot.querySelector('table');
      assertElement(table, HTMLTableElement);

      const firstFocusedCell = getFocusableCell(component.shadowRoot);
      firstFocusedCell.focus();
      dispatchKeyDownEvent(table, {key: 'ArrowDown'});
      const newFocusedCell = getFocusableCell(component.shadowRoot);
      // It's 3 here because row 2 is hidden
      assert.strictEqual(newFocusedCell.getAttribute('data-row-index'), '3');
      assert.strictEqual(newFocusedCell.getAttribute('data-col-index'), '0');
    });

    it('correctly marks the first visible row cell as focusable when the first row is hidden', () => {
      const rowsWithLondonHidden = createRows();
      rowsWithLondonHidden[0].hidden = true;
      const component = renderDataGrid({rows: rowsWithLondonHidden, columns: columnsWithNoneSortable});
      assertShadowRoot(component.shadowRoot);
      const table = component.shadowRoot.querySelector('table');
      assertElement(table, HTMLTableElement);

      const firstFocusedCell = getFocusableCell(component.shadowRoot);
      assert.strictEqual(firstFocusedCell.getAttribute('data-row-index'), '2');
      assert.strictEqual(firstFocusedCell.getAttribute('data-col-index'), '0');
    });
  });

  describe('setting the widths of the columns', () => {
    it('defaults to 100% if there is only one column', () => {
      const columns = [
        {id: 'key', title: 'Key', sortable: false},
      ];

      const component = renderDataGrid({rows: [], columns});
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

      const component = renderDataGrid({rows: [], columns});
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

      const component = renderDataGrid({rows: [], columns});
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
    const component = renderDataGrid({rows, columns});
    renderElementIntoDOM(component);


    assertShadowRoot(component.shadowRoot);
    const columnHeaderClickEvent = getEventPromise<ColumnHeaderClickEvent>(component, 'columnHeaderClick');
    const cityColumn = getHeaderCellForColumnId(component.shadowRoot, 'city');
    dispatchClickEvent(cityColumn);

    const clickEvent = await columnHeaderClickEvent;
    assert.deepEqual(clickEvent.data, {column: columns[0], columnIndex: 0});
  });

  it('emits an event when the user "clicks" a column header with the enter key', async () => {
    const component = renderDataGrid({rows, columns});
    renderElementIntoDOM(component);
    assertShadowRoot(component.shadowRoot);

    const columnHeaderClickEvent = getEventPromise<ColumnHeaderClickEvent>(component, 'columnHeaderClick');
    const focusableCell = getFocusableCell(component.shadowRoot);
    focusableCell.focus();
    const table = component.shadowRoot.querySelector('table');
    assertElement(table, HTMLTableElement);
    // Navigate up to the column header
    dispatchKeyDownEvent(table, {key: 'ArrowUp'});
    const newFocusedCell = getFocusableCell(component.shadowRoot);
    assert.strictEqual(newFocusedCell.getAttribute('data-row-index'), '0');
    assert.strictEqual(newFocusedCell.getAttribute('data-col-index'), '0');

    dispatchKeyDownEvent(table, {key: 'Enter'});

    const clickEvent = await columnHeaderClickEvent;

    assert.deepEqual(clickEvent.data, {column: columns[0], columnIndex: 0});
  });

  describe('adding new rows', () => {
    it('only has one DOM mutation to add the new row', async () => {
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
                {columnId: 'city', value: 'Berlin'},
                {columnId: 'country', value: 'Germany'},
                {columnId: 'population', value: '3.66m'},
              ],
            };

            component.data = {
              columns,
              rows: [...rows, newRow],
              activeSort: null,
            };

            const newRowValues = getValuesOfBodyRow(shadowRoot, 4);
            assert.deepEqual(newRowValues, ['Berlin', 'Germany', '3.66m']);
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
