# Copyright 2019 The Chromium Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

"""
Helper to find the path to the correct third_party directory
"""

from os import path

def root_path():
  SCRIPTS_PATH = path.dirname(path.abspath(__file__))
  ABS_DEVTOOLS_PATH = path.abspath(path.dirname(SCRIPTS_PATH))
  if 'renderer' in ABS_DEVTOOLS_PATH:
    return path.dirname(path.dirname(path.dirname(path.dirname(ABS_DEVTOOLS_PATH))))
  else:
    return ABS_DEVTOOLS_PATH

def third_party_path():
  return path.join(root_path(), 'third_party')
