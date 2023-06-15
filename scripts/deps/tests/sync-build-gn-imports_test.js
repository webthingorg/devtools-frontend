// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// This script takes a path to a BUILD.gn and ensures that its DEPS are in sync for each file in that BUILD.gn.
const {assert} = require('chai');
const path = require('path');
const {compareDeps, parseBuildGN, parseSourceFileForImports, validateDirectory} =
    require('../sync-build-gn-imports.js');

describe('parsing a BUILD.gn file to find its modules', () => {
  it('can parse a BUILD.gn that has sources and deps on one line', () => {
    const input = `devtools_module("handlers") {
  sources = ["TestHandler.ts"]

  deps = ["../../../core/platform:bundle"]
}`;
    const result = parseBuildGN(input);
    assert.deepEqual(result, [{
                       template: 'devtools_module',
                       moduleName: 'handlers',
                       sources: ['TestHandler.ts'],
                       deps: ['../../../core/platform:bundle']
                     }]);
  });

  it('can parse a BUILD.gn that has sources and deps over multiple lines', () => {
    const input = `devtools_module("handlers") {
  sources = [
    "HandlerOne.ts",
    "HandlerTwo.ts",
  ]
  deps = [
    "../../../core/platform:bundle",
    "../../../core/sdk:bundle",
  ]
}`;
    const result = parseBuildGN(input);
    assert.deepEqual(result, [{
                       template: 'devtools_module',
                       moduleName: 'handlers',
                       sources: ['HandlerOne.ts', 'HandlerTwo.ts'],
                       deps: ['../../../core/platform:bundle', '../../../core/sdk:bundle']
                     }]);
  });

  it('can ignore other GN parts that we do not need to care about', () => {
    const input = `devtools_module("handlers") {
  sources = [
    "HandlerOne.ts",
    "HandlerTwo.ts",
  ]

  visibility = [":*"]

  deps = [
    "../../../core/platform:bundle",
    "../../../core/sdk:bundle",
  ]
}`;
    const result = parseBuildGN(input);
    assert.deepEqual(result, [{
                       template: 'devtools_module',
                       moduleName: 'handlers',
                       sources: ['HandlerOne.ts', 'HandlerTwo.ts'],
                       deps: ['../../../core/platform:bundle', '../../../core/sdk:bundle']
                     }]);
  });

  it('ignores any sources or inputs that are commented out', () => {
    const input = `devtools_module("handlers") {
  sources = [
    # "HandlerOne.ts",
    "HandlerTwo.ts",
  ]

  visibility = [":*"]

  deps = [
    # "../../../core/platform:bundle",
    "../../../core/sdk:bundle",
  ]
}`;
    const result = parseBuildGN(input);
    assert.deepEqual(result, [{
                       template: 'devtools_module',
                       moduleName: 'handlers',
                       sources: ['HandlerTwo.ts'],
                       deps: ['../../../core/sdk:bundle']
                     }]);
  });

  it('can parse multiple modules', () => {
    const input = `devtools_module("handlers") {
  sources = [
    "HandlerOne.ts",
    "HandlerTwo.ts",
  ]

  deps = [
    "../../../core/platform:bundle",
    "../../../core/sdk:bundle",
  ]
}

devtools_module("other") {
  sources = ["foo.ts"]
}`;
    const result = parseBuildGN(input);
    assert.deepEqual(result, [
      {
        template: 'devtools_module',
        moduleName: 'handlers',
        sources: ['HandlerOne.ts', 'HandlerTwo.ts'],
        deps: ['../../../core/platform:bundle', '../../../core/sdk:bundle']
      },
      {template: 'devtools_module', moduleName: 'other', sources: ['foo.ts'], deps: []}
    ]);
  });

  it('can parse multiple modules when there is no blank line between them', () => {
    const input = `devtools_module("handlers") {
  sources = [
    "HandlerOne.ts",
    "HandlerTwo.ts",
  ]

  deps = [
    "../../../core/platform:bundle",
    "../../../core/sdk:bundle",
  ]
}
devtools_module("other") {
  sources = ["foo.ts"]
}`;
    const result = parseBuildGN(input);
    assert.deepEqual(result, [
      {
        template: 'devtools_module',
        moduleName: 'handlers',
        sources: ['HandlerOne.ts', 'HandlerTwo.ts'],
        deps: ['../../../core/platform:bundle', '../../../core/sdk:bundle']
      },
      {template: 'devtools_module', moduleName: 'other', sources: ['foo.ts'], deps: []}
    ]);
  });

  it('can parse multiple modules that do not have sources or deps', () => {
    const input = `devtools_module("handlers") {
  sources = [
    "HandlerOne.ts",
    "HandlerTwo.ts",
  ]
}
devtools_module("other") {
  sources = []
}`;
    const result = parseBuildGN(input);
    assert.deepEqual(result, [
      {template: 'devtools_module', moduleName: 'handlers', sources: ['HandlerOne.ts', 'HandlerTwo.ts'], deps: []},
      {template: 'devtools_module', moduleName: 'other', sources: [], deps: []}
    ]);
  });
});

describe('parsing imports from a TS file', () => {
  it('returns a list of imports', () => {
    const input = `
import * as SDK from '../core/sdk/sdk.js';
import {type Foo} from './types.js';
import {Bar} from './utils.js';
    `;

    const result = parseSourceFileForImports(input, 'front_end/components/example.ts');
    assert.deepEqual(result, {
      filePath: 'front_end/components/example.ts',
      imports: [
        '../core/sdk/sdk.js',
        './types.js',
        './utils.js',
      ]
    });
  });
});

describe('comparing imports from BUILD.gn and a source file', () => {
  it('can match up imports', () => {
    const buildGNFileContents = `devtools_module("handlers") {
  sources = [
    "HandlerOne.ts",
    "HandlerTwo.ts",
  ]

  deps = [
    "../../../core/platform:bundle",
    "../../../core/sdk:bundle",
  ]
}`;
    const buildGN = parseBuildGN(buildGNFileContents);

    const sourceCodeFileContents = `
import * as Platform from '../../../core/platform/platform.js';
import * as SDK from '../../../core/sdk/sdk.js';
  `;
    const sourceCodeFileName = 'front_end/components/HandlerOne.ts';
    const sourceCode = parseSourceFileForImports(sourceCodeFileContents, sourceCodeFileName);

    const result = compareDeps({buildGN, sourceCode});
    assert.deepEqual(result, {
      inBoth: [
        path.resolve(path.dirname(sourceCodeFileName), '../../../core/platform'),
        path.resolve(path.dirname(sourceCodeFileName), '../../../core/sdk')
      ],
      inOnlyBuildGN: [],
      sourceIsEntryPoint: false,
      missingBuildGNSources: [],
      inOnlySourceCode: [],
    });
  });

  it('can match up imports when one goes an extra folder up', () => {
    const buildGNFileContents = `devtools_module("handlers") {
  sources = [
    "HandlerOne.ts",
    "HandlerTwo.ts",
  ]

  deps = [
    "../../core/platform:bundle",
  ]
}`;
    const buildGN = parseBuildGN(buildGNFileContents);

    const sourceCodeFileContents = `
import * as Platform from '../platform/platform.js';
  `;
    const sourceCodeFileName = 'front_end/core/handlers/HandlerOne.ts';
    const sourceCode = parseSourceFileForImports(sourceCodeFileContents, sourceCodeFileName);

    const result = compareDeps({buildGN, sourceCode});
    assert.deepEqual(result, {
      inBoth: [path.resolve(path.dirname(sourceCodeFileName), '../../core/platform')],
      inOnlyBuildGN: [],
      sourceIsEntryPoint: false,
      missingBuildGNSources: [],
      inOnlySourceCode: [],
    });
  });

  it('can correctly identify sub-modules and the DEPS for them', () => {
    const buildGNFileContents = `devtools_module("helpers") {
  sources = ["helpers.ts"]
}

devtools_module("handlers") {
  sources = [
    "HandlerOne.ts",
  ]

  deps = [
    "helpers:bundle",
  ]
}`;
    const buildGN = parseBuildGN(buildGNFileContents);

    const sourceCodeFileContents = `
import * as Helpers from './helpers/helpers.js';
  `;
    const sourceCode = parseSourceFileForImports(sourceCodeFileContents, 'front_end/components/HandlerOne.ts');

    const result = compareDeps({buildGN, sourceCode});
    assert.deepEqual(result, {
      inBoth: [path.resolve('front_end/components', 'helpers')],
      inOnlyBuildGN: [],
      missingBuildGNSources: [],
      sourceIsEntryPoint: false,
      inOnlySourceCode: [],
    });
  });

  it('can find deps that are only in source code or BUILD.gn', () => {
    const buildGNFileContents = `devtools_module("handlers") {
  sources = [
    "HandlerOne.ts",
    "HandlerTwo.ts",
  ]

  deps = [
    "../../../core/platform:bundle",
    "../../../core/sdk:bundle",
    "../../../core/only-in-build-gn:bundle",
  ]
}`;
    const buildGN = parseBuildGN(buildGNFileContents);

    const sourceCodeFileContents = `
import * as Platform from '../../../core/platform/platform.js';
import * as SDK from '../../../core/sdk/sdk.js';
import * as Something from '../only-in-source-code/only-in-source-code.js';
  `;
    const sourceCode = parseSourceFileForImports(sourceCodeFileContents, 'front_end/components/HandlerOne.ts');

    const resolvePath = filePath => {
      return path.resolve('front_end/components', filePath);
    };

    const result = compareDeps({buildGN, sourceCode});
    assert.deepEqual(result, {
      inBoth: [resolvePath('../../../core/platform'), resolvePath('../../../core/sdk')],
      inOnlyBuildGN: [resolvePath('../../../core/only-in-build-gn')],
      sourceIsEntryPoint: false,
      inOnlySourceCode: [resolvePath('../only-in-source-code')],
      missingBuildGNSources: [],
    });
  });

  it('does not check that sibling imports are in the DEPS', () => {
    const buildGNFileContents = `devtools_module("handlers") {
  sources = [
    "HandlerOne.ts",
    "HandlerTwo.ts",
    "Utils.ts",
  ]

  deps = [
    "../../../core/platform:bundle",
  ]
}`;
    const buildGN = parseBuildGN(buildGNFileContents);

    const sourceCodeFileContents = `
import * as Platform from '../../../core/platform/platform.js';
import {Utils} from './Utils.js';
  `;
    const sourceCode = parseSourceFileForImports(sourceCodeFileContents, 'front_end/components/HandlerOne.ts');

    const resolvePath = filePath => {
      return path.resolve('front_end/components', filePath);
    };

    const result = compareDeps({buildGN, sourceCode});
    // We don't expect any errors for Utils.js, because it's a file in the same
    // directory and therefore doesn't need to be a DEP. It just needs to be in
    // the `sources` list.
    assert.deepEqual(result, {
      inBoth: [resolvePath('../../../core/platform')],
      sourceIsEntryPoint: false,
      inOnlyBuildGN: [],
      inOnlySourceCode: [],
      missingBuildGNSources: [],
    });
  });

  it('merges the DEPS of the devtools_module if we find devtools_entrypoint', () => {
    const buildGNFileContents = `devtools_module("handlers") {
  sources = [
    "HandlerOne.ts",
    "HandlerTwo.ts",
    "Utils.ts",
  ]

  deps = [
    "../../../core/platform:bundle",
    "services:bundle"
  ]
}

devtools_entrypoint("bundle") {
  entrypoint = "handlers.ts"
  deps = [":handlers"]
}
`;
    const buildGN = parseBuildGN(buildGNFileContents);

    const sourceCodeFileContents = `
import * as HandlerOne from './HandlerOne.js';
import * as HandlerTwo from './HandlerTwo.js';
import * as Services from './services/services.js';

export {HandlerOne, HandlerTwo, Services};
  `;
    const sourceCode = parseSourceFileForImports(sourceCodeFileContents, 'front_end/handlers/handlers.ts');

    const resolvePath = filePath => {
      return path.resolve('front_end/handlers', filePath);
    };
    // We don't check entrypoint files, all they do is provide the entrypoint
    // and depend on a devtools_module, which is where the real logic is.
    const result = compareDeps({buildGN, sourceCode});
    assert.deepEqual(result, {
      sourceIsEntryPoint: true,
      inBoth: [resolvePath('services')],
      missingBuildGNSources: [],
      inOnlyBuildGN: [resolvePath('../../../core/platform')],
      inOnlySourceCode: [],
    });
  });

  it('reports a missing source if a sibling import is not in sources', () => {
    const buildGNFileContents = `devtools_module("handlers") {
  sources = [
    "HandlerOne.ts",
    "HandlerTwo.ts",
  ]

  deps = [
    "../../../core/platform:bundle",
  ]
}`;
    const buildGN = parseBuildGN(buildGNFileContents);

    const sourceCodeFileContents = `
import * as Platform from '../../../core/platform/platform.js';
import {Utils} from './Utils.js';
  `;
    const sourceCode = parseSourceFileForImports(sourceCodeFileContents, 'front_end/components/HandlerOne.ts');

    const resolvePath = filePath => {
      return path.resolve('front_end/handlers', filePath);
    };
    const result = compareDeps({buildGN, sourceCode});
    // We don't expect any errors for Utils.js, because it's a file in the same
    // directory and therefore doesn't need to be a DEP. It just needs to be in
    // the `sources` list.
    assert.deepEqual(result, {
      inBoth: [resolvePath('../../../core/platform')],
      missingBuildGNSources: ['Utils.ts'],
      inOnlyBuildGN: [],
      sourceIsEntryPoint: false,
      inOnlySourceCode: [],
    });
  });
});

describe('executing the checker on a directory', () => {
  it('finds missing imports that need to be in the BUILD.gn and extraneous imports in the BUILD.gn', () => {
    const testDir = path.join(__dirname, 'fixtures', 'missing-deps');
    const result = validateDirectory(testDir);
    const resolvePath = filePath => {
      return path.resolve(testDir, filePath);
    };
    assert.deepEqual(result.missingBuildGNDeps, [
      {importPath: resolvePath('../../missing-one'), sourceFile: 'HandlerOne.ts'},
      {importPath: resolvePath('../../missing-two'), sourceFile: 'HandlerTwo.ts'},
    ]);
    assert.deepEqual(Array.from(result.unusedBuildGNDeps), [resolvePath('../../../not-used-in-source-code')]);
  });
});
