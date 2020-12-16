// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import * as HARImporter from '../../../../front_end/har_importer/har_importer.js';
import * as SDK from '../../../../front_end/sdk/sdk.js';

const exampleLog = new HARImporter.HARFormat.HARLog({
  'version': '1.2',
  'creator': {
    'name': 'WebInspector',
    'version': '537.36',
  },
  'pages': [],
  'entries': [{
    '_initiator': {
      'type': 'script',
      'stack': {
        'callframes': [
          {
            'functionName': 'testFunction',
            'scriptId': '52',
            'url': 'https://example.com/script.js',
            'lineNumber': 0,
            'columnNumber': 1,
          },
        ],
      },
    },
    '_priority': 'High',
    '_resourceType': 'xhr',
    'cache': {},
    'connection': '1',
    'request': {
      'method': 'POST',
      'url': 'https://example.com/api/testEndpoint?param1=test',
      'httpVersion': 'http/2.0',
      'headers': [
        {
          'name': ':method',
          'value': 'POST',
        },
      ],
      'queryString': [
        {
          'name': 'param1',
          'value': 'test',
        },
      ],
      'headersSize': -1,
      'bodySize': 109,
    },
    'response': {
      'status': 200,
      'statusText': '',
      'httpVersion': 'http/2.0',
      'headers': [],
      'content': {
        'size': 3697,
        'mimeType': 'application/json',
        'text': 'console.log(\'hello world\');',
      },
      'redirectURL': '',
      'headersSize': -1,
      'bodySize': -1,
      '_transferSize': 2903,
      '_error': null,
    },
    'serverIPAddress': '127.0.0.1',
    'startedDateTime': '2020-12-14T17:35:53.241Z',
    'time': 512.348,
    'timings': {
      'blocked': 0.7580000340715051,
      'dns': -1,
      'ssl': -1,
      'connect': -1,
      'send': 0.378,
      'wait': 510.48699999354034,
      'receive': 0.7249999907799065,
      '_blocked_queueing': 0.5090000340715051,
    },
  }],
});

describe('HARImporter', () => {
  it('Converts a HARLog to Network Requests Properly', () => {
    const requests: Array<SDK.NetworkRequest.NetworkRequest> =
        HARImporter.HARImporter.Importer.requestsFromHARLog(exampleLog);
    assert.lengthOf(requests, 1, 'Unable to parse request from Har log');

    const parsedRequest = requests[0];
    // Validate constructor params of NetworkRequest
    assert.strictEqual(parsedRequest._requestId, 'har-0');
    assert.strictEqual(parsedRequest._url, 'https://example.com/api/testEndpoint?param1=test');
    assert.strictEqual(parsedRequest._documentURL, 'https://example.com/api/testEndpoint?param1=test');
    assert.strictEqual(parsedRequest._frameId, '');
    assert.strictEqual(parsedRequest._loaderId, '');
    assert.deepStrictEqual(
        parsedRequest._initiator, {type: Protocol.Network.InitiatorType.Script, url: undefined, lineNumber: undefined});
  });
});
