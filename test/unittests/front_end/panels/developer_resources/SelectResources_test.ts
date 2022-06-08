// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import type * as Platform from '../../../../../front_end/core/platform/platform.js';
import * as SDK from '../../../../../front_end/core/sdk/sdk.js';
import * as DeveloperResources from '../../../../../front_end/panels/developer_resources/developer_resources.js';
import {describeWithEnvironment} from '../../helpers/EnvironmentHelpers.js';

describeWithEnvironment('DeveloperResourcesView', () => {
  it('remembers selected element on update', async () => {
    const view = DeveloperResources.DeveloperResourcesView.DeveloperResourcesView.instance();
    const loader = SDK.PageResourceLoader.PageResourceLoader.instance();

    const url = 'file:///tmp/example.html' as Platform.DevToolsPath.UrlString;
    const initiator = {
      target: null,
      frameId: null,
      extensionId: 'MyExtensionId',
      initiatorUrl: null,
    };
    const key = {url, initiator};
    const inFlightResource = {success: null, ...key, size: null};
    loader.updateExtensionResourceLoad(inFlightResource);

    await view.selectResource(key);
    assert.deepEqual(await view.selectedResource(), inFlightResource);

    const completedFlightResource = {success: true, ...key, size: 17};
    loader.updateExtensionResourceLoad(completedFlightResource);
    assert.deepEqual(await view.selectedResource(), completedFlightResource);
  });
});
