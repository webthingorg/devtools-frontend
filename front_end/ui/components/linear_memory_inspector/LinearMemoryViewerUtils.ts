// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

export interface HighlightInfo {
  startAddress: number;
  size: number;
  name?: string;
  type?: string;
}
