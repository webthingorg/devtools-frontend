#!/usr/bin/env vpython3
#
# Copyright 2023 The Chromium Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

import argparse
import json
import os
import subprocess
import sys
import tempfile
import time
from e2e_divider import divide_run

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
        default=4,
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
    parser.add_argument('--failure-screenshots',
                        dest='failure_screenshots',
                        action='store_true',
                        help='Save screenshots to failure_screenshots.html.')
    return parser.parse_args(cli_args)


def colored_print(text, color='no_color'):
    color_codes = {
        'no_color': '0',
        'red': '0;31',
        'green': '0;32',
        'yellow': '1;33',
        'blue': '0;34',
        'purple': '0;35',
        'gray': '0;37',
        'white': '1;37',
    }
    print(f'\033[{color_codes[color]}m {text} \033[0m')


if __name__ == '__main__':
    args = parse_options(sys.argv[1:])
    commands = divide_run(chunks=int(args.jobs),
                          pattern=args.test_file_pattern,
                          iterations=int(args.iterations))

    screenshots = ''
    if args.failure_screenshots:
        screenshots = f'HTML_OUTPUT_FILE={devtools_paths.devtools_root_path()}/failure_screenshots.html '

    results_log_files = []
    processes = []
    for i in range(len(commands)):
        temp = tempfile.NamedTemporaryFile(delete=False)
        results_log_files.append(temp)
        processes.append(
            subprocess.Popen(
                f'{screenshots}{" ".join(commands[i])} --mocha-reporter json-stream 2>&1 | tee {temp.name}',
                shell=True))

    start_time = time.time()
    for proc in processes:
        proc.communicate()

    failed_tests = []
    tests, passes, pending, failures = 0, 0, 0, 0
    for i in range(len(commands)):
        with open(results_log_files[i].name, "r") as f:
            for l in f.readlines():
                if l.startswith('[\"fail\"'):
                    failed_tests.append(json.loads(l)[1])
                if l.startswith('[\"end\"'):
                    result = json.loads(l)[1]
                    tests += result['tests']
                    passes += result['passes']
                    pending += result['pending']
                    failures += result['failures']

    for tf in results_log_files:
        tf.close()

    print('\n\nFailed tests:')
    for f in failed_tests:
        print(json.dumps(f, indent=2))
        print()

    print()
    colored_print(f'Total tests: {tests}', 'yellow')
    colored_print(f'Passed: {passes}', 'green')
    colored_print(f'Pending: {pending}', 'blue')
    colored_print(f'Failures: {failures}', 'red')
    print()

    if args.failure_screenshots and failed_tests:
        colored_print(
            f'Failure screenshots: {devtools_paths.devtools_root_path()}/failure_screenshots.html',
            'white')
        print()

    colored_print(
        'Run Time: ' + str(round(
            (time.time() - start_time) / 60, 2)) + ' minutes', 'white')
