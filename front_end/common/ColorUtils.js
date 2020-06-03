// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * Combine the two given color according to alpha blending.
 * @param {!Array<number>} fgRGBA
 * @param {!Array<number>} bgRGBA
 * @param {!Array<number>} out_blended
 */
export function blendColors(fgRGBA, bgRGBA, out_blended) {
  const alpha = fgRGBA[3];

  out_blended[0] = ((1 - alpha) * bgRGBA[0]) + (alpha * fgRGBA[0]);
  out_blended[1] = ((1 - alpha) * bgRGBA[1]) + (alpha * fgRGBA[1]);
  out_blended[2] = ((1 - alpha) * bgRGBA[2]) + (alpha * fgRGBA[2]);
  out_blended[3] = alpha + (bgRGBA[3] * (1 - alpha));
}
