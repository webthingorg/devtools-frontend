#!/usr/bin/env python3
#
# Copyright 2020 The Chromium Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.
"""
Used to download a pre-built version of emscripten for running e2e tests
testing DevTools with emscripten generated Wasm binaries.
"""

import argparse
import platform
import os
import subprocess
import sys
import tarfile
import tempfile
import zipfile

if sys.version_info >= (3, ):
    from urllib.request import urlretrieve
else:
    from urllib import urlretrieve

BS = 8192
STAMP_FILE = 'build-revision'
DOWNLOAD_URL = "https://storage.googleapis.com/webassembly/emscripten-releases-builds/%s/%s/wasm-binaries.%s"
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))


def check_stamp_file(dest, tag):
    path = os.path.join(dest, STAMP_FILE)
    if os.path.isfile(path):
        with open(path) as f:
            return tag == f.read().strip()
    return False


def write_stamp_file(dest, tag):
    with open(os.path.join(dest, STAMP_FILE), 'w') as f:
        return f.write(tag)


def unzip(os_name, file, dest):
    is_zip = os_name == 'win'
    z = zipfile.ZipFile(file) if is_zip else tarfile.open(file, 'r:bz2')
    z.extractall(path=dest)


def npm_install(dest):
    node = os.path.abspath(
        os.path.join(
            PROJECT_ROOT, 'third_party', 'node', *{
                'Darwin': ('mac', 'node-darwin-x64', 'bin', 'node'),
                'Linux': ('linux', 'node-linux-x64', 'bin', 'node'),
                'Windows': ('win', 'node.exe')
            }[platform.system()]))
    npm = os.path.join(os.path.dirname(os.path.dirname(node)), 'lib',
                       'node_modules', 'npm', 'bin', 'npm-cli.js')
    directory = os.path.join(dest, 'install', 'emscripten')

    subprocess.check_call([node, npm, 'ci', '--production'], cwd=directory)


def script_main(args):
    parser = argparse.ArgumentParser(description='Download Emscripten')
    parser.add_argument('tag', help='emscripten tag')
    parser.add_argument('dest', help='destination directory')
    options = parser.parse_args(args)

    dest = os.path.join(PROJECT_ROOT, options.dest)

    if not os.path.isdir(dest):
        os.makedirs(dest)

    if check_stamp_file(dest, options.tag):
        return 0

    os_name = {
        'Linux': 'linux',
        'Windows': 'win',
        'Darwin': 'mac'
    }[platform.system()]

    url = DOWNLOAD_URL % (os_name, options.tag,
                          'zip' if os_name == 'win' else 'tbz2')

    try:
        filename, _ = urlretrieve(url)

        unzip(os_name, filename, dest)

        npm_install(dest)

        write_stamp_file(dest, options.tag)

    except Exception as e:
        sys.stderr.write('Error Downloading URL "{url}": {e}\n'.format(url=url,
                                                                       e=e))
        return 1


if __name__ == '__main__':
    sys.exit(script_main(sys.argv[1:]))
