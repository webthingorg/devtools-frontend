#!/usr/bin/env vpython3
#
# Copyright 2023 The Chromium Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

import os
import subprocess
import sys
import time

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import devtools_paths

test_files = []
for root, dirs, files in os.walk(os.getcwd() + '/test/e2e'):
    for file in files:
        if file.endswith('_test.ts'):
            test_files.append(root.split("/")[-1] + '/' + file)

chunks = 7
divided_test_files = []

for i in range(chunks):
    divided_test_files.append(test_files[i:i + (len(test_files) // chunks)])

processes = []
for l in divided_test_files:
    command = [
        devtools_paths.node_path(),
        os.path.join(devtools_paths.devtools_root_path(), 'scripts', 'test',
                     'run_test_suite.js'),
        '--config=test/e2e/test-runner-config.json',
        '--test-file-pattern=' + ','.join(l)
    ]
    processes.append(subprocess.Popen(' '.join(command), shell=True))

start_time = time.time()
for proc in processes:
    proc.communicate()

print('Run Time: ' + str(round(time.time() - start_time, 2)) + ' seconds')
