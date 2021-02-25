// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/* eslint-disable rulesdir/no_underscored_properties */

import * as Search from '../search/search.js';
import * as UI from '../ui/ui.js'; // eslint-disable-line no-unused-vars

import { SourcesSearchScope } from './SourcesSearchScope.js';

let searchSourcesViewInstance: SearchSourcesView;

export class SearchSourcesView extends Search.SearchView.SearchView {
  private constructor() {
    super('sources');
  }

  static instance(): SearchSourcesView {
    if (!searchSourcesViewInstance) {
      searchSourcesViewInstance = new SearchSourcesView();
    }
    return searchSourcesViewInstance;
  }

  static async openSearch(query: string, searchImmediately?: boolean): Promise<UI.Widget.Widget> {
    const view = (UI.ViewManager.ViewManager.instance().view('sources.search-sources-tab') as UI.View.View);
    // Deliberately use target location name so that it could be changed
    // based on the setting later.
    const location = (await UI.ViewManager.ViewManager.instance().resolveLocation('drawer-view') as any);
    location.appendView(view);
    await UI.ViewManager.ViewManager.instance().revealView((view as UI.View.View));
    const widget = (await view.widget() as Search.SearchView.SearchView);
    widget.toggle(query, Boolean(searchImmediately));
    return widget;
  }

  createScope(): Search.SearchConfig.SearchScope {
    return new SourcesSearchScope();
  }
}

let actionDelegateInstance: ActionDelegate;

export class ActionDelegate implements UI.ActionRegistration.ActionDelegate {
  static instance(opts: {
    forceNew: boolean | null;
  } | undefined = { forceNew: null }): ActionDelegate {
    const { forceNew } = opts;
    if (!actionDelegateInstance || forceNew) {
      actionDelegateInstance = new ActionDelegate();
    }

    return actionDelegateInstance;
  }
  handleAction(context: UI.Context.Context, actionId: string): boolean {
    this._showSearch();
    return true;
  }

  _showSearch(): Promise<UI.Widget.Widget> {
    const selection = UI.InspectorView.InspectorView.instance().element.window().getSelection();
    let queryCandidate = '';
    if (selection && selection.rangeCount) {
      queryCandidate = selection.toString().replace(/\r?\n.*/, '');
    }

    return SearchSourcesView.openSearch(queryCandidate);
  }
}
