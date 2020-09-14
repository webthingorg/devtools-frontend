// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const fs = require('fs');
const path = require('path');

const ENTRYPOINTS = [
  'devtools_app',
  'inspector',
  'js_app',
  'ndb_app',
  'node_app',
  'toolbox',
  'worker_app',
];

const args = process.argv;

const templateIndex = args.findIndex(arg => arg === '--template');
const templateLocation = args[templateIndex + 1];

if (!templateLocation) {
  throw new Error('Must specify --template location with the location of the HTML entrypoint template.');
}

const outDirectoryIndex = args.findIndex(arg => arg === '--out-directory');
const outDirectoryLocation = args[outDirectoryIndex + 1];

if (!outDirectoryLocation) {
  throw new Error('Must specify --out-directory location where the outputs must live.');
}

const templateContent = fs.readFileSync(templateLocation, 'utf-8');

for (const entrypoint of ENTRYPOINTS) {
  const rewrittenTemplateContent = templateContent.replace('%ENTRYPOINT_NAME%', entrypoint);
  fs.writeFileSync(path.join(outDirectoryLocation, `${entrypoint}.html`), rewrittenTemplateContent);
}
