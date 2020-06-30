// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as path from 'path';

// eslint-disable-next-line import/no-default-export
export default {
  treeshake: false,
  context: 'self',
  output: {
    format: 'esm',
  },
  plugins:
      [
        (() => {
          let entrypointDirectory;
          return {
            name: 'devtools-plugin',
            buildStart(options) {
              let inputFile = options.input;
              if (Array.isArray(inputFile)) {
                if (inputFile.length !== 1) {
                  throw new Error(`Invalid multiple inputs: ${JSON.stringify(inputFile)}`);
                }
                inputFile = inputFile[0];
              } else {
                throw new Error(`Invalid input file type specified: ${JSON.stringify(options.input)}`);
              }
              const absoluteInputPath = path.normalize(path.join(process.cwd(), inputFile));
              entrypointDirectory = path.dirname(absoluteInputPath) + path.sep;
            },
            resolveId(source, importer) {
              if (!importer) {
                return null;
              }
              const currentDirectory = path.normalize(path.dirname(importer));
              const importedFilelocation = path.normalize(path.join(currentDirectory, source));
              const importedFileDirectory = path.dirname(importedFilelocation) + path.sep;

              // Generated files are part of other directories, as they are only imported once
              if (path.basename(importedFileDirectory) === 'generated') {
                return null;
              }

              // We currently still have to import third_party packages and put them in separate
              // folders with the `module.json` files.
              //
              // Note that we can't do a simple check for only `third_party`, as in Chromium
              // our full path is `third_party/devtools-frontend/src/`, which thus *always*
              // includes third_party. It also not possible to use the current directory
              // as a check for the import, as the import will be different in Chromium and
              // would therefore not match the path of `__dirname`.
              if (importedFileDirectory.includes(path.join('front_end', 'third_party'))) {
                return null;
              }

              const isExternal = !importedFileDirectory.startsWith(entrypointDirectory);

              return {
                id: importedFilelocation,
                external: isExternal,
              };
            }
          };
        })(),
      ]
};
