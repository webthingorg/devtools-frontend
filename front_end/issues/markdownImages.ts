// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

export interface IconData {
  key: string;
  isIcon: boolean;
  style?: Record<string, string>;
}

const markdownIcons = new Map<string, IconData>([
  [
    'deviceEmulationIcon',  // Key for device emulation icon
    {
      key: 'largeicon-phone',
      isIcon: true,
      style: {
        margin: '-4px',
      },
    },
  ],
  [
    'settingsIcon',  // Key for settings gear icon
    {
      key: 'largeicon-settings-gear',
      isIcon: true,
      style: {
        margin: '-4px',
      },
    },
  ],
]);

export const getMarkdownImage = (key: string) => {
  if (markdownIcons.has(key)) {
    return markdownIcons.get(key);
  }
  throw new Error(`Markdown icon with key '${key}' is not available, please check markdownImages.ts`);
};
