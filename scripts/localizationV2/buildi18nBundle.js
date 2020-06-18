// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * This is a helper script to bundle the i18n.js library.
 * From the folder containing i18n.js, locales.js, and this script, run node buildI18nBundle.js
 * This will generate an unminified-i18n-bundle.js file that exports a module called i18n
 */

const browserify = require('browserify');
const fs = require('fs');
const path = require('path');
const uglifyify = require('uglifyify');
const replace = require('replace-in-file');
const yargs = require('yargs');

const usageMessage = `A helper script to bundle the i18n.js library.
  From the folder containing i18n.js, locales.js, and this script, run:
    node buildI18nBundle.js [--minify].
  This will generate an unminified or a minified (if --minify is present)
  i18n-bundle.js that exports a module called i18n.`;
const versionMessage = '// lighthouse.i18n, browserified. 1.0.0\n';
const tscSkip = '// @ts-nocheck\n';

function main() {
  const args = yargs.parse(process.argv);
  let shouldMinify = false;
  let outputPath = __dirname;
  let i18nPath = path.normalize(path.join(__dirname, 'i18n.js'));

  if (args.output_path) {
    outputPath = args.output_path;
  }

  if (args.minify) {
    shouldMinify = true;
  }

  if (args.i18n_path) {
    i18nPath = args.i18n_path;
  }

  if (args.usage) {
    console.log(usageMessage);
    process.exit(0);
  }

  try {
    bundleI18n(shouldMinify, outputPath, i18nPath);
  } catch (e) {
    console.log(e.stack);
    process.exit(1);
  }
}

/**
 * Creates the patched version of i18n library.
 * @param {boolean} shouldMinify True if the output file should be minified,
 * false otherwise.
 * @param {boolean} outputPath The output path for generated files.
 * @param {boolean} i18nPath The path to i18n.js library.
 */
function bundleI18n(shouldMinify, outputPath, i18nPath) {
  const i18nBundle = browserify(i18nPath, {standalone: 'i18n'});
  if (shouldMinify) {
    console.log('minifying i18n...');
    i18nBundle.transform(uglifyify, {global: true});
  }

  console.log('Bundling i18n...');
  const normalizedOutputPath = path.normalize(path.join(outputPath, 'i18n-bundle.js'));
  const i18nBundleStream = i18nBundle.bundle();
  const writeStream = fs.createWriteStream(normalizedOutputPath);
  writeStream.on('finish', async err => {
    await patchLibrary(normalizedOutputPath, /g\.i18n/gi, 'i18n');

    // prepend with version and skip headers
    const prependHeaders = versionMessage + tscSkip;
    const wrapperHeader = 'let i18n={};';

    await patchLibrary(normalizedOutputPath, /^/gi, prependHeaders + wrapperHeader);

    // append ESM export
    await patchLibrary(normalizedOutputPath, /$/gi, 'export {i18n};');
  });
  i18nBundleStream.pipe(writeStream);
  console.log(`Written to ${outputPath}`);
}

/**
 * Applies specific patches to expose the module as an ESM instead of as a global.
 * @param {string} path The path to the file.
 * @param {string} textToReplace The regex or text that will be replaced.
 * @param {string} replacement The replacement text.
 */
async function patchLibrary(path, textToReplace, replacement) {
  await replace({
    from: textToReplace,
    to: replacement,
    files: path,
  });
}

main();
