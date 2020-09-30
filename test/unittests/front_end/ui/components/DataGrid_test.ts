// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {DataGrid} from '../../../../../front_end/ui/components/DataGrid.js';
import {Row, RowSelectedEvent} from '../../../../../front_end/ui/components/DataGridUtils.js';
import {assertElement, assertElements, assertShadowRoot, dispatchClickEvent, renderElementIntoDOM} from '../../helpers/DOMHelpers.js';
import {withMutations, withNoMutations} from '../../helpers/MutationHelpers.js';

import {getHeaderCellForColumnId, getHeaderCells, getRowByIndex, getValuesForColumn, getValuesOfRow} from './DataGridHelpers.js';

const {assert} = chai;


describe('DataGrid', () => {
  it('renders the right headers and values', () => {
    const columns = [
      {id: 'key', title: 'Key', sortable: true, width: 50},
      {id: 'value', title: 'Value', sortable: false, width: 50},
    ];

    const rows = [
      [{columnId: 'key', value: 'Foo'}, {columnId: 'value', value: 'foobar'}],
      [{columnId: 'key', value: 'Bar'}, {columnId: 'value', value: 'bazbar'}],
    ];
    const component = new DataGrid();
    component.data = {rows, columns};

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

  describe('setting the widths of the columns', () => {
    it('defaults to 100% if there is only one column', () => {
      const columns = [
        {id: 'key', title: 'Key', sortable: false},
      ];

      const rows = [
        [{columnId: 'key', value: 'Foo'}],
      ];

      const component = new DataGrid();
      component.data = {rows, columns};

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
        [{columnId: 'one', value: 'one'}, {columnId: 'two', value: 'two'}],
      ];

      const component = new DataGrid();
      component.data = {rows, columns};

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
        [{columnId: 'one', value: 'one'}, {columnId: 'two', value: 'two'}, {columnId: 'three', value: 'three'}],
      ];

      const component = new DataGrid();
      component.data = {rows, columns};

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

  describe('sorting the columns', () => {
    const columns = [
      {id: 'key', title: 'Key', sortable: true},
    ];
    const rows = [
      [{columnId: 'key', value: 'Bravo'}],
      [{columnId: 'key', value: 'Alpha'}],
      [{columnId: 'key', value: 'Charlie'}],
    ];

    it('lets the user click to sort the column in ASC order', async () => {
      const component = new DataGrid();
      component.data = {rows, columns};

      renderElementIntoDOM(component);
      assertShadowRoot(component.shadowRoot);

      await withNoMutations(component.shadowRoot, shadowRoot => {
        const keyHeader = getHeaderCellForColumnId(shadowRoot, 'key');
        dispatchClickEvent(keyHeader);
        const cellValues = getValuesForColumn(shadowRoot, 'key');
        assert.deepEqual(cellValues, ['Alpha', 'Bravo', 'Charlie']);
      });
    });

    it('lets the user click twice to sort the column in DESC order', () => {
      const component = new DataGrid();
      component.data = {rows, columns};

      renderElementIntoDOM(component);
      assertShadowRoot(component.shadowRoot);

      const keyHeader = getHeaderCellForColumnId(component.shadowRoot, 'key');
      dispatchClickEvent(keyHeader);  // ASC order
      dispatchClickEvent(keyHeader);  // DESC order
      const cellValues = getValuesForColumn(component.shadowRoot, 'key');

      assert.deepEqual(cellValues, ['Charlie', 'Bravo', 'Alpha']);
    });

    it('resets the sort if the column is DESC', () => {
      const component = new DataGrid();
      component.data = {rows, columns};

      renderElementIntoDOM(component);
      assertShadowRoot(component.shadowRoot);

      const keyHeader = getHeaderCellForColumnId(component.shadowRoot, 'key');
      const originalCellValues = getValuesForColumn(component.shadowRoot, 'key');
      dispatchClickEvent(keyHeader);  // ASC order
      dispatchClickEvent(keyHeader);  // DESC order
      dispatchClickEvent(keyHeader);  // Now reset!
      const finalCellValues = getValuesForColumn(component.shadowRoot, 'key');

      assert.deepEqual(finalCellValues, originalCellValues);
    });
  });

  describe('selecting a row', () => {
    it('selects a row when it is clicked and focuses the table', async () => {
      const columns = [
        {id: 'key', title: 'Key', sortable: false},
      ];

      const rows: Row[] = [[{
        columnId: 'key',
        value: 'Hello world',
      }]];
      const component = new DataGrid();
      component.data = {rows, columns};

      renderElementIntoDOM(component);
      assertShadowRoot(component.shadowRoot);

      await withNoMutations(component.shadowRoot, shadowRoot => {
        const row = getRowByIndex(shadowRoot, 0);
        assert.isFalse(row.classList.contains('selected'));
        dispatchClickEvent(row);
        assert.isTrue(row.classList.contains('selected'));

        const table = shadowRoot.querySelector('table');
        assertElement(table, HTMLTableElement);
        assert.isTrue(table.hasFocus());
      });
    });

    it('emits a row-selected-event when a user clicks a row', async () => {
      const columns = [
        {id: 'key', title: 'Key', sortable: false},
      ];

      const rows: Row[] = [[{
        columnId: 'key',
        value: 'Hello world',
      }]];
      const component = new DataGrid();
      component.data = {rows, columns};

      renderElementIntoDOM(component);
      const rowSelectedEvent = await new Promise<RowSelectedEvent>(resolve => {
        assertShadowRoot(component.shadowRoot);
        component.addEventListener('data-grid-row-selected', (event: unknown) => {
          resolve(event as RowSelectedEvent);
        });
        const row = getRowByIndex(component.shadowRoot, 0);
        dispatchClickEvent(row);
      });

      assert.strictEqual(rowSelectedEvent.data, rows[0]);
    });
  });

  describe('adding new rows', () => {
    it('only has one DOM mutation to add the new row', async () => {
      const columns = [
        {id: 'key', title: 'Key', sortable: true, width: 50},
        {id: 'value', title: 'Value', sortable: false, width: 50},
      ];

      const rows: Row[] = [];
      const component = new DataGrid();
      component.data = {rows, columns};

      renderElementIntoDOM(component);
      assertShadowRoot(component.shadowRoot);

      await withMutations(
          [
            // We expect one <tr> to be added
            {tagName: 'tr', max: 1},
          ],
          component.shadowRoot, shadowRoot => {
            const newRow = [
              {columnId: 'key', value: 'Hello'},
              {columnId: 'value', value: 'World'},
            ];

            component.data = {
              columns: component.data.columns,
              rows: [...component.data.rows, newRow],
            };

            const newRowValues = getValuesOfRow(shadowRoot, 0);
            assert.deepEqual(newRowValues, ['Hello', 'World']);
          });
    });

    it('scrolls to the bottom of the table when a row is inserted', () => {
      const container = document.createElement('div');
      container.style.height = '100px';

      const columns = [
        {id: 'key', title: 'Key', sortable: true, width: 50},
        {id: 'value', title: 'Value', sortable: false, width: 50},
      ];

      const rows: Row[] = [
        [{columnId: 'key', value: 'Row'}, {columnId: 'value', value: 'One'}],
        [{columnId: 'key', value: 'Row'}, {columnId: 'value', value: 'Two'}],
        [{columnId: 'key', value: 'Row'}, {columnId: 'value', value: 'Three'}],
        [{columnId: 'key', value: 'Row'}, {columnId: 'value', value: 'Four'}],
        [{columnId: 'key', value: 'Row'}, {columnId: 'value', value: 'Five'}],
        [{columnId: 'key', value: 'Row'}, {columnId: 'value', value: 'Six'}],
      ];
      const component = new DataGrid();
      component.data = {rows, columns};
      container.appendChild(component);

      renderElementIntoDOM(container);
      assertShadowRoot(component.shadowRoot);

      const scrolledElement = component.shadowRoot.querySelector('.wrapping-container');
      assertElement(scrolledElement, HTMLDivElement);
      assert.strictEqual(scrolledElement.scrollTop, 0);
      const newRow = [
        {columnId: 'key', value: 'Newly inserted'},
        {columnId: 'value', value: 'row'},
      ];
      component.data = {
        ...component.data,
        rows: [...component.data.rows, newRow],
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
        [{columnId: 'key', value: 'Row'}, {columnId: 'value', value: 'One'}],
        [{columnId: 'key', value: 'Row'}, {columnId: 'value', value: 'Two'}],
        [{columnId: 'key', value: 'Row'}, {columnId: 'value', value: 'Three'}],
        [{columnId: 'key', value: 'Row'}, {columnId: 'value', value: 'Four'}],
        [{columnId: 'key', value: 'Row'}, {columnId: 'value', value: 'Five'}],
        [{columnId: 'key', value: 'Row'}, {columnId: 'value', value: 'Six'}],
      ];
      const component = new DataGrid();
      component.data = {rows, columns};
      container.appendChild(component);

      renderElementIntoDOM(container);
      assertShadowRoot(component.shadowRoot);

      const scrolledElement = component.shadowRoot.querySelector('.wrapping-container');
      assertElement(scrolledElement, HTMLDivElement);
      // Select a row by clicking on it
      const row = getRowByIndex(component.shadowRoot, 0);
      dispatchClickEvent(row);

      const newRow = [
        {columnId: 'key', value: 'Newly inserted'},
        {columnId: 'value', value: 'row'},
      ];
      component.data = {
        ...component.data,
        rows: [...component.data.rows, newRow],
      };
      assert.strictEqual(scrolledElement.scrollTop, 0);
    });
  });
});
