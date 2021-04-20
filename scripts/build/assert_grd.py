#!/usr/bin/env vpython
# -*- coding: UTF-8 -*-
#
# Copyright 2021 The Chromium Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.
"""
Asserts that old and new list of GRD files is equal.
"""

import sys
import json


def main(argv):
    old_list = open(argv[1], 'r').read()
    new_list = open(argv[2], 'r').read()
    target_dir = argv[3]

    json_old = json.loads(old_list)
    json_new = json.loads(new_list)

    for i in range(len(json_old)):
        json_old[i] = json_old[i].replace(target_dir + "/", "")

    for i in range(len(json_new)):
        json_new[i] = json_new[i].replace(target_dir + "/", "")

    json_old.sort()
    json_new.sort()

    for old in json_old:
        if old not in json_new:
            print("File " + old + " is missing in the new grd list")

    for new in json_new:
        if new not in json_old:
            print("File " + new + " didn't exist in the old grd")


if __name__ == '__main__':
    sys.exit(main(sys.argv))
