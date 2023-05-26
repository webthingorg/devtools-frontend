#!/usr/bin/env vpython3
#
# Copyright 2023 The Chromium Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

import multiprocessing
import os
import subprocess
import sys
import time

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import devtools_paths

test_files = []
for root, dirs, files in os.walk(os.path.join(os.getcwd(), 'test', 'e2e')):
    for file in files:
        if file.endswith('_test.ts'):
            test_files.append(os.path.join(os.path.split(root)[-1], file))

# Change this for various experiment options. Overall there are 175 files.
# E.g. some interesting experiments are (chunks, processes) as:
# (4, 4), (32, 4), (175, 4), (8, 8), etc...
chunks = 8
processes = 8

divided_test_files = [[] for i in range(chunks)]
print(f'Testing {len(test_files)} files.')

for i, t in enumerate(test_files):
  divided_test_files[i % chunks].append(t)

args = [(str(i), f) for i, f in enumerate(divided_test_files)]

def fun(args):
    index, l = args
    env = dict(os.environ)
    # HACK: No guearantee that this is actually a free port. Ideally the remote
    # debugging should use OS API to ask for a free port?
    env['REMOTE_DEBUGGING_PORT'] = str(9221 + int(index))
    command = [
        devtools_paths.node_path(),
        os.path.join(devtools_paths.devtools_root_path(), 'scripts', 'test',
                     'run_test_suite.js'),
        '--config=test/e2e/test-runner-config.json',
        '--test-file-pattern=' + ','.join(l)
    ]
    #print(command)
    proc = subprocess.Popen(
        ' '.join(command),
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        shell=True)
    stdout, _ = proc.communicate()
    return proc.returncode, stdout.decode('utf-8')

start_time = time.time()
pool = multiprocessing.Pool(processes)
errors = 0
for code, result in pool.imap_unordered(fun, args):
    print('******************************************************************')
    print('******************************************************************')
    print(result)
    errors += int(bool(code))

print(f'{errors} errors')
print('Run Time: ' + str(round(time.time() - start_time, 2)) + ' seconds')
