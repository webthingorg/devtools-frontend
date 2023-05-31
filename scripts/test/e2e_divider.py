#!/usr/bin/env vpython3
#
# Copyright 2023 The Chromium Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

import argparse
import math
import os
import sys
from pathlib import Path, PurePath

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import devtools_paths


def parse_options(cli_args):
    parser = argparse.ArgumentParser(description='Run tests')
    parser.add_argument(
        '--test-suite-source-dir',
        dest='test_suite_source_dir',
        help=
        'Path to the source folder containing the tests, relative to the current working directory.'
    )
    parser.add_argument(
        '--jobs',
        dest='jobs',
        default=1,
        help='Number of parallel runners to use (if supported). Defaults to 1.'
    )
    parser.add_argument(
        '--test-file-pattern',
        dest='test_file_pattern',
        default=None,
        help=
        'A comma separated glob (or just a file path) to select specific test files to execute.'
    )
    parser.add_argument('--iterations',
                        dest='iterations',
                        default=1,
                        help='Number of test iterations.')
    return parser.parse_args(cli_args)


def divide_run(chunks, pattern=None, iterations=1):
    commands = []
    test_files = []

    if pattern:
        test_files = pattern.split(',')
    else:
        for root, dirs, files in os.walk(Path(os.getcwd() + '/test/e2e')):
            for file in files:
                if file.endswith('_test.ts'):
                    test_files.append(
                        str(Path(f'{PurePath(root).parts[-1]}/{file}')))

    if iterations > 1:
        for i in range(chunks):
            commands.append([
                'ITERATIONS=' + str(math.ceil(iterations / chunks)),
                devtools_paths.node_path(),
                str(
                    Path(
                        f'{devtools_paths.devtools_root_path()}/scripts/test/run_test_suite.js'
                    )), f'--config={Path("test/e2e/test-runner-config.json")}',
                '--test-file-pattern=' + ','.join(test_files)
            ])

        return commands

    divided_test_files = [[] for i in range(chunks)]

    for i in range(len(test_files)):
        divided_test_files[i % chunks].append(test_files[i])

    for l in divided_test_files:
        if l:
            commands.append([
                devtools_paths.node_path(),
                str(
                    Path(
                        f'{devtools_paths.devtools_root_path()}/scripts/test/run_test_suite.js'
                    )), f'--config={Path("test/e2e/test-runner-config.json")}',
                '--test-file-pattern=' + ','.join(l)
            ])

    return commands


if __name__ == '__main__':
    args = parse_options(sys.argv[1:])
    commands = divide_run(chunks=int(args.jobs),
                          pattern=args.test_file_pattern,
                          iterations=int(args.iterations))
    for command in commands:
        print(' '.join(command))
