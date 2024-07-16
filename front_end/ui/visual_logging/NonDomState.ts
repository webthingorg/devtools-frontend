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

const registry: WeakMap<Loggable, LoggableRegistration[]> = new Map();

function getLoggables(parent?: Loggable): LoggableRegistration[] {
  return registry.get(parent || nullParent) || [];
}

export function registerLoggable(loggable: Loggable, config: LoggingConfig, parent?: Loggable): void {
  console.error('registerLoggable', parent);
  const values = getLoggables(parent);
  values.push({loggable, config, parent});
  registry.set(parent || nullParent, values);
}

export function unregisterLoggables(parent: Loggable|undefined): void {
  console.error('unregisterLoggable', parent);
  registry.delete(parent || nullParent);
}

export function getNonDomState(parent: Loggable|undefined): {loggables: LoggableRegistration[]} {
  return {loggables: [...getLoggables(parent)]};
}

export function unregisterAllLoggables(): void {
  registry.delete(nullParent);
}

const nullParent = {};
