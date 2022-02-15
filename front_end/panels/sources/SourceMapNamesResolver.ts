// Copyright 2016 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as SourceMapScopes from '../../models/source_map_scopes/source_map_scopes.js';

// TODO(jarin) Point the layout tests to the source_map_scopes bundle and remove this file completely.
export const setScopeResolvedForTest = SourceMapScopes.NamesResolver.setScopeResolvedForTest;
export const getScopeResolvedForTest = SourceMapScopes.NamesResolver.getScopeResolvedForTest;
export const resolveExpression = SourceMapScopes.NamesResolver.resolveExpression;
