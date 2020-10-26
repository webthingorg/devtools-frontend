// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import {Column, Row} from '../../../../../front_end/ui/components/DataGridUtils.js';

export const createColumns = (): Column[] => {
  return [
    {id: 'city', title: 'City', sortable: true, width: 40},
    {id: 'country', title: 'Country', sortable: false, width: 40},
    {id: 'population', title: 'Population', sortable: false, width: 20},
  ];
};

export const createRows = (): Row[] => {
  return [
    {
      cells: [
        {columnId: 'city', value: 'London'},
        {columnId: 'country', value: 'UK'},
        {columnId: 'population', value: '8.98m'},
      ],
    },
    {
      cells: [
        {columnId: 'city', value: 'Munich'},
        {columnId: 'country', value: 'Germany'},
        {columnId: 'population', value: '1.47m'},
      ],
    },
    {
      cells: [
        {columnId: 'city', value: 'Barcelona'},
        {columnId: 'country', value: 'Spain'},
        {columnId: 'population', value: '1.62m'},
      ],
    },
  ];
};

export const columns: Column[] = createColumns();
export const rows: Row[] = createRows();
export const columnsWithNoneSortable = createColumns().map(col => {
  col.sortable = false;
  return col;
});

Object.freeze(columns);
Object.freeze(columnsWithNoneSortable);
Object.freeze(rows);
