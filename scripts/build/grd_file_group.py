# Copyright 2020 The Chromium Authors.  All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.
import argparse
import errno
import sys
import subprocess
import json
import os
import shutil
import collections

from os import path
_CURRENT_DIR = path.join(path.dirname(__file__))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        '-o',
        '--target_outputs',
        nargs='*',
        help='List of target output files to include in a GRD file')
    parser.add_argument('-b', '--output_location', required=True)

    opts = parser.parse_args()

    if (len(opts.target_outputs) == 0):
        print(
            'Did not receive any target outputs. You must include at least one target output.'
        )
        return 1

    output_location = path.join(os.getcwd(), opts.output_location)

    file_group = {}
    file_group['files'] = opts.target_outputs

    with open(output_location, 'w') as generated_file_group_location:
        try:
            json.dump(file_group, generated_file_group_location)
        except Exception as e:
            print(
                'Encountered error while writing generated file_group in location %s:'
                % output_location)
            print(e)
            return 1

    return 0


if __name__ == '__main__':
    sys.exit(main())
