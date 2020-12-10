// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/*
  To use links in markdown, add key here with the link and
  use the added key in markdown.
  @example markdown
  Find more information about web development at [Learn more](exampleLink)
*/
const markdownLinks = new Map<string, string>([
  ['exampleLink', 'https://web.dev/'],
]);

export const getMarkdownLink = (key: string) => {
  const link = markdownLinks.get(key);
  if (!link) {
    throw new Error(`Markdown link with key '${key}' is not available, please check MarkdownLinksMap.ts`);
  }
  return link;
};
