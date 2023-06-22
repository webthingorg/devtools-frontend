// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as Platform from '../../core/platform/platform.js';

function parseScheme(pattern: string): {hostPattern: string, scheme: string}|undefined {
  const SCHEME_SEPARATOR = '://';
  const schemeEnd = pattern.indexOf(SCHEME_SEPARATOR);
  if (schemeEnd < 0) {
    return undefined;
  }
  const scheme = pattern.substr(0, schemeEnd).toLowerCase();

  // Keep in sync with //extensions/common/url_pattern.cc in chromium
  const validSchemes = [
    '*', 'http', 'https', 'ftp', 'chrome', 'chrome-extension',
    // Chromium additionally defines the following schemes, but these aren't relevant for host url patterns:
    /* 'file', 'filesystem', 'ws', 'wss', 'data', 'uuid-in-package'*/
  ];

  if (!validSchemes.includes(scheme)) {
    return undefined;
  }

  return {scheme, hostPattern: pattern.substr(schemeEnd + SCHEME_SEPARATOR.length)};
}

function defaultPort(scheme: string): string|undefined {
  switch (scheme) {
    case 'http':
      return '80';
    case 'https':
      return '443';
    case 'ftp':
      return '25';
  }
  return undefined;
}

function parseHostAndPort(pattern: string, scheme: string): {host: string, port: string}|undefined {
  const pathnameStart = pattern.indexOf('/');
  if (pathnameStart >= 0) {
    if (pathnameStart < pattern.length - 1) {
      // Host patterns don't allow for paths to be specified
      return undefined;
    }
    // Strip off path part
    pattern = pattern.substr(0, pathnameStart);
  }

  if (pattern.endsWith(':*')) {
    // Strip off wildcard port to not upset url parsing
    pattern = pattern.substr(0, pattern.length - 2);
  }

  if (pattern.endsWith(':')) {
    return undefined;
  }

  let asUrl: URL;
  try {
    asUrl = new URL(pattern.startsWith('*.') ? `http://${pattern.substr(2)}` : `http://${pattern}`);
  } catch {
    return undefined;
  }
  if (asUrl.pathname !== '/') {
    return undefined;
  }

  if (asUrl.hostname.endsWith('.')) {
    asUrl.hostname = asUrl.hostname.substr(0, asUrl.hostname.length - 1);
  }

  // The URL constructor is happy to accept '*', but it gets replaced with %2A
  if (asUrl.hostname !== '%2A' && asUrl.hostname.includes('%2A')) {
    return undefined;
  }

  // The URL constructor strips off the default port for the scheme, even if it was given explicitely
  const httpPort = defaultPort('http');
  if (!httpPort) {
    return undefined;
  }
  const port = pattern.endsWith(`:${httpPort}`) ? httpPort : (asUrl.port === '' ? '*' : asUrl.port);
  const schemesWithPort = ['http', 'https', 'ftp'];
  if (port !== '*' && !schemesWithPort.includes(scheme)) {
    return undefined;
  }

  const host = asUrl.hostname !== '%2A' ? (pattern.startsWith('*.') ? `*.${asUrl.hostname}` : asUrl.hostname) : '*';
  return {
    host,
    port,
  };
}

export class HostUrlPattern {
  static parse(pattern: string): HostUrlPattern|undefined {
    if (pattern === '<all_urls>') {
      return new HostUrlPattern({matchesAll: true});
    }
    const parsedScheme = parseScheme(pattern);
    if (!parsedScheme) {
      return undefined;
    }
    const {scheme, hostPattern} = parsedScheme;

    const parsedHost = parseHostAndPort(hostPattern, scheme);
    if (!parsedHost) {
      return undefined;
    }
    const {host, port} = parsedHost;

    return new HostUrlPattern({scheme, host, port, matchesAll: false});
  }

  private constructor(readonly pattern: {matchesAll: true}|
                      {readonly scheme: string, readonly host: string, readonly port: string, matchesAll: false}) {
  }

  get scheme(): string {
    return this.pattern.matchesAll ? '*' : this.pattern.scheme;
  }
  get host(): string {
    return this.pattern.matchesAll ? '*' : this.pattern.host;
  }
  get port(): string {
    return this.pattern.matchesAll ? '*' : this.pattern.port;
  }

  matchesAllUrls(): boolean {
    return this.pattern.matchesAll;
  }

  matchesUrl(url: Platform.DevToolsPath.UrlString): boolean {
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch {
      return false;
    }
    // Try to parse the input url before checking for <all_urls> because <all_urls> doesn't match invalid urls
    if (this.matchesAllUrls()) {
      return true;
    }
    const scheme = parsedUrl.protocol.substr(0, parsedUrl.protocol.length - 1);
    const port = parsedUrl.port || defaultPort(scheme);
    return this.matchesScheme(scheme) && this.matchesHost(parsedUrl.hostname) && (!port || this.matchesPort(port));
  }

  matchesScheme(scheme: string): boolean {
    if (this.pattern.matchesAll) {
      return true;
    }
    if (this.pattern.scheme === '*') {
      return scheme === 'http' || scheme === 'https';
    }
    return this.pattern.scheme === scheme;
  }

  matchesHost(host: string): boolean {
    if (this.pattern.matchesAll) {
      return true;
    }
    if (this.pattern.host === '*') {
      return true;
    }
    let normalizedHost = new URL(`http://${host}`).hostname;
    if (normalizedHost.endsWith('.')) {
      normalizedHost = normalizedHost.substr(0, normalizedHost.length - 1);
    }
    if (this.pattern.host.startsWith('*.')) {
      return normalizedHost === this.pattern.host.substr(2) || normalizedHost.endsWith(this.pattern.host.substr(1));
    }
    return this.pattern.host === normalizedHost;
  }

  matchesPort(port: string): boolean {
    if (this.pattern.matchesAll) {
      return true;
    }
    return this.pattern.port === '*' || this.pattern.port === port;
  }
}
