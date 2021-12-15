#!/usr/bin/env vpython
# Copyright 2017 The Chromium Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

from os import path as os_path
import platform
import subprocess
import sys
import os


def Exec(cmd, output=subprocess.PIPE):
    return subprocess.Popen(cmd,
                            cwd=os.getcwd(),
                            stdout=output,
                            stderr=output,
                            universal_newlines=True).communicate()


def GetBinaryPath():
    gclient_root, _ = Exec(['gclient', 'root'])
    return os_path.join(
        gclient_root.strip(), 'src', 'third_party', 'node', *{
            'Darwin': ('mac', 'node-darwin-x64', 'bin', 'node'),
            'Linux': ('linux', 'node-linux-x64', 'bin', 'node'),
            'Windows': ('win', 'node.exe'),
        }[platform.system()])


def RunNode(cmd_parts, output=subprocess.PIPE):
    cmd = [GetBinaryPath()] + cmd_parts
    gclient_root, _ = Exec(['gclient', 'root'])
    cmd.append('--gclient-root=' + gclient_root.strip())
    process = subprocess.Popen(cmd,
                               cwd=os.getcwd(),
                               stdout=output,
                               stderr=output,
                               universal_newlines=True)
    stdout, stderr = process.communicate()

    if process.returncode != 0:
        print('%s failed:\n%s\n%s' % (cmd, stdout, stderr))
        exit(process.returncode)

    return stdout


if __name__ == '__main__':
    args = sys.argv[1:]
    # Accept --output as the first argument, and then remove
    # it from the args entirely if present.
    if len(args) > 0 and args[0] == '--output':
        output = None
        args = sys.argv[2:]
    else:
        output = subprocess.PIPE
    RunNode(args, output)
