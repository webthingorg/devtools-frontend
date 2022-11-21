// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {collectAllStringsInDir, writeStringsToCtcFiles, createPsuedoLocaleStrings, collectAndBakeCtcStrings} =
    require('../../../third_party/i18n/collect-strings.js');

/** @typedef {import('../../../third_party/i18n/bake-ctc-to-lhl.js').CtcMessage} CtcMessage */

const yargsObject = require('yargs')
                        .option('input-directories', {
                          type: 'array',
                          demandOption: true,
                        })
                        .option('output-directory', {
                          type: 'string',
                          demandOption: true,
                        })
                        .option('include-en-xl', {
                          type: 'boolean',
                        })
                        .strict()
                        .argv;

const inputDirectories = yargsObject['input-directories'];
if (inputDirectories.length === 0) {
  throw new Error('Provide at least one directory!');
}

/** @type {Record<string, CtcMessage} */
let collectedStrings = {};
for (const directory of inputDirectories) {
  collectedStrings = {
    ...collectedStrings,
    ...collectAllStringsInDir(directory),
  };
}

const outputDirectory = yargsObject['output-directory'];
writeStringsToCtcFiles(outputDirectory, 'en-US', collectedStrings);
if (yargsObject['include-en-xl']) {
  writeStringsToCtcFiles(outputDirectory, 'en-XL', createPsuedoLocaleStrings(collectedStrings));
}

// Turns all the *.ctc.json files in a directory into the LHL JSON format.
collectAndBakeCtcStrings(outputDirectory, outputDirectory);
