// Copyright 2016 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as UI from '../../legacy.js';

import type {Provider} from './FilteredListWidget.js';
import {FilteredListWidget, getRegisteredProviders} from './FilteredListWidget.js';

export const history: string[] = [];

export class QuickOpenImpl {
  private prefix: string|null;
  private readonly query: string;
  private readonly providers: Map<string, () => Promise<Provider>>;
  private readonly prefixes: string[];
  private readonly titlePrefixs: Map<string, () => string>;
  private readonly titleSuggestions: Map<string, (() => string)|undefined>;
  private filteredListWidget: FilteredListWidget|null;
  constructor() {
    this.prefix = null;
    this.query = '';
    this.providers = new Map();
    this.prefixes = [];
    this.titlePrefixs = new Map();
    this.titleSuggestions = new Map();
    this.filteredListWidget = null;

    getRegisteredProviders().forEach(this.addProvider.bind(this));
    this.prefixes.sort((a, b) => b.length - a.length);
  }

  static show(query: string): void {
    const quickOpen = new this();
    const filteredListWidget = new FilteredListWidget(null, history, quickOpen.queryChanged.bind(quickOpen));
    quickOpen.filteredListWidget = filteredListWidget;
    filteredListWidget.showAsDialog();
    filteredListWidget.setQuery(query);
    // filteredListWidget.setQuery(query.length > 0? query : ' ');
  }

  private addProvider(extension: {
    prefix: string,
    titlePrefix: () => string,
    titleSuggestion?: (() => string), provider: () => Promise<Provider>,
  }): void {
    const prefix = extension.prefix;
    if (prefix === null) {
      return;
    }
    this.prefixes.push(prefix);
    this.titlePrefixs.set(prefix, extension.titlePrefix);
    this.titleSuggestions.set(prefix, extension.titleSuggestion);
    this.providers.set(prefix, extension.provider);
  }

  private queryChanged(query: string): void {
    const prefix = this.prefixes.find(prefix => query.startsWith(prefix));
    if (typeof prefix !== 'string' || this.prefix === prefix) {
      if (query !== prefix && this.filteredListWidget) {
        this.filteredListWidget.setCommandHintElement('');
      }
      return;
    }

    this.prefix = prefix;
    if (!this.filteredListWidget) {
      return;
    }
    this.filteredListWidget.setPrefix(prefix);

    const titlePrefixFunction = this.titlePrefixs.get(prefix);
    this.filteredListWidget.setCommandTypeIndicatorElement(titlePrefixFunction ? titlePrefixFunction() : '');
    const titleSuggestionFunction = this.titleSuggestions.get(prefix);
    this.filteredListWidget.setCommandHintElement(titleSuggestionFunction ? titleSuggestionFunction() : '');

    this.filteredListWidget.setProvider(null);
    const providerFunction = this.providers.get(prefix);
    if (!providerFunction) {
      return;
    }
    providerFunction().then(provider => {
      if (this.prefix !== prefix || !this.filteredListWidget) {
        return;
      }
      this.filteredListWidget.setProvider(provider);
      this.providerLoadedForTest(provider);
    });
  }

  private providerLoadedForTest(_provider: Provider): void {
  }
}

let showActionDelegateInstance: ShowActionDelegate;

export class ShowActionDelegate implements UI.ActionRegistration.ActionDelegate {
  static instance(opts: {
    forceNew: boolean|null,
  } = {forceNew: null}): ShowActionDelegate {
    const {forceNew} = opts;
    if (!showActionDelegateInstance || forceNew) {
      showActionDelegateInstance = new ShowActionDelegate();
    }

    return showActionDelegateInstance;
  }

  handleAction(context: UI.Context.Context, actionId: string): boolean {
    switch (actionId) {
      case 'quickOpen.show':
        QuickOpenImpl.show('');
        return true;
    }
    return false;
  }
}
