#!/usr/bin/env python
#
# Copyright 2019 The Chromium Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.
"""
Run unit tests on a pinned version of chrome.
"""

import os
import platform
import re
from subprocess import Popen
import sys
import signal

scripts_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(scripts_path)

import test_helpers
import devtools_paths

NINJA_BUILD_NAME = os.environ.get('NINJA_BUILD_NAME') or 'Release'


def run_tests(chrome_binary):
    cwd = devtools_paths.devtools_root_path()
    karmaconfig_path = os.path.join(cwd, 'out', NINJA_BUILD_NAME, 'gen', 'karma.conf.js')

    if not os.path.exists(karmaconfig_path):
        print('Unable to find Karma config at ' + karmaconfig_path)
        print('Make sure to set the NINJA_BUILD_NAME variable to the folder name of "out/NINJA_BUILD_NAME"')
        sys.exit(1)

    print('Using karma config ' + karmaconfig_path)

    exec_command = [devtools_paths.node_path(), devtools_paths.karma_path(), 'start', test_helpers.to_platform_path_exact(karmaconfig_path)]

    env = os.environ.copy()
    env['NODE_PATH'] = devtools_paths.node_path()
    if (chrome_binary is not None):
        env['CHROME_BIN'] = chrome_binary

    exit_code = test_helpers.popen(exec_command, cwd=cwd, env=env)
    if exit_code == 1:
        return True

    return False


def main():
    chrome_binary = None

    # Default to the downloaded / pinned Chromium binary
    downloaded_chrome_binary = devtools_paths.downloaded_chrome_binary_path()
    if test_helpers.check_chrome_binary(downloaded_chrome_binary):
        chrome_binary = downloaded_chrome_binary

    if (chrome_binary is None):
        print('Unable to run, no Chrome binary provided')
        sys.exit(1)

    print('Using Chromium binary (%s)\n' % chrome_binary)

    errors_found = run_tests(chrome_binary)
    if errors_found:
        print('ERRORS DETECTED')
        sys.exit(1)


if __name__ == '__main__':
    main()
