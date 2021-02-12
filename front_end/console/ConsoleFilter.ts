// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/* eslint-disable rulesdir/no_underscored_properties */

import * as SDK from '../sdk/sdk.js';
import * as TextUtils from '../text_utils/text_utils.js';

import { ConsoleViewMessage } from './ConsoleViewMessage.js'; // eslint-disable-line no-unused-vars

export class ConsoleFilter {
  name: string;
  parsedFilters: TextUtils.TextUtils.ParsedFilter[];
  executionContext: SDK.RuntimeModel.ExecutionContext | null;
  levelsMask: {
    [x: string]: boolean;
  };
  constructor(name: string, parsedFilters: TextUtils.TextUtils.ParsedFilter[], executionContext: SDK.RuntimeModel.ExecutionContext | null, levelsMask?: {
    [x: string]: boolean;
  }) {
    this.name = name;
    this.parsedFilters = parsedFilters;
    this.executionContext = executionContext;
    this.levelsMask = levelsMask || ConsoleFilter.defaultLevelsFilterValue();
  }

  static allLevelsFilterValue(): {
    [x: string]: boolean;
  } {
    const result: {
      [x: string]: boolean;
    } = {};
    for (const name of Object.values(SDK.ConsoleModel.MessageLevel)) {
      result[name] = true;
    }
    return result;
  }

  static defaultLevelsFilterValue(): {
    [x: string]: boolean;
  } {
    const result = ConsoleFilter.allLevelsFilterValue();
    result[SDK.ConsoleModel.MessageLevel.Verbose] = false;
    return result;
  }

  static singleLevelMask(level: string): {
    [x: string]: boolean;
  } {
    const result: {
      [x: string]: boolean;
    } = {};
    result[level] = true;
    return result;
  }

  clone(): ConsoleFilter {
    const parsedFilters = this.parsedFilters.map(TextUtils.TextUtils.FilterParser.cloneFilter);
    const levelsMask = Object.assign({}, this.levelsMask);
    return new ConsoleFilter(this.name, parsedFilters, this.executionContext, levelsMask);
  }

  shouldBeVisible(viewMessage: ConsoleViewMessage): boolean {
    const message = viewMessage.consoleMessage();
    if (this.executionContext &&
      (this.executionContext.runtimeModel !== message.runtimeModel() ||
        this.executionContext.id !== message.executionContextId)) {
      return false;
    }

    if (message.type === SDK.ConsoleModel.MessageType.Command || message.type === SDK.ConsoleModel.MessageType.Result ||
      message.isGroupMessage()) {
      return true;
    }
    if (message.level && !this.levelsMask[message.level as string]) {
      return false;
    }

    for (const filter of this.parsedFilters) {
      if (!filter.key) {
        if (filter.regex && viewMessage.matchesFilterRegex(filter.regex) === filter.negative) {
          return false;
        }
        if (filter.text && viewMessage.matchesFilterText(filter.text) === filter.negative) {
          return false;
        }
      }
      else {
        switch (filter.key) {
          case FilterType.Context: {
            if (!passesFilter(filter, message.context, false /* exactMatch */)) {
              return false;
            }
            break;
          }
          case FilterType.Source: {
            const sourceNameForMessage = message.source ?
              SDK.ConsoleModel.MessageSourceDisplayName.get((message.source as SDK.ConsoleModel.MessageSource)) :
              message.source;
            if (!passesFilter(filter, sourceNameForMessage, true /* exactMatch */)) {
              return false;
            }
            break;
          }
          case FilterType.Url: {
            if (!passesFilter(filter, message.url, false /* exactMatch */)) {
              return false;
            }
            break;
          }
        }
      }
    }
    return true;

    function passesFilter(filter: TextUtils.TextUtils.ParsedFilter, value: string | null | undefined, exactMatch: boolean): boolean {
      if (!filter.text) {
        return Boolean(value) === filter.negative;
      }
      if (!value) {
        return !filter.text === !filter.negative;
      }
      const filterText = (filter.text as string).toLowerCase();
      const lowerCaseValue = value.toLowerCase();
      if (exactMatch && (lowerCaseValue === filterText) === filter.negative) {
        return false;
      }
      if (!exactMatch && lowerCaseValue.includes(filterText) === filter.negative) {
        return false;
      }
      return true;
    }
  }
}

export enum FilterType {
  Context = 'context',
  Source = 'source',
  Url = 'url'
}
;
