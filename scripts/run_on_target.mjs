// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as childProcess from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import yargs from 'yargs';
import unparse from 'yargs-unparser';

const argv = yargs(process.argv).option('target', {alias: 't', type: 'string', default: 'Default'}).argv;

const target = argv['target'];

delete argv['target'];
delete argv['t'];
const [argv0, run_on_target, ...args] = unparse(argv);

const sourceRoot = path.dirname(path.dirname(run_on_target));
const cwd = path.join(sourceRoot, 'out', target);

if (!fs.existsSync(cwd)) {
  throw new Error(`Target directory ${cwd} does not exist`);
}
if (!fs.statSync(cwd).isDirectory()) {
  throw new Error(`Target path ${cwd} is not a  directory`);
}

childProcess.spawnSync(argv0, args, {stdio: 'inherit', cwd});
