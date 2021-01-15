// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {execSync, spawnSync} from 'child_process';

import {transformModule, updateExtensionsAndReferences} from './jsdoc-to-ts';

(async () => {
  execSync('git pull');
  const module = process.argv[2];
  transformModule(module, true);
  updateExtensionsAndReferences(module);
  process.chdir('../../');
  execSync('node ./third_party/i18n/collect-strings.js');
  execSync('git cl format --js');
  execSync('git add .');
  execSync(`git commit -a -m "[JSDOC2TS]: Migrate ${module}\n\nBug: chromium:1158760"`);
  const id = execSync('git log --format="%H" -n 1', {encoding: 'utf8'});
  console.log(id);
  execSync('git checkout master');
  execSync(`git checkout -b j2t-${module}`);
  execSync('git brs origin/master');
  execSync('git pull');
  execSync(`git cherry-pick ${id}`);
  console.log('git cl upload');
  spawnSync('git cl upload --bypass-hooks -T -f', {stdio: 'pipe'});
  console.log('autoninja');
  spawnSync('autoninja -C out/Default', {stdio: 'pipe'});
})();
