// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {DataGridController} from '../../../../../front_end/ui/components/DataGridController.js';
import {Row} from '../../../../../front_end/ui/components/DataGridUtils.js';
import {assertElement, assertNotNull, assertShadowRoot, dispatchClickEvent, renderElementIntoDOM} from '../../helpers/DOMHelpers.js';
import {TEXT_NODE, withMutations, withNoMutations} from '../../helpers/MutationHelpers.js';

import {getHeaderCellForColumnId, getRowByIndex, getSelectedRow, getValuesForColumn, getValuesOfAllRows} from './DataGridHelpers.js';

const {assert} = chai;


const getInternalDataGridShadowRoot = (component: DataGridController): ShadowRoot => {
  assertShadowRoot(component.shadowRoot);
  const internalDataGrid = component.shadowRoot.querySelector('devtools-data-grid');
  assertNotNull(internalDataGrid);
  const internalShadow = internalDataGrid.shadowRoot;
  assertShadowRoot(internalShadow);
  return internalShadow;
};

describe('DataGridController', () => {
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
      const component = new DataGridController();
      component.data = {rows, columns};

      renderElementIntoDOM(component);
      assertShadowRoot(component.shadowRoot);

      const internalDataGridShadow = getInternalDataGridShadowRoot(component);

      await withMutations(
          [{
            // Two text mutations as LitHtml updates the text nodes but does not
            // touch the actual DOM nodes.
            target: TEXT_NODE,
            max: 2,
          }],
          internalDataGridShadow, shadowRoot => {
            const keyHeader = getHeaderCellForColumnId(shadowRoot, 'key');
            dispatchClickEvent(keyHeader);
            const cellValues = getValuesForColumn(shadowRoot, 'key');
            assert.deepEqual(cellValues, ['Alpha', 'Bravo', 'Charlie']);
          });
    });

    it('lets the user click twice to sort the column in DESC order', () => {
      const component = new DataGridController();
      component.data = {rows, columns};

      renderElementIntoDOM(component);
      assertShadowRoot(component.shadowRoot);
      const internalDataGridShadow = getInternalDataGridShadowRoot(component);

      const keyHeader = getHeaderCellForColumnId(internalDataGridShadow, 'key');
      dispatchClickEvent(keyHeader);  // ASC order
      dispatchClickEvent(keyHeader);  // DESC order
      const cellValues = getValuesForColumn(internalDataGridShadow, 'key');
      assert.deepEqual(cellValues, ['Charlie', 'Bravo', 'Alpha']);
    });

    it('resets the sort if the user clicks after setting the sort to DESC', () => {
      const component = new DataGridController();
      component.data = {rows, columns};

      renderElementIntoDOM(component);
      assertShadowRoot(component.shadowRoot);
      const internalDataGridShadow = getInternalDataGridShadowRoot(component);

      const keyHeader = getHeaderCellForColumnId(internalDataGridShadow, 'key');
      const originalCellValues = getValuesForColumn(internalDataGridShadow, 'key');
      dispatchClickEvent(keyHeader);  // ASC order
      dispatchClickEvent(keyHeader);  // DESC order
      dispatchClickEvent(keyHeader);  // Now reset!
      const finalCellValues = getValuesForColumn(internalDataGridShadow, 'key');
      assert.deepEqual(finalCellValues, originalCellValues);
    });
  });

  describe('filtering rows', () => {
    const columns = [
      {id: 'key', title: 'Letter', sortable: true},
      {id: 'value', title: 'Phonetic', sortable: true},
    ];
    const rows = [
      [{columnId: 'key', value: 'Letter A'}, {columnId: 'value', value: 'Alpha'}],
      [{columnId: 'key', value: 'Letter B'}, {columnId: 'value', value: 'Bravo'}],
      [{columnId: 'key', value: 'Letter C'}, {columnId: 'value', value: 'Charlie'}],
    ];

    it('only shows rows with values that match the filter', () => {
      const component = new DataGridController();
      component.data = {rows, columns, filterText: 'Bravo'};

      renderElementIntoDOM(component);
      assertShadowRoot(component.shadowRoot);
      const internalDataGridShadow = getInternalDataGridShadowRoot(component);
      const renderedRowValues = getValuesOfAllRows(internalDataGridShadow);
      assert.deepEqual(renderedRowValues, [
        ['Letter B', 'Bravo'],
      ]);
    });

    it('shows all rows if the filter is then cleared', () => {
      const component = new DataGridController();
      component.data = {rows, columns, filterText: 'Bravo'};

      renderElementIntoDOM(component);
      assertShadowRoot(component.shadowRoot);
      const internalDataGridShadow = getInternalDataGridShadowRoot(component);
      let renderedRowValues = getValuesOfAllRows(internalDataGridShadow);
      assert.lengthOf(renderedRowValues, 1);
      component.data = {
        ...component.data,
        filterText: undefined,
      };
      renderedRowValues = getValuesOfAllRows(internalDataGridShadow);
      assert.lengthOf(renderedRowValues, 3);
    });

    it('supports filtering by column using :', () => {
      const component = new DataGridController();
      component.data = {rows, columns, filterText: 'Letter:A'};

      renderElementIntoDOM(component);
      assertShadowRoot(component.shadowRoot);
      const internalDataGridShadow = getInternalDataGridShadowRoot(component);
      const renderedRowValues = getValuesOfAllRows(internalDataGridShadow);
      assert.deepEqual(renderedRowValues, [
        ['Letter A', 'Alpha'],
      ]);
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
      const component = new DataGridController();
      component.data = {rows, columns};

      renderElementIntoDOM(component);
      assertShadowRoot(component.shadowRoot);

      const internalDataGridShadow = getInternalDataGridShadowRoot(component);
      await withNoMutations(internalDataGridShadow, shadowRoot => {
        const currentSelectedRow = getSelectedRow(shadowRoot);
        assert.isNull(currentSelectedRow, 'There is no current selected row');
        const firstRow = getRowByIndex(shadowRoot, 0);
        dispatchClickEvent(firstRow);
        assert.strictEqual(firstRow, getSelectedRow(shadowRoot));

        const table = shadowRoot.querySelector('table');
        assertElement(table, HTMLTableElement);
        assert.isTrue(table.hasFocus());
      });
    });
  });
});
