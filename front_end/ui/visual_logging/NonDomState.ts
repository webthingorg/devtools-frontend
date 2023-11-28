// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import {type Loggable} from './Loggable.js';
import {type LoggingConfig} from './LoggingConfig.js';

interface LoggableRegistration {
  loggable: Loggable;
  config: LoggingConfig;
  parent?: Loggable;
}

const registry: LoggableRegistration[] = [];

export function registerLoggable(loggable: Loggable, config: LoggingConfig, parent?: Loggable): void {
  registry.push({loggable, config, parent});
}

export function unregisterLoggable(loggable: Loggable): void {
  const index = registry.findIndex(r => r.loggable === loggable);
  registry.splice(index, 1);
}

export function getNonDomState(): {loggables: LoggableRegistration[]} {
  return {loggables: [...registry]};
}
