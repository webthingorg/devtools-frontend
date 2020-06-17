// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import logicalAssignment from '../third_party/acorn-logical-assignment/package/dist/acorn-logical-assignment.mjs';
import * as Acorn from '../third_party/acorn/package/dist/acorn.mjs';

// Extensions return a new Parser class (no mutation).
const ExtendedParser = Acorn.Parser.extend(logicalAssignment);

const CustomAcorn = {
  ...Acorn,
  Parser: ExtendedParser,
  // Re-export convenient functions on the acorn namespace.  Binding is needed
  // since the functions uses `new this(...)`, and `this` will be the exports
  // object if not bound to ExtendedParser.
  tokenizer: ExtendedParser.tokenizer.bind(ExtendedParser),
  parse: ExtendedParser.parse.bind(ExtendedParser),
};

// Simple wrapper around Acorn so that we can add extensions to it, such as ES
// features that are not merged to Acorn yet.
export {CustomAcorn as Acorn};
