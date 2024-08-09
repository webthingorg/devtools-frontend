// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {type Chrome} from '../../../extension-api/ExtensionAPI.js';
import * as Common from '../../core/common/common.js';
import {FunctionNameGuesserPluginManager} from '../extensions/extensions.js';

let instance: ExtensionManager|null = null;

export interface ExtensionPlugin {
  getName(): string;
  getCapabilities(): string[];
  getFunctionRanges(
      fileName: string, sourceContent: string, sourceMap?: Chrome.DevTools.SourceMapEntry,
      unminificationMode?: Chrome.DevTools.UnminificationMode): Promise<Chrome.DevTools.FunctionDescriptor[]>;
}

export class ExtensionManager extends Common.ObjectWrapper.ObjectWrapper<EventTypes> {
  static instance(): ExtensionManager {
    if (!instance) {
      instance = new ExtensionManager();
    }
    return instance;
  }

  constructor() {
    super();
    this.attach();
  }

  attach(): void {
    const pluginManager = FunctionNameGuesserPluginManager.FunctionNameGuesserPluginManager.instance();
    pluginManager.addEventListener(FunctionNameGuesserPluginManager.Events.PluginAdded, this.#handlePlugin);
    pluginManager.addEventListener(FunctionNameGuesserPluginManager.Events.PluginRemoved, this.#handlePlugin);
  }

  detach(): void {
    const pluginManager = FunctionNameGuesserPluginManager.FunctionNameGuesserPluginManager.instance();
    pluginManager.removeEventListener(FunctionNameGuesserPluginManager.Events.PluginAdded, this.#handlePlugin);
    pluginManager.removeEventListener(FunctionNameGuesserPluginManager.Events.PluginRemoved, this.#handlePlugin);
  }

  #handlePlugin = (): void => {
    this.dispatchEventToListeners(Events.ExtensionsUpdated, this.#extensions());
  };

  #extensions = (): ExtensionPlugin[] => {
    return FunctionNameGuesserPluginManager.FunctionNameGuesserPluginManager.instance().plugins();
  };

  findFunctionParserExtensionsForFile = (sourceUrl: string): ExtensionPlugin[] => {
    const byCapabilities = (extension: ExtensionPlugin): boolean => {
      const supportedTypes = extension.getCapabilities();  // e.g. .js, .jsx etc
      for (const fileType of supportedTypes) {
        if (fileType && sourceUrl?.endsWith(fileType)) {
          return true;
        }
      }
      return false;
    };
    return this.#extensions().filter(byCapabilities);
  };

  findBestCandidate = (choices: Chrome.DevTools.FunctionDescriptor[], resolvedLineNumber: number,
                       resolvedColumnNumber: number): Chrome.DevTools.FunctionDescriptor|null => {
    return choices.reduce<Chrome.DevTools.FunctionDescriptor|null>((best, candidate) => {
      // Cases covered:
      //  1. function a() { }
      //  2.  /* resolved line here */
      //  3. function b() { }
      // both descs. for a() and b() should be discarded
      if (candidate.startLine > resolvedLineNumber || candidate.endLine < resolvedLineNumber) {
        return best;
      }

      if (this.isWithinRange(
              candidate.startLine, candidate.startColumn, candidate.endLine, candidate.endColumn, resolvedLineNumber,
              resolvedColumnNumber)) {
        if (best) {
          if (candidate.startLine > best.startLine) {
            return candidate;
          }
          if (candidate.startLine === best.startLine && candidate.startColumn > best.startColumn) {
            return candidate;
          }
          if (candidate.endLine < best.endLine) {
            return candidate;
          }
          if (candidate.endLine === best.endLine && candidate.endColumn < best.endColumn) {
            return candidate;
          }

          return best;
        }
      }

      // if we don't have a 'best' yet, the resolved location is at least within this desc, so choose it
      if (!best) {
        return candidate;
      }

      // otherwise we need to see if we're in an interior function that is better-named
      if (candidate.startLine === best.startLine) {
        if (candidate.startColumn >= best.startColumn) {
          return candidate;
        }
      }

      if (candidate.startLine >= best.startLine) {
        return candidate;
      }

      return best;
    }, null);
  };

  /**
   * Checks to see whether the line/col pair of cy/cx is within the range defined by start (sy/sx) and end (ey/ex)
   * @param sy Start line
   * @param sx Start column
   * @param ey End line
   * @param ex End column
   * @param cy Candidate line
   * @param cx Candidate column
   */
  isWithinRange(sy: number, sx: number, ey: number, ex: number, cy: number, cx: number): boolean {
    if (cy < sy || cy > ey) {
      // early bail: candidate line is before or after range, by line
      return false;
    }

    if (cy > sy && cy < ey) {
      // early exit: candidate line is definitely within the range, by line
      return true;
    }

    // Now we know that the line is either the start or end line (or both if the function is one line long)
    if (cy === sy) {
      // candidate line is starting line
      if (cx < sx) {
        // candidate column is before starting column
        return false;
      }

      if (sy === ey) {
        // if the function is a single line, we need to check to make sure that the candidate isn't after
        if (cx > ex) {
          return false;
        }
      }

      return true;
    }

    // Finally, candidate line is ending line; assert cy === ey
    if (cx > ex) {
      // Location is after the end of the range
      return false;
    }

    return true;
  }
}

export const enum Events {
  ExtensionsUpdated = 'extensionsUpdated',
}

export type EventTypes = {
  [Events.ExtensionsUpdated]: ExtensionPlugin[],
};
