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


class ProjectConfig:
    def __init__(
        self,
        name='devtools-frontend',
        gs_root='gs://devtools-frontend-screenshots',
    ):
        self.gs_root = gs_root
        self.gs_folder = self.gs_root + '/screenshots'


def main(project_config, *args):
    check_cq_status(project_config)


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
            failed_steps = [
                step['name'] for step in build_w_steps['steps']
                if step['status'] == 'FAILURE'
            ]
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
    main(ProjectConfig(), sys.argv[1:])

# Path: scripts/tools/update_goldens_v2.py
