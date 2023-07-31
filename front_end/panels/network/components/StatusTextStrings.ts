
// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as i18n from '../../../core/i18n/i18n.js';

export function getStatusText(statusCode: number): string|null {
  switch (statusCode) {
    case 100:
      return i18n.i18n.lockedString('Continue');
    case 101:
      return i18n.i18n.lockedString('Switching Protocols');
    case 102:
      return i18n.i18n.lockedString('Processing');
    case 103:
      return i18n.i18n.lockedString('Early Hints');
    case 200:
      return i18n.i18n.lockedString('OK');
    case 201:
      return i18n.i18n.lockedString('Created');
    case 202:
      return i18n.i18n.lockedString('Accepted');
    case 203:
      return i18n.i18n.lockedString('Non-Authoritative Information');
    case 204:
      return i18n.i18n.lockedString('No Content');
    case 205:
      return i18n.i18n.lockedString('Reset Content');
    case 206:
      return i18n.i18n.lockedString('Partial Content');
    case 207:
      return i18n.i18n.lockedString('Multi-Status');
    case 208:
      return i18n.i18n.lockedString('Already Reported');
    case 226:
      return i18n.i18n.lockedString('IM Used');
    case 300:
      return i18n.i18n.lockedString('Multiple Choices');
    case 301:
      return i18n.i18n.lockedString('Moved Permanently');
    case 302:
      return i18n.i18n.lockedString('Found');
    case 303:
      return i18n.i18n.lockedString('See Other');
    case 304:
      return i18n.i18n.lockedString('Not Modified');
    case 305:
      return i18n.i18n.lockedString('Use Proxy');
    case 306:
      return i18n.i18n.lockedString('Switch Proxy');
    case 307:
      return i18n.i18n.lockedString('Temporary Redirect');
    case 308:
      return i18n.i18n.lockedString('Permanent Redirect');
    case 400:
      return i18n.i18n.lockedString('Bad Request');
    case 401:
      return i18n.i18n.lockedString('Unauthorized');
    case 402:
      return i18n.i18n.lockedString('Payment Required');
    case 403:
      return i18n.i18n.lockedString('Forbidden');
    case 404:
      return i18n.i18n.lockedString('Not Found');
    case 405:
      return i18n.i18n.lockedString('Method Not Allowed');
    case 406:
      return i18n.i18n.lockedString('Not Acceptable');
    case 407:
      return i18n.i18n.lockedString('Proxy Authentication Required');
    case 408:
      return i18n.i18n.lockedString('Request Timeout');
    case 409:
      return i18n.i18n.lockedString('Conflict');
    case 410:
      return i18n.i18n.lockedString('Gone');
    case 411:
      return i18n.i18n.lockedString('Length Required');
    case 412:
      return i18n.i18n.lockedString('Precondition Failed');
    case 413:
      return i18n.i18n.lockedString('Payload Too Large');
    case 414:
      return i18n.i18n.lockedString('URI Too Long');
    case 415:
      return i18n.i18n.lockedString('Unsupported Media Type');
    case 416:
      return i18n.i18n.lockedString('Range Not Satisfiable');
    case 417:
      return i18n.i18n.lockedString('Expectation Failed');
    case 418:
      return i18n.i18n.lockedString('I\'m a teapot');
    case 421:
      return i18n.i18n.lockedString('Misdirected Request');
    case 422:
      return i18n.i18n.lockedString('Unprocessable Entity');
    case 423:
      return i18n.i18n.lockedString('Locked');
    case 424:
      return i18n.i18n.lockedString('Failed Dependency');
    case 425:
      return i18n.i18n.lockedString('Too Early');
    case 426:
      return i18n.i18n.lockedString('Upgrade Required');
    case 428:
      return i18n.i18n.lockedString('Precondition Required');
    case 429:
      return i18n.i18n.lockedString('Too Many Requests');
    case 431:
      return i18n.i18n.lockedString('Request Header Fields Too Large');
    case 451:
      return i18n.i18n.lockedString('Unavailable For Legal Reasons');
    case 500:
      return i18n.i18n.lockedString('Internal Server Error');
    case 501:
      return i18n.i18n.lockedString('Not Implemented');
    case 502:
      return i18n.i18n.lockedString('Bad Gateway');
    case 503:
      return i18n.i18n.lockedString('Service Unavailable');
    case 504:
      return i18n.i18n.lockedString('Gateway Timeout');
    case 505:
      return i18n.i18n.lockedString('HTTP Version Not Supported');
    case 506:
      return i18n.i18n.lockedString('Variant Also Negotiates');
    case 507:
      return i18n.i18n.lockedString('Insufficient Storage');
    case 508:
      return i18n.i18n.lockedString('Loop Detected');
    case 510:
      return i18n.i18n.lockedString('Not Extended');
    case 511:
      return i18n.i18n.lockedString('Network Authentication Required');
    default:
      return null;
  }
}
