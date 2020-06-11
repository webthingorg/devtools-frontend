# Copyright 2020 Microsoft Corp. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

import optparse
import os
import shutil
import subprocess
import sys

_HERE_PATH = os.path.abspath(os.path.dirname(__file__))
_NC_ROOT_PATH = os.path.normpath(
    os.path.join(_HERE_PATH, '..', '..', 'front_end', 'third_party',
                 'network-console'))


def main():
    parser = optparse.OptionParser(description=__doc__)
    parser.add_option(
        '--output_path',
        action='store',
        metavar='OUTPUT_PATH',
        help=
        'Where to place built static files for the Network Console frontend')
    options, _ = parser.parse_args()

    if not options.output_path:
        parser.error('--output_path was not specified.')

    out_nc_path = os.path.join(options.output_path, 'network_console')
    if not (os.path.exists(out_nc_path)):
        os.mkdir(out_nc_path)

    out_build_path = os.path.join(out_nc_path, 'build')
    if (os.path.exists(out_build_path)):
        shutil.rmtree(out_build_path)

    os.mkdir(out_build_path)
    out_static_path = os.path.join(out_build_path, 'static')
    shutil.copy(os.path.join(_NC_ROOT_PATH, 'dist', 'index.html'),
                os.path.join(out_build_path, 'index.html'))
    shutil.copytree(os.path.join(_NC_ROOT_PATH, 'dist', 'static'),
                    out_static_path)


if __name__ == '__main__':
    sys.exit(main())
