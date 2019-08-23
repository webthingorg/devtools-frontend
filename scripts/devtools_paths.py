# Copyright 2019 The Chromium Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.
"""
Helper to find the path to the correct third_party directory
"""

from os import path
import sys

def root_path():
    SCRIPTS_PATH = path.dirname(path.abspath(__file__))
    ABS_DEVTOOLS_PATH = path.dirname(SCRIPTS_PATH)
    if 'third_party' in ABS_DEVTOOLS_PATH:
        return path.normpath(path.join(ABS_DEVTOOLS_PATH, '..', '..'))
    else:
        return ABS_DEVTOOLS_PATH

def third_party_path():
    return path.join(root_path(), 'third_party')

def node_path():
    try:
        old_sys_path = sys.path[:]
        sys.path.append(path.join(third_party_path(), 'node'))
        import node
    finally:
        sys.path = old_sys_path
    return node.GetBinaryPath()

RELATIVE_ROOT_PATH = path.join(path.dirname(__file__), '..')

def eslint_path():
    return path.join(RELATIVE_ROOT_PATH, 'node_modules', 'eslint', 'bin', 'eslint.js')

def karma_path():
    return path.join(RELATIVE_ROOT_PATH, 'node_modules', 'karma', 'bin', 'karma')

def node_modules_path():
    return path.join(RELATIVE_ROOT_PATH, 'node_modules')

def package_json_path():
    return path.join(RELATIVE_ROOT_PATH, 'package.json')
