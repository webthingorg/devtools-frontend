// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {promises: fs} = require('fs');
const glob = require('glob');
const path = require('path');

function sortAndDeduplicateLines(string, identation) {
  return string.trim()
      .split('\n')
      .map(l => l.trim())
      // Sort
      .sort((a, b) => a.trim().localeCompare(b.trim()))
      // Deduplicate
      .filter((l, i, a) => a.indexOf(l) === i)
      .map(l => identation + l)
      .join('\n');
}

function sortVar(data, name) {
  const regexp = new RegExp(`${name} = \\[\\n([^\\[]*)\\]`, 'm');
  const match = data.match(regexp);
  if (!match) {
    throw new Error(`Could not find variable ${name}`);
  }
  const identation = name.match(/^(\s+)/)[1];
  const lines = sortAndDeduplicateLines(match[1], identation + '  ');
  return data.replace(match[1], lines);
}

const cwd = path.resolve(__dirname, '../front_end');
glob('**/*.{gn,gni}', {cwd}, function(err, files) {
  if (err) {
    throw err;
  }

  Promise.all(files.map(async file => {
    if (file.startsWith('build') || file.startsWith('third_party')) {
      return null;
    }

    const filePath = path.join(cwd, file);
    let data = await fs.readFile(filePath, {encoding: 'utf8'});
    const matches = data.matchAll(/(.+) = \[\n[^\[]+\s+\]/mg);
    for (const match of matches) {
      data = sortVar(data, match[1]);
    }
    await fs.writeFile(filePath, data);
  }));
});

// // all_devtools_modules
// let modules = fs.readFileSync('all_devtools_modules.gni', {encoding: 'utf8'});
// modules = sortVar(modules, 'all_devtools_modules');
// modules = sortVar(modules, 'all_typescript_modules');
// fs.writeFileSync('all_devtools_modules.gni', modules);

// // devtools_module_entrypoint
// let entrypoints = fs.readFileSync('devtools_module_entrypoints.gni', {encoding: 'utf8'});
// entrypoints = sortVar(entrypoints, 'devtools_module_entrypoints');
// entrypoints = sortVar(entrypoints, 'generated_typescript_entrypoints');
// fs.writeFileSync('devtools_module_entrypoints.gni', entrypoints);
