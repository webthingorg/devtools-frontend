# Copyright 2019 The Chromium Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.
"""
Helper to manage DEPS.
"""

import os
import os.path as path
import subprocess
import devtools_paths
import shutil
import json

LICENSES = [
    'MIT',
    'Apache-2.0',
    'BSD',
    'BSD-2-Clause',
    'BSD-3-Clause',
    'CC0-1.0',
    'CC-BY-3.0',
    'ISC',
]

# List all DEPS here.
DEPS = {
  '@types/chai': '4.2.0',
  '@types/mocha': '5.2.7',
  'ajv': '6.10.1',
  'chai': '4.2.0',
  'eslint': '6.0.1',
  'karma': '4.2.0',
  'karma-chai': '0.1.0',
  'karma-chrome-launcher': '3.1.0',
  'karma-mocha': '1.3.0',
  'karma-typescript': '4.1.1',
  'license-checker': '25.0.1',
  'mocha': '6.2.0',
  'typescript': '3.5.3'
}

def clean_node_modules():
    # Clean the node_modules folder first. That way only the packages listed above
    # (and their deps) are installed.
    try:
        shutil.rmtree(path.realpath(devtools_paths.node_modules_path()))
    except OSError as err:
        print ('Error removing node_modules: %s, %s' % (err.filename, err.strerror))

def strip_private_fields():
    # npm adds private fields which need to be stripped.
    pattern = path.join(devtools_paths.node_modules_path(), 'package.json')
    packages = []
    for root, dirnames, filenames in os.walk(devtools_paths.node_modules_path()):
        for filename in filter(lambda f: f == 'package.json', filenames):
            packages.append(path.join(root, filename))

    for pkg in packages:
        with open(pkg, 'r+') as pkg_file:
            prop_removal_count = 0
            try:
                pkg_data = json.load(pkg_file)

                # Remove anything that begins with an underscore, as these are
                # the private fields in a package.json
                for key in pkg_data.keys():
                    if key.find(u'_') == 0:
                        pkg_data.pop(key)
                        prop_removal_count = prop_removal_count + 1

                pkg_file.truncate(0)
                pkg_file.seek(0)
                json.dump(pkg_data, pkg_file, indent=2, sort_keys=True)
                print("(%s): %s" % (prop_removal_count, pkg))
            except:
                print('Unable to fix: %s' % pkg)
                return True

    return False

def ensure_licenses():
    exec_command = [
        devtools_paths.node_path(),
        devtools_paths.license_checker_path(),
        '--onlyAllow',
        ('%s' % (';'.join(LICENSES)))
    ]

    license_result = subprocess.check_call(exec_command, cwd=devtools_paths.root_path())
    return license_result != 0

def install_deps():
    clean_node_modules()

    exec_command = [
        'npm',
        'install',
        '--no-save'
    ]
    for pkg, version in DEPS.items():
        exec_command.append('%s@%s' % (pkg, version))

    errors_found = False
    npm_proc_result = subprocess.check_call(exec_command, cwd=devtools_paths.root_path())
    if npm_proc_result != 0:
        errors_found = True

    # If npm fails, bail here, otherwise attempt to strip private fields.
    if errors_found:
        return True

    errors_found = strip_private_fields()
    if errors_found:
        return True

    errors_found = ensure_licenses()
    return errors_found

npm_errors_found = install_deps()

if npm_errors_found:
    print('npm installation failed')
else:
    print('npm installation successful')
