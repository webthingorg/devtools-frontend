// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {ValueType} from './ValueInterpreterDisplayUtils.js';

export enum ValueTypeGroup {
  Integer = 'Integer',
  Float = 'Floating point',
  Other = 'Other'
}

export const GROUP_TO_TYPES = new Map(
    [
      [ValueTypeGroup.Integer, [ValueType.Int8, ValueType.Int16, ValueType.Int32, ValueType.Int64]],
      [ValueTypeGroup.Float, [ValueType.Float32, ValueType.Float64]],
      [ValueTypeGroup.Other, [ValueType.Boolean, ValueType.String]],
    ],
);
