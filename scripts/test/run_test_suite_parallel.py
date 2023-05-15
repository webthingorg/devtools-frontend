#!/usr/bin/env vpython3
#
# Copyright 2023 The Chromium Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.
"""
Run tests on a pinned version of chrome.

DEPRECATED: please use run_test_suite.js instead.
"""
import time
import subprocess
import os

test_files = []
for root, dirs, files in os.walk(f'{os.getcwd()}/test/e2e'):
    for file in files:
        if file.endswith('_test.ts'):
            test_files.append(f'{root.split("/")[-1]}/{file}')

chunks = 8
divided_test_files = []

for i in range(chunks):
    divided_test_files.append(test_files[i:i + (len(test_files) // chunks)])

processes = []
for l in divided_test_files:
    pattern = ','.join(l)
    processes.append(
        subprocess.Popen(
            f'vpython third_party/node/node.py --output scripts/test/run_test_suite.js --config=test/e2e/test-runner-config.json --test-file-pattern={pattern}',
            shell=True))

start_time = time.time()
for proc in processes:
    proc.communicate()

print("My program took", time.time() - start_time, "to run")
