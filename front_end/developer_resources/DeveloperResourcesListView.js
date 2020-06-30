// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as BrowserSDK from '../browser_sdk/browser_sdk.js';
import * as Common from '../common/common.js';
import * as DataGrid from '../data_grid/data_grid.js';
import * as SDK from '../sdk/sdk.js';  // eslint-disable-line no-unused-vars
import * as TextUtils from '../text_utils/text_utils.js';
import * as UI from '../ui/ui.js';

export class DeveloperResourcesListView extends UI.Widget.VBox {
  /**
   * @param {function(*):boolean} filterCallback
   */
  constructor(filterCallback) {
    super(true);
    /** @type {!Map<*, !GridNode>} */
    this._nodeForItem = new Map();
    this._filterCallback = filterCallback;
    /** @type {?RegExp} */
    this._highlightRegExp = null;
    this.registerRequiredCSS('developer_resources/developerResourcesListView.css');
    const columns = [
      {id: 'status', title: Common.UIString.UIString('Status'), width: '20px', fixedWidth: true, sortable: true},
      {id: 'url', title: Common.UIString.UIString('URL'), width: '250px', fixedWidth: false, sortable: true},
      {id: 'frame', title: Common.UIString.UIString('Frame'), width: '40px', fixedWidth: false, sortable: true}, {
        id: 'size',
        title: Common.UIString.UIString('Total Bytes'),
        width: '40px',
        fixedWidth: true,
        sortable: true,
        align: DataGrid.DataGrid.Align.Right
      },
      {
        id: 'errorMessage',
        title: Common.UIString.UIString('Error'),
        width: '100px',
        fixedWidth: false,
        sortable: true,
      }
    ];
    this._dataGrid = new DataGrid.SortableDataGrid.SortableDataGrid({displayName: ls`Developer Resources`, columns});
    this._dataGrid.setResizeMethod(DataGrid.DataGrid.ResizeMethod.Last);
    this._dataGrid.element.classList.add('flex-auto');
    this._dataGrid.addEventListener(DataGrid.DataGrid.Events.SortingChanged, this._sortingChanged, this);

    const dataGridWidget = this._dataGrid.asWidget();
    dataGridWidget.show(this.contentElement);
    this.setDefaultFocusedChild(dataGridWidget);
  }

  /**
   * @param {!Iterable<!SDK.PageResourceLoader.PageResource>} items
   */
  update(items) {
    let hadUpdates = false;
    const rootNode = this._dataGrid.rootNode();
    for (const item of items) {
      let node = this._nodeForItem.get(item);
      if (node) {
        if (this._filterCallback(node.data)) {
          hadUpdates = node._refreshIfNeeded() || hadUpdates;
        }
        continue;
      }
      node = new GridNode(item);
      this._nodeForItem.set(item, node);
      if (this._filterCallback(node.data)) {
        rootNode.appendChild(node);
        hadUpdates = true;
      }
    }
    if (hadUpdates) {
      this._sortingChanged();
    }
  }

  reset() {
    this._nodeForItem.clear();
    this._dataGrid.rootNode().removeChildren();
  }

  /**
   * @param {?RegExp} highlightRegExp
   */
  updateFilterAndHighlight(highlightRegExp) {
    this._highlightRegExp = highlightRegExp;
    let hadTreeUpdates = false;
    for (const node of this._nodeForItem.values()) {
      const shouldBeVisible = this._filterCallback(node.data);
      const isVisible = !!node.parent;
      if (shouldBeVisible) {
        node._setHighlight(this._highlightRegExp);
      }
      if (shouldBeVisible === isVisible) {
        continue;
      }
      hadTreeUpdates = true;
      if (!shouldBeVisible) {
        node.remove();
      } else {
        this._dataGrid.rootNode().appendChild(node);
      }
    }
    if (hadTreeUpdates) {
      this._sortingChanged();
    }
  }

  _sortingChanged() {
    const columnId = this._dataGrid.sortColumnId();
    if (!columnId) {
      return;
    }

    const sortFunction = GridNode.sortFunctionForColumn(columnId);
    if (sortFunction) {
      this._dataGrid.sortNodes(sortFunction, !this._dataGrid.isSortOrderAscending());
    }
  }
}

/**
 * @extends {DataGrid.SortableDataGrid.SortableDataGridNode<!GridNode>}
 */
class GridNode extends DataGrid.SortableDataGrid.SortableDataGridNode {
  /**
   * @param {!SDK.PageResourceLoader.PageResource} item
   */
  constructor(item) {
    super(item);
    /** @type {?RegExp} */
    this._highlightRegExp = null;
  }

  /**
   * @param {?RegExp} highlightRegExp
   */
  _setHighlight(highlightRegExp) {
    if (this._highlightRegExp === highlightRegExp) {
      return;
    }
    this._highlightRegExp = highlightRegExp;
    this.refresh();
  }

  /**
   * @return {boolean}
   */
  _refreshIfNeeded() {
    this.refresh();
    return true;
  }

  /**
   * @override
   * @param {string} columnId
   * @return {!Element}
   */
  createCell(columnId) {
    const cell = /** @type {!HTMLElement} */ (this.createTD(columnId));
    switch (columnId) {
      case 'url': {
        cell.title = this.data.url;
        const outer = cell.createChild('div', 'url-outer');
        const prefix = outer.createChild('div', 'url-prefix');
        const suffix = outer.createChild('div', 'url-suffix');
        const splitURL = /^(.*)(\/[^/]*)$/.exec(this.data.url);
        prefix.textContent = splitURL ? splitURL[1] : this.data.url;
        suffix.textContent = splitURL ? splitURL[2] : '';
        if (this._highlightRegExp) {
          this._highlight(outer, this.data.url);
        }
        this.setCellAccessibleName(this.data.url, cell, columnId);
        break;
      }
      case 'frame': {
        const frame = BrowserSDK.FrameManager.FrameManager.instance().getFrame(this.data.frameId);
        if (frame) {
          cell.textContent = frame.displayName();
        } else {
          cell.textContent = this.data.frameId;
        }
        cell.onmouseenter = () => {
          const frame = BrowserSDK.FrameManager.FrameManager.instance().getFrame(this.data.frameId);
          if (frame) {
            frame.highlight();
          }
        };
        cell.onmouseleave = () => SDK.OverlayModel.OverlayModel.hideDOMNodeHighlight();
        break;
      }
      case 'status': {
        if (this.data.success !== null) {
          cell.textContent = this.data.success ? '✓' : '🗙';
        }
        break;
      }
      case 'size': {
        const size = this.data.size;
        if (size !== null) {
          const sizeSpan = cell.createChild('span');
          sizeSpan.textContent = Number.withThousandsSeparator(size);
          const sizeAccessibleName = (size === 1) ? ls`1 byte` : ls`${size} bytes`;
          this.setCellAccessibleName(sizeAccessibleName, cell, columnId);
        }
        break;
      }
      case 'errorMessage': {
        cell.classList.add('error-message');
        if (this.data.errorMessage) {
          cell.textContent = this.data.errorMessage;
          if (this._highlightRegExp) {
            this._highlight(cell, this.data.errorMessage);
          }
        }
        break;
      }
    }
    return cell;
  }

  /**
   * @param {!Element} element
   * @param {string} textContent
   */
  _highlight(element, textContent) {
    if (!this._highlightRegExp) {
      return;
    }
    const matches = this._highlightRegExp.exec(textContent);
    if (!matches || !matches.length) {
      return;
    }
    const range = new TextUtils.TextRange.SourceRange(matches.index, matches[0].length);
    UI.UIUtils.highlightRangesWithStyleClass(element, [range], 'filter-highlight');
  }

  /**
   *
   * @param {string} columnId
   * @returns {null|function(!DataGrid.DataGrid.DataGridNode<GridNode>, !DataGrid.DataGrid.DataGridNode<GridNode>):number}
   */
  static sortFunctionForColumn(columnId) {
    switch (columnId) {
      case 'url':
        return (a, b) => a.data.url.localeCompare(b.data.url);
      case 'status':
        return (a, b) => a.data.status - b.data.status;
      case 'size':
        return (a, b) => a.data.size - b.data.size;
      case 'errorMessage':
        return (a, b) => (a.data.errorMessage || '').localeCompare(b.data.errorMessage);
      default:
        console.assert(false, 'Unknown sort field: ' + columnId);
        return null;
    }
  }
}
