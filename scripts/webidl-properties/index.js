// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// eslint-disable-next-line rulesdir/es_modules_import
import idl from '@webref/idl';
import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';

import {SPECS} from './config.js';
import {getIDLProps} from './get-props.js';
import {getMissingTypes} from './util.js';

if (process.argv.length !== 3) {
  throw new Error('Please provide the path to devtools-frontend');
}

const files = await idl.listAll();
const specs = await Promise.all(SPECS.map(name => files[name].parse().then(idls => ({name, idls}))));

const output = getIDLProps(specs);
const missing = getMissingTypes(output);

for (const type of missing) {
  console.warn('Found missing type:', type);
}

const frontendPath = path.resolve(process.argv[2]);
const jsMetadataPath = path.join(frontendPath, 'front_end/models/javascript_metadata/');
const outPath = path.join(jsMetadataPath, 'DOMPinnedProperties.js');
const thisPath = path.relative(frontendPath, url.fileURLToPath(import.meta.url));
const json = JSON.stringify(output, null, 2);

fs.writeFileSync(outPath, `
// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
// Generated from ${thisPath}

export const DOMPinnedProperites = JSON.parse(\`${json}\`);
`);
