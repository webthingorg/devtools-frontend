// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {execSync} from 'child_process';

import {transformModule, updateExtensionsAndReferences} from './jsdoc-to-ts';

(async () => {
  // execSync('git pull');
  const module = process.argv[2];
  transformModule(module, true);
  updateExtensionsAndReferences(module);
  process.chdir('../../');
  execSync('node ./third_party/i18n/collect-strings.js', {stdio: 'inherit'});
  execSync('git cl presubmit --upload --force', {stdio: 'inherit'});
  execSync('git cl format --js', {stdio: 'inherit'});
  execSync('git add .', {stdio: 'inherit'});
  execSync(`git commit -a -m "[JSDOC2TS]: Migrate ${module}\n\nBug: chromium:1158760"`, {stdio: 'inherit'});
  const id = execSync('git log --format="%H" -n 1', {encoding: 'utf8'});
  console.log(id);
  execSync('git checkout master', {stdio: 'inherit'});
  execSync(`git checkout -b j2t-${module}`, {stdio: 'inherit'});
  execSync('git brs origin/master', {stdio: 'inherit'});
  execSync('git pull', {stdio: 'inherit'});
  execSync(`git cherry-pick ${id}`, {stdio: 'inherit'});
  console.log('git cl upload');
  execSync('git cl upload --bypass-hooks -T -f', {stdio: 'inherit'});
  console.log('autoninja');
  execSync('autoninja -C out/Default', {stdio: 'inherit'});
})();
