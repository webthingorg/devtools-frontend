// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Never instantiate. Fake class to convince TypeScript to typecheck invocations
// of these methods on branded strings as returning the same type of branded string.
class BrandedStringInterface<BrandedTypeTag> {
  substring(start: Number, end?: Number|undefined): BrandedString<BrandedTypeTag> {
    throw `Never Called with ${start} and ${end}`;
  }
  concat(...strings: string[]): BrandedString<BrandedTypeTag> {
    throw `Never Called with ${strings}`;
  }
}

type BrandedString<BrandedTypeTag> = BrandedStringInterface<BrandedTypeTag>&string&BrandedTypeTag;

class UrlStringTag {
  private urlTag: (string|undefined);
}
/**
 * File paths in DevTools that are represented as URLs
 * @example
 * “file:///Hello%20World/file/js”
 */
export type UrlString = BrandedString<UrlStringTag>;

class RawPathStringTag {
  private rawPathTag: (string|undefined);
}
/**
 * File paths in DevTools that are represented as unencoded absolute
 * or relative paths
 * @example
 * “/Hello World/file.js”
 */
export type RawPathString = BrandedString<RawPathStringTag>;

class EncodedPathStringTag {
  private encodedPathTag: (string|undefined);
}
/**
 * File paths in DevTools that are represented as encoded paths
 * @example
 * “/Hello%20World/file.js”
 */
export type EncodedPathString = BrandedString<EncodedPathStringTag>;
