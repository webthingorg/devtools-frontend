#!/usr/bin/env python
#
# Copyright 2020 The Chromium Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

import fnmatch
import glob
import sys
from os import path, walk
from subprocess import Popen

scripts_path = path.dirname(path.dirname(path.abspath(__file__)))
sys.path.append(scripts_path)
import devtools_paths

CURRENT_DIRECTORY = path.dirname(path.abspath(__file__))
ROOT_DIRECTORY = path.normpath(path.join(CURRENT_DIRECTORY, '..', '..'))
FRONT_END_DIRECTORY = path.join(ROOT_DIRECTORY, 'front_end')
DEFAULT_GLOB = path.join(FRONT_END_DIRECTORY, '**', '*.css')


def get_css_files_or_glob():
    if len(sys.argv):
        # TODO: We shouldn't need to filter for .css files here; instead,
        # PRESUBMIT.py should only ever pass *.css file names as arguments.
        files = [f for f in sys.argv if f.endswith('.css')]
        if len(files):
            return files
    return [DEFAULT_GLOB]


def main():
    exec_command = [
        devtools_paths.node_path(),
        path.join(ROOT_DIRECTORY, 'node_modules', 'stylelint', 'bin',
                  'stylelint.js'),
    ]
    exec_command.extend(get_css_files_or_glob())
    exec_command.append('--fix')
    # stylelint does not appear to work on the Windows bots. Setting
    # the --allow-empty-input flag makes the build pass, but no CSS
    # is actually linted on Windows. TODO: make linting work on Windows
    # and remove this flag.
    exec_command.append('--allow-empty-input')

    stylelint_proc = Popen(exec_command, cwd=ROOT_DIRECTORY)
    stylelint_proc.communicate()

    sys.exit(stylelint_proc.returncode)


if __name__ == '__main__':
    main()
