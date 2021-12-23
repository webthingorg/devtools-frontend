# Copyright 2021 The Chromium Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

import os


# This is used by chromium/src/tools/licenses.py to find licenses for
# DevTools frontend dependencies.
def paths(path_prefix):
    return (os.path.join(path_prefix, 'front_end', 'third_party',
                         'codemirror'), )
