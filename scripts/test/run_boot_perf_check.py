#!/usr/bin/env python
#
# Copyright 2019 The Chromium Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.
"""
Run boot perf test on a pre-built chrome or one specified via --chrome-binary.
"""

import os
import platform
import re
import subprocess
import sys
import signal

scripts_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(scripts_path)

import devtools_paths


def check_chrome_binary(chrome_binary):
    return os.path.exists(chrome_binary) and os.path.isfile(chrome_binary) and os.access(chrome_binary, os.X_OK)


def popen(arguments, cwd=None, env=None):
    return subprocess.Popen(arguments, cwd=cwd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, env=env)


def to_platform_path_exact(filepath):
    if not is_cygwin:
        return filepath
    output, _ = popen(['cygpath', '-w', filepath]).communicate()
    # pylint: disable=E1103
    return output.strip().replace('\\', '\\\\')


def start_hosted_mode_server():
    proc = popen([devtools_paths.node_path(), devtools_paths.hosted_mode_script_path()])
    hosted_mode_pid = proc.pid
    return hosted_mode_pid


def stop_hosted_mode_server(hosted_mode_pid):
    if hosted_mode_pid is None:
        return

    os.kill(hosted_mode_pid, signal.SIGTERM)
    hosted_mode_pid = None


def run_boot_perf_test(chrome_binary, devtools_path, runs):
    boot_perf_errors_found = False
    exec_command = [devtools_paths.node_path(), devtools_paths.boot_perf_test_path(), '--progress=false', '--runs=%s' % runs]
    env = os.environ.copy()
    if (chrome_binary is not None):
        env['CHROME_BIN'] = chrome_binary

    boot_perf_proc = popen(exec_command, cwd=devtools_path, env=env)
    (boot_perf_proc_out, _) = boot_perf_proc.communicate()

    if boot_perf_proc.returncode != 0:
        boot_perf_errors_found = True

    print(boot_perf_proc_out)
    return boot_perf_errors_found


def main():
    devtools_path = devtools_paths.devtools_root_path()
    is_cygwin = sys.platform == 'cygwin'
    chrome_binary = None
    downloaded_chrome_binary = os.path.abspath(os.path.join(
        *{
            'Linux': (devtools_path, 'third_party', 'chrome', 'chrome-linux', 'chrome'),
            'Darwin': (devtools_path, 'third_party', 'chrome', 'chrome-mac', 'Chromium.app', 'Contents', 'MacOS', 'Chromium'),
            'Windows': (devtools_path, 'third_party', 'chrome', 'chrome-win', 'chrome.exe'),
        }[platform.system()]))

    if check_chrome_binary(downloaded_chrome_binary):
        chrome_binary = downloaded_chrome_binary

    if len(sys.argv) >= 2:
        chrome_binary = re.sub(r'^\-\-chrome-binary=(.*)', '\\1', sys.argv[1])
        if not check_chrome_binary(chrome_binary):
            print('Unable to find a Chrome binary at \'%s\'' % chrome_binary)
            sys.exit(1)

    runs = 1
    print('Running boot perf test with %s iteration(s). This may take some time...' % runs)
    if (chrome_binary is not None):
        print('Using custom Chrome binary (%s)\n' % chrome_binary)
    else:
        print('Unable to run, no Chrome binary provided')
        sys.exit(1)

    errors_found = False
    hosted_mode_pid = None
    try:
        hosted_mode_pid = start_hosted_mode_server()
        errors_found = run_boot_perf_test(chrome_binary, devtools_path, runs)
    except Exception as err:
        print(err)
    finally:
        stop_hosted_mode_server(hosted_mode_pid)

    if errors_found:
        print('ERRORS DETECTED')
        sys.exit(1)


if __name__ == '__main__':
    main()
