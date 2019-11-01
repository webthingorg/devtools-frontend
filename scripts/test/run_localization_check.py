#!/usr/bin/env python
#
# Copyright 2016 The Chromium Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

import os.path as path
import re
import subprocess
import sys

scripts_path = path.dirname(path.dirname(path.abspath(__file__)))
sys.path.append(scripts_path)
import devtools_paths

check_devtools_localizable_resources_args = []
check_devtools_localizability = []
devtools_path = devtools_paths.devtools_root_path()


def show_menu(sys_arg):
    print('Usage: %s  <arg1> [arg2]' % path.basename(sys_arg.argv[0]))
    print
    print(' <--a | --files <.js file path>*> -a: If present, check all devtools frontend .js files')
    print('                         <.js file path>*: List of .js files with absolute paths separated by a space')
    print(' [--autofix]             -autofix: If present, errors in localizable resources will be fixed automatically')
    sys_arg.exit(0)


if '--help' in sys.argv:
    show_menu(sys)
else:
    if '--a' in sys.argv:
        # arguments were normalized with --(dash) but this script requires a single dash.
        check_devtools_localizable_resources_args = ['-a']
    elif '--files' in sys.argv:
        argument_index = sys.argv.index('--files') + 1
        check_devtools_localizable_resources_args = sys.argv[argument_index:len(sys.argv)]

    if '--autofix' in sys.argv:
        argument_index = None
        # Autofix may exist after the file list, so we need to take it out.
        if '--autofix' in check_devtools_localizable_resources_args:
            argument_index = check_devtools_localizable_resources_args.index('--autofix')
            check_devtools_localizable_resources_args.pop(argument_index)
        check_devtools_localizability = ['--autofix']

    if len(check_devtools_localizable_resources_args) == 0:
        show_menu(sys)
is_cygwin = sys.platform == 'cygwin'


def popen(arguments, cwd=None):
    return subprocess.Popen(arguments, cwd=cwd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)


def to_platform_path(filepath):
    if not is_cygwin:
        return filepath
    return re.sub(r'^/cygdrive/(\w)', '\\1:', filepath)


def to_platform_path_exact(filepath):
    if not is_cygwin:
        return filepath
    output, _ = popen(['cygpath', '-w', filepath]).communicate()
    # pylint: disable=E1103
    return output.strip().replace('\\', '\\\\')


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
    return checkWithNodeScript(script_path, script_description, check_devtools_localizability)


def main():
    errors_found = checkDevtoolsLocalizableResources()
    errors_found += checkDevtoolsLocalizabilty()

    if errors_found:
        print('ERRORS DETECTED')
        sys.exit(1)


if __name__ == '__main__':
    main()
