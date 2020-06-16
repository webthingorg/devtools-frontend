#!/usr/bin/env python
#
# Copyright 2020 The Chromium Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

import sys
from os import path
from subprocess import Popen

scripts_path = path.dirname(path.dirname(path.abspath(__file__)))
sys.path.append(scripts_path)
import devtools_paths

CURRENT_DIRECTORY = path.dirname(path.abspath(__file__))
ROOT_DIRECTORY = path.join(CURRENT_DIRECTORY, '..', '..')
FRONT_END_DIRECTORY = path.join(ROOT_DIRECTORY, 'front_end')

DEFAULT_GLOB = path.join(FRONT_END_DIRECTORY, '**', '*.css')


def main():
    files = [DEFAULT_GLOB]
    if len(sys.argv):
        files = [f for f in sys.argv if f.endswith('.css')]
        if len(files) is 0:
            files = [DEFAULT_GLOB]

    exec_command = [
        devtools_paths.node_path(),
        path.join(ROOT_DIRECTORY, 'node_modules', 'stylelint', 'bin',
                  'stylelint.js'),
    ]
    exec_command.extend(files)
    exec_command.append('--fix')
    exec_command.append('--allow-empty-input')

    stylelint_proc = Popen(exec_command, cwd=ROOT_DIRECTORY)
    stylelint_proc.communicate()

    sys.exit(stylelint_proc.returncode)


if __name__ == '__main__':
    main()
