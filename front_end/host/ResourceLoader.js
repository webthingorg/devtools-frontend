// Copyright (c) 2015 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {InspectorFrontendHostInstance} from './InspectorFrontendHost.js';

export const ResourceLoader = {};

let _lastStreamId = 0;

/** @type {!Object.<number, !Common.OutputStream>} */
const _boundStreams = {};

/**
 * @param {!Common.OutputStream} stream
 * @return {number}
 */
const _bindOutputStream = function(stream) {
  _boundStreams[++_lastStreamId] = stream;
  return _lastStreamId;
};

/**
 * @param {number} id
 */
const _discardOutputStream = function(id) {
  _boundStreams[id].close();
  delete _boundStreams[id];
};

/**
 * @param {number} id
 * @param {string} chunk
 */
export const streamWrite = function(id, chunk) {
  _boundStreams[id].write(chunk);
};

/**
 * @param {string} url
 * @param {?Object.<string, string>} headers
 * @param {function(boolean, !Object.<string, string>, string, string)} callback
 */
export function load(url, headers, callback) {
  const stream = new Common.StringOutputStream();
  loadAsStream(url, headers, stream, mycallback);

  /**
   * @param {boolean} success
   * @param {!Object.<string, string>} headers
   * @param {string} errorDesc
   */
  function mycallback(success, headers, errorMessage) {
    callback(success, headers, stream.data(), errorMessage);
  }
}

/**
 * @param {number} netError
 * Keep this function in sync with `net_error_list.h` on the Chromium side.
 * @returns {string}
 */
function getNetErrorCategory(netError) {
  if (netError > -100) {
    return 'System error';
  }
  if (netError > -200) {
    return 'Connection error';
  }
  if (netError > -300) {
    return 'Certificate error';
  }
  if (netError > -400) {
    return 'HTTP error';
  }
  if (netError > -500) {
    return 'Cache error';
  }
  if (netError > -600) {
    return 'Signed Exchange error';
  }
  if (netError > -700) {
    return 'FTP error';
  }
  if (netError > -800) {
    return 'Certificate manager error';
  }
  if (netError > -900) {
    return 'DNS resolver error';
  }
  return 'Unknown error';
}

/**
 * @param {number} netError
 * @returns {boolean}
 */
function isHTTPError(netError) {
  return netError <= -300 && netError > -400;
}

/**
 * @param {!InspectorFrontendHostAPI.LoadNetworkResourceResult} response
 * @returns {!{success:boolean, message: string}}
 */
function createErrorDescriptionFromResponse(response) {
  const {statusCode, netError, urlValid, messageOverride} = response;
  let message = '';
  if (typeof messageOverride === 'undefined') {
    if (typeof netError === 'undefined') {
      if (urlValid === false) {
        message = ls`Invalid URL`;
      } else {
        message = ls`Unknown error`;
      }
    } else {
      if (netError !== 0) {
        const errorCategory = getNetErrorCategory(netError);
        message = ls`${errorCategory}: net error code ${netError}`;
        if (isHTTPError(netError)) {
          message += ls`, HTTP status code ${statusCode}`;
        }
      }
    }
  } else {
    message = `${messageOverride}`;
  }
  const success = statusCode < 300 || statusCode === 304;
  console.assert(success === (typeof message === 'string'));
  return {success, message};
}

/**
 * @param {string} url
 * @param {?Object.<string, string>} headers
 * @param {!Common.OutputStream} stream
 * @param {function(boolean, !Object.<string, string>, string)=} callback
 */
export const loadAsStream = function(url, headers, stream, callback) {
  const streamId = _bindOutputStream(stream);
  const parsedURL = new Common.ParsedURL(url);
  if (parsedURL.isDataURL()) {
    loadXHR(url).then(dataURLDecodeSuccessful).catch(dataURLDecodeFailed);
    return;
  }

  const rawHeaders = [];
  if (headers) {
    for (const key in headers) {
      rawHeaders.push(key + ': ' + headers[key]);
    }
  }
  InspectorFrontendHostInstance.loadNetworkResource(url, rawHeaders.join('\r\n'), streamId, finishedCallback);

  /**
   * @param {!InspectorFrontendHostAPI.LoadNetworkResourceResult} response
   */
  function finishedCallback(response) {
    if (callback) {
      const {success, message} = createErrorDescriptionFromResponse(response);
      callback(success, response.headers || {}, message);
    }
    _discardOutputStream(streamId);
  }

  /**
   * @param {string} text
   */
  function dataURLDecodeSuccessful(text) {
    streamWrite(streamId, text);
    finishedCallback(/** @type {!InspectorFrontendHostAPI.LoadNetworkResourceResult} */ ({statusCode: 200}));
  }

  function dataURLDecodeFailed(xhrStatus) {
    const message = ls`Decoding Data URL failed`;
    finishedCallback(/** @type {!InspectorFrontendHostAPI.LoadNetworkResourceResult} */ ({statusCode: 404, message}));
  }
};
