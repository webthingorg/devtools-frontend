// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * This is a helper script to bundle the i18n.js library.
 * From the folder containing i18n.js, locales.js, and this script, run node buildI18nBundle.js
 * This will generate a unminified-i18n-bundle.js file that exports a module called i18n
 */

const browserify = require('browserify');
const fs = require('fs');
const path = require('path');
const uglifyify = require('uglifyify');
const replace = require('replace-in-file');
const helpMessage = 'A helper script to bundle the i18n.js library.\n' +
    'From the folder containing i18n.js, locales.js, and this script, run node buildI18nBundle.js [--minify].\n' +
    'This will generate a unminified or minified(if --minify presents) i18n-bundle.js that exports a module called i18n.\n';

function main() {
  const extraArg = process.argv[2];
  let shouldMinify = false;

  if (extraArg === '--help') {
    console.log(helpMessage);
    process.exit(0);
  } else if (extraArg === '--minify') {
    shouldMinify = true;
  } else if (extraArg) {
    console.log('Please pass in --help or --minify');
    process.exit(0);
  }

  try {
    bundleI18n(shouldMinify);
  } catch (e) {
    console.log(e.stack);
    process.exit(1);
  }
}

/**
 * Creates the patched version of i18n library.
 * @param {*} shouldMinify True if the output file should be minified, false otherwise.
 */
function bundleI18n(shouldMinify) {
  const i18nBundle = browserify('i18n.js', {standalone: 'i18n'});
  let outputFilename = '/unminified-i18n-bundle.js';

  if (shouldMinify) {
    console.log('minifying i18n...');
    i18nBundle.transform(uglifyify, {global: true});
    outputFilename = '/i18n-bundle.js';
  }

  console.log('Bundling i18n...');
  const outputPath = path.normalize(__dirname + outputFilename);
  const i18nBundleStream = i18nBundle.bundle();
  const writeStream = fs.createWriteStream((outputPath));
  writeStream.on('finish', async err => {
    await patchLibrary(outputPath, /g\.i18n/gi, 'i18n');
    await patchLibrary(
        outputPath, /\(function\(f\){if\(typeof exports===\"object\"/gi,
        'let i18n={};(function(f){if(typeof exports==="object"');
    await patchLibrary(outputPath, /{}\]},{},\[[1-9]+\]\)\([1-9]+\)(\n|\r)?}\);/gi, match => `${match}export {i18n};`);
  });
  i18nBundleStream.pipe(writeStream);
  console.log(`Written to ${outputPath}`);
}

/**
 * Applies specific patches to expose the module as an ESM instead of as a global.
 * @param {*} path The path to the file.
 * @param {*} textToReplace The regex or text that will be replaced.
 * @param {*} replacement The replacement text.
 */
async function patchLibrary(path, textToReplace, replacement) {
  await replace({
    from: textToReplace,
    to: replacement,
    files: path,
  });
}

main();
