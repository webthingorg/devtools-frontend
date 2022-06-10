// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {GLOBAL_ATTRIBUTES, VALID_MEMBERS} from './config.js';
import * as Util from './util.js';

/**
 * All the members relevant for generating the DOM pinned properties dataset
 * from WebIDL interfaces, mixins and dictionaries.
 */
const ACCEPTED_MEMBER_TYPES = new Set(['attribute', 'field']);

/**
 * Generates the DOM pinned properties dataset.
 *
 * @param {array} specs A list of specs. Each spec specifies its name and
 * all the idl definitions it contains.
 * @returns {object} output An object with of WebIDL type names as keys and their
 * WebIDL properties and inheritance/include chains as values.
 */
export function getIDLProps(specs, output = {}) {
  for (const spec of specs) {
    transform(spec, output);
  }
  validate(output, VALID_MEMBERS);
  return output;
}

function transform({name, idls}, output = {}) {
  const makeEntry = () => ({
    inheritance: null,
    includes: [],
    props: {},
  });

  for (const idl of idls) {
    switch (idl.type) {
      case 'interface':
      case 'interface mixin':
      case 'dictionary': {
        output[idl.name] = output[idl.name] ?? makeEntry();
        const members = idl.members?.filter(e => ACCEPTED_MEMBER_TYPES.has(e.type));
        const props = members?.map(e => [e.name, {global: GLOBAL_ATTRIBUTES.has(e.name), specs: [name]}, ]);
        Util.merge(output[idl.name], {
          inheritance: idl.inheritance,
          props: Object.fromEntries(props),
        });
        break;
      }
      case 'includes': {
        output[idl.target] = output[idl.target] ?? makeEntry();
        Util.merge(output[idl.target], {
          includes: [idl.includes],
        });
        break;
      }
      case 'callback':
      case 'callback interface':
      case 'enum':
      case 'typedef':
      case 'namespace': {
        break;
      }
      default: {
        console.warn('Skipping unknown WebIDL type', idl.type);
      }
    }
  }
}

function validate(output) {
  for (const [key, value] of Object.entries(output)) {
    const rule = VALID_MEMBERS[key];
    if (!rule) {
      continue;
    }

    const states = Object.entries(rule).map(([selector, allowlist]) => {
      const valid = Object.entries(value.props).filter(([prop]) => allowlist.has(prop.toLowerCase()));
      return [selector, Object.fromEntries(valid)];
    });
    value.states = Object.fromEntries(states);
  }
}
