// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {DataGridController} from '../../../../../front_end/ui/components/DataGridController.js';
import {Row, RowSelectedEvent} from '../../../../../front_end/ui/components/DataGridUtils.js';
import {assertElement, assertNotNull, assertElements, assertShadowRoot, dispatchClickEvent, renderElementIntoDOM} from '../../helpers/DOMHelpers.js';
import {withMutations, withNoMutations} from '../../helpers/MutationHelpers.js';

import {getHeaderCellForColumnId, getHeaderCells, getRowByIndex, getValuesForColumn, getValuesOfRow} from './DataGridHelpers.js';

const {assert} = chai;


describe.only('DataGridController', () => {
  describe('sorting the columns', () => {
    const columns = [
      {id: 'key', title: 'Key', sortable: true},
    ];
    const rows = [
      [{columnId: 'key', value: 'Bravo'}],
      [{columnId: 'key', value: 'Alpha'}],
      [{columnId: 'key', value: 'Charlie'}],
    ];

    it.only('lets the user click to sort the column in ASC order', async () => {
      const component = new DataGridController();
      component.data = {rows, columns};

      renderElementIntoDOM(component);
      assertShadowRoot(component.shadowRoot);

      const internalDataGrid = component.shadowRoot.querySelector('devtools-data-grid');

      assertNotNull(internalDataGrid);
      const internalShadow = internalDataGrid.shadowRoot;
      assertShadowRoot(internalShadow);

      await withNoMutations(internalShadow, shadowRoot => {
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

      const keyHeader = getHeaderCellForColumnId(component.shadowRoot, 'key');
      dispatchClickEvent(keyHeader);  // ASC order
      dispatchClickEvent(keyHeader);  // DESC order
      const cellValues = getValuesForColumn(component.shadowRoot, 'key');

      assert.deepEqual(cellValues, ['Charlie', 'Bravo', 'Alpha']);
    });

    it('resets the sort if the column is DESC', () => {
      const component = new DataGridController();
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
      const component = new DataGridController();
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
  });
});
