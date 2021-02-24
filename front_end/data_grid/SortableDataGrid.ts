// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/* eslint-disable rulesdir/no_underscored_properties */

import * as Platform from '../platform/platform.js';

import { ColumnDescriptor, Events, Parameters } from './DataGrid.js'; // eslint-disable-line no-unused-vars
import { ViewportDataGrid, ViewportDataGridNode } from './ViewportDataGrid.js';

/**
 * @template NODE_TYPE
 */
export class SortableDataGrid extends ViewportDataGrid<SortableDataGridNode<NODE_TYPE>> {
  _sortingFunction: <NODE_TYPE>(a: SortableDataGridNode<NODE_TYPE>, b: SortableDataGridNode<NODE_TYPE>) => number;
  constructor(dataGridParameters: Parameters) {
    super(dataGridParameters);
    this._sortingFunction = SortableDataGrid.TrivialComparator;
    this.setRootNode((new SortableDataGridNode() as SortableDataGridNode<NODE_TYPE>));
  }

  /**
   * @template NODE_TYPE
   */
  static TrivialComparator(a: SortableDataGridNode<NODE_TYPE>, b: SortableDataGridNode<NODE_TYPE>): number {
    return 0;
  }

  /**
   * @template NODE_TYPE
   */
  static NumericComparator(columnId: string, a: SortableDataGridNode<NODE_TYPE>, b: SortableDataGridNode<NODE_TYPE>): number {
    const aValue = a.data[columnId];
    const bValue = b.data[columnId];
    const aNumber = Number(aValue instanceof Node ? aValue.textContent : aValue);
    const bNumber = Number(bValue instanceof Node ? bValue.textContent : bValue);
    return aNumber < bNumber ? -1 : (aNumber > bNumber ? 1 : 0);
  }

  /**
   * @template NODE_TYPE
   */
  static StringComparator(columnId: string, a: SortableDataGridNode<NODE_TYPE>, b: SortableDataGridNode<NODE_TYPE>): number {
    const aValue = a.data[columnId];
    const bValue = b.data[columnId];
    const aString = aValue instanceof Node ? aValue.textContent : String(aValue);
    const bString = bValue instanceof Node ? bValue.textContent : String(bValue);
    if (!aString || !bString) {
      return 0;
    }
    return aString < bString ? -1 : (aString > bString ? 1 : 0);
  }

  /**
   * @template NODE_TYPE
   */
  static Comparator(comparator: (arg0: SortableDataGridNode<NODE_TYPE>, arg1: SortableDataGridNode<NODE_TYPE>) => number, reverseMode: boolean, a: SortableDataGridNode<NODE_TYPE>, b: SortableDataGridNode<NODE_TYPE>): number {
    return reverseMode ? comparator(b, a) : comparator(a, b);
  }

  /**
   * @template NODE_TYPE
   */
  static create(columnNames: string[], values: any[], displayName: string): SortableDataGrid<SortableDataGridNode<NODE_TYPE>> | null {
    const numColumns = columnNames.length;
    if (!numColumns) {
      return null;
    }

    const columns = ([] as ColumnDescriptor[]);
    for (let i = 0; i < columnNames.length; ++i) {
      const id = String(i);
      columns.push(({ id, title: columnNames[i], sortable: true } as ColumnDescriptor));
    }

    const nodes = [];
    for (let i = 0; i < values.length / numColumns; ++i) {
      const data: {
        [x: number]: any;
      } = {};
      for (let j = 0; j < columnNames.length; ++j) {
        data[j] = values[numColumns * i + j];
      }

      const node = new SortableDataGridNode(data);
      node.selectable = false;
      nodes.push(node);
    }

    const dataGrid = new SortableDataGrid(({ displayName, columns } as Parameters));
    const length = nodes.length;
    const rootNode = dataGrid.rootNode();
    for (let i = 0; i < length; ++i) {
      rootNode.appendChild(nodes[i]);
    }

    dataGrid.addEventListener(Events.SortingChanged, sortDataGrid);

    function sortDataGrid(): void {
      const nodes = dataGrid.rootNode().children;
      const sortColumnId = dataGrid.sortColumnId();
      if (!sortColumnId) {
        return;
      }

      let columnIsNumeric = true;
      for (let i = 0; i < nodes.length; i++) {
        const value = nodes[i].data[sortColumnId];
        if (isNaN(value instanceof Node ? value.textContent : value)) {
          columnIsNumeric = false;
          break;
        }
      }

      const comparator = columnIsNumeric ? SortableDataGrid.NumericComparator : SortableDataGrid.StringComparator;
      dataGrid.sortNodes(comparator.bind(null, sortColumnId), !dataGrid.isSortOrderAscending());
    }
    return dataGrid;
  }

  insertChild(node: SortableDataGridNode<NODE_TYPE>): void {
    const root = (this.rootNode() as SortableDataGridNode<NODE_TYPE>);
    root.insertChildOrdered(node);
  }

  sortNodes(comparator: (arg0: SortableDataGridNode<NODE_TYPE>, arg1: SortableDataGridNode<NODE_TYPE>) => number, reverseMode: boolean): void {
    this._sortingFunction = SortableDataGrid.Comparator.bind(null, comparator, reverseMode);
    this.rootNode().recalculateSiblings(0);
    (this.rootNode() as SortableDataGridNode<NODE_TYPE>)._sortChildren();
    this.scheduleUpdateStructure();
  }
}

/**
 * @template NODE_TYPE
 */
export class SortableDataGridNode extends ViewportDataGridNode<SortableDataGridNode<NODE_TYPE>> {
  constructor(data?: {
    [x: string]: any;
  } | null, hasChildren?: boolean) {
    super(data, hasChildren);
  }

  insertChildOrdered(node: SortableDataGridNode<NODE_TYPE>): void {
    const dataGrid = (this.dataGrid as SortableDataGrid<NODE_TYPE> | null);
    if (dataGrid) {
      this.insertChild(node, Platform.ArrayUtilities.upperBound((this.children as SortableDataGridNode<NODE_TYPE>[]), node, dataGrid._sortingFunction));
    }
  }

  _sortChildren(): void {
    const dataGrid = (this.dataGrid as SortableDataGrid<NODE_TYPE> | null);
    if (!dataGrid) {
      return;
    }
    (this.children as SortableDataGridNode<NODE_TYPE>[]).sort(dataGrid._sortingFunction);
    for (let i = 0; i < this.children.length; ++i) {
      const child = (this.children[i] as SortableDataGridNode<NODE_TYPE>);
      child.recalculateSiblings(i);
    }
    for (let i = 0; i < this.children.length; ++i) {
      const child = (this.children[i] as SortableDataGridNode<NODE_TYPE>);
      child._sortChildren();
    }
  }
}
