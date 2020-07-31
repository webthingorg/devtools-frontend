# Copyright 2019 The Chromium Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

# This script looks for build_overrides/clobber and, if it is
# found, will remove the out/ dir. This is because sometimes
# build bots can get themselves into a problematic state from
# previous builds, and need their out dir removing completely.

import shutil
import os

cwd = os.getcwd()
out_dir = os.path.join(cwd, "out")
clobber_path = os.path.join(cwd, "build_overrides", "clobber")

if not os.path.exists(clobber_path):
    exit()

print("Clobbering %s" % (out_dir))
shutil.rmtree(out_dir)
