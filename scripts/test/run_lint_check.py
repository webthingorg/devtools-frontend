#!/usr/bin/env python
#
# Copyright 2016 The Chromium Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

import os
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


def run_eslint_command(eslintconfig_path, extension, env=os.environ.copy()):
    exec_command = [
        devtools_paths.node_path(),
        devtools_paths.eslint_path(),
        # Even though we are specifying a concrete config for typescript,
        # without this additional command flag, the typescript eslint check
        # would still incorrectly run the javascript rules. This is not desired
        # and will reliably OOM the eslint process.
        '--no-eslintrc',
        '--config',
        test_helpers.to_platform_path_exact(eslintconfig_path),
        '--ignore-path',
        test_helpers.to_platform_path_exact(ESLINT_IGNORE_PATH),
        '--ext',
        extension,
        '--fix',
    ] + [directory + '/**/*' + extension for directory in FILES_TO_LINT]

    eslint_proc = Popen(exec_command, cwd=ROOT_DIRECTORY, env=env)
    eslint_proc.communicate()

    if eslint_proc.returncode is not 0:
        print('ESLint failed for config' + eslintconfig_path)
        sys.exit(eslint_proc.returncode)


def main():
    run_eslint_command(JAVASCRIPT_ESLINT_CONFIG, '.js')

    print('JAVASCRIPT_DONE')

    my_env = os.environ.copy()
    my_env['DEBUG'] = 'eslint:*'
    run_eslint_command(TYPESCRIPT_ESLINT_CONFIG, '.ts', env=my_env)

    sys.exit(0)


if __name__ == '__main__':
    main()
