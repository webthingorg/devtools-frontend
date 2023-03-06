#!/usr/bin/env python3
# Copyright 2023 The DevTools Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

import argparse
import json
import os
import tempfile
import time
import subprocess
import sys

from update_goldens import ProjectConfig, update


def main(project_config, *args):
    parser = build_parser()
    options = parser.parse_args(*args)
    update(project_config, options)


def build_parser():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        formatter_class=argparse.RawTextHelpFormatter, epilog=__doc__)

    update_help = 'Downloads the screenshots from the builders and applies ' \
        'them locally.'

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


def check_cq_status(project_config):
    raw_result = run_command(['git', 'cl', 'try-results', '--json=-'])
    cq_result = json.loads(raw_result)
    builders_still_running = [
        builder_result['builder']['builder'] for builder_result in cq_result
        if builder_result['status'] in ['STARTED', 'SCHEDULED']
    ]
    if builders_still_running:
        print('The following builders are still running:')
        print(builders_still_running)
        print('Please wait until they finish.')
        sys.exit(1)

    builds_with_failures = [
        builder_result['id'] for builder_result in cq_result
        if builder_result['status'] != 'SUCCESS'
    ]
    if builds_with_failures:
        check_bb_auth()
        for build_id in builds_with_failures:
            raw_build = run_command(
                ['bb', 'get', '-json', '-fields', 'steps', build_id])
            build_w_steps = json.loads(raw_build)
            failed_steps = [(build_w_steps['builder']['builder'], step)
                            for step in build_w_steps['steps']
                            if step['status'] == 'FAILURE']
            print(failed_steps)


def check_bb_auth():
    auth_info = run_command(['bb', 'auth-info'])
    if auth_info == 'Not logged in.':
        print('Please run bb auth-login to log in to buildbucket.')
        sys.exit(1)


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
