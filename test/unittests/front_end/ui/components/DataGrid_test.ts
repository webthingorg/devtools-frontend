// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {ColumnHeaderClickEvent, DataGrid, DataGridData, RowClickEvent} from '../../../../../front_end/ui/components/DataGrid.js';
import {Row} from '../../../../../front_end/ui/components/DataGridUtils.js';
import {assertElement, assertElements, assertShadowRoot, dispatchClickEvent, renderElementIntoDOM} from '../../helpers/DOMHelpers.js';
import {withMutations} from '../../helpers/MutationHelpers.js';

import {getHeaderCellForColumnId, getHeaderCells, getRowByIndex, getValuesOfRow} from './DataGridHelpers.js';

const {assert} = chai;


const renderDataGrid = (data: Partial<DataGridData>): DataGrid => {
  const component = new DataGrid();
  component.data = {
    rows: data.rows || [],
    columns: data.columns || [],
    selectedRowIndex: data.selectedRowIndex || null,
    activeSort: data.activeSort || null,
  };
  return component;
};

describe('DataGrid', () => {
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

    const outputtedRowValues = [getValuesOfRow(component.shadowRoot, 0), getValuesOfRow(component.shadowRoot, 1)];
    assert.deepEqual(outputtedRowValues, [
      ['Foo', 'foobar'],
      ['Bar', 'bazbar'],
    ]);
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

    it('labels a column when it is sortable', () => {
      const component = renderDataGrid({columns, rows});
      assertShadowRoot(component.shadowRoot);

      const keyHeader = getHeaderCellForColumnId(component.shadowRoot, 'key');
      const valueHeader = getHeaderCellForColumnId(component.shadowRoot, 'value');
      assert.strictEqual(keyHeader.getAttribute('aria-sort'), 'none');
      assert.strictEqual(valueHeader.getAttribute('aria-sort'), '');
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


  describe('clicking a column header', () => {
    it('emits an event', async () => {
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
  });

  describe('selecting a row', () => {
    it('emits an event when the user clicks on a row', async () => {
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

      const rowSelectedEvent = await new Promise<RowClickEvent>(resolve => {
        assertShadowRoot(component.shadowRoot);
        component.addEventListener('rowClick', (event: unknown) => {
          resolve(event as RowClickEvent);
        });
        const row = getRowByIndex(component.shadowRoot, 0);
        dispatchClickEvent(row);
      });

      assert.deepEqual(rowSelectedEvent.data, {row: rows[0], rowIndex: 0});
    });
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
              selectedRowIndex: null,
              activeSort: null,
            };

            const newRowValues = getValuesOfRow(shadowRoot, 0);
            assert.deepEqual(newRowValues, ['Hello', 'World']);
          });
    });

    it('scrolls to the bottom of the table when a row is inserted', async () => {
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
        selectedRowIndex: null,
        activeSort: null,
      };
      assert.strictEqual(scrolledElement.scrollTop, 61);
    });

    it('does not auto scroll if the user has a row selected', () => {
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
      const component = renderDataGrid({rows, columns, selectedRowIndex: 0});
      container.appendChild(component);
      renderElementIntoDOM(container);
      assertShadowRoot(component.shadowRoot);

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
        selectedRowIndex: 0,
        activeSort: null,
      };
      assert.strictEqual(scrolledElement.scrollTop, 0);
    });
  });
});
