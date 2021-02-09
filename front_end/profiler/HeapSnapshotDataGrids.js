/*
 * Copyright (C) 2012 Google Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import * as Components from '../components/components.js';
import * as DataGrid from '../data_grid/data_grid.js';
import * as HeapSnapshotModel from '../heap_snapshot_model/heap_snapshot_model.js';
import * as i18n from '../i18n/i18n.js';
import * as SDK from '../sdk/sdk.js';  // eslint-disable-line no-unused-vars
import * as UI from '../ui/ui.js';

import {AllocationGridNode, HeapSnapshotConstructorNode, HeapSnapshotDiffNode, HeapSnapshotGenericObjectNode, HeapSnapshotGridNode, HeapSnapshotObjectNode, HeapSnapshotRetainingObjectNode,} from './HeapSnapshotGridNodes.js';  // eslint-disable-line no-unused-vars
import {HeapSnapshotProxy} from './HeapSnapshotProxy.js';               // eslint-disable-line no-unused-vars
import {HeapProfileHeader} from './HeapSnapshotView.js';                // eslint-disable-line no-unused-vars
import {DataDisplayDelegate, ProfileHeader} from './ProfileHeader.js';  // eslint-disable-line no-unused-vars

export const UIStrings = {
  /**
  *@description Text in Heap Snapshot Data Grids of a profiler tool
  */
  distanceFromWindowObject: 'Distance from window object',
  /**
  *@description Text in Heap Snapshot Data Grids of a profiler tool
  */
  sizeOfTheObjectItselfInBytes: 'Size of the object itself in bytes',
  /**
  *@description Text in Heap Snapshot Data Grids of a profiler tool
  */
  sizeOfTheObjectPlusTheGraphIt: 'Size of the object plus the graph it retains in bytes',
  /**
  *@description Text in Heap Snapshot Data Grids of a profiler tool
  */
  object: 'Object',
  /**
  *@description Text in Heap Snapshot Data Grids of a profiler tool
  */
  distance: 'Distance',
  /**
  *@description Text in Heap Snapshot Data Grids of a profiler tool
  */
  shallowSize: 'Shallow Size',
  /**
  *@description Text in Heap Snapshot Data Grids of a profiler tool
  */
  retainedSize: 'Retained Size',
  /**
  *@description Data grid name for Heap Snapshot Retainment data grids
  */
  heapSnapshotRetainment: 'Heap Snapshot Retainment',
  /**
  *@description Text in Heap Snapshot Data Grids of a profiler tool
  */
  constructorString: 'Constructor',
  /**
  *@description Data grid name for Heap Snapshot Constructors data grids
  */
  heapSnapshotConstructors: 'Heap Snapshot Constructors',
  /**
  *@description Text in Heap Snapshot Data Grids of a profiler tool
  */
  New: '# New',
  /**
  *@description Text in Heap Snapshot Data Grids of a profiler tool
  */
  Deleted: '# Deleted',
  /**
  *@description Text in Heap Snapshot Data Grids of a profiler tool
  */
  Delta: '# Delta',
  /**
  *@description Text in Heap Snapshot Data Grids of a profiler tool
  */
  allocSize: 'Alloc. Size',
  /**
  *@description Text in Heap Snapshot Data Grids of a profiler tool
  */
  freedSize: 'Freed Size',
  /**
  *@description Text in Heap Snapshot Data Grids of a profiler tool
  */
  sizeDelta: 'Size Delta',
  /**
  *@description Data grid name for Heap Snapshot Diff data grids
  */
  heapSnapshotDiff: 'Heap Snapshot Diff',
  /**
  *@description Text in Heap Snapshot Data Grids of a profiler tool
  */
  liveCount: 'Live Count',
  /**
  *@description Text in Heap Snapshot Data Grids of a profiler tool
  */
  count: 'Count',
  /**
  *@description Text in Heap Snapshot Data Grids of a profiler tool
  */
  liveSize: 'Live Size',
  /**
  *@description Text for the size of something
  */
  size: 'Size',
  /**
  *@description Text for a programming function
  */
  function: 'Function',
  /**
  *@description Text in Heap Snapshot View of a profiler tool
  */
  allocation: 'Allocation',
};
const str_ = i18n.i18n.registerUIStrings('profiler/HeapSnapshotDataGrids.js', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);
const i18nLazyString = i18n.i18n.getLazilyComputedLocalizedString.bind(undefined, str_);

/** @type {!WeakMap<!DataGrid.DataGrid.DataGridNode<!HeapSnapshotGridNode>, !Array<!HeapSnapshotGridNode>>} */
const adjacencyMap = new WeakMap();

/**
 * @extends DataGrid.DataGrid.DataGridImpl<!HeapSnapshotGridNode>
 */
export class HeapSnapshotSortableDataGrid extends DataGrid.DataGrid.DataGridImpl {
  /**
   * @param {?SDK.HeapProfilerModel.HeapProfilerModel} heapProfilerModel
   * @param {!DataDisplayDelegate} dataDisplayDelegate
   * @param {!DataGrid.DataGrid.Parameters} dataGridParameters
   */
  constructor(heapProfilerModel, dataDisplayDelegate, dataGridParameters) {
    // TODO(allada) This entire class needs to be converted to use the templates in DataGridNode.
    super(dataGridParameters);
    /** @type {?HeapSnapshotProxy} */
    this.snapshot = null;
    /** @type {?HeapSnapshotGridNode} */
    this.selectedNode = null;
    this._heapProfilerModel = heapProfilerModel;
    this._dataDisplayDelegate = dataDisplayDelegate;
    const tooltips = [
      ['distance', i18nString(UIStrings.distanceFromWindowObject)],
      ['shallowSize', i18nString(UIStrings.sizeOfTheObjectItselfInBytes)],
      ['retainedSize', i18nString(UIStrings.sizeOfTheObjectPlusTheGraphIt)]
    ];
    for (const info of tooltips) {
      const headerCell = this.headerTableHeader(info[0]);
      if (headerCell) {
        headerCell.setAttribute('title', info[1]);
      }
    }

    /**
     * @type {number}
     */
    this._recursiveSortingDepth = 0;
    /**
     * @type {?HeapSnapshotGridNode}
     */
    this._highlightedNode = null;
    /**
     * @type {boolean}
     */
    this._populatedAndSorted = false;
    /**
     * @type {?UI.Toolbar.ToolbarInput}
     */
    this._nameFilter = null;
    /** @type {!HeapSnapshotModel.HeapSnapshotModel.NodeFilter|undefined} */
    this._nodeFilter = new HeapSnapshotModel.HeapSnapshotModel.NodeFilter();
    this.addEventListener(HeapSnapshotSortableDataGridEvents.SortingComplete, this._sortingComplete, this);
    this.addEventListener(DataGrid.DataGrid.Events.SortingChanged, this.sortingChanged, this);
    this.setRowContextMenuCallback(this._populateContextMenu.bind(this));
  }

  /**
   * @param {!HeapSnapshotProxy} snapshot
   * @param {number} nodeIndex
   */
  async setDataSource(snapshot, nodeIndex) {
  }

  /**
   * @param {!HeapSnapshotGridNode} node
   * @return {boolean}
   */
  _isFilteredOut(node) {
    const nameFilterValue = this._nameFilter ? this._nameFilter.value().toLowerCase() : '';
    if (nameFilterValue && (node instanceof HeapSnapshotDiffNode || node instanceof HeapSnapshotConstructorNode) &&
        node.filteredOut(nameFilterValue)) {
      return true;
    }
    return false;
  }

  /**
   * @return {?SDK.HeapProfilerModel.HeapProfilerModel}
   */
  heapProfilerModel() {
    return this._heapProfilerModel;
  }

  /**
   * @return {!DataDisplayDelegate}
   */
  dataDisplayDelegate() {
    return this._dataDisplayDelegate;
  }

  /**
   * @return {!HeapSnapshotModel.HeapSnapshotModel.NodeFilter|undefined}
   */
  nodeFilter() {
    return this._nodeFilter;
  }

  /**
   * @param {!UI.Toolbar.ToolbarInput} nameFilter
   */
  setNameFilter(nameFilter) {
    this._nameFilter = nameFilter;
  }

  /**
   * @return {number}
   */
  defaultPopulateCount() {
    return 100;
  }

  _disposeAllNodes() {
    const children = this.topLevelNodes();
    for (let i = 0, l = children.length; i < l; ++i) {
      children[i].dispose();
    }
  }

  /**
   * @override
   */
  wasShown() {
    if (this._nameFilter) {
      this._nameFilter.addEventListener(UI.Toolbar.ToolbarInput.Event.TextChanged, this._onNameFilterChanged, this);
      this.updateVisibleNodes(true);
    }
    if (this._populatedAndSorted) {
      this.dispatchEventToListeners(HeapSnapshotSortableDataGridEvents.ContentShown, this);
    }
  }

  _sortingComplete() {
    this.removeEventListener(HeapSnapshotSortableDataGridEvents.SortingComplete, this._sortingComplete, this);
    this._populatedAndSorted = true;
    this.dispatchEventToListeners(HeapSnapshotSortableDataGridEvents.ContentShown, this);
  }

  /**
   * @override
   */
  willHide() {
    if (this._nameFilter) {
      this._nameFilter.removeEventListener(UI.Toolbar.ToolbarInput.Event.TextChanged, this._onNameFilterChanged, this);
    }
    this._clearCurrentHighlight();
  }

  /**
   * @param {!UI.ContextMenu.ContextMenu} contextMenu
   * @param {!DataGrid.DataGrid.DataGridNode<!HeapSnapshotGridNode>} gridNode
   */
  _populateContextMenu(contextMenu, gridNode) {
    const node = /** @type {!HeapSnapshotGridNode} */ (gridNode);
    node.populateContextMenu(contextMenu, this._dataDisplayDelegate, this.heapProfilerModel());

    if (node instanceof HeapSnapshotGenericObjectNode && node.linkElement &&
        !contextMenu.containsTarget(node.linkElement)) {
      contextMenu.appendApplicableItems(node.linkElement);
    }
  }

  resetSortingCache() {
    delete this._lastSortColumnId;
    delete this._lastSortAscending;
  }

  /**
   * @return {!Array<!HeapSnapshotGridNode>}
   */
  topLevelNodes() {
    return /** @type {!Array<!HeapSnapshotGridNode>}*/ (this.rootNode().children);
  }

  /**
   * @param {!Protocol.HeapProfiler.HeapSnapshotObjectId} heapSnapshotObjectId
   * @return {!Promise<?HeapSnapshotGridNode>}
   */
  revealObjectByHeapSnapshotId(heapSnapshotObjectId) {
    return Promise.resolve(/** @type {?HeapSnapshotGridNode} */ (null));
  }

  /**
   * @param {!HeapSnapshotGridNode} node
   */
  highlightNode(node) {
    this._clearCurrentHighlight();
    this._highlightedNode = node;
    UI.UIUtils.runCSSAnimationOnce(this._highlightedNode.element(), 'highlighted-row');
  }

  _clearCurrentHighlight() {
    if (!this._highlightedNode) {
      return;
    }
    this._highlightedNode.element().classList.remove('highlighted-row');
    this._highlightedNode = null;
  }

  resetNameFilter() {
    if (this._nameFilter) {
      this._nameFilter.setValue('');
    }
  }

  _onNameFilterChanged() {
    this.updateVisibleNodes(true);
    this._deselectFilteredNodes();
  }

  _deselectFilteredNodes() {
    let currentNode = this.selectedNode;
    while (currentNode) {
      if (this.selectedNode && this._isFilteredOut(/** @type {!HeapSnapshotGridNode} */ (currentNode))) {
        this.selectedNode.deselect();
        this.selectedNode = null;
        return;
      }
      currentNode = /** @type {?HeapSnapshotGridNode} */ (currentNode.parent);
    }
  }

  /**
   * @param {string} sortColumnId
   * @param {boolean} ascending
   * @return {!HeapSnapshotModel.HeapSnapshotModel.ComparatorConfig}
   */
  _sortFields(sortColumnId, ascending) {
    throw new Error('Not implemented');
  }

  sortingChanged() {
    const sortAscending = this.isSortOrderAscending();
    const sortColumnId = this.sortColumnId();
    if (this._lastSortColumnId === sortColumnId && this._lastSortAscending === sortAscending) {
      return;
    }
    /** @type {?string} */
    this._lastSortColumnId = sortColumnId;
    /** @type {boolean} */
    this._lastSortAscending = sortAscending;
    const sortFields = this._sortFields(sortColumnId || '', sortAscending);

    /**
     * @param {!DataGrid.DataGrid.DataGridNode<!HeapSnapshotGridNode>} nodeA
     * @param {!DataGrid.DataGrid.DataGridNode<!HeapSnapshotGridNode>} nodeB
     */
    function SortByTwoFields(nodeA, nodeB) {
      // @ts-ignore
      let field1 = nodeA[sortFields.fieldName1];
      // @ts-ignore
      let field2 = nodeB[sortFields.fieldName1];
      let result = field1 < field2 ? -1 : (field1 > field2 ? 1 : 0);
      if (!sortFields.ascending1) {
        result = -result;
      }
      if (result !== 0) {
        return result;
      }
      // @ts-ignore
      field1 = nodeA[sortFields.fieldName2];
      // @ts-ignore
      field2 = nodeB[sortFields.fieldName2];
      result = field1 < field2 ? -1 : (field1 > field2 ? 1 : 0);
      if (!sortFields.ascending2) {
        result = -result;
      }
      return result;
    }
    this._performSorting(SortByTwoFields);
  }

  /**
   * @param {function(!DataGrid.DataGrid.DataGridNode<!HeapSnapshotGridNode>, !DataGrid.DataGrid.DataGridNode<!HeapSnapshotGridNode>): number} sortFunction
   */
  _performSorting(sortFunction) {
    this.recursiveSortingEnter();
    const children = this.allChildren(this.rootNode());
    this.rootNode().removeChildren();
    children.sort(sortFunction);
    for (let i = 0, l = children.length; i < l; ++i) {
      const child = /** @type {!HeapSnapshotGridNode} */ (children[i]);
      this.appendChildAfterSorting(child);
      if (child.expanded) {
        child.sort();
      }
    }
    this.recursiveSortingLeave();
  }

  /**
   * @param {!HeapSnapshotGridNode} child
   */
  appendChildAfterSorting(child) {
    const revealed = child.revealed;
    this.rootNode().appendChild(child);
    child.revealed = revealed;
  }

  recursiveSortingEnter() {
    ++this._recursiveSortingDepth;
  }

  recursiveSortingLeave() {
    if (!this._recursiveSortingDepth) {
      return;
    }
    if (--this._recursiveSortingDepth) {
      return;
    }
    this.updateVisibleNodes(true);
    this.dispatchEventToListeners(HeapSnapshotSortableDataGridEvents.SortingComplete);
  }

  /**
   * @param {boolean} force
   */
  updateVisibleNodes(force) {
  }

  /**
   * @param {!DataGrid.DataGrid.DataGridNode<!HeapSnapshotGridNode>} parent
   * @return {!Array.<!DataGrid.DataGrid.DataGridNode<!HeapSnapshotGridNode>>}
   */
  allChildren(parent) {
    return parent.children;
  }

  /**
   * @param {!HeapSnapshotGridNode} parent
   * @param {!HeapSnapshotGridNode} node
   * @param {number} index
   */
  insertChild(parent, node, index) {
    parent.insertChild(node, index);
  }

  /**
   * @param {!HeapSnapshotGridNode} parent
   * @param {number} index
   */
  removeChildByIndex(parent, index) {
    parent.removeChild(parent.children[index]);
  }

  /**
   * @param {!HeapSnapshotGridNode} parent
   */
  removeAllChildren(parent) {
    parent.removeChildren();
  }
}

/**
 * @enum {symbol}
 */
export const HeapSnapshotSortableDataGridEvents = {
  ContentShown: Symbol('ContentShown'),
  SortingComplete: Symbol('SortingComplete')
};

export class HeapSnapshotViewportDataGrid extends HeapSnapshotSortableDataGrid {
  /**
   * @param {?SDK.HeapProfilerModel.HeapProfilerModel} heapProfilerModel
   * @param {!DataDisplayDelegate} dataDisplayDelegate
   * @param {!DataGrid.DataGrid.Parameters} dataGridParameters
   */
  constructor(heapProfilerModel, dataDisplayDelegate, dataGridParameters) {
    super(heapProfilerModel, dataDisplayDelegate, dataGridParameters);
    this.scrollContainer.addEventListener('scroll', this._onScroll.bind(this), true);
    this._topPaddingHeight = 0;
    this._bottomPaddingHeight = 0;
    /** @type {?HeapSnapshotGridNode} */
    this.selectedNode = null;
  }

  /**
   * @override
   * @return {!Array.<!HeapSnapshotGridNode>}
   */
  topLevelNodes() {
    return this.allChildren(this.rootNode());
  }

  /**
   * @override
   * @param {!HeapSnapshotGridNode} child
   */
  appendChildAfterSorting(child) {
    // Do nothing here, it will be added in updateVisibleNodes.
  }

  /**
   * @override
   * @param {boolean} force
   */
  updateVisibleNodes(force) {
    // Guard zone is used to ensure there are always some extra items
    // above and below the viewport to support keyboard navigation.
    const guardZoneHeight = 40;
    const scrollHeight = this.scrollContainer.scrollHeight;
    let scrollTop = this.scrollContainer.scrollTop;
    let scrollBottom = scrollHeight - scrollTop - this.scrollContainer.offsetHeight;
    scrollTop = Math.max(0, scrollTop - guardZoneHeight);
    scrollBottom = Math.max(0, scrollBottom - guardZoneHeight);
    let viewPortHeight = scrollHeight - scrollTop - scrollBottom;
    // Do nothing if populated nodes still fit the viewport.
    if (!force && scrollTop >= this._topPaddingHeight && scrollBottom >= this._bottomPaddingHeight) {
      return;
    }
    const hysteresisHeight = 500;
    scrollTop -= hysteresisHeight;
    viewPortHeight += 2 * hysteresisHeight;
    const selectedNode = this.selectedNode;
    this.rootNode().removeChildren();

    this._topPaddingHeight = 0;
    this._bottomPaddingHeight = 0;

    this._addVisibleNodes(this.rootNode(), scrollTop, scrollTop + viewPortHeight);

    this.setVerticalPadding(this._topPaddingHeight, this._bottomPaddingHeight);

    if (selectedNode) {
      // Keep selection even if the node is not in the current viewport.
      if (selectedNode.parent) {
        selectedNode.select(true);
      } else {
        /** @type {?HeapSnapshotGridNode} */
        this.selectedNode = selectedNode;
      }
    }
  }

  /**
   * @param {!DataGrid.DataGrid.DataGridNode<!HeapSnapshotGridNode>} parentNode
   * @param {number} topBound
   * @param {number} bottomBound
   * @return {number}
   */
  _addVisibleNodes(parentNode, topBound, bottomBound) {
    if (!parentNode.expanded) {
      return 0;
    }

    const children = this.allChildren(/** @type {!HeapSnapshotGridNode} */ (parentNode));
    let topPadding = 0;
    // Iterate over invisible nodes beyond the upper bound of viewport.
    // Do not insert them into the grid, but count their total height.
    let i = 0;
    for (; i < children.length; ++i) {
      const child = children[i];
      if (this._isFilteredOut(child)) {
        continue;
      }
      const newTop = topPadding + this._nodeHeight(child);
      if (newTop > topBound) {
        break;
      }
      topPadding = newTop;
    }

    // Put visible nodes into the data grid.
    let position = topPadding;
    for (; i < children.length && position < bottomBound; ++i) {
      const child = children[i];
      if (this._isFilteredOut(child)) {
        continue;
      }
      const hasChildren = child.hasChildren();
      child.removeChildren();
      child.setHasChildren(hasChildren);
      parentNode.appendChild(child);
      position += child.nodeSelfHeight();
      position += this._addVisibleNodes(child, topBound - position, bottomBound - position);
    }

    // Count the invisible nodes beyond the bottom bound of the viewport.
    let bottomPadding = 0;
    for (; i < children.length; ++i) {
      const child = children[i];
      if (this._isFilteredOut(child)) {
        continue;
      }
      bottomPadding += this._nodeHeight(child);
    }

    this._topPaddingHeight += topPadding;
    this._bottomPaddingHeight += bottomPadding;
    return position + bottomPadding;
  }

  /**
   * @param {!HeapSnapshotGridNode} node
   * @return {number}
   */
  _nodeHeight(node) {
    let result = node.nodeSelfHeight();
    if (!node.expanded) {
      return result;
    }
    const children = this.allChildren(node);
    for (let i = 0; i < children.length; i++) {
      result += this._nodeHeight(children[i]);
    }
    return result;
  }

  /**
   * @param {!Array<!HeapSnapshotGridNode>} pathToReveal
   * @return {!Promise<!HeapSnapshotGridNode>}
   */
  revealTreeNode(pathToReveal) {
    const height = this._calculateOffset(pathToReveal);
    const node = /** @type {!HeapSnapshotGridNode} */ (pathToReveal[pathToReveal.length - 1]);
    const scrollTop = this.scrollContainer.scrollTop;
    const scrollBottom = scrollTop + this.scrollContainer.offsetHeight;
    if (height >= scrollTop && height < scrollBottom) {
      return Promise.resolve(node);
    }

    const scrollGap = 40;
    this.scrollContainer.scrollTop = Math.max(0, height - scrollGap);
    return new Promise(resolve => {
      console.assert(!this._scrollToResolveCallback);
      this._scrollToResolveCallback = resolve.bind(null, node);
      // Still resolve the promise if it does not scroll for some reason.
      this.scrollContainer.window().requestAnimationFrame(() => {
        if (!this._scrollToResolveCallback) {
          return;
        }
        this._scrollToResolveCallback();
        this._scrollToResolveCallback = null;
      });
    });
  }

  /**
   * @param {!Array.<!HeapSnapshotGridNode>} pathToReveal
   * @return {number}
   */
  _calculateOffset(pathToReveal) {
    let parentNode = this.rootNode();
    let height = 0;
    if (pathToReveal.length === 0) {
      return 0;
    }
    for (let i = 0; i < pathToReveal.length; ++i) {
      const node = pathToReveal[i];
      const children = this.allChildren(parentNode);
      for (let j = 0; j < children.length; ++j) {
        const child = children[j];
        if (node === child) {
          height += node.nodeSelfHeight();
          break;
        }
        height += this._nodeHeight(child);
      }
      parentNode = node;
    }
    return height - /** @type {!HeapSnapshotGridNode} */ (pathToReveal[pathToReveal.length - 1]).nodeSelfHeight();
  }

  /**
   * @override
   * @param {!DataGrid.DataGrid.DataGridNode<!HeapSnapshotGridNode>} parent
   * @return {!Array.<!HeapSnapshotGridNode>}
   */
  allChildren(parent) {
    const children = adjacencyMap.get(parent) || [];
    if (!adjacencyMap.has(parent)) {
      adjacencyMap.set(parent, children);
    }
    return children;
  }

  /**
   * @param {!DataGrid.DataGrid.DataGridNode<!HeapSnapshotGridNode>} parent
   * @param {!HeapSnapshotGridNode} node
   */
  appendNode(parent, node) {
    this.allChildren(parent).push(node);
  }

  /**
   * @override
   * @param {!HeapSnapshotGridNode} parent
   * @param {!HeapSnapshotGridNode} node
   * @param {number} index
   */
  insertChild(parent, node, index) {
    this.allChildren(parent).splice(index, 0, /** @type {!HeapSnapshotGridNode} */ (node));
  }

  /**
   * @override
   * @param {!HeapSnapshotGridNode} parent
   * @param {number} index
   */
  removeChildByIndex(parent, index) {
    this.allChildren(parent).splice(index, 1);
  }

  /**
     * @override
     * @param {!HeapSnapshotGridNode} parent
     */
  removeAllChildren(parent) {
    adjacencyMap.delete(parent);
  }

  removeTopLevelNodes() {
    this._disposeAllNodes();
    this.rootNode().removeChildren();
    this.removeAllChildren(/** @type {!HeapSnapshotGridNode} */ (this.rootNode()));
  }

  /**
   * @param {!HTMLElement} element
   * @return {boolean}
   */
  _isScrolledIntoView(element) {
    const viewportTop = this.scrollContainer.scrollTop;
    const viewportBottom = viewportTop + this.scrollContainer.clientHeight;
    const elemTop = element.offsetTop;
    const elemBottom = elemTop + element.offsetHeight;
    return elemBottom <= viewportBottom && elemTop >= viewportTop;
  }

  /**
   * @override
   */
  onResize() {
    super.onResize();
    this.updateVisibleNodes(false);
  }

  /**
   * @param {!Event} event
   */
  _onScroll(event) {
    this.updateVisibleNodes(false);

    if (this._scrollToResolveCallback) {
      this._scrollToResolveCallback();
      this._scrollToResolveCallback = null;
    }
  }
}

export class HeapSnapshotContainmentDataGrid extends HeapSnapshotSortableDataGrid {
  /**
   * @param {?SDK.HeapProfilerModel.HeapProfilerModel} heapProfilerModel
   * @param {!DataDisplayDelegate} dataDisplayDelegate
   * @param {string} displayName
   * @param {!Array.<!DataGrid.DataGrid.ColumnDescriptor>=} columns
   */
  constructor(heapProfilerModel, dataDisplayDelegate, displayName, columns) {
    columns =
        columns || (/** @type {!Array<!DataGrid.DataGrid.ColumnDescriptor>} */ ([
          {id: 'object', title: i18nLazyString(UIStrings.object), disclosure: true, sortable: true},
          {id: 'distance', title: i18nLazyString(UIStrings.distance), width: '70px', sortable: true, fixedWidth: true},
          {
            id: 'shallowSize',
            title: i18nLazyString(UIStrings.shallowSize),
            width: '110px',
            sortable: true,
            fixedWidth: true
          },
          {
            id: 'retainedSize',
            title: i18nLazyString(UIStrings.retainedSize),
            width: '110px',
            sortable: true,
            fixedWidth: true,
            sort: DataGrid.DataGrid.Order.Descending
          }
        ]));
    const lazyDisplayName = () => displayName;
    const dataGridParameters = /** @type {!DataGrid.DataGrid.Parameters} */ ({displayName: lazyDisplayName, columns});
    super(heapProfilerModel, dataDisplayDelegate, dataGridParameters);
  }

  /**
   * @override
   * @param {!HeapSnapshotProxy} snapshot
   * @param {number} nodeIndex
   */
  async setDataSource(snapshot, nodeIndex) {
    this.snapshot = snapshot;
    const node =
        new HeapSnapshotModel.HeapSnapshotModel.Node(-1, 'root', 0, nodeIndex || snapshot.rootNodeIndex, 0, 0, '');
    this.setRootNode(this._createRootNode(snapshot, node));
    /** @type {!HeapSnapshotGridNode} */ (this.rootNode()).sort();
  }

  /**
   * @param {!HeapSnapshotProxy} snapshot
   * @param {!HeapSnapshotModel.HeapSnapshotModel.Node} node
   */
  _createRootNode(snapshot, node) {
    const fakeEdge = new HeapSnapshotModel.HeapSnapshotModel.Edge('', node, '', -1);
    return new HeapSnapshotObjectNode(this, snapshot, fakeEdge, null);
  }

  /**
   * @override
   */
  sortingChanged() {
    const rootNode = this.rootNode();
    if (rootNode.hasChildren()) {
      /** @type {!HeapSnapshotGridNode} */ (rootNode).sort();
    }
  }
}

export class HeapSnapshotRetainmentDataGrid extends HeapSnapshotContainmentDataGrid {
  /**
   * @param {?SDK.HeapProfilerModel.HeapProfilerModel} heapProfilerModel
   * @param {!DataDisplayDelegate} dataDisplayDelegate
   */
  constructor(heapProfilerModel, dataDisplayDelegate) {
    const columns = /** @type {!Array<!DataGrid.DataGrid.ColumnDescriptor>} */ ([
      {id: 'object', title: i18nLazyString(UIStrings.object), disclosure: true, sortable: true}, {
        id: 'distance',
        title: i18nLazyString(UIStrings.distance),
        width: '70px',
        sortable: true,
        fixedWidth: true,
        sort: DataGrid.DataGrid.Order.Ascending
      },
      {
        id: 'shallowSize',
        title: i18nLazyString(UIStrings.shallowSize),
        width: '110px',
        sortable: true,
        fixedWidth: true
      },
      {
        id: 'retainedSize',
        title: i18nLazyString(UIStrings.retainedSize),
        width: '110px',
        sortable: true,
        fixedWidth: true
      }
    ]);
    super(heapProfilerModel, dataDisplayDelegate, i18nString(UIStrings.heapSnapshotRetainment), columns);
  }

  /**
   * @override
   * @param {!HeapSnapshotProxy} snapshot
   * @param {!HeapSnapshotModel.HeapSnapshotModel.Node} node
   */
  _createRootNode(snapshot, node) {
    const fakeEdge = new HeapSnapshotModel.HeapSnapshotModel.Edge('', node, '', -1);
    return new HeapSnapshotRetainingObjectNode(this, snapshot, fakeEdge, null);
  }

  /**
   * @override
   * @param {string} sortColumn
   * @param {boolean} sortAscending
   */
  _sortFields(sortColumn, sortAscending) {
    switch (sortColumn) {
      case 'object':
        return new HeapSnapshotModel.HeapSnapshotModel.ComparatorConfig('_name', sortAscending, '_count', false);
      case 'count':
        return new HeapSnapshotModel.HeapSnapshotModel.ComparatorConfig('_count', sortAscending, '_name', true);
      case 'shallowSize':
        return new HeapSnapshotModel.HeapSnapshotModel.ComparatorConfig('_shallowSize', sortAscending, '_name', true);
      case 'retainedSize':
        return new HeapSnapshotModel.HeapSnapshotModel.ComparatorConfig('_retainedSize', sortAscending, '_name', true);
      case 'distance':
        return new HeapSnapshotModel.HeapSnapshotModel.ComparatorConfig('_distance', sortAscending, '_name', true);
      default:
        throw new Error(`Unknown column ${sortColumn}`);
    }
  }

  reset() {
    this.rootNode().removeChildren();
    this.resetSortingCache();
  }

  /**
   * @override
   * @param {!HeapSnapshotProxy} snapshot
   * @param {number} nodeIndex
   */
  async setDataSource(snapshot, nodeIndex) {
    await super.setDataSource(snapshot, nodeIndex);
    this.rootNode().expand();
  }
}

/**
 * @enum {symbol}
 */
export const HeapSnapshotRetainmentDataGridEvents = {
  ExpandRetainersComplete: Symbol('ExpandRetainersComplete')
};

export class HeapSnapshotConstructorsDataGrid extends HeapSnapshotViewportDataGrid {
  /**
   * @param {?SDK.HeapProfilerModel.HeapProfilerModel} heapProfilerModel
   * @param {!DataDisplayDelegate} dataDisplayDelegate
   */
  constructor(heapProfilerModel, dataDisplayDelegate) {
    const columns = /** @type {!Array<!DataGrid.DataGrid.ColumnDescriptor>} */ ([
      {id: 'object', title: i18nLazyString(UIStrings.constructorString), disclosure: true, sortable: true},
      {id: 'distance', title: i18nLazyString(UIStrings.distance), width: '70px', sortable: true, fixedWidth: true}, {
        id: 'shallowSize',
        title: i18nLazyString(UIStrings.shallowSize),
        width: '110px',
        sortable: true,
        fixedWidth: true
      },
      {
        id: 'retainedSize',
        title: i18nLazyString(UIStrings.retainedSize),
        width: '110px',
        sort: DataGrid.DataGrid.Order.Descending,
        sortable: true,
        fixedWidth: true
      }
    ]);
    // clang-format off
    super(heapProfilerModel, dataDisplayDelegate, /** @type {!DataGrid.DataGrid.Parameters} */ (
      {displayName: i18nLazyString(UIStrings.heapSnapshotConstructors), columns}));
    // clang-format on
    this._profileIndex = -1;
    this._objectIdToSelect = null;

    /** @type {?HeapSnapshotModel.HeapSnapshotModel.NodeFilter} */
    this._nextRequestedFilter = null;
  }

  /**
   * @override
   * @param {string} sortColumn
   * @param {boolean} sortAscending
   * @return {!HeapSnapshotModel.HeapSnapshotModel.ComparatorConfig}
   */
  _sortFields(sortColumn, sortAscending) {
    switch (sortColumn) {
      case 'object':
        return new HeapSnapshotModel.HeapSnapshotModel.ComparatorConfig('_name', sortAscending, '_retainedSize', false);
      case 'distance':
        return new HeapSnapshotModel.HeapSnapshotModel.ComparatorConfig(
            '_distance', sortAscending, '_retainedSize', false);
      case 'shallowSize':
        return new HeapSnapshotModel.HeapSnapshotModel.ComparatorConfig('_shallowSize', sortAscending, '_name', true);
      case 'retainedSize':
        return new HeapSnapshotModel.HeapSnapshotModel.ComparatorConfig('_retainedSize', sortAscending, '_name', true);
      default:
        throw new Error(`Unknown column ${sortColumn}`);
    }
  }

  /**
   * @override
   * @param {!Protocol.HeapProfiler.HeapSnapshotObjectId} id
   * @return {!Promise<?HeapSnapshotGridNode>}
   */
  async revealObjectByHeapSnapshotId(id) {
    if (!this.snapshot) {
      this._objectIdToSelect = id;
      return null;
    }

    const className = await this.snapshot.nodeClassName(parseInt(id, 10));
    if (!className) {
      return null;
    }

    const parent = this.topLevelNodes().find(classNode => classNode.name === className);
    if (!parent) {
      return null;
    }

    const nodes =
        await /** @type {!HeapSnapshotConstructorNode} */ (parent).populateNodeBySnapshotObjectId(parseInt(id, 10));
    return nodes.length ? this.revealTreeNode(nodes) : null;
  }

  clear() {
    this._nextRequestedFilter = null;
    this._lastFilter = null;
    this.removeTopLevelNodes();
  }

  /**
   * @override
   * @param {!HeapSnapshotProxy} snapshot
   * @param {number} nodeIndex
   */
  async setDataSource(snapshot, nodeIndex) {
    this.snapshot = snapshot;
    if (this._profileIndex === -1) {
      this._populateChildren();
    }

    if (this._objectIdToSelect) {
      this.revealObjectByHeapSnapshotId(this._objectIdToSelect);
      this._objectIdToSelect = null;
    }
  }

  /**
   * @param {number} minNodeId
   * @param {number} maxNodeId
   */
  setSelectionRange(minNodeId, maxNodeId) {
    this._nodeFilter = new HeapSnapshotModel.HeapSnapshotModel.NodeFilter(minNodeId, maxNodeId);
    this._populateChildren(this._nodeFilter);
  }

  /**
   * @param {number} allocationNodeId
   */
  setAllocationNodeId(allocationNodeId) {
    this._nodeFilter = new HeapSnapshotModel.HeapSnapshotModel.NodeFilter();
    this._nodeFilter.allocationNodeId = allocationNodeId;
    this._populateChildren(this._nodeFilter);
  }

  /**
   * @param {!HeapSnapshotModel.HeapSnapshotModel.NodeFilter} nodeFilter
   * @param {!Object<string, !HeapSnapshotModel.HeapSnapshotModel.Aggregate>} aggregates
   */
  _aggregatesReceived(nodeFilter, aggregates) {
    this._filterInProgress = null;
    if (this._nextRequestedFilter && this.snapshot) {
      this.snapshot.aggregatesWithFilter(this._nextRequestedFilter)
          .then(this._aggregatesReceived.bind(this, this._nextRequestedFilter));
      this._filterInProgress = this._nextRequestedFilter;
      this._nextRequestedFilter = null;
    }
    this.removeTopLevelNodes();
    this.resetSortingCache();
    for (const constructor in aggregates) {
      this.appendNode(
          /** @type {!HeapSnapshotGridNode} */ (this.rootNode()),
          new HeapSnapshotConstructorNode(this, constructor, aggregates[constructor], nodeFilter));
    }
    this.sortingChanged();
    this._lastFilter = nodeFilter;
  }

  /**
   * @param {!HeapSnapshotModel.HeapSnapshotModel.NodeFilter=} maybeNodeFilter
   */
  async _populateChildren(maybeNodeFilter) {
    const nodeFilter = maybeNodeFilter || new HeapSnapshotModel.HeapSnapshotModel.NodeFilter();

    if (this._filterInProgress) {
      this._nextRequestedFilter = this._filterInProgress.equals(nodeFilter) ? null : nodeFilter;
      return;
    }
    if (this._lastFilter && this._lastFilter.equals(nodeFilter)) {
      return;
    }
    this._filterInProgress = nodeFilter;

    if (this.snapshot) {
      const aggregates = await this.snapshot.aggregatesWithFilter(nodeFilter);
      this._aggregatesReceived(nodeFilter, aggregates);
    }
  }

  /**
   * @param {!Array.<!HeapProfileHeader>} profiles
   * @param {number} profileIndex
   */
  filterSelectIndexChanged(profiles, profileIndex) {
    this._profileIndex = profileIndex;
    this._nodeFilter = undefined;
    if (profileIndex !== -1) {
      const minNodeId = profileIndex > 0 ? profiles[profileIndex - 1].maxJSObjectId : 0;
      const maxNodeId = profiles[profileIndex].maxJSObjectId;
      this._nodeFilter = new HeapSnapshotModel.HeapSnapshotModel.NodeFilter(minNodeId, maxNodeId);
    }

    this._populateChildren(this._nodeFilter);
  }
}

export class HeapSnapshotDiffDataGrid extends HeapSnapshotViewportDataGrid {
  /**
   * @param {?SDK.HeapProfilerModel.HeapProfilerModel} heapProfilerModel
   * @param {!DataDisplayDelegate} dataDisplayDelegate
   */
  constructor(heapProfilerModel, dataDisplayDelegate) {
    const columns = /** @type {!Array<!DataGrid.DataGrid.ColumnDescriptor>} */ ([
      {id: 'object', title: i18nLazyString(UIStrings.constructorString), disclosure: true, sortable: true},
      {id: 'addedCount', title: i18nLazyString(UIStrings.New), width: '75px', sortable: true, fixedWidth: true},
      {id: 'removedCount', title: i18nLazyString(UIStrings.Deleted), width: '75px', sortable: true, fixedWidth: true},
      {id: 'countDelta', title: i18nLazyString(UIStrings.Delta), width: '65px', sortable: true, fixedWidth: true}, {
        id: 'addedSize',
        title: i18nLazyString(UIStrings.allocSize),
        width: '75px',
        sortable: true,
        fixedWidth: true,
        sort: DataGrid.DataGrid.Order.Descending
      },
      {id: 'removedSize', title: i18nLazyString(UIStrings.freedSize), width: '75px', sortable: true, fixedWidth: true},
      {id: 'sizeDelta', title: i18nLazyString(UIStrings.sizeDelta), width: '75px', sortable: true, fixedWidth: true}
    ]);
    // clang-format off
    super(heapProfilerModel, dataDisplayDelegate, /** @type {!DataGrid.DataGrid.Parameters} */ (
      {displayName: i18nLazyString(UIStrings.heapSnapshotDiff), columns}));
    // clang-format on
  }

  /**
   * @override
   * @return {number}
   */
  defaultPopulateCount() {
    return 50;
  }

  /**
   * @override
   * @param {string} sortColumn
   * @param {boolean} sortAscending
   */
  _sortFields(sortColumn, sortAscending) {
    switch (sortColumn) {
      case 'object':
        return new HeapSnapshotModel.HeapSnapshotModel.ComparatorConfig('_name', sortAscending, '_count', false);
      case 'addedCount':
        return new HeapSnapshotModel.HeapSnapshotModel.ComparatorConfig('_addedCount', sortAscending, '_name', true);
      case 'removedCount':
        return new HeapSnapshotModel.HeapSnapshotModel.ComparatorConfig('_removedCount', sortAscending, '_name', true);
      case 'countDelta':
        return new HeapSnapshotModel.HeapSnapshotModel.ComparatorConfig('_countDelta', sortAscending, '_name', true);
      case 'addedSize':
        return new HeapSnapshotModel.HeapSnapshotModel.ComparatorConfig('_addedSize', sortAscending, '_name', true);
      case 'removedSize':
        return new HeapSnapshotModel.HeapSnapshotModel.ComparatorConfig('_removedSize', sortAscending, '_name', true);
      case 'sizeDelta':
        return new HeapSnapshotModel.HeapSnapshotModel.ComparatorConfig('_sizeDelta', sortAscending, '_name', true);
      default:
        throw new Error(`Unknown column ${sortColumn}`);
    }
  }

  /**
   * @override
   * @param {!HeapSnapshotProxy} snapshot
   * @param {number} nodeIndex
   */
  async setDataSource(snapshot, nodeIndex) {
    this.snapshot = snapshot;
  }

  /**
   * @param {!HeapSnapshotProxy} baseSnapshot
   */
  setBaseDataSource(baseSnapshot) {
    this.baseSnapshot = baseSnapshot;
    this.removeTopLevelNodes();
    this.resetSortingCache();
    if (this.baseSnapshot === this.snapshot) {
      this.dispatchEventToListeners(HeapSnapshotSortableDataGridEvents.SortingComplete);
      return;
    }
    this._populateChildren();
  }

  async _populateChildren() {
    if (this.snapshot === null || this.baseSnapshot === undefined || this.baseSnapshot.uid === undefined) {
      throw new Error('Data sources have not been set correctly');
    }
    // Two snapshots live in different workers isolated from each other. That is why
    // we first need to collect information about the nodes in the first snapshot and
    // then pass it to the second snapshot to calclulate the diff.
    const aggregatesForDiff = await this.baseSnapshot.aggregatesForDiff();
    const diffByClassName = await this.snapshot.calculateSnapshotDiff(this.baseSnapshot.uid, aggregatesForDiff);

    for (const className in diffByClassName) {
      const diff = /** @type {!HeapSnapshotModel.HeapSnapshotModel.DiffForClass} */ (
          /** @type {?} */ (diffByClassName[className]));
      this.appendNode(this.rootNode(), new HeapSnapshotDiffNode(this, className, diff));
    }
    this.sortingChanged();
  }
}

export class AllocationDataGrid extends HeapSnapshotViewportDataGrid {
  /**
   * @param {?SDK.HeapProfilerModel.HeapProfilerModel} heapProfilerModel
   * @param {!DataDisplayDelegate} dataDisplayDelegate
   */
  constructor(heapProfilerModel, dataDisplayDelegate) {
    const columns = /** @type {!Array<!DataGrid.DataGrid.ColumnDescriptor>} */ ([
      {id: 'liveCount', title: i18nLazyString(UIStrings.liveCount), width: '75px', sortable: true, fixedWidth: true},
      {id: 'count', title: i18nLazyString(UIStrings.count), width: '65px', sortable: true, fixedWidth: true},
      {id: 'liveSize', title: i18nLazyString(UIStrings.liveSize), width: '75px', sortable: true, fixedWidth: true},
      {
        id: 'size',
        title: i18nLazyString(UIStrings.size),
        width: '75px',
        sortable: true,
        fixedWidth: true,
        sort: DataGrid.DataGrid.Order.Descending
      },
      {id: 'name', title: i18nLazyString(UIStrings.function), disclosure: true, sortable: true},
    ]);
    // clang-format off
    super(heapProfilerModel, dataDisplayDelegate, /** @type {!DataGrid.DataGrid.Parameters} */ (
      {displayName: i18nLazyString(UIStrings.allocation), columns}));
    // clang-format on
    this._linkifier = new Components.Linkifier.Linkifier();
  }

  get linkifier() {
    return this._linkifier;
  }

  dispose() {
    this._linkifier.reset();
  }

  /**
   * @override
   * @param {!HeapSnapshotProxy} snapshot
   * @param {number} nodeIndex
   */
  async setDataSource(snapshot, nodeIndex) {
    this.snapshot = snapshot;
    this._topNodes = await this.snapshot.allocationTracesTops();
    this._populateChildren();
  }

  _populateChildren() {
    this.removeTopLevelNodes();
    const root = this.rootNode();
    const tops = this._topNodes || [];
    for (const top of tops) {
      this.appendNode(root, new AllocationGridNode(this, top));
    }
    this.updateVisibleNodes(true);
  }

  /**
   * @override
   */
  sortingChanged() {
    if (this._topNodes !== undefined) {
      this._topNodes.sort(this.createComparator());
      this.rootNode().removeChildren();
      this._populateChildren();
    }
  }

  /**
   * @return {function(!Object, !Object):number}
   */
  createComparator() {
    const fieldName = this.sortColumnId();
    const compareResult = (this.sortOrder() === DataGrid.DataGrid.Order.Ascending) ? +1 : -1;
    /**
     * @param {!Object} a
     * @param {!Object} b
     * @return {number}
     */
    function compare(a, b) {
      // @ts-ignore
      if (a[fieldName] > b[fieldName]) {
        return compareResult;
      }
      // @ts-ignore
      if (a[fieldName] < b[fieldName]) {
        return -compareResult;
      }
      return 0;
    }
    return compare;
  }
}
