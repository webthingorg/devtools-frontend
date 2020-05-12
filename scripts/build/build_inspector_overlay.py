#!/usr/bin/env python
# -*- coding: UTF-8 -*-
#
# Copyright 2020 The Chromium Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.
"""
Builds inspector overlay:
- bundles input js files using rollup
- copies css files as is
- generates a new grd file listing generated resources
"""

from os import path
from os.path import join
from modular_build import read_file, write_file
from generate_devtools_grd import make_name_from_filename

import os
import sys
import subprocess
import rjsmin

try:
    original_sys_path = sys.path
    sys.path = sys.path + [
        path.join(os.path.dirname(os.path.realpath(__file__)), '..')
    ]
    import devtools_paths
finally:
    sys.path = original_sys_path

grit_template_start = '''<?xml version="1.0" encoding="UTF-8"?>
<grit latest_public_release="0" current_release="1"
      output_all_resource_defines="false">
  <outputs>
    <output filename="grit/inspector_overlay_resources_map.h" type="rc_header">
      <emit emit_type='prepend'></emit>
    </output>
    <output filename="inspector_overlay_resources.pak" type="data_package" />
  </outputs>
  <release seq="1">
    <includes>
'''
grit_template_end = '''
    </includes>
  </release>
</grit>
'''


def rollup(input_path, output_path, filename):
    target = join(input_path, filename)
    rollup_process = subprocess.Popen(
        [devtools_paths.node_path(),
         devtools_paths.rollup_path()] +
        ['--format', 'iife', '-n', 'InspectorOverlay'] + ['--input', target],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE)
    out, error = rollup_process.communicate()
    write_file(join(output_path, filename), rjsmin.jsmin(out))


def main(argv):
    try:
        input_path_flag_index = argv.index('--input_path')
        input_path = argv[input_path_flag_index + 1]
        output_path_flag_index = argv.index('--output_path')
        output_path = argv[output_path_flag_index + 1]

        file_names = argv[1:input_path_flag_index]

        for filename in file_names:
            if filename.endswith(".js"):
                rollup(input_path, output_path, filename)
            if filename.endswith(".css"):
                css_file = read_file(join(input_path, filename))
                write_file(join(output_path, filename), css_file)

        data = [grit_template_start]
        for i, filename in enumerate(file_names):
            data += '\t\t\t<include name="{id}" file="{filename}" type="BINDATA" compress="gzip"/>'.format(
                id="IDR_INSPECT_" + make_name_from_filename(filename),
                filename=filename)
            if i < len(file_names) - 1:
                data += "\n"
        data += grit_template_end

        write_file(join(output_path, 'inspector_overlay_resources.grd'),
                   ''.join(data))

    except:
        print(
            'Usage: %s filename_1 filename_2 ... filename_N --input_path <input_path> --output_path <output_path>'
            % argv[0])
        raise


if __name__ == '__main__':
    sys.exit(main(sys.argv))
