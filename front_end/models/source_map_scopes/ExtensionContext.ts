// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import {type Chrome} from '../../../extension-api/ExtensionAPI.js';
import type * as Platform from '../../core/platform/platform.js';
import type * as SDK from '../../core/sdk/sdk.js';

const functionDescriptorCache:
    WeakMap<SDK.SourceMap.SourceMap, Map<Platform.DevToolsPath.UrlString, Chrome.DevTools.FunctionDescriptor[]>> =
        new WeakMap();

interface ExtensionManagerConstructor {
  instance(): ExternalExtensionManager;
}

interface ExtensionPlugin {
  getFunctionRanges(fileName: string, sourceContent: string): Promise<Chrome.DevTools.FunctionDescriptor[]>;
}

interface ExternalExtensionManager {
  findFunctionParserExtensionsForFile(sourceUrl: string): ExtensionPlugin[];
}

let extensionManager: ExternalExtensionManager|null = null;
async function loadExtensionManager(): Promise<ExternalExtensionManager|null> {
  if (!extensionManager) {
    try {
      const extensionsModulePath: string = '../../models/source_map_extensions/source_map_extensions.js';
      const extensionsModule = await import(extensionsModulePath);
      const extensionsManagerStatics =
          extensionsModule?.ExtensionManager.ExtensionManager as ExtensionManagerConstructor;
      extensionManager = extensionsManagerStatics?.instance();
      return extensionManager;
    } catch (e) {
      console.error('Error Loading', e);
      throw new Error(e);
    }
  }
  return extensionManager;
}

export async function getFunctionNameViaExtensionOrCache(
    sourceMap: SDK.SourceMap.SourceMap, script: SDK.Script.Script, content: string, lineNumber: number,
    columnNumber: number): Promise<string|undefined> {
  let resolvedName;
  const extensionMangerInstance = await loadExtensionManager();

  if (extensionMangerInstance && content) {
    let functionDescriptorsViaSourceUrlMap = functionDescriptorCache.get(sourceMap);
    if (!functionDescriptorsViaSourceUrlMap) {
      functionDescriptorsViaSourceUrlMap = new Map();
      functionDescriptorCache.set(sourceMap, functionDescriptorsViaSourceUrlMap);
    }

    let parsed = functionDescriptorsViaSourceUrlMap.get(script.sourceURL);
    if (!parsed) {
      const extensions = extensionMangerInstance?.findFunctionParserExtensionsForFile(script.sourceURL);
      if (extensions && extensions.length) {
        for (const extension of extensions) {
          parsed = await extension.getFunctionRanges(script.sourceURL, content);

          if (parsed && parsed.length) {
            functionDescriptorsViaSourceUrlMap.set(script.sourceURL, parsed);
            break;
          }
        }
      }
    }
    if (parsed) {
      const best = sourceMap.findBestCandidate(parsed, lineNumber, columnNumber) as Chrome.DevTools.FunctionDescriptor;
      if (best) {
        resolvedName = best.nameAsFunction;
      }
    }
  }
  return resolvedName;
}
