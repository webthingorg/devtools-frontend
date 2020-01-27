// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {ObjectWrapper} from '../common/Object.js';

export class Issue extends ObjectWrapper {
  constructor(code, resources = []) {
    super();
    this._code = code;
    this._resources = new Set();
    this.addResources(resources);
  }

  get code() {
    return this._code;
  }

  get resources() {
    return [...this._resources];
  }

  addResources(resources) {
    const originalSize = this._resources.size;
    for (const resource of resources) {
      this._resources.add(resource);
    }
    if (this._resources.size !== originalSize) {
      this.dispatchEventToListeners(Events.Updated, resources);
    }
  }

  static create(code, resources = []) {
    return new Issue(code, resources);
  }
}

/** @enum {symbol} */
export const Events = {
  Updated: Symbol('Updated'),
  IssueAdded: Symbol('IssueAdded'),
  IssueUpdated: Symbol('IssueUpdated'),
};

/* Legacy exported object */
self.SDK = self.SDK || {};

/* Legacy exported object */
SDK = SDK || {};

/** @constructor */
SDK.Issue = Issue;

/** @enum {symbol} */
SDK.Issue.Events = Events;
