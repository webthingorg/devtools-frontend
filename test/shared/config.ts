// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

interface SupportedEnvVars {
  NO_SHUFFLE: boolean;
  STRESS: boolean;
  VERBOSE: boolean;
  THROTTLE: number;
  TEST_LIST: string;
  TEST_FILE: string;
  DEBUG: boolean;
  ITERATIONS: number;
  JOBS: number;
  SLOWMO: number;
  CHROME_BIN: string;
  INTERACTIVE: boolean;
  TIMEOUT: number;
}

export function getEnvVar<Key extends keyof SupportedEnvVars>(
    name: Key, defaultValue?: SupportedEnvVars[Key]): SupportedEnvVars[Key] {
  const envVar = process.env[name];

  if (typeof defaultValue === 'boolean') {
    return (!!envVar) as SupportedEnvVars[Key];
  }

  if (typeof defaultValue === 'number') {
    let value = Number(envVar);
    if (Number.isNaN(value)) {
      value = defaultValue;
    }
    return value as SupportedEnvVars[Key];
  }

  return (envVar || defaultValue) as SupportedEnvVars[Key];
}
