// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as SDK from '../../../core/sdk/sdk.js';
import type * as Protocol from '../../../generated/protocol.js';
import * as Platform from '../../../core/platform/platform.js';

let headerOverridesManagerInstance: HeaderOverridesManager;

export class HeaderOverridesManager {
  readonly #requestToHeaderDescriptors: WeakMap<Readonly<SDK.NetworkRequest.NetworkRequest>, HeaderDescriptor[]>;

  private constructor() {
    this.#requestToHeaderDescriptors = new WeakMap();
  }

  static instance(opts: {forceNew: boolean|null} = {forceNew: null}): HeaderOverridesManager {
    const {forceNew} = opts;
    if (!headerOverridesManagerInstance || forceNew) {
      headerOverridesManagerInstance = new HeaderOverridesManager();
    }

    return headerOverridesManagerInstance;
  }

  getEditedHeaders(request: Readonly<SDK.NetworkRequest.NetworkRequest>): HeaderDescriptor[]|null {
    return this.#requestToHeaderDescriptors.get(request) || null;
  }

  setEditedHeaders(request: Readonly<SDK.NetworkRequest.NetworkRequest>, headers: HeaderDescriptor[]): void {
    this.#requestToHeaderDescriptors.set(request, headers);
  }

  static generateHeaderDescriptors(request: Readonly<SDK.NetworkRequest.NetworkRequest>): HeaderDescriptor[] {
    const headers: HeaderDescriptor[] =
        request.sortedResponseHeaders.map(header => ({
                                            name: Platform.StringUtilities.toLowerCaseString(header.name),
                                            value: header.value,
                                            originalValue: header.value,
                                          }));
    HeaderOverridesManager.#markOverrides(headers, request);
    return headers;
  }

  static #markOverrides(headers: HeaderDescriptor[], request: Readonly<SDK.NetworkRequest.NetworkRequest>): void {
    if (request.originalResponseHeaders.length === 0) {
      return;
    }

    // To compare original headers and actual headers we use a map from header
    // name to an array of header values. This allows us to handle the cases
    // in which we have multiple headers with the same name (and corresponding
    // header values which may or may not occur multiple times as well). We are
    // not using MultiMaps, because a Set would not able to distinguish between
    // header values [a, a, b] and [a, b, b].
    const originalHeaders = new Map<Platform.StringUtilities.LowerCaseString, string[]>();
    for (const header of request?.originalResponseHeaders || []) {
      const headerName = Platform.StringUtilities.toLowerCaseString(header.name);
      const headerValues = originalHeaders.get(headerName);
      if (headerValues) {
        headerValues.push(header.value);
      } else {
        originalHeaders.set(headerName, [header.value]);
      }
    }

    const actualHeaders = new Map<Platform.StringUtilities.LowerCaseString, string[]>();
    for (const header of headers) {
      const headerName = Platform.StringUtilities.toLowerCaseString(header.name);
      const headerValues = actualHeaders.get(headerName);
      if (headerValues) {
        headerValues.push(header.value || '');
      } else {
        actualHeaders.set(headerName, [header.value || '']);
      }
    }

    const isDifferent =
        (headerName: Platform.StringUtilities.LowerCaseString,
         actualHeaders: Map<Platform.StringUtilities.LowerCaseString, string[]>,
         originalHeaders: Map<Platform.StringUtilities.LowerCaseString, string[]>): boolean => {
          const actual = actualHeaders.get(headerName);
          const original = originalHeaders.get(headerName);
          if (!actual || !original || actual.length !== original.length) {
            return true;
          }
          actual.sort();
          original.sort();
          for (let i = 0; i < actual.length; i++) {
            if (actual[i] !== original[i]) {
              return true;
            }
          }
          return false;
        };

    for (const headerName of actualHeaders.keys()) {
      // If the array of actual headers and the array of original headers do not
      // exactly match, mark all headers with 'headerName' as being overridden.
      if (isDifferent(headerName, actualHeaders, originalHeaders)) {
        headers.filter(header => header.name === headerName).forEach(header => {
          header.isOverride = true;
        });
      }
    }
  }
}

export interface BlockedDetailsDescriptor {
  explanation: () => string;
  examples: Array<{
    codeSnippet: string,
    comment?: () => string,
  }>;
  link: {
    url: string,
  }|null;
  reveal?: () => void;
}

export interface HeaderDescriptor {
  name: Platform.StringUtilities.LowerCaseString;
  value: string|null;
  originalValue?: string;
  headerValueIncorrect?: boolean;
  blockedDetails?: BlockedDetailsDescriptor;
  headerNotSet?: boolean;
  setCookieBlockedReasons?: Protocol.Network.SetCookieBlockedReason[];
  highlight?: boolean;
  isOverride?: boolean;
  valueEditable?: boolean;
  nameEditable?: boolean;
}
