#!/usr/bin/env python3
#
# Copyright 2020 The Chromium Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.
"""
Used to download a pre-built version of emscripten for running e2e tests
testing DevTools with emscripten generated Wasm binaries.

Usage: ./download_emscripten.py EMSCRIPTEN_TAG DOWNLOAD_DESTINATION
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
    from urllib.request import urlopen
else:
    from urllib2 import urlopen

BS = 8192
STAMP_FILE = 'build-revision'
DOWNLOAD_URL = "https://storage.googleapis.com/webassembly/emscripten-releases-builds/%s/%s/wasm-binaries.%s"


def check_stamp_file(options):
    try:
        with open(os.path.join(options.dest, STAMP_FILE)) as f:
            return options.tag == f.read().strip()
    except Exception:
        return False


def write_stamp_file(options):
    with open(os.path.join(options.dest, STAMP_FILE), 'w') as f:
        return f.write(options.tag)


def unzip(os_name, file, dest):
    is_zip = os_name == 'win'
    z = zipfile.ZipFile(file) if is_zip else tarfile.open(file, 'r:bz2')
    z.extractall(path=dest)


def script_main(args):
    parser = argparse.ArgumentParser()
    parser.add_argument('tag')
    parser.add_argument('dest')
    options = parser.parse_args(args)

    if not os.path.isdir(options.dest):
        os.makedirs(options.dest)

    if check_stamp_file(options):
        return 0

    os_name = {
        'Linux': 'linux',
        'Windows': 'win',
        'Darwin': 'mac'
    }[platform.system()]

    url = DOWNLOAD_URL % (os_name, options.tag,
                          'zip' if os_name == 'win' else 'tbz2')

    download_size = 0
    try:
        with tempfile.NamedTemporaryFile() as output_file:
            request = urlopen(url)
            while True:
                buffer = request.read(BS)
                if not buffer:
                    break
                download_size += len(buffer)
                output_file.write(buffer)
            sys.stdout.write('Downloaded {download_size}B\n'.format(
                download_size=download_size))
            output_file.flush()

            unzip(os_name, output_file.name, options.dest)

        write_stamp_file(options)

    except Exception as e:
        sys.stderr.write('Error Downloading URL "{url}": {e}\n'.format(url=url,
                                                                       e=e))
        return 1


if __name__ == '__main__':
    sys.exit(script_main(sys.argv[1:]))
