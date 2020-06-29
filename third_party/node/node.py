#!/usr/bin/env python
# Copyright 2017 The Chromium Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

from os import path as os_path
import platform
import subprocess
import sys
import os


def GetBinaryPath():
    return os_path.join(
        os_path.dirname(__file__), *{
            'Darwin': ('mac', 'node-darwin-x64', 'bin', 'node'),
            'Linux': ('linux', 'node-linux-x64', 'bin', 'node'),
            'Windows': ('win', 'node.exe'),
        }[platform.system()])


def RunNode(cmd_parts):
    # Unless specified, pipe the output, because in Ninja actions we don't
    # want to print any output, unless the action failed.
    if '--output' in cmd_parts:
        process_output = None
    else:
        process_output = subprocess.PIPE

    cmd = [GetBinaryPath()] + cmd_parts
    process = subprocess.Popen(cmd,
                               cwd=os.getcwd(),
                               stdout=process_output,
                               stderr=process_output)
    stdout, stderr = process.communicate()

    if process.returncode is not 0:
        print('%s failed:\n%s' % (cmd, stdout + stderr))
        exit(process.returncode)

    return stdout


if __name__ == '__main__':
    RunNode(sys.argv[1:])
