// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as SDK from '../../../../../../front_end/core/sdk/sdk.js';
import * as Platform from '../../../../../../front_end/core/platform/platform.js';
import * as NetworkComponents from '../../../../../../front_end/panels/network/components/components.js';
import {describeWithEnvironment} from '../../../helpers/EnvironmentHelpers.js';

const {assert} = chai;

describeWithEnvironment('HeaderOverridesManager', () => {
  it('can generate header descriptions from request', async () => {
    const request = {
      sortedResponseHeaders: [
        {name: 'accept-ranges', value: 'bytes'},
        {name: 'age', value: '999999'},
        {name: 'content-encoding', value: 'gzip'},
        {name: 'duplicate', value: 'foo'},
        {name: 'duplicate', value: 'bar'},
        {name: 'triplicate', value: 'first'},
        {name: 'triplicate', value: 'second'},
        {name: 'triplicate', value: 'first'},

      ],
      originalResponseHeaders: [
        {name: 'Content-Encoding', value: 'gzip'},
        {name: 'Accept-Ranges', value: 'bytes'},
        {name: 'Age', value: '482518'},
        {name: 'triplicate', value: 'second'},
        {name: 'triplicate', value: 'second'},
        {name: 'triplicate', value: 'first'},
        {name: 'duplicate', value: 'foo'},
        {name: 'duplicate', value: 'bar'},
      ],
    } as SDK.NetworkRequest.NetworkRequest;
    const headers = NetworkComponents.HeaderOverridesManager.HeaderOverridesManager.generateHeaderDescriptors(request);
    const expected: NetworkComponents.HeaderOverridesManager.HeaderDescriptor[] = [
      {name: Platform.StringUtilities.toLowerCaseString('accept-ranges'), value: 'bytes', originalValue: 'bytes'},
      {
        name: Platform.StringUtilities.toLowerCaseString('age'),
        value: '999999',
        originalValue: '999999',
        isOverride: true,
      },
      {name: Platform.StringUtilities.toLowerCaseString('content-encoding'), value: 'gzip', originalValue: 'gzip'},
      {name: Platform.StringUtilities.toLowerCaseString('duplicate'), value: 'foo', originalValue: 'foo'},
      {name: Platform.StringUtilities.toLowerCaseString('duplicate'), value: 'bar', originalValue: 'bar'},
      {
        name: Platform.StringUtilities.toLowerCaseString('triplicate'),
        value: 'first',
        originalValue: 'first',
        isOverride: true,
      },
      {
        name: Platform.StringUtilities.toLowerCaseString('triplicate'),
        value: 'second',
        originalValue: 'second',
        isOverride: true,
      },
      {
        name: Platform.StringUtilities.toLowerCaseString('triplicate'),
        value: 'first',
        originalValue: 'first',
        isOverride: true,
      },
    ];

    assert.deepEqual(headers, expected);
  });
});
