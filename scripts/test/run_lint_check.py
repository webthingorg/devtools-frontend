#!/usr/bin/env python
#
# Copyright 2016 The Chromium Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

import os.path as path
import re
import subprocess
import sys
import test_helpers
from subprocess import Popen

scripts_path = path.dirname(path.dirname(path.abspath(__file__)))
sys.path.append(scripts_path)
import devtools_paths

ROOT_DIRECTORY = path.join(path.dirname(path.abspath(__file__)), '..', '..')
FRONT_END_DIRECTORY = path.join(ROOT_DIRECTORY, 'front_end')
TEST_DIRECTORY = path.join(ROOT_DIRECTORY, 'test')

FILES_TO_LINT = [FRONT_END_DIRECTORY, TEST_DIRECTORY]

JAVASCRIPT_ESLINT_CONFIG = path.join(ROOT_DIRECTORY, '.eslintrc.js')
TYPESCRIPT_ESLINT_CONFIG = path.join(ROOT_DIRECTORY, '.eslintrc-typescript.js')
ESLINT_IGNORE_PATH = path.join(ROOT_DIRECTORY, '.eslintignore')


def run_eslint_command(eslintconfig_path, extension):
    exec_command = [
        devtools_paths.node_path(),
        devtools_paths.eslint_path(),
        '--config',
        test_helpers.to_platform_path_exact(eslintconfig_path),
        '--ignore-path',
        test_helpers.to_platform_path_exact(ESLINT_IGNORE_PATH),
        '--ext',
        extension,
        '--fix',
    ] + FILES_TO_LINT

    eslint_proc = Popen(exec_command, cwd=ROOT_DIRECTORY)
    eslint_proc.communicate()

    if eslint_proc.returncode is not 0:
        sys.exit(eslint_proc.returncode)


def main():
    run_eslint_command(JAVASCRIPT_ESLINT_CONFIG, '.js')
    run_eslint_command(TYPESCRIPT_ESLINT_CONFIG, '.ts')

    sys.exit(0)


if __name__ == '__main__':
    main()
