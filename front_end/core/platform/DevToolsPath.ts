// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

class UrlStringTag {
  private urlTag: (string|undefined);
}
export type UrlString = string&UrlStringTag;

class RawPathStringTag {
  private rawPathTag: (string|undefined);
}
export type RawPathString = string&RawPathStringTag;

class EncodedPathStringTag {
  private encodedPathTag: (string|undefined);
}
export type EncodedPathString = string&EncodedPathStringTag;
