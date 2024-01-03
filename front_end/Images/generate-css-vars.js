// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
const path = require('path');
const {writeIfChanged} = require('../../scripts/build/ninja/write-if-changed.js');
const [, , buildTimestamp, targetGenDir, targetName, ...imageSources] = process.argv;

/**
 * @param {string} fileName
 */
function generateCSSVariableDefinition(fileName) {
  const {base, name} = path.parse(fileName);
  return `['${name}', '${base}']`;
}

const CURRENT_YEAR = new Date(Number(buildTimestamp) * 1000).getUTCFullYear();
const newContents = `
// Copyright ${CURRENT_YEAR} The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const sources = [
  ${imageSources.map(generateCSSVariableDefinition).join(',\n  ')}
];
const sheet = new CSSStyleSheet();
sheet.replaceSync(\`:root {
  \${sources.map(([name, base]) => \`--image-file-\${name}: url(\${new URL(base, import.meta.url)});\`).join('\\n')}
}\`);
document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
`;

writeIfChanged(path.join(targetGenDir, 'Images.prebundle.js'), newContents);

const tsconfigContent = `{
  "compilerOptions": {
      "composite": true
  },
  "files": [
      "Images.js"
  ]
}
`;

writeIfChanged(path.join(targetGenDir, `${targetName}-tsconfig.json`), tsconfigContent);
