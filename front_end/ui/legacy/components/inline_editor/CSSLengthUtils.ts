// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as SDK from '../../../../core/sdk/sdk.js';

export interface Length {
  value: number;
  unit: SDK.CSSMetadata.LengthUnit;
}

export const parseText = (text: string): Length|null => {
  const result = text.match(SDK.CSSMetadata.CSSLengthRegex);
  if (!result || !result.groups) {
    return null;
  }

  return {
    value: Number(result.groups.value),
    unit: result.groups.unit as SDK.CSSMetadata.LengthUnit,
  };
};
