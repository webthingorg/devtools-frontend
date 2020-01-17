// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

Dom3d.ColorHelper = class {
  constructor() {
    this._blueToYellow = [
      [0, 26, 128],   [0, 51, 153],   [0, 77, 179],   [0, 102, 204],  [0, 128, 230],   [0, 153, 255],
      [23, 158, 232], [46, 162, 209], [70, 167, 185], [93, 172, 162], [116, 176, 139], [139, 181, 116],
      [162, 185, 93], [185, 190, 70], [209, 195, 46], [232, 199, 23], [255, 204, 0],   [255, 187, 0],
      [255, 170, 0],  [255, 153, 0],  [255, 136, 0],  [255, 119, 0],  [255, 102, 0],   [255, 119, 0]
    ];

    this._purpleToWhiteToPink = [
      [51, 0, 255],    [70, 19, 255],   [88, 37, 255],   [107, 56, 255],  [125, 74, 255],  [144, 93, 255],
      [162, 111, 255], [181, 130, 255], [199, 148, 255], [218, 167, 255], [236, 185, 255], [255, 204, 255],
      [255, 190, 241], [255, 176, 227], [255, 162, 213], [255, 148, 199], [255, 134, 185], [255, 121, 172],
      [255, 107, 158], [255, 93, 144],  [255, 107, 158]
    ];

    this._blueToYellowIterator = new Dom3d.ColorIterator(this._blueToYellow);
    this._purpleToWhiteIterator = new Dom3d.ColorIterator(this._purpleToWhiteToPink);
  }

  /**
     * Creates an array of rgb colors with hues covering the entire spectrum
     *
     * @param {number} [maxNestingLevel=20]
     * @returns Array Rgb values for a rainbow scheme
     */
  makeRainbowGradient(maxNestingLevel = 20) {
    const degreesForHue = 360;
    const rainbowColorGradient = [];
    const ratio = degreesForHue / maxNestingLevel;
    for (let i = 0; i < maxNestingLevel; i++) {
      const hue = (ratio * i) / degreesForHue;
      const rgb = this.convertHSLToRGB(hue, 0.8, 0.6);
      rainbowColorGradient.push(rgb);
    }
    return rainbowColorGradient;
  }

  defaultHeatmapColor() {
    return this._purpleToWhiteIterator;
  }

  blueToYellow() {
    return this._blueToYellowIterator;
  }

  purpleToWhiteToPink() {
    return this._purpleToWhiteIterator;
  }


  /**
     * Converts HSL to RGB
     *
     * @param {number} h hue 0 - 1
     * @param {number} s saturation 0 - 1
     * @param {number} l luminosity 0 -1
     * @returns {Array<number>} an array with the rgb values
     */
  convertHSLToRGB(h, s, l) {
    let r, g, b;
    if (s === 0) {
      r = g = b = l;  // If no saturation, then everything is grayscale
    } else {
      // Calculate luminosity and saturation coefficients
      const x = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const y = 2 * l - x;
      r = this.convertHUEToRGB(y, x, h + 0.33);
      g = this.convertHUEToRGB(y, x, h);
      b = this.convertHUEToRGB(y, x, h - 0.33);
    }
    return [(r * 255), (g * 255), (b * 255)];
  }

  /**
     * @returns number 0-1
     */
  convertHUEToRGB(y, x, t) {
    if (t < 0) {
      t += 1;
    } else if (t > 1) {
      t -= 1;
    }
    if (t >= 0.66) {
      return y;
    } else if (t >= 0.5) {
      return y + (x - y) * (0.66 - t) * 6;
    } else if (t >= 0.33) {
      return x;
    } else {
      return y + (x - y) * 6 * t;
    }
  }
};

Dom3d.ColorIterator = class {
  constructor(colorList) {
    this._colorList = colorList;
    this._size = this._colorList.length - 1;
  }

  getColorForLevel(level = 0) {
    const block = Math.floor(level / this._size);
    const reverse = block % 2 === 1;
    let colorIndex = level % this._size;
    if (reverse) {
      colorIndex = this._size - colorIndex;
    }

    return this._colorList[colorIndex];
  }
};
