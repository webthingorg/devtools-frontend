// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
// eslint-disable-next-line rulesdir/es_modules_import
import * as UI from '../../ui/ui.js';

import type {DataGrid} from './DataGrid.js';
import {ContextMenuColumnSortClickEvent} from './DataGridUtils.js';
import type {Column} from './DataGridUtils.js';

function toggleColumnVisibility(dataGrid: DataGrid, column: Column): void {
  const newVisibility = !column.visible;
  const newColumns = dataGrid.data.columns.map(col => {
    if (col === column) {
      col.visible = newVisibility;
    }
    return col;
  });
  dataGrid.data = {
    ...dataGrid.data,
    columns: newColumns,
  };
}

export function addColumnVisibilityCheckboxes(
    dataGrid: DataGrid, contextMenu: UI.ContextMenu.ContextMenu|UI.ContextMenu.SubMenu): void {
  const {columns} = dataGrid.data;

  for (const column of columns) {
    if (!column.hideable) {
      continue;
    }
    /**
       * Append checkboxes for each column that is hideable; these will show
       * with checkboxes if the column is visible and allow the user to click in
       * the context menu to toggle an individual column's visibility.
       */
    contextMenu.defaultSection().appendCheckboxItem(column.title, () => {
      toggleColumnVisibility(dataGrid, column);
    }, column.visible);
  }
}

export function addSortableColumnItems(
    dataGrid: DataGrid, contextMenu: UI.ContextMenu.ContextMenu|UI.ContextMenu.SubMenu): void {
  const sortableColumns = dataGrid.data.columns.filter(col => col.sortable === true);
  if (sortableColumns.length > 0) {
    for (const column of sortableColumns) {
      contextMenu.defaultSection().appendItem(column.title, () => {
        dataGrid.dispatchEvent(new ContextMenuColumnSortClickEvent(column));
      });
    }
  }
}
