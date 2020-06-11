// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as SDK from '../sdk/sdk.js';  // eslint-disable-line no-unused-vars

/**
 * @param {!SDK.NetworkRequest.NetworkRequest} request
 * @return {!Promise<NCShared.INetConsoleRequest>}
 */
export async function sdkRequestToNetworkConsoleRequest(request) {
  let url = request.url();
  const parsedQuery = new URLSearchParams(request.parsedURL.queryParams);
  const queryParameters = /** @type {!Array<NCShared.IHttpHeader>} */ ([]);
  parsedQuery.forEach((value, key) => {
    queryParameters.push({
      key,
      value,
    });
  });

  if (queryParameters.length > 0) {
    url = url.substr(0, url.indexOf('?'));
  }

  const requestName = `${request.requestMethod.toUpperCase()} ${url}`;
  const headers = request.requestHeaders().filter(h => !h.name.startsWith(':'));
  const authorization = /** @type {!any} */ ({type: 'none'});
  const authorizationHeader = request.requestHeaders().find(h => h.name.toLowerCase() === 'authorization');
  if (authorizationHeader) {
    let shouldRemoveAuthorizationHeader = false;
    if (authorizationHeader.value.startsWith('Bearer ')) {
      authorization.type = 'token';
      authorization.token = {
        token: authorizationHeader.value.substr(7),
      };
      shouldRemoveAuthorizationHeader = true;
    }

    // TODO: Basic can be computed and injected here.

    if (shouldRemoveAuthorizationHeader) {
      const index = headers.indexOf(authorizationHeader);
      headers.splice(index, 1);
    }
  }
  // These headers are automatically created by the browser. We don't need to
  // pass them along.
  const AUTOGEN_HEADERS_TO_REMOVE = [
    'accept-encoding',
    'cookie',
    'host',
    'connection',
    'user-agent',
    'sec-fetch-site',
    'sec-fetch-mode',
    'sec-fetch-dest',
  ];

  const contentTypeHeader = headers.find(h => h.name.toLowerCase() === 'content-type');
  const bodyComponents = {
    rawTextBody: {
      text: '',
      contentType: request.mimeType,
    },
    formData: /** @type {!any[]} */ ([]),
    xWwwFormUrlencoded: /** @type {!any[]} */ ([]),
    bodySelection: /** @type {'none' | 'form-data' | 'x-www-form-urlencoded' | 'raw'} */ ('none'),
  };
  const formParameters = await request.formParameters();
  if (formParameters) {
    if (contentTypeHeader && contentTypeHeader.value === 'application/x-www-form-urlencoded') {
      bodyComponents.xWwwFormUrlencoded = formParameters.map(pair => {
        return {
          description: '',
          isActive: true,
          key: pair.name,
          value: pair.value,
        };
      });
      bodyComponents.bodySelection = 'x-www-form-urlencoded';
    } else {
      bodyComponents.formData = formParameters.map(pair => {
        return {
          description: '',
          isActive: true,
          key: pair.name,
          value: pair.value,
          type: 'text',
        };
      });
      bodyComponents.bodySelection = 'form-data';
    }
  }
  // If request.formParameters() wasn't populated, we'll check for a raw body
  if (bodyComponents.formData.length === 0 && bodyComponents.xWwwFormUrlencoded.length === 0) {
    const content = await request.requestFormData();
    if (content) {
      bodyComponents.rawTextBody.text = content;
      bodyComponents.rawTextBody.contentType = (contentTypeHeader && contentTypeHeader.value) || 'text/plain';
      bodyComponents.bodySelection = 'raw';
    }
  }

  return {
    url: url,
    name: requestName,
    verb: /** @type {!NCShared.HttpVerb} */ (request.requestMethod.toUpperCase()),
    description: '',
    authorization,
    headers: headers.filter(h => AUTOGEN_HEADERS_TO_REMOVE.indexOf(h.name.toLowerCase()) < 0).map(src => {
      return {
        description: '',
        isActive: true,
        key: src.name,
        value: src.value,
      };
    }),
    queryParameters,
    routeParameters: [],
    bodyComponents,
    body: {content: ''},
  };
}
