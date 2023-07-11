// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Network from '../../../../../front_end/panels/network/network.js';
import type * as Protocol from '../../../../../front_end/generated/protocol.js';
import type * as Platform from '../../../../../front_end/core/platform/platform.js';
import * as SDK from '../../../../../front_end/core/sdk/sdk.js';

import {describeWithEnvironment} from '../../helpers/EnvironmentHelpers.js';
import {assertElement} from '../../helpers/DOMHelpers.js';

describeWithEnvironment('NetworkLogView', () => {
  it('adds marker to requests with overridden headers', async () => {
    const request = SDK.NetworkRequest.NetworkRequest.create(
        'requestId' as Protocol.Network.RequestId, 'https://www.example.com' as Platform.DevToolsPath.UrlString,
        '' as Platform.DevToolsPath.UrlString, null, null, null);
    request.statusCode = 200;

    request.responseHeaders = [{name: 'foo', value: 'overridden'}];
    request.originalResponseHeaders = [{name: 'foo', value: 'original'}];
    let networkRequestNode = new Network.NetworkDataGridNode.NetworkRequestNode(
        {} as Network.NetworkDataGridNode.NetworkLogViewInterface, request);
    let el = document.createElement('div');
    networkRequestNode.renderCell(el, 'status');
    let marker = el.querySelector('.network-override-marker');
    assertElement(marker, HTMLDivElement);

    request.responseHeaders = [{name: 'foo', value: 'original'}];
    networkRequestNode = new Network.NetworkDataGridNode.NetworkRequestNode(
        {} as Network.NetworkDataGridNode.NetworkLogViewInterface, request);
    el = document.createElement('div');
    networkRequestNode.renderCell(el, 'status');
    marker = el.querySelector('.network-override-marker');
    assert.isNull(marker);
  });

  it('adds specific icon to the failed requests', async () => {
    const request = SDK.NetworkRequest.NetworkRequest.create(
        'requestId' as Protocol.Network.RequestId, 'https://www.example.com' as Platform.DevToolsPath.UrlString,
        '' as Platform.DevToolsPath.UrlString, null, null, null);
    request.statusCode = 404;

    const networkRequestNode = new Network.NetworkDataGridNode.NetworkRequestNode(
        {} as Network.NetworkDataGridNode.NetworkLogViewInterface, request);
    const el = document.createElement('div');

    networkRequestNode.renderCell(el, 'name');
    const marker = el.querySelector('.icon') as HTMLElement;

    const styleIconOriginal = marker.style;
    const indexOfIconImage = styleIconOriginal.webkitMaskImage.indexOf('Images/');
    const iconImage = styleIconOriginal.webkitMaskImage.substring(indexOfIconImage + 7);
    const styleIconFailed = 'cross-circle-filled.svg")';

    assert.strictEqual(styleIconFailed, iconImage);

    const backgroundColorOfIcon = styleIconOriginal.backgroundColor.toString();
    assert.strictEqual(backgroundColorOfIcon, 'var(--icon-error)');
  });
});
