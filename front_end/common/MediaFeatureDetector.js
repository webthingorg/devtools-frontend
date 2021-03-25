// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * Queries webview to determine if media feature is supported. `media`
 * serializes to `'not all'` for unsupported queries.
 *
 * @param {string} query
 * @return {boolean}
 */
export function isSupported(query) {
  return window.matchMedia(query).media === query;
}
