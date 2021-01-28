"use strict";
// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
Object.defineProperty(exports, "__esModule", { value: true });
exports.findNodeForTypeReferenceName = void 0;
const findNodeForTypeReferenceName = (state, typeReferenceName) => {
    const matchingNode = [...state.foundInterfaces, ...state.foundEnums].find(dec => {
        return dec.name.escapedText === typeReferenceName;
    });
    return matchingNode || null;
};
exports.findNodeForTypeReferenceName = findNodeForTypeReferenceName;
//# sourceMappingURL=utils.js.map