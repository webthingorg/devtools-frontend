// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const markdownLinks = new Map<string, string>([
  ['exampleLink', 'https://web.dev/'],
]);

export const getMarkdownLink = (key: string) => {
  if (markdownLinks.has(key)) {
    return markdownLinks.get(key);
  }
  throw new Error(`Markdown link with key '${key}' is not available, please check markdownLinks.ts`);
};
