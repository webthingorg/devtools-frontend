// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const [argv0, run_on_target, script, ...args] = process.argv;

let target = 'Default';
const newArgs = [];
for (let i = 0; i < args.length; ++i) {
  const arg = args[i];
  if (arg === '-t' || arg === '--target') {
    ++i;
    if (i < args.length) {
      target = args[i];
    } else {
      newArgs.push(arg);
    }
  } else if (arg.startsWith('--target=')) {
    target = arg.substr('--target='.length);
  } else {
    newArgs.push(arg);
  }
}

const sourceRoot = path.dirname(path.dirname(run_on_target));
const cwd = path.join(sourceRoot, 'out', target);

if (!fs.existsSync(cwd)) {
  throw new Error(`Target directory ${cwd} does not exist`);
}
if (!fs.statSync(cwd).isDirectory()) {
  throw new Error(`Target path ${cwd} is not a  directory`);
}

childProcess.spawnSync(argv0, [path.join(cwd, script), ...newArgs], {stdio: 'inherit'});
