#!/usr/bin/env python
#
# Copyright 2019 The Chromium Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

import argparse
import os.path as path
import re
import subprocess
import sys

scripts_path = path.dirname(path.dirname(path.abspath(__file__)))
sys.path.append(scripts_path)
import devtools_paths

check_devtools_localizable_resources_args = []
check_devtools_localizability_args = []
devtools_path = devtools_paths.devtools_root_path()

parser = argparse.ArgumentParser(description='Process localization check arguments.')
parser.add_argument('--a', action='store_true', dest='all_files', help='If present, check all devtools frontend .js files')
parser.add_argument('--files', nargs='+', help='List of .js files with absolute paths separated by a space')
parser.add_argument(
    '--autofix', action='store_true', help='If present, errors in localizable resources will be fixed automatically')
args = parser.parse_args()

if not (args.all_files or args.files):
    parser.error("You need to provide a list of files to scan with --files option or --a to scan all the files")
elif args.all_files and args.files:
    parser.error(
        "Please provide only one option for scanning the files: --a for all files or --files <FILE_LIST> for specific files.")

if args.all_files:
    check_devtools_localizable_resources_args = ['-a']
elif args.files:
    check_devtools_localizable_resources_args = args.files
if args.autofix:
    check_devtools_localizability_args = ['--autofix']


def popen(arguments, cwd=None):
    return subprocess.Popen(arguments, cwd=cwd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)


def checkWithNodeScript(script_path, script_description, args):
    print(script_description + "...")
    script_proc_errors_found = False
    exec_command = [
        devtools_paths.node_path(),
        script_path,
    ] + args

    script_proc = popen(exec_command)
    (script_proc_out, _) = script_proc.communicate()
    if script_proc.returncode != 0:
        script_proc_errors_found = True
    else:
        print(script_description + ' exited successfully')

    print(script_proc_out)
    return script_proc_errors_found


def checkDevtoolsLocalizabilty():
    script_path = devtools_paths.check_localized_strings_path()
    script_description = 'Verifying that all resources are localizable'
    return checkWithNodeScript(script_path, script_description, check_devtools_localizable_resources_args)


def checkDevtoolsLocalizableResources():
    script_path = devtools_paths.check_localizable_resources_path()
    script_description = 'Verifying the structure of localization resource files'
    return checkWithNodeScript(script_path, script_description, check_devtools_localizability_args)


def main():
    errors_found = checkDevtoolsLocalizableResources()
    errors_found += checkDevtoolsLocalizabilty()

    if errors_found:
        print('ERRORS DETECTED')
        sys.exit(1)


if __name__ == '__main__':
    main()
