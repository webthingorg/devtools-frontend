// Copyright 2016 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Diff from '../diff/diff.js';
import * as UI from '../ui/ui.js';  // eslint-disable-line no-unused-vars
import {FilteredListWidget, Provider} from './FilteredListWidget.js';

export class QuickPick {
  /**
   * @private
   */
  constructor() {
    throw new ReferenceError('Instance type not implemented.');
  }

  /**
   *
   * @param {!Array<!QuickPickItem>} items
   * @param {!QuickPickOptions} options
   * @return {!Promise<!QuickPickItem|undefined>}
   */
  static show(items, options) {
    /**
     * @type {!Promise<undefined>}
     */
    let canceledPromise = new Promise(_r => {});  // Intentionally creates an unresolved promise
    /**
     * @type {!Promise<!QuickPickItem>}
     */
    const fulfilledPromise = new Promise(resolve => {
      const provider =
          new QuickPickProvider(items, resolve, options.matchOnDescription ? 0.5 : 0, options.matchOnDetail ? 0.25 : 0);
      const widget = new FilteredListWidget(provider);
      widget.setPlaceholder(options.placeHolder);
      widget.setPromptTitle(options.placeHolder);
      widget.showAsDialog(options.placeHolder);
      canceledPromise = widget.once('hidden');
      widget.setQuery('');
    });

    return Promise.race([fulfilledPromise, canceledPromise]).then(values => {
      // If it was fulfilled, then `result` will have a value.
      // If it was canceled, then `result` will be undefined.
      // Either way, it has the value that we want.
      return values;
    });
  }
}

class QuickPickProvider extends Provider {
  /**
   *
   * @param {!Array<!QuickPickItem>} items
   * @param {!Function} resolve
   * @param {number=} matchOnDescription
   * @param {number=} matchOnDetail
   */
  constructor(items, resolve, matchOnDescription = 0.5, matchOnDetail = 0.25) {
    super();
    this._resolve = resolve;
    this._items = items;
    this._matchOnDescription = matchOnDescription;
    this._matchOnDetail = matchOnDetail;
  }

  /**
   * @override
   */
  itemCount() {
    return this._items.length;
  }

  /**
   * @override
   * @param {number} itemIndex
   * @return {string}
   */
  itemKeyAt(itemIndex) {
    const item = this._items[itemIndex];
    let key = item.label;
    if (this._matchOnDescription) {
      key += ' ' + item.description;
    }
    if (this._matchOnDetail) {
      key += ' ' + item.detail;
    }
    return key;
  }

  /**
   * @override
   * @param {number} itemIndex
   * @param {string} query
   * @return {number}
   */
  itemScoreAt(itemIndex, query) {
    const item = this._items[itemIndex];
    const test = query.toLowerCase();
    let score = Diff.Diff.DiffWrapper.characterScore(test, item.label.toLowerCase());

    if (this._matchOnDescription && item.description) {
      const descriptionScore = Diff.Diff.DiffWrapper.characterScore(test, item.description.toLowerCase());
      score += descriptionScore * this._matchOnDescription;
    }

    if (this._matchOnDetail && item.detail) {
      const detailScore = Diff.Diff.DiffWrapper.characterScore(test, item.detail.toLowerCase());
      score += detailScore * this._matchOnDetail;
    }

    return score;
  }

  /**
   * @override
   * @param {number} itemIndex
   * @param {string} query
   * @param {!Element} titleElement
   * @param {!Element} subtitleElement
   */
  renderItem(itemIndex, query, titleElement, subtitleElement) {
    const item = this._items[itemIndex];
    titleElement.removeChildren();
    const labelElement = titleElement.createChild('span');
    labelElement.createTextChild(item.label);
    FilteredListWidget.highlightRanges(titleElement, query, true);
    if (item.description) {
      const descriptionElement = titleElement.createChild('span', 'quickpick-description');
      descriptionElement.createTextChild(item.description);
      if (this._matchOnDescription) {
        FilteredListWidget.highlightRanges(descriptionElement, query, true);
      }
    }
    if (item.detail) {
      subtitleElement.createTextChild(item.detail);
      if (this._matchOnDetail) {
        FilteredListWidget.highlightRanges(subtitleElement, query, true);
      }
    }
  }

  /**
   * @override
   * @return {boolean}
   */
  renderAsTwoRows() {
    return this._items.some(i => !!i.detail);
  }

  /**
   * @override
   * @param {?number} itemIndex
   * @param {string} _promptValue
   */
  selectItem(itemIndex, _promptValue) {
    if (typeof itemIndex === 'number') {
      this._resolve(this._items[itemIndex]);
      return;
    }

    this._resolve(undefined);
  }
}

/**
 * @typedef {{
 *  label: string;
 *  description?: string;
 *  detail?: string;
 * }}
 */
export let QuickPickItem;

/**
 * @typedef {{
 *   placeHolder: string;
 *   matchOnDescription?: boolean;
 *   matchOnDetail?: boolean;
 * }}
 */
export let QuickPickOptions;

/**
 * @implements {UI.ActionDelegate.ActionDelegate}
 * @unrestricted
 */
export class QuickPickDemoDelegate {
  /**
   * @override
   * @param {!UI.Context.Context} context
   * @param {string} actionId
   * @return {boolean}
   */
  handleAction(context, actionId) {
    this._runDemo();
    return true;
  }

  async _runDemo() {
    const demoMenu1 = [
      {
        label: 'Item 1',
      },
      {
        label: 'Item 2',
      },
      {
        label: 'Item 3',
      }
    ];
    const queryOne = await QuickPick.show(demoMenu1, {placeHolder: 'Choose from these options:'});
    if (!queryOne) {
      return;
    }

    const demoMenu2 = [
      {
        label: 'Another item 1',
        description: 'Some details about item 1',
        detail: 'This item 1 is really interesting',
      },
      {
        label: 'Option 2',
        description: 'Some information about option 2',
        detail: 'Option 2 is really about options and information',
      }
    ];
    await QuickPick.show(
        demoMenu2, {placeHolder: 'Choose from these choices:', matchOnDescription: true, matchOnDetail: true});
  }
}
