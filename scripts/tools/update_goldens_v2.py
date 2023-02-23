#!/usr/bin/env python3
# Copyright 2023 The DevTools Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

import argparse
import json
import os
import tempfile
import time
import subprocess
import sys


class ProjectConfig:
    def __init__(self,
                 name='devtools-frontend',
                 gs_root='gs://devtools-frontend-screenshots',
    ):
        self.gs_root = gs_root
        self.gs_folder = self.gs_root + '/screenshots'



def main(project_config, *args):
    check_cq_status(project_config)


def check_cq_status(project_config):
    pass

if __name__ == '__main__':
    main(ProjectConfig(), sys.argv[1:])

# Path: scripts/tools/update_goldens_v2.py