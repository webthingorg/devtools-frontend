# Copyright 2019 The Chromium Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.
"""
Helper to find the path to the correct third_party directory
"""

from os import path
import sys


# Following paths are relative to the checkout.
# In the standalone build, this is the devtools-frontend directory.
# In the integrated build, this is the src/chromium directory.
def root_path():
    SCRIPTS_PATH = path.dirname(path.abspath(__file__))
    ABS_DEVTOOLS_PATH = path.dirname(SCRIPTS_PATH)
    PARENT_PATH = path.dirname(ABS_DEVTOOLS_PATH)
    if path.basename(PARENT_PATH) == 'third_party':
        # integrated build
        return path.dirname(PARENT_PATH)
    else:
        # standalone build
        return ABS_DEVTOOLS_PATH


# This is the third_party path relative to the root of the checkout.
def third_party_path():
    return path.join(root_path(), 'third_party')


# This points to the node binary downloaded as part of the checkout.
def node_path():
    try:
        old_sys_path = sys.path[:]
        sys.path.append(path.join(third_party_path(), 'node'))
        import node
    finally:
        sys.path = old_sys_path
    return node.GetBinaryPath()


# Following paths are relative to the devtools directory, and thus relative
# to this script. They point to files from this repository.
RELATIVE_ROOT_PATH = path.join(path.dirname(__file__), '..')


def eslint_path():
    return path.join(RELATIVE_ROOT_PATH, 'node_modules', 'eslint', 'bin', 'eslint.js')


def karma_path():
    return path.join(RELATIVE_ROOT_PATH, 'node_modules', 'karma', 'bin', 'karma')


def node_modules_path():
    return path.join(RELATIVE_ROOT_PATH, 'node_modules')


def package_json_path():
    return path.join(RELATIVE_ROOT_PATH, 'package.json')
