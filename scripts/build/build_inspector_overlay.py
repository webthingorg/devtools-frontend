#!/usr/bin/env python
# -*- coding: UTF-8 -*-
#
# Copyright 2020 The Chromium Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.
"""
Builds inspector overlay
"""

from os import path
from os.path import join
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


def read_file(filename):
    with open(filename, 'rt') as input:
        return input.read()


def write_file(filename, content):
    if path.exists(filename):
        os.remove(filename)
    directory = path.dirname(filename)
    if not path.exists(directory):
        os.makedirs(directory)
    with open(filename, 'wt') as output:
        output.write(content)


grit_template_start = '''<?xml version="1.0" encoding="UTF-8"?>
<grit latest_public_release="0" current_release="1"
      output_all_resource_defines="false">
  <outputs>
    <output filename="grit/devtools_inspector_resources_map.h" type="rc_header">
      <emit emit_type='prepend'></emit>
    </output>
    <output filename="devtools_inspector_resources.pak" type="data_package" />
  </outputs>
  <release seq="1">
    <includes>
'''
grit_template_end = '''
    </includes>
  </release>
</grit>
'''


def make_name_from_filename(filename):
    return (filename.replace('/', '_').replace('\\',
                                               '_').replace('-', '_').replace(
                                                   '.', '_')).upper()


dir_path = os.path.dirname(os.path.realpath(__file__))


def rollup(input_path, output_path, filename):
    target = join(dir_path, input_path, filename)
    rollup_process = subprocess.Popen(
        [devtools_paths.node_path(),
         devtools_paths.rollup_path()] +
        ['--format', 'iife', '-n', 'InspectorOverlay'] + ['--input', target],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE)
    out, error = rollup_process.communicate()
    print(error)
    write_file(join(output_path, filename), rjsmin.jsmin(out))


def main(argv):
    try:
        js_files = ["tool_highlight.js"]
        css_files = ["common.css"]
        input_path = "../../front_end/inspector_overlay"
        output_path = argv[2]
        for filename in js_files:
            rollup(input_path, output_path, filename)
        for filename in css_files:
            css_file = read_file(join(dir_path, input_path, filename))
            write_file(join(output_path, filename), css_file)
        data = [grit_template_start]
        for filename in css_files + js_files:
            data += '\t\t\t<include name="{id}" file="{filename}" type="BINDATA" compress="gzip"/>\n'.format(
                id="IDR_INSPECT_" + make_name_from_filename(filename),
                filename=filename)
        data += grit_template_end
        write_file(join(output_path, 'devtools_inspector_resources.grd'),
                   ''.join(data))

    except:
        print(
            'Usage: %s app_1 app_2 ... app_N --input_path <input_path> --output_path <output_path> --rollup true'
            % argv[0])
        raise


if __name__ == '__main__':
    sys.exit(main(sys.argv))
