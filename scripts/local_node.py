# Copyright 2017 The Chromium Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.
"""
Thin wrapper around the local node.js installed as part of chromium DEPS
"""

from os import path
import sys

SCRIPTS_PATH = path.dirname(path.abspath(__file__))
ROOT_PATH = path.join(SCRIPTS_PATH, '..')
PACKAGE_JSON_PATH = path.join(ROOT_PATH, 'package.json')
NODE_PATH = path.join(ROOT_PATH, 'third_party', 'node')
ESLINT_PATH = path.join(ROOT_PATH, 'node_modules', 'eslint', 'bin', 'eslint.js')
KARMA_PATH = path.join(ROOT_PATH, 'node_modules', 'karma', 'bin', 'karma')
NODE_MODULES_PATH = path.join(ROOT_PATH, 'node_modules')

try:
    old_sys_path = sys.path[:]
    sys.path.append(NODE_PATH)
    import node
finally:
    sys.path = old_sys_path


def node_path():
    return node.GetBinaryPath()


def eslint_path():
    return ESLINT_PATH


def karma_path():
    return KARMA_PATH


def node_modules_path():
    return NODE_MODULES_PATH


def package_json_path():
    return PACKAGE_JSON_PATH
