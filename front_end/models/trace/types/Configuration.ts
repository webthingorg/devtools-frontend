// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

export type Configuration = {
  /**
   * Include V8 RCS functions in the JS stacks
   */
  includeRuntimeCallStats: boolean,
  /**
   * Show all events: disable the default filtering which hides and excludes some events.
   */
  showAllEvents: boolean,
  /**
   * Extra detail for RPP developers (eg Trace Event json in Summary, and individual JS Sample events)
   */
  debugMode: boolean,
};

export const defaults = (): Configuration => ({
  includeRuntimeCallStats: false,
  showAllEvents: false,
  debugMode: false,
});

/**
 * Generates a key that can be used to represent this config in a cache. This is
 * used mainly in tests, where we want to avoid re-parsing a file if we have
 * already processed it with the same configuration.
 * While this cache keyThis cache key purposefully
 * does not include all settings in the configuration; the processing settings
 * do not impact the actual resulting data. Only new flags in the config that
 * alter parsing should be added to this cache key.
 */
export function configToCacheKey(config: Configuration): string {
  return JSON.stringify(config);
}
