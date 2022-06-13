// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// eslint-disable-next-line rulesdir/es_modules_import
import idl from '@webref/idl';
import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';

import {SPECS} from './config.js';
import {addMetadata, getIDLProps, minimize} from './get-props.js';
import {getMissingTypes} from './util.js';

if (process.argv.length !== 3) {
  throw new Error('Please provide the path to devtools-frontend');
}

const files = await idl.listAll();
const names = Object.keys(SPECS);
const specs = await Promise.all(names.map(name => files[name].parse().then(idls => ({name, idls}))));

const output = addMetadata(getIDLProps(specs));
const missing = getMissingTypes(output);

for (const type of missing) {
  console.warn('Found missing type:', type);
}

const frontendPath = path.resolve(process.argv[2]);
const jsMetadataPath = path.join(frontendPath, 'front_end/models/javascript_metadata/');
const outPath = path.join(jsMetadataPath, 'DOMPinnedProperties.js');
const thisPath = path.relative(frontendPath, url.fileURLToPath(import.meta.url));

fs.writeFileSync(outPath, `
// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
// Generated from ${thisPath}

/**
 * All the specs used when generating the DOM pinned properties dataset.
 */
export const SPECS = ${JSON.stringify(SPECS)};

/**
 * The DOM pinned properties dataset. Generated from WebIDL data parsed from
 * the SPECS above.
 *
 * This is an object with WebIDL type names as keys and their WebIDL properties
 * and inheritance/include chains as values. The shape of each entry is:
 *
 * [TypeName: string]: { // a type name such as "HTMLInputElement"
 *   inheritance?: string, // an inherited Type
 *   includes?: Array<string>, // a set of Types to also include properties from
 *   props?: { // properties defined on this Type
 *     [PropName: string]: { // a property name such as "checked"
 *       global?: boolean // whether it's a "global" attribute
 *       specs?: number // bitfield of the specs in which the property is found
 *     }
 *   },
 *   states?: { // "states" in which only certain properties are "applicable"
 *    [selector: string]: { // a CSS selector such as "[type=checkbox]".
 *      ...props
 *    }
 *   }
 * }
 */
export const DOMPinnedProperties = ${JSON.stringify(minimize(output))};
`);
