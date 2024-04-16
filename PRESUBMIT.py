# Copyright 2019 the V8 project authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

USE_PYTHON3 = True

LUCICFG_ENTRY_SCRIPTS = ['main.star']


def CheckChangeOnUpload(input_api, output_api):
  tests = [CheckRunMain(input_api, output_api)]
  return input_api.RunTests(tests)

def CheckRunMain(input_api, output_api):
  return input_api.Command(
            'main.star',
            [ './main.star' ],
            {
                'stderr': input_api.subprocess.STDOUT,
                'cwd': input_api.PresubmitLocalPath(),
            },
            output_api.PresubmitError)

def CheckChangeOnCommit(input_api, output_api):
  return CheckChangeOnUpload(input_api, output_api)