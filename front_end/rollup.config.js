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
              entrypointDirectory = path.dirname(absoluteInputPath);
            },
            resolveId(source, importer) {
              if (!importer) {
                return null;
              }
              const currentDirectory = path.normalize(path.dirname(importer));
              const importedFilelocation = path.normalize(path.join(currentDirectory, source));
              const isExternal = !path.dirname(importedFilelocation).startsWith(entrypointDirectory);

              return {
                id: importedFilelocation,
                external: isExternal,
              };
            }
          };
        })(),
      ]
};
