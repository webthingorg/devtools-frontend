#!/usr/bin/env python3
# Copyright 2023 The DevTools Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

import argparse
import subprocess
import sys

from update_goldens import ProjectConfig, update
"""The purpose of this CLI tool is to help you manage changes to screenshots in
 Interaction tests across multiple platforms.

If you've made changes that impact the screenshots, you'll need to update them
for all supported platforms. Assuming you've committed your changes and
uploaded the CL, you'll need to trigger a dry run in Gerrit or execute the
command:
\x1b[32m git cl try \x1b[0m

After waiting for the dry run to complete, you can execute the command:
\x1b[32m update_goldens_v2.py \x1b[0m

Any failing Interaction test will generate updated screenshots, which will be
downloaded and applied to your local change. Inspect the status of your working
copy for any such screenshot updates. If you have new screenshots and they look
as expected, add, commit, and upload the changes. If you repeat the steps above
without making any additional changes to the code, you should not have any more
screenshot tests failing.
"""


def main(project_config, *args):
    parser = build_parser()
    options = parser.parse_args(*args)
    update(project_config, options)


def build_parser():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        formatter_class=argparse.RawTextHelpFormatter, epilog=__doc__)

    mutually_exclusive = parser.add_mutually_exclusive_group()
    mutually_exclusive.add_argument(
        '--patchset',
        help='The patchset number from where to download screenshot changes. '
        'If not provided it defaults to the latest patchset.')
    parser.add_argument('--ignore-failed',
                        action='store_true',
                        help='Ignore results comming from failed builders.')
    mutually_exclusive.add_argument(
        '--retry',
        action='store_true',
        help='Re-trigger failed builders (when dealing with flakes).')
    parser.add_argument('--wait-sec', type=int,
        help='Wait and retry update every specified number of seconds. ' \
            'Minimum value is 30s to avoid overwhelming Gerrit.')
    parser.set_defaults(func=update)
    parser.add_argument('--verbose',
                        action='store_true',
                        help='Show more debugging info')

    return parser


def run_command(command, verbose=False, message=None):
    """Run command and deal with return code and output from the subprocess"""
    process = subprocess.Popen(command,
                               stdout=subprocess.PIPE,
                               stderr=subprocess.PIPE)
    stdout, stderr = process.communicate()
    if verbose:
        print(stdout.decode('utf-8'))
    if process.returncode != 0:
        print(stderr.decode('utf-8'))
        if message:
            print(message)
        else:
            print('Ups! Something went wrong.')
        print('Try --verbose to debug.')
        sys.exit(1)
    return stdout.decode('utf-8')


if __name__ == '__main__':
    main(
        ProjectConfig(platforms=['linux', 'win64'],
                      builder_prefix='devtools_frontend'), sys.argv[1:])
