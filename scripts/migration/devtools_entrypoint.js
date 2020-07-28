// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const fs = require('fs');
const child_process = require('child_process');

function moveToEntrypoint(name) {
  console.log(`Moving "${name}"`);

  const currentBranch = child_process.execSync(`git branch --show-current`, {encoding: 'utf8'}).trim();
  if (currentBranch !== name) {
    child_process.execSync(`git checkout master`, {stdio: [process.stdin, process.stdout, process.stderr]});
    child_process.execSync(`git checkout -b ${name}`, {stdio: [process.stdin, process.stdout, process.stderr]});
    child_process.execSync(`git brs ${currentBranch}`, {stdio: [process.stdin, process.stdout, process.stderr]});
  }

  const base = `front_end/${name}/`;

  const sources = fs.readdirSync(base).filter(f => !f.startsWith(name) && f.match(/.*\.js$/)).sort();

  const dependencies =
      sources
          .map(f => {
            const content = fs.readFileSync(base + f, {encoding: 'utf8'});
            return Array.from(content.matchAll(/import \* as (?:\w+) from '..\/(.+)\/\1.js';/g), m => m[1]);
          })
          .reduce((prev, curr) => prev.concat(curr), [])
          .filter((v, i, a) => a.indexOf(v) === i)
          .sort();

  const buildgn = `# Copyright 2020 The Chromium Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

import("../../scripts/build/ninja/devtools_entrypoint.gni")
import("../../scripts/build/ninja/devtools_module.gni")

devtools_module("${name}") {
  sources = [
    ${sources.map(f => `"${f}"`).join(',\n')}
  ]

  deps = [
    ${dependencies.map(f => `"../${f}:bundle",`).join('\n')}
  ]
}

devtools_entrypoint("bundle") {
  entrypoint = "${name}.js"
  is_legacy_javascript_entrypoint = [ "crbug.com/1011811" ]

  deps = [ ":${name}" ]
}
`;

  fs.writeFileSync(`front_end/${name}/BUILD.gn`, buildgn);

  // module.json
  const module = JSON.parse(fs.readFileSync(base + 'module.json', {encoding: 'utf8'}));
  module.skip_rollup = true;
  fs.writeFileSync(base + 'module.json', JSON.stringify(module, null, '  '));

  function sortAndDeduplicateLines(string) {
    return string.split(/\n/)
        .sort((a, b) => a.trim().localeCompare(b.trim()))
        .filter((l, i, a) => a.indexOf(l) === i)
        .join('\n');
  }

  function sortVar(data, name) {
    const regexp = new RegExp(`${name} = \\[\\n([^\\[]*)\\]`, 'm');
    const match = data.match(regexp);
    const lines = sortAndDeduplicateLines(match[1]);
    return data.replace(match[1], lines);
  }

  // all_devtools_modules
  let modules = fs.readFileSync('all_devtools_modules.gni', {encoding: 'utf8'});
  const all_devtools_modules = modules.match(/^all_devtools_module_sources = \[\n([^\[]*)\]/m)
  const files = all_devtools_modules[1].split('\n').filter(l => l.startsWith(`  "${name}/`)).join('\n') + '\n';
  modules = modules.replace(all_devtools_modules[1], all_devtools_modules[1].replace(files, ''));
  const all_typescript_modules = modules.match(/^all_typescript_module_sources = \[\n([^\[]*)\]/m);
  modules = modules.replace(all_typescript_modules[1], all_typescript_modules[1] + files);
  modules = sortVar(modules, 'all_devtools_module_sources');
  modules = sortVar(modules, 'all_typescript_module_sources');
  fs.writeFileSync('all_devtools_modules.gni', modules);

  // devtools_module_entrypoint
  let entrypoints = fs.readFileSync('devtools_module_entrypoints.gni', {encoding: 'utf8'});
  const devtools_module_entrypoints = entrypoints.match(/^devtools_module_entrypoint_sources = \[\n([^\[]*)\]/m)
  entrypoints = entrypoints.replace(
      devtools_module_entrypoints[1], devtools_module_entrypoints[1].replace(`"${name}/${name}.js",\n`, ''));
  const generated_typescript_entrypoints =
      entrypoints.match(/^generated_typescript_entrypoint_sources = \[\n([^\[]*)\]/m);
  if (!generated_typescript_entrypoints[1].includes(`"$resources_out_dir/${name}/${name}.js",\n`)) {
    entrypoints = entrypoints.replace(
        generated_typescript_entrypoints[1],
        generated_typescript_entrypoints[1] + `"$resources_out_dir/${name}/${name}.js",\n`);
  }

  entrypoints = sortVar(entrypoints, 'devtools_module_entrypoint_sources');
  entrypoints = sortVar(entrypoints, 'generated_typescript_entrypoint_sources');
  fs.writeFileSync('devtools_module_entrypoints.gni', entrypoints);

  // front_end/BUILD.gn
  let frontendBuild = fs.readFileSync('front_end/BUILD.gn', {encoding: 'utf8'});
  const public_deps = frontendBuild.match(/public_deps = \[\n([^\[]*)\]/m);
  if (!public_deps[1].includes(`  "${name}:bundle",\n  `)) {
    frontendBuild = frontendBuild.replace(public_deps[1], public_deps[1] + `  "${name}:bundle",\n  `);
  }
  frontendBuild = sortVar(frontendBuild, 'public_deps');
  fs.writeFileSync('front_end/BUILD.gn', frontendBuild);

  // Add ts-nocheck
  for (const source of sources) {
    const content = fs.readFileSync(base + source, {encoding: 'utf8'});
    if (content.indexOf('@ts-nocheck') !== -1)
      continue;

    const lines = content.split('\n');
    // find first empty line
    const index = lines.findIndex(l => l.trim() === '');

    lines.splice(index, 0, '', '// @ts-nocheck', '// TODO(crbug.com/1011811): Enable TypeScript compiler checks');

    fs.writeFileSync(base + source, lines.join('\n'));
  }


  child_process.execSync(`git add .`, {stdio: [process.stdin, process.stdout, process.stderr]});
  child_process.execSync('git cl format --presubmit', {stdio: [process.stdin, process.stdout, process.stderr]});
  child_process.execSync('npm run check-gn', {stdio: [process.stdin, process.stdout, process.stderr]});
  child_process.execSync(
      `node scripts/build/cross_reference_ninja_and_tsc.js Default front_end/${name}:bundle`,
      {stdio: [process.stdin, process.stdout, process.stderr]});
  child_process.execSync('autoninja -C out/Default', {stdio: [process.stdin, process.stdout, process.stderr]});
  child_process.execSync('autoninja -C out/Release', {stdio: [process.stdin, process.stdout, process.stderr]});

  child_process.execSync(`git add .`, {stdio: [process.stdin, process.stdout, process.stderr]});
  child_process.execSync(
      `git add front_end/${name}/BUILD.gn`, {stdio: [process.stdin, process.stdout, process.stderr]});

  const title = `Migrate \\\`front_end/${name}\\\` to \\\`devtools_entrypoint\\\``;
  const output = child_process.execSync(`git log -1 --pretty=%B`, {encoding: 'utf8'});
  if (output.trim() === title) {
    child_process.execSync(`git commit -a --amend --no-edit`, {stdio: [process.stdin, process.stdout, process.stderr]});
  } else {
    child_process.execSync(`git commit -a -m "${title}"`, {stdio: [process.stdin, process.stdout, process.stderr]});
  }
  child_process.execSync(
      `git cl upload -b 1101738 -r aerotwist@chromium.org,jacktfranklin@chromium.org -d`,
      {stdio: [process.stdin, process.stdout, process.stderr]});
}

moveToEntrypoint(process.argv[2]);
