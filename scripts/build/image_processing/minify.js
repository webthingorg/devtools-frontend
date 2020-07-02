// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const fs = require('fs');
const {PNG} = require('pngjs');
const path = require('path');
const imagequant = require('../../../third_party/squoosh/imagequant.js');
const oxiPNG = require('../../../third_party/squoosh/oxipng.js');

const outputDirectory = process.argv[2];

const PNG_OPTIMIZE_LEVEL = 3;
const QUANTIZE_NUMBER_OF_COLORS = 32;

const ImageQuantModule = imagequant();

ImageQuantModule.onRuntimeInitialized = () => {
  for (let i = 3; i < process.argv.length; i++) {
    const srcName = process.argv[i];
    // Read a PNG file
    const fileData = fs.readFileSync(path.join(process.cwd(), srcName));
    // Parse it
    const decodedPNG = PNG.sync.read(fileData, {
      filterType: -1,
    });
    const {width, height} = decodedPNG;
    const quantizedImage = ImageQuantModule.quantize(decodedPNG.data, width, height, QUANTIZE_NUMBER_OF_COLORS, 0);

    const quantizedPNG = new PNG({width, height});
    quantizedPNG.data = quantizedImage.buffer;
    const quantizedPNGBuffer = PNG.sync.write(quantizedPNG);
    const optimizedPNGBuffer = oxiPNG.optimise(quantizedPNGBuffer, PNG_OPTIMIZE_LEVEL);

    fs.writeFileSync(path.join(process.cwd(), outputDirectory, path.basename(srcName)), optimizedPNGBuffer);
  }
};
