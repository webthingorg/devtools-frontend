// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/*
 * src for image is relative url for image location.
 * src for icon is key in front_end/ui/Icon.js
 * @example icon
 * {
 *   src: 'largeicon-phone',
 *   isIcon: true,
 *   style: {
 *     margin: 4px;
 *   }
 * }
 * @example image
 * {
 *   src: 'Images/errorWave',
 *   isIcon: false,
 *   style: {
 *     margin: 4px;
 *   }
 * }
 *
*/
export interface ImageData {
  src: string;
  isIcon: boolean;
  style?: Record<string, string>;
}

/*
 * To use images in markdown, add key here with the image data and
 * use the added key in markdown.
 * @example markdown
 * Find more information about web development at ![Settings icon](settingsIcon)
 * and below is the another image example ![Chrome toolbar](chromeToolKey)
*/

// NOTE: This is only exported for tests, and it should not be
// imported in any component, instead add image data in map and
// use getMarkdownImage to get the appropriate image data.
export const markdownImages = new Map<string, ImageData>([]);

export const getMarkdownImage = (key: string) => {
  const image = markdownImages.get(key);
  if (!image) {
    throw new Error(`Markdown icon with key '${key}' is not available, please check MarkdownImagesMap.ts`);
  }
  return image;
};
