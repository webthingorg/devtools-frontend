// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const fs = require('fs');
const child_process = require('child_process');

function sortAndDeduplicateLines(string) {
  return string.trimRight()
      .split('\n')
      // Sort
      .sort((a, b) => a.trim().localeCompare(b.trim()))
      // Deduplicate
      .filter((l, i, a) => a.indexOf(l) === i)
      .join('\n');
}

function sortVar(data, name) {
  const regexp = new RegExp(`${name} = \\[\\n([^\\[]*)\\]`, 'm');
  const match = data.match(regexp);
  if (!match) {
    throw new Error(`Could not find variable ${name}`);
  }
  const lines = sortAndDeduplicateLines(match[1]);
  return data.replace(match[1], lines + '\n');
}

// all_devtools_modules
let modules = fs.readFileSync('all_devtools_modules.gni', {encoding: 'utf8'});
modules = sortVar(modules, 'all_devtools_modules');
modules = sortVar(modules, 'all_typescript_modules');
fs.writeFileSync('all_devtools_modules.gni', modules);

// devtools_module_entrypoint
let entrypoints = fs.readFileSync('devtools_module_entrypoints.gni', {encoding: 'utf8'});
entrypoints = sortVar(entrypoints, 'devtools_module_entrypoints');
entrypoints = sortVar(entrypoints, 'generated_typescript_entrypoints');
fs.writeFileSync('devtools_module_entrypoints.gni', entrypoints);

child_process.execSync(
    'gn format all_devtools_modules.gni devtools_module_entrypoints.gni',
    {stdio: [process.stdin, process.stdout, process.stderr]});
