// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const LOGGING_ATTRIBUTE = 'jslog';

export interface LoggingConfig {
  ve: number;
  track?: Map<string, string>;
  context?: number;
}

export function needsLogging(element: Element): boolean {
  return element.hasAttribute(LOGGING_ATTRIBUTE);
}

export function getLoggingConfig(element: Element): LoggingConfig {
  return parseJsLog(element.getAttribute(LOGGING_ATTRIBUTE) || '');
}

enum VisualElements {
  TreeItem = 1,
}

function resolveVe(ve: string): number {
  return VisualElements[ve as keyof typeof VisualElements] || 0;
}

function parseJsLog(jslog: string): LoggingConfig {
  const components = jslog.replace(/ /g, '').split(';');
  const getComponent = (name: string) => components.filter(c => c.startsWith(name)).map(c => c.substr(name.length))[0];
  const ve = resolveVe(components[0]);
  if (ve === 0) {
    throw new Error('Unkown VE: ' + jslog);
  }
  const config: LoggingConfig = {ve};
  const contextString = getComponent('context:');
  const context = contextString ? parseInt(contextString) : undefined;
  if (context) {
    config.context = context;
  }
  const trackString = getComponent('track:');
  const track = trackString ?
      new Map<string, string>(trackString.split(',').map(t => t.split(':') as [string, string])) :
      undefined;
  if (track) {
    config.track = track;
  }

  return config;
}
